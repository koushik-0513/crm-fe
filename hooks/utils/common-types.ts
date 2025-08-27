import type { TContact } from "@/types/global";

// Common Layout Props Types
export type TLayoutProps = {
  children: React.ReactNode;
}

export type TDashboardLayoutProps = {
  children: React.ReactNode;
}

export type TAuthLayoutProps = {
  children: React.ReactNode;
}

export type TRootLayoutProps = {
  children: React.ReactNode;
}

export type TAuthMiddlewareProps = {
  children: React.ReactNode;
}

export type TProviderProps = {
  children: React.ReactNode;
}

// Common Form Data Types
export type TUserData = {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  organizationName?: string;
  teamCode?: string;
  role?: string;
  photoUrl?: string;
}

export type TUpdateData = {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  organizationName?: string;
  avatar?: string;
}

export type TCsvContactData = {
  name: string;
  email: string;
  phone: string;
  company: string;
  tags: string[];
  note: string;
}

// Common Component Props Types
export type TEditContactDialogProps = {
  contact: TContact;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (contactId: string, data: Partial<TContact>) => void;
}

export type TWhatsAppMessageProps = {
  isOpen: boolean;
  onClose: () => void;
}

export type TNavigationPage = {
  name: string;
  path: string;
}

export type TUserProfile = {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  organizationName?: string;
  teamCode?: string;
  role?: string;
  photoUrl?: string;
}

// Common Chat Types
export type TMessage = {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: string;
}

export type TChatHistory = {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
  hasCRMContext: boolean;
  messages: TMessage[];
}

export type TModelOption = {
  name: string;
  provider: string;
}

// Common Activity Types
export type TDateRangeSelection = {
  startDate?: Date;
  endDate?: Date;
  key?: string;
}

// Common Tag Types
export type TTag = {
  _id: string;
  name: string;
  color: string;
  user: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type TTagDeleteError = {
  error: string;
  contactCount: number;
  tagName: string;
} 