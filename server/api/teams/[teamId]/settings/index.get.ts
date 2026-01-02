import { getAuthenticatedUser, requireTeamMembership } from '~/server/utils/auth';
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

  // Verify user is a member
  await requireTeamMembership(event, teamId, user.id);

  // Get or create settings
  let settings = await prisma.teamSettings.findUnique({
    where: { teamId },
  });

  if (!settings) {
    settings = await prisma.teamSettings.create({
      data: { teamId },
    });
  }

  return { settings };
});
