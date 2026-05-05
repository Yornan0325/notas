export interface Block {
  pageId: string;
  id: string;
  type:
    | 'text'
    | 'title'
    | 'todo'
    | 'h1'
    | 'h2'
    | 'h3'
    | 'bullet_list'
    | 'numbered_list'
    | 'toggle_list'
    | 'quote'
    | 'code'
    | 'callout'
    | 'image';
  content: string;
  synced: boolean;
  attachmentPath?: string;
  attachmentName?: string;
  imageWidth?: number;
  imageAlign?: 'left' | 'center' | 'right';
  imageFlow?: 'stack' | 'columns';
}

export interface Page {
  id: string;
  title: string;
  parentId: string | null;
  docId: string;
  icon?: string;
  isDocumentRoot?: boolean;
  createdAt?: string;
  updatedAt?: string;
  synced?: boolean;
}

export type ShareTargetType = 'workspace' | 'page';
export type SharePermission = 'view' | 'edit';

export interface ShareInvite {
  id: string;
  targetType: ShareTargetType;
  targetId: string;
  docId: string;
  title: string;
  email: string;
  permission: SharePermission;
  token: string;
  createdAt: string;
  synced?: boolean;
}
