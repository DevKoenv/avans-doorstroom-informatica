import { getAuthenticatedUser, requireTeamAdmin, verifyCollectionBelongsToTeam } from '~/server/utils/auth';
import { updateCollectionSchema } from '~/server/utils/validation';
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

  const body = await readBody(event);
  const data = updateCollectionSchema.parse(body);

  // Update collection
  const collection = await prisma.collection.update({
    where: { id: collectionId },
    data,
  });

  return { collection };
});
