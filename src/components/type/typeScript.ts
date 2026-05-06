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
    | 'image'
    | 'view_table'
    | 'view_cards'
    | 'view_detail'
    | 'view_calendar'
    | 'view_form'
    | 'view_timeline'
    | 'view_chart'
    | 'view_board';
  content: string;
  synced: boolean;
  blockOrder?: number;
  attachmentPath?: string;
  attachmentName?: string;
  imageWidth?: number;
  imageAlign?: 'left' | 'center' | 'right';
  imageFlow?: 'stack' | 'columns';
  ownerWorkspaceId?: string;
  sharePermission?: SharePermission;
}

export interface Page {
  id: string;
  title: string;
  parentId: string | null;
  docId: string;
  icon?: string;
  isDocumentRoot?: boolean;
  isFavorite?: boolean;
  createdAt?: string;
  updatedAt?: string;
  synced: boolean;
  ownerWorkspaceId?: string;
  sharePermission?: SharePermission;
  sharedRootId?: string;
  projectName?: string;
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
  ownerWorkspaceId?: string;
  createdAt: string;
  synced: boolean;
}
