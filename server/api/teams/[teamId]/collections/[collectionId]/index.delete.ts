import { getAuthenticatedUser, requireTeamAdmin, verifyCollectionBelongsToTeam } from '~/server/utils/auth';
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

  // Verify user is admin or owner
  await requireTeamAdmin(event, teamId, user.id);

  // Verify collection belongs to team
  await verifyCollectionBelongsToTeam(collectionId, teamId);

  // Delete collection (cascade will delete bookmarks)
  await prisma.collection.delete({
    where: { id: collectionId },
  });

  return {
    success: true,
    message: 'Collection deleted successfully',
  };
});
