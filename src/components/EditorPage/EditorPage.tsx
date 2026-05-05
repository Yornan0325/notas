// src/components/editor/EditorPage.tsx
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useCodaStore } from "../../store/useCodaStore";
import { PageSidebar } from "./PageSidebar";
import { FileText } from "lucide-react";
import { Canvas } from "../editor/Canvas";

const EditorPage = () => {
  const { docId } = useParams();
  const { pages, addPage } = useCodaStore();
  
  // Estado para la página seleccionada actualmente
  const [activePageId, setActivePageId] = useState<string | null>(null);

  // Al cargar, si no hay página activa pero hay páginas en el doc, selecciona la primera
  useEffect(() => {
    const docPages = pages.filter(p => p.docId === docId);
    if (!activePageId && docPages.length > 0) {
      setActivePageId(docPages[0].id);
    }
  }, [docId, pages, activePageId]);

  const currentPage = pages.find(p => p.id === activePageId);

  return (
    <div className="flex h-screen bg-[#1a1a1a] overflow-hidden">
      
      {/* 1. Sidebar de Páginas Interna */}
      <PageSidebar 
        docId={docId || ""} 
        activePageId={activePageId}
        onSelectPage={(id) => setActivePageId(id)}
      />

      {/* 2. Contenido del Documento (El Lienzo Blanco) */}
      <main className="flex-1 overflow-y-auto bg-white">
        {activePageId ? (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
             {/* Pasamos el activePageId al Canvas para filtrar bloques */}
            <Canvas pageId={activePageId} pageTitle={currentPage?.title || ""} />
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
            <FileText size={48} className="opacity-10" />
            <p>Selecciona o crea una página para empezar</p>
            <button 
              onClick={() => addPage(docId || "")}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
            >
              Crear primera página
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default EditorPage;