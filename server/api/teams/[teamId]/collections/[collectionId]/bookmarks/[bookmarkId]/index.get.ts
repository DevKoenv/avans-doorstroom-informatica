import { getAuthenticatedUser, requireTeamMembership, verifyBookmarkBelongsToCollection } from '~/server/utils/auth';
import { prisma } from '~/server/utils/prisma';

export default defineEventHandler(async (event) => {
  const user = await getAuthenticatedUser(event);
  const teamId = parseInt(getRouterParam(event, 'teamId') || '');
  const collectionId = parseInt(getRouterParam(event, 'collectionId') || '');
  const bookmarkId = parseInt(getRouterParam(event, 'bookmarkId') || '');

  if (isNaN(teamId) || isNaN(collectionId) || isNaN(bookmarkId)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid team, collection, or bookmark ID',
    });
  }

  // Verify user is a member
  await requireTeamMembership(event, teamId, user.id);

  // Verify bookmark belongs to collection and team
  await verifyBookmarkBelongsToCollection(bookmarkId, collectionId, teamId);

  // Get bookmark
  const bookmark = await prisma.bookmark.findUnique({
    where: { id: bookmarkId },
    include: {
      tags: {
        include: {
          tag: true,
        },
      },
    },
  });

  return { bookmark };
});
