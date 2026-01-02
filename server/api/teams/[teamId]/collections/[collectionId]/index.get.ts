import { getAuthenticatedUser, requireTeamMembership, verifyCollectionBelongsToTeam } from '~/server/utils/auth';
import { prisma } from '~/server/utils/prisma';

export default defineEventHandler(async (event) => {
  const user = await getAuthenticatedUser(event);
  const teamId = parseInt(getRouterParam(event, 'teamId') || '');
  const collectionId = parseInt(getRouterParam(event, 'collectionId') || '');

  if (isNaN(teamId) || isNaN(collectionId)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid team or collection ID',
    });
  }

  // Verify user is a member
  await requireTeamMembership(event, teamId, user.id);

  // Verify collection belongs to team
  await verifyCollectionBelongsToTeam(collectionId, teamId);

  // Get collection with bookmarks
  const collection = await prisma.collection.findUnique({
    where: { id: collectionId },
    include: {
      _count: {
        select: {
          bookmarks: true,
        },
      },
    },
  });

  return { collection };
});
