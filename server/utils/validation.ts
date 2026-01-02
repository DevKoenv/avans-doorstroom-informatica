import { z } from 'zod';
import { TeamMemberRole, BookmarkStatus } from '~/prisma/generated/prisma';

// Team schemas
export const createTeamSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  avatar: z.string().url().optional(),
  slug: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
});

export const updateTeamSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  avatar: z.string().url().optional().nullable(),
  slug: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
    .optional(),
});

// Team Settings schemas
export const updateTeamSettingsSchema = z.object({
  defaultMemberRole: z.nativeEnum(TeamMemberRole).optional(),
  allowMemberBookmarkCreate: z.boolean().optional(),
  allowMemberTagCreate: z.boolean().optional(),
});

// Team Member schemas
export const updateTeamMemberSchema = z.object({
  role: z.nativeEnum(TeamMemberRole),
});

export const transferOwnershipSchema = z.object({
  newOwnerId: z.number().int().positive(),
});

// Collection schemas
export const createCollectionSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  icon: z.string().max(50).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color').optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const updateCollectionSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  icon: z.string().max(50).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color').optional(),
  sortOrder: z.number().int().min(0).optional(),
});

// Bookmark schemas
export const createBookmarkSchema = z.object({
  title: z.string().min(1).max(200),
  url: z.string().url(),
  description: z.string().max(1000).optional(),
  favicon: z.string().url().optional(),
  status: z.nativeEnum(BookmarkStatus).optional(),
  tagIds: z.array(z.number().int().positive()).optional(),
});

export const updateBookmarkSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  url: z.string().url().optional(),
  description: z.string().max(1000).optional().nullable(),
  favicon: z.string().url().optional().nullable(),
  status: z.nativeEnum(BookmarkStatus).optional(),
  tagIds: z.array(z.number().int().positive()).optional(),
});

// Tag schemas
export const createTagSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color').optional(),
});

export const updateTagSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color').optional(),
});

// Invitation schemas
export const createInvitationSchema = z.object({
  email: z.string().email(),
  role: z.nativeEnum(TeamMemberRole).optional(),
});

export const acceptInvitationSchema = z.object({
  token: z.string(),
});
