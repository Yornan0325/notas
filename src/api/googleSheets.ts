import axios from 'axios';
import type { Block } from '../components/type/typeScript';

const WEB_APP_URL =
  'https://script.google.com/macros/s/AKfycbxxLZxiSQx0HIK5iei59gCvKUL-7sTwFZZIbJEkUNaJDL1lDWzHFEDiOPJBf1YLJJro/exec';

interface SheetBlockRow {
  id: string;
  page_id?: string;
  tipo?: Block['type'];
  contenido?: string;
}

export const syncToSheets = async (blocks: Block[], docName: string) => {
  try {
    const dataToSave = {
      sheet: docName,
      values: blocks.map((block) => ({
        id: block.id,
        page_id: block.pageId,
        tipo: block.type,
        contenido: block.content,
        fecha: new Date().toISOString(),
      })),
    };

    console.log(`Enviando ${blocks.length} bloques a la hoja "${docName}"...`);

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
    console.error('Error en la sincronizacion:', error);
    return false;
  }
};

export const fetchFromSheets = async (): Promise<Block[]> => {
  try {
    const response = await axios.get<SheetBlockRow[]>(`${WEB_APP_URL}?sheet=Bloques`);

    return response.data.map((row) => ({
      id: row.id,
      pageId: row.page_id || '',
      type: row.tipo || 'text',
      content: row.contenido || '',
      synced: true,
    }));
  } catch (error) {
    console.error('Error cargando desde Sheets:', error);
    return [];
  }
};
