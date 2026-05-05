import axios from 'axios';
import type { Block } from '../components/type/typeScript';

// REEMPLAZA ESTA URL con la que copiaste de tu App Script (la que termina en /exec)
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbxxLZxiSQx0HIK5iei59gCvKUL-7sTwFZZIbJEkUNaJDL1lDWzHFEDiOPJBf1YLJJro/exec';


export const syncToSheets = async (blocks: Block[], docName: string) => {
  try {
    const dataToSave = {
      sheet: docName,
      values: blocks.map(b => ({
        id: b.id,
        page_id: b.pageId,
        tipo: b.type,
        contenido: b.content,
        fecha: new Date().toISOString()
      }))
    };

    console.log(`Enviando ${blocks.length} bloques a la hoja "${docName}"...`);

    // Usamos fetch con 'no-cors' para enviarlo a Google Apps Script sin bloqueo de red
    await fetch(WEB_APP_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify(dataToSave),
    });

    return true; 
  } catch (error) {
    console.error("Error en la sincronización:", error);
    return false;
  }
};


export const fetchFromSheets = async () => {
  try {
    const response = await axios.get(`${WEB_APP_URL}?sheet=Bloques`);
    // Google Sheets nos devuelve un array de objetos
    return response.data.map((row: any) => ({
      id: row.id,
      type: row.tipo || 'text',
      content: row.contenido,
      synced: true // Si viene de Sheets, ya está sincronizado
    }));
  } catch (error) {
    console.error("Error cargando desde Sheets:", error);
    return [];
  }
};