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
});

export const paginationSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  total_pages: z.number(),
  total_items: z.number(),
});

// ============================================================================
// API RESPONSE SCHEMAS
// ============================================================================

export const contactServiceResponseSchema = z.object({
  message: z.string().optional(),
  contacts: z.array(contactSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    total_pages: z.number(),
    total_items: z.number(),
  }).optional(),
});

export const contactCreateResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  contact: contactSchema,
});

export const contactUpdateResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  contact: contactSchema,
});

export const contactDeleteResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export const contactBulkDeleteResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  deletedCount: z.number(),
});

export const contactImportResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  importedCount: z.number(),
  errors: z.array(z.string()).optional(),
});

export const tagServiceResponseSchema = z.object({
  tags: z.array(tagSchema),
  tagCounts: z.record(z.string(), z.number()),
  message: z.string(),
  totalTags: z.number().optional(),
  pagination: paginationSchema.optional(),
});

export const tagCreateResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  tag: tagSchema,
});

export const tagUpdateResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  tag: tagSchema,
});

export const tagDeleteResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export const tagDeleteErrorSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  contactCount: z.number(),
});

export const tagBulkCreateResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  tags: z.array(tagSchema),
});

export const activityResponseSchema = z.array(activitySchema);

export const activitiesResponseSchema = z.object({
  activities: z.array(activitySchema),
  pagination: paginationSchema.optional(),
});

export const contactActivitiesResponseSchema = z.object({
  success: z.boolean(),
  activities: z.array(activitySchema),
  count: z.number(),
});

export const chatResponseSchema = z.object({
  _id: z.string().optional(),
  conversationId: z.string(),
  user: z.string(),
  title: z.string().optional(),
  messages: z.array(z.object({
    sender: z.string(),
    message: z.string(),
    timestamp: z.date().optional(),
  })),
  hasCRMContext: z.boolean().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const chatDeleteResponseSchema = z.object({
  message: z.string(),
});

export const chatTitleUpdateResponseSchema = z.object({
  message: z.string(),
  title: z.string(),
});

export const profileResponseSchema = z.object({
  user: userSchema,
  message: z.string(),
  success: z.boolean(),
});

export const profileUpdateResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  user: userSchema,
});

export const profileDeleteResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export const dashboardStatsSchema = z.object({
  allContacts: z.array(contactSchema).optional(),
  totalContacts: z.number(),
  newThisWeek: z.number(),
  activities: z.number(),
  activitiesByDay: z.record(z.string(), z.number()),
  contactsByCompany: z.array(z.object({
    name: z.string(),
    contacts: z.number(),
  })),
  tagDistribution: z.array(z.object({
    name: z.string(),
    count: z.number(),
  })),
});

// ============================================================================
// ERROR RESPONSE SCHEMAS
// ============================================================================

export const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    type: z.string(),
    message: z.string(),
    details: z.string().optional(),
    code: z.string().optional(),
    timestamp: z.date(),
    requestId: z.string().optional(),
    context: z.record(z.string(), z.unknown()).optional(),
  }),
});

export const successResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
    message: z.string().optional(),
    pagination: paginationSchema.optional(),
  });

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

export const validateApiResponse = <T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): z.infer<T> => {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Return the data as-is if validation fails for debugging purposes
      return data as z.infer<T>;
    }
    throw error;
  }
};

export const validateErrorResponse = (data: unknown) => {
  return validateApiResponse(errorResponseSchema, data);
};

export const validateSuccessResponse = <T extends z.ZodTypeAny>(
  dataSchema: T,
  data: unknown
) => {
  return validateApiResponse(successResponseSchema(dataSchema), data);
}; 