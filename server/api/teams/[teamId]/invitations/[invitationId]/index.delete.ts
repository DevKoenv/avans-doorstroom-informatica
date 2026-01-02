import { getAuthenticatedUser, requireTeamAdmin } from '~/server/utils/auth';
import { prisma } from '~/server/utils/prisma';

export default defineEventHandler(async (event) => {
  const user = await getAuthenticatedUser(event);
  const teamId = parseInt(getRouterParam(event, 'teamId') || '');
  const invitationId = parseInt(getRouterParam(event, 'invitationId') || '');

  if (isNaN(teamId) || isNaN(invitationId)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid team or invitation ID',
    });
  }

  // Verify user is admin or owner
  await requireTeamAdmin(event, teamId, user.id);

  // Verify invitation belongs to team
  const invitation = await prisma.invitation.findUnique({
    where: { id: invitationId },
  });

  if (!invitation || invitation.teamId !== teamId) {
    throw createError({
      statusCode: 404,
      message: 'Invitation not found',
    });
  }

  // Delete invitation
  await prisma.invitation.delete({
    where: { id: invitationId },
  });

  return {
    success: true,
    message: 'Invitation deleted successfully',
  };
});
