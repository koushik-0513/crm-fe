import { toast } from "sonner";
import { useState, useEffect } from "react";
import { isAxiosError, isValidationError, isNetworkError } from '@/utils/type-Guards';

// Common Error Handling
export const handleApiError = ({ error, defaultMessage = "An error occurred" }: { error: unknown; defaultMessage?: string }) => {
  let errorMessage = defaultMessage;
  
  if (isAxiosError(error)) {
    if (error.response?.data && typeof error.response.data === 'object' && 'error' in error.response.data) {
      const errorData = error.response.data as { error?: { message?: string }; message?: string };
      if (errorData.error?.message) {
        errorMessage = errorData.error.message;
      } else if (errorData.message) {
        errorMessage = errorData.message;
      }
    }
  } else if (isValidationError(error)) {
    errorMessage = error.message;
  } else if (isNetworkError(error)) {
    errorMessage = error.message;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }
  
  toast.error(errorMessage);
  return errorMessage;
};

// Common File Validation
export const validateImageFile = (file: File): boolean => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg", 
    "image/png",
    "image/gif",
    "image/webp",
  ];
  
  if (!allowedTypes.includes(file.type)) {
    toast.error("Please select a valid image file (JPEG, PNG, GIF, or WebP)");
    return false;
  }
  
  if (file.size > 2 * 1024 * 1024) {
    toast.error("File size must be less than 2MB");
    return false;
  }
  
  return true;
};

// Common String Utilities
export const getUserInitials = (name?: string): string => {
  if (!name) return "U";
  
  const names = name.split(" ");
  return names.map(name => name[0]).join("").toUpperCase().slice(0, 2);
};

export const formatActivityType = (activityType: string): string => {
  const typeMap: Record<string, string> = {
    "CONTACT CREATED": "Contact Created",
    "CONTACT DELETED": "Contact Deleted", 
    "CONTACT EDITED": "Contact Edited",
    "TAG CREATED": "Tag Created",
    "TAG EDITED": "Tag Edited",
    "TAG DELETED": "Tag Deleted",
    "BULK IMPORT CONTACTS": "Bulk Import",
    "BULK DELETE CONTACTS": "Bulk Delete",
    "FORCE DELETE TAG": "Force Delete Tag",
    "ACCOUNT DELETED": "Account Deleted"
  };
  
  return typeMap[activityType] || activityType;
};

export const formatActivityTime = (timestamp: string | Date): string => {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  return date.toLocaleString();
};

export const formatTimestamp = (timestamp: string | Date): string => {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Common Array Utilities
export const getVisiblePages = ({ currentPage, totalPages, maxVisible = 5 }: { currentPage: number; totalPages: number; maxVisible?: number }) => {
  const pages: number[] = [];
  const halfVisible = Math.floor(maxVisible / 2);
  
  let start = Math.max(1, currentPage - halfVisible);
  let end = Math.min(totalPages, start + maxVisible - 1);
  
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }
  
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  
  return pages;
};

// Common Validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

// Common Debounce Hook
export const useDebounce = ({ value, delay }: { value: string; delay: number }) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Common Scroll Utilities
export const scrollToBottom = (ref: React.RefObject<HTMLElement>) => {
  ref.current?.scrollIntoView({ behavior: "smooth" });
};

export const scrollToBottomImmediate = (ref: React.RefObject<HTMLElement>) => {
  ref.current?.scrollIntoView({ behavior: "auto" });
};

export const scrollToBottomSmooth = (ref: React.RefObject<HTMLElement>) => {
  setTimeout(() => scrollToBottom(ref), 100);
}; 