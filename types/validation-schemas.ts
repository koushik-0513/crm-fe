import { z } from 'zod';
import type { ActivityTypes } from './global';

// ============================================================================
// BASE SCHEMAS
// ============================================================================

export const contactSchema = z.object({
  _id: z.string(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  company: z.string(),
  tags: z.array(z.string()),
  note: z.string().optional(),
  user: z.string(),
  avatar: z.string().optional(),
  createdAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
  updatedAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
  lastInteraction: z.string().optional().transform(val => val ? new Date(val) : undefined),
});

export const tagSchema = z.object({
  _id: z.string(),
  name: z.string(),
  color: z.string(),
  user: z.string(),
  createdAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
  updatedAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
});

export const activitySchema = z.object({
  _id: z.string(),
  contactId: z.string().optional(),
  user: z.string(),
  activityType: z.string(), // This will be validated as ActivityTypes enum
  timestamp: z.string().transform(val => new Date(val)),
  details: z.string().optional(),
  createdAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
  updatedAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
}).transform((data) => ({
  ...data,
      activityType: data.activityType as ActivityTypes, // Cast to ActivityTypes enum
}));

export const userSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  company: z.string(),
  photoUrl: z.string(),
  walkthrough: z.array(z.object({
    page_name: z.string(),
    completed: z.boolean(),
  })).optional(),
});

export const paginationSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  total_pages: z.number(),
  total_items: z.number(),
});

// ============================================================================
// TYPE DEFINITIONS (for reference only)
// ============================================================================

// These are kept for type reference but not used for validation
export type ContactSchema = z.infer<typeof contactSchema>;
export type TagSchema = z.infer<typeof tagSchema>;
export type ActivitySchema = z.infer<typeof activitySchema>;
export type UserSchema = z.infer<typeof userSchema>;
export type PaginationSchema = z.infer<typeof paginationSchema>; 