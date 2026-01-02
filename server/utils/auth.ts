import type { H3Event } from 'h3';
import { TeamMemberRole } from '~/prisma/generated/prisma';
import { prisma } from './prisma';

/**
 * Get the authenticated user from the session
 * Throws 401 if not authenticated
 */
export async function getAuthenticatedUser(event: H3Event) {
  const session = await requireUserSession(event);
  if (!session.user?.id) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    });
  }
  return session.user;
}

/**
 * Check if user is a member of a team and return their membership
 * Throws 403 if not a member
 */
export async function requireTeamMembership(
  event: H3Event,
  teamId: number,
  userId: number
) {
  const membership = await prisma.teamMember.findUnique({
    where: {
      teamId_userId: {
        teamId,
        userId,
      },
    },
    include: {
      team: true,
    },
  });

  if (!membership) {
    throw createError({
      statusCode: 403,
      message: 'You are not a member of this team',
    });
  }

  return membership;
}

/**
 * Check if user has required role in a team
 * Throws 403 if user doesn't have the required role
 */
export async function requireTeamRole(
  event: H3Event,
  teamId: number,
  userId: number,
  requiredRoles: TeamMemberRole[]
) {
  const membership = await requireTeamMembership(event, teamId, userId);

  if (!requiredRoles.includes(membership.role)) {
    throw createError({
      statusCode: 403,
      message: 'Insufficient permissions',
    });
  }

  return membership;
}

/**
 * Check if user is OWNER or ADMIN of a team
 */
export async function requireTeamAdmin(
  event: H3Event,
  teamId: number,
  userId: number
) {
  return requireTeamRole(event, teamId, userId, [
    TeamMemberRole.OWNER,
    TeamMemberRole.ADMIN,
  ]);
}

/**
 * Check if user is OWNER of a team
 */
export async function requireTeamOwner(
  event: H3Event,
  teamId: number,
  userId: number
) {
  return requireTeamRole(event, teamId, userId, [TeamMemberRole.OWNER]);
}

/**
 * Verify that a collection belongs to the specified team
 * Throws 404 if collection doesn't exist or doesn't belong to team
 */
export async function verifyCollectionBelongsToTeam(
  collectionId: number,
  teamId: number
) {
  const collection = await prisma.collection.findUnique({
    where: { id: collectionId },
  });

  if (!collection || collection.teamId !== teamId) {
    throw createError({
      statusCode: 404,
      message: 'Collection not found',
    });
  }

  return collection;
}

/**
 * Verify that a bookmark belongs to a collection in the specified team
 */
export async function verifyBookmarkBelongsToCollection(
  bookmarkId: number,
  collectionId: number,
  teamId: number
) {
  const bookmark = await prisma.bookmark.findUnique({
    where: { id: bookmarkId },
    include: {
      collection: true,
    },
  });

  if (
    !bookmark ||
    bookmark.collectionId !== collectionId ||
    bookmark.collection.teamId !== teamId
  ) {
    throw createError({
      statusCode: 404,
      message: 'Bookmark not found',
    });
  }

  return bookmark;
}

/**
 * Verify that a tag belongs to the specified team
 */
export async function verifyTagBelongsToTeam(tagId: number, teamId: number) {
  const tag = await prisma.tag.findUnique({
    where: { id: tagId },
  });

  if (!tag || tag.teamId !== teamId) {
    throw createError({
      statusCode: 404,
      message: 'Tag not found',
    });
  }

  return tag;
}
