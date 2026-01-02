import { getAuthenticatedUser, requireTeamAdmin } from '~/server/utils/auth';
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

  // Get all invitations for this team
  const invitations = await prisma.invitation.findMany({
    where: { teamId },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return { invitations };
});
