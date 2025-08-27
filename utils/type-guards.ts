export const isAxiosError = (error: unknown): error is {
  response?: {
    status: number;
    data?: unknown;
    statusText?: string;
  };
  message?: string;
} => {
  return Boolean(error && typeof error === 'object' && 'response' in error);
};

export const isApiErrorResponse = (data: unknown): data is {
  error: {
    type: string;
    message: string;
    details?: string;
    code?: string;
    timestamp: Date;
    requestId?: string;
    context?: Record<string, unknown>;
  };
} => {
  return Boolean(data && typeof data === 'object' && 'error' in data);
};

export const isSuccessResponse = (data: unknown): data is {
  data: unknown;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    total_items: number;
  };
} => {
  return Boolean(data && typeof data === 'object' && 'data' in data);
};

export const isValidationError = (error: unknown): error is {
  message: string;
  details?: string;
  field?: string;
} => {
  return Boolean(error && typeof error === 'object' && 'message' in error && typeof (error as Record<string, unknown>).message === 'string');
};

export const isNetworkError = (error: unknown): error is {
  message: string;
  code?: string;
} => {
  const errorObj = error as Record<string, unknown>;
  const message = errorObj.message;
  return Boolean(error && typeof error === 'object' && 'message' in error &&
    (typeof message === 'string' && (message.includes('network') || message.includes('fetch'))));
};


export const isRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
};

export const isStringRecord = (value: unknown): value is Record<string, string> => {
  if (!isRecord(value)) return false;
  return Object.values(value).every(v => typeof v === 'string');
};

export const isNumberRecord = (value: unknown): value is Record<string, number> => {
  if (!isRecord(value)) return false;
  return Object.values(value).every(v => typeof v === 'number');
};

export const isArrayOfStrings = (value: unknown): value is string[] => {
  return Array.isArray(value) && value.every(item => typeof item === 'string');
};

export const isArrayOfNumbers = (value: unknown): value is number[] => {
  return Array.isArray(value) && value.every(item => typeof item === 'number');
};

export const isHTMLElement = (value: unknown): value is HTMLElement => {
  return value instanceof HTMLElement;
};

export const isHTMLInputElement = (value: unknown): value is HTMLInputElement => {
  return value instanceof HTMLInputElement;
};

export const isHTMLFormElement = (value: unknown): value is HTMLFormElement => {
  return value instanceof HTMLFormElement;
};

export const isEventTarget = (value: unknown): value is EventTarget => {
  return value instanceof EventTarget;
};

export const isNonNullable = <T>(value: T): value is NonNullable<T> => {
  return value !== null && value !== undefined;
};

export const isDefined = <T>(value: T | undefined | null): value is T => {
  return value !== undefined && value !== null;
};

export const isString = (value: unknown): value is string => {
  return typeof value === 'string';
};

export const isNumber = (value: unknown): value is number => {
  return typeof value === 'number' && !isNaN(value);
};

export const isBoolean = (value: unknown): value is boolean => {
  return typeof value === 'boolean';
};

export const isFunction = (value: unknown): value is Function => {
  return typeof value === 'function';
};

export const isDate = (value: unknown): value is Date => {
  return value instanceof Date;
};

export const isValidDate = (value: unknown): value is Date => {
  return isDate(value) && !isNaN(value.getTime());
};

export const hasPagination = (data: unknown): data is {
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    total_items: number;
  };
} => {
  return isRecord(data) && 'pagination' in data && isRecord((data as Record<string, unknown>).pagination);
};

export const hasMessage = (data: unknown): data is { message: string } => {
  return isRecord(data) && 'message' in data && typeof (data as Record<string, unknown>).message === 'string';
};

export const hasData = (data: unknown): data is { data: unknown } => {
  return isRecord(data) && 'data' in data;
};

// Deprecated: backend no longer returns `success`
export const hasSuccess = (_data: unknown): _data is { success: boolean } => false;

export const isValidApiResponse = (data: unknown): data is {
  data?: unknown;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    total_items: number;
  };
} => {
  return isRecord(data) && (hasData(data) || hasMessage(data));
};

export const isValidErrorResponse = (data: unknown): data is {
  error: {
    type: string;
    message: string;
    details?: string;
    code?: string;
    timestamp: Date;
    requestId?: string;
    context?: Record<string, unknown>;
  };
} => {
  return isApiErrorResponse(data);
};

export const isValidSuccessResponse = <T>(data: unknown): data is {
  data: T;
  message: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    total_items: number;
  };
} => {
  return isSuccessResponse(data) && hasData(data);
}; 