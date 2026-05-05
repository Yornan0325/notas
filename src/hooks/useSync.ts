import { useEffect } from 'react';
import { useCodaStore } from '../store/useCodaStore';
import { syncToSheets } from '../api/googleSheets';

export const useSync = () => {
  const { blocks, pages, markAsSynced } = useCodaStore();

  useEffect(() => {
    const performSync = async () => {
      // Solo procedemos si el navegador está online y hay bloques sin sincronizar
      const pendingBlocks = blocks.filter(b => !b.synced);
      if (pendingBlocks.length === 0 || !navigator.onLine) return;

      console.log("Detectados cambios pendientes. Organizando por página...");

      // Agrupamos por pageId para que cada página sea su propia hoja en Sheets
      const pageIdsToSync = Array.from(new Set(pendingBlocks.map(b => b.pageId)));

      for (const pageId of pageIdsToSync) {
        const page = pages.find(p => p.id === pageId);
        if (!page) continue;

        // Para asegurar que la hoja en Sheets refleje la página completa, 
        // enviamos todos los bloques de esa página, no solo los pendientes.
        const allPageBlocks = blocks.filter(b => b.pageId === pageId);
        const sheetName = page.title || "Página sin título";

        console.log(`Sincronizando hoja: "${sheetName}" (${allPageBlocks.length} bloques)`);
        
        const success = await syncToSheets(allPageBlocks, sheetName);
        
        if (success) {
          // Marcamos como sincronizados los bloques que enviamos
          const ids = allPageBlocks.map(b => b.id);
          markAsSynced(ids);
          console.log(`✓ Hoja "${sheetName}" sincronizada correctamente.`);
        }
      }
    };

    // Escuchar cambios en el estado online
    const handleOnline = () => {
      console.log("Conexión restaurada. Intentando sincronización...");
      performSync();
    };
    window.addEventListener('online', handleOnline);
    
    // Sincronización automática con debounce de 3 segundos
    const timeoutId = setTimeout(performSync, 3000);

    return () => {
      window.removeEventListener('online', handleOnline);
      clearTimeout(timeoutId);
    };
  }, [blocks, pages, markAsSynced]);
};