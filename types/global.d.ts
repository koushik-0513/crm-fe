
export type TContact = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  tags: string[];
  note?: string;
  user: string;
  avatar?: string;
  createdAt?: Date;
  updatedAt?: Date;
  lastInteraction?: Date;
}

export type TUser = {
  _id?: string;
  uid?: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  organizationName?: string;
  teamCode?: string;
  photoUrl: string;
  role: "admin" | "user" | "individual";
  walkthrough?: Array<{
    page_name: string;
    completed: boolean;
  }>;
  createdAt?: Date;
  updatedAt?: Date;
}

export type TTag = {
  _id: string;
  name: string;
  color: string;
  user: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type TActivity = {
  _id: string;
  contactId?: string;
  user: string;
  activityType: ActivityTypes;
  timestamp: Date;
  details?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type TChatMessage = {
  _id?: string;
  conversationId: string;
  user: string;
  title?: string;
  messages: TUserMessage[];
  hasCRMContext?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type TUserMessage = {
  sender: SenderType;
  message: string;
  timestamp?: Date;
}


export enum ActivityTypes {
  CONTACT_CREATED = "CONTACT CREATED",
  CONTACT_DELETED = "CONTACT DELETED",
  CONTACT_EDITED = "CONTACT EDITED",
  TAG_CREATED = "TAG CREATED",
  TAG_EDITED = "TAG EDITED",
  TAG_DELETED = "TAG DELETED",
  BULK_IMPORT_CONTACTS = "BULK IMPORT CONTACTS",
  BULK_DELETE_CONTACTS = "BULK DELETE CONTACTS",
  FORCE_DELETE_TAG = "FORCE DELETE TAG",
  ACCOUNT_DELETED = "ACCOUNT DELETED"
}

export enum SenderType {
  USER = "user",
  AI = "ai"
}

export enum MessageStatus {
  PENDING = "pending",
  SENT = "sent",
  DELIVERED = "delivered",
  READ = "read",
  FAILED = "failed"
}

export enum ContentType {
  ACTIVITY = "activity",
  NOTE = "note",
  MESSAGE_HISTORY = "message_history",
  MEETING_NOTE = "meeting_note",
  PREFERENCE = "preference"
}



export type TContactForm = {
  name: string;
  email: string;
  phone: string;
  company: string;
  tags: string[];
  note: string;
}

export type TTagForm = {
  name: string;
  color: string;
}



export type TApiSuccess<TData = undefined> = {
  message: string;
  data?: TData;
  pagination?: TPagination;
};

export type TApiError = {
  message: string;
  status_code: number;
};

export type TApiPromise<TData = undefined> = Promise<TApiSuccess<TData>> | Promise<TApiError>;

export type TApiResponse<T = unknown> = {
  message: string;
  data?: T;
  pagination?: TPagination;
}

export type TPagination = {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  total_items: number;
}

export type TPaginatedResponse<T> = {
  message: string;
  data: T[];
  pagination: TPagination;
}



export type TMessageHistory = {
  _id: string;
  user: string;
  contactId: string;
  contactName: string;
  phoneNumber: string;
  messageContent: string;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  smsMessageId?: string;
  prompt: string;
  generatedAt: string;
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  errorMessage?: string;
  metadata?: {
    aiModel: string;
    contextUsed: string[];
    generationTime: number;
  };
}



export type TAIModel = {
  name: string;
  available: boolean;
  maxTokens: number;
  description?: string;
}

export type TAIModelConfig = {
  maxTokens: number;
  maxMessages: number;
  summarizationThreshold: number;
  contextWindowSize: number;
  tokenThreshold: number;
}



export type TSearchResultItem = {
  id?: string;
  _id?: string;
  name?: string;
  title?: string;
  email?: string;
  type: 'contact' | 'tag' | 'activity';
}

export type TSearchResults = {
  pages: TSearchPage[];
  data: {
    contacts?: TSearchResultItem[];
    tags?: TSearchResultItem[];
    activities?: TSearchResultItem[];
  };
}

export type TSearchPage = {
  title: string;
  results: TSearchResultItem[];
}


export type TChatbotMessage = {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: string;
}

export type TChatbotChatHistory = {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
  hasCRMContext: boolean;
  messages: TChatbotMessage[];
}

export type TChatbotAIModel = {
  name: string;
  available: boolean;
  provider?: string;
}

export type TNotification = {
  _id: string;
  recipient: string;
  sender: {
    _id: string;
    name: string;
    email: string;
    photoUrl: string;
  };
  title: string;
  message: string;
  type: "admin_message" | "system_notification";
  status: "unread" | "read";
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type TNotificationForm = {
  recipient_uid: string;
  title: string;
  message: string;
  type?: "admin_message" | "system_notification";
}