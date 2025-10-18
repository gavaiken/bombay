import { z } from 'zod';

// Maximum content length for messages (4000 characters as per SEC.2 requirements)
const MAX_MESSAGE_CONTENT_LENGTH = 4000;
const MAX_THREAD_TITLE_LENGTH = 200;

// Thread schema as returned in responses
export const ThreadSchema = z.object({
  id: z.string().cuid(),
  title: z.string().nullable(),
  activeModel: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export const ThreadListSchema = z.array(ThreadSchema);

// Message schema as returned in responses
export const MessageSchema = z.object({
  id: z.string().cuid(),
  threadId: z.string().cuid(),
  role: z.enum(['system','user','assistant']),
  contentText: z.string(),
  provider: z.string().optional().nullable(),  // only set for assistant
  model: z.string().optional().nullable(),     // only set for assistant
  usage: z.object({ 
    input_tokens: z.number().int(), 
    output_tokens: z.number().int() 
  }).optional(),
  createdAt: z.string().datetime()
});

export const MessageListSchema = z.array(MessageSchema);

// Request schemas with validation limits
export const CreateThreadSchema = z.object({
  title: z.string()
    .max(MAX_THREAD_TITLE_LENGTH, `Thread title must be ${MAX_THREAD_TITLE_LENGTH} characters or less`)
    .optional(),
  activeModel: z.string().optional()
});

export const UpdateThreadSchema = z.object({
  activeModel: z.string().min(1, 'Active model is required'),
  title: z.string()
    .max(MAX_THREAD_TITLE_LENGTH, `Thread title must be ${MAX_THREAD_TITLE_LENGTH} characters or less`)
    .optional()
});

export const SendMessageSchema = z.object({
  threadId: z.string().cuid('Invalid thread ID format'),
  content: z.string()
    .min(1, 'Message content cannot be empty')
    .max(MAX_MESSAGE_CONTENT_LENGTH, `Message content must be ${MAX_MESSAGE_CONTENT_LENGTH} characters or less`)
    .refine(
      (content) => content.trim().length > 0,
      'Message content cannot be only whitespace'
    )
});

// Export the constants for use in other files
export const VALIDATION_LIMITS = {
  MAX_MESSAGE_CONTENT_LENGTH,
  MAX_THREAD_TITLE_LENGTH,
} as const;