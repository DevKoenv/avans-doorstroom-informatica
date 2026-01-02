import { getAuthenticatedUser, requireTeamAdmin } from '~/server/utils/auth';
import { createCollectionSchema } from '~/server/utils/validation';
import { prisma } from '~/server/utils/prisma';

export default defineEventHandler(async (event) => {
  const user = await getAuthenticatedUser(event);
  const teamId = parseInt(getRouterParam(event, 'teamId') || '');

  if (isNaN(teamId)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid team ID',
    });
  }

  // Verify user is admin or owner
  await requireTeamAdmin(event, teamId, user.id);

  const body = await readBody(event);
  const data = createCollectionSchema.parse(body);

  // Create collection
  const collection = await prisma.collection.create({
    data: {
      ...data,
      teamId,
    },
  });

  return { collection };
});
