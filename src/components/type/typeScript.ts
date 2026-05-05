export interface Block {
    pageId: string;
    id: string;
    type: 'text' | 'title' | 'todo' | 'h1' | 'h2' | 'h3' | 'bullet_list' | 'numbered_list' | 'toggle_list' | 'quote' | 'code' | 'callout';
    content: string;
    synced: boolean;
}
// 1. Definición de tipos
export interface Page {
  id: string;
  title: string;
  parentId: string | null;
  docId: string;
}