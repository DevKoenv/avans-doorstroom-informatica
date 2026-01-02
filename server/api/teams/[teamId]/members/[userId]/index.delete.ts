import { getAuthenticatedUser, requireTeamAdmin } from '~/server/utils/auth';
import { TeamMemberRole } from '~/prisma/generated/prisma';
import { prisma } from '~/server/utils/prisma';

export default defineEventHandler(async (event) => {
  const user = await getAuthenticatedUser(event);
  const teamId = parseInt(getRouterParam(event, 'teamId') || '');
  const targetUserId = parseInt(getRouterParam(event, 'userId') || '');

  if (isNaN(teamId) || isNaN(targetUserId)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid team or user ID',
    });
  }

  // Verify user is admin or owner
  const membership = await requireTeamAdmin(event, teamId, user.id);

  // Get target member
  const targetMember = await prisma.teamMember.findUnique({
    where: {
      teamId_userId: {
        teamId,
        userId: targetUserId,
      },
    },
  });

  if (!targetMember) {
    throw createError({
      statusCode: 404,
      message: 'Member not found',
    });
  }

  // Cannot remove owner
  if (targetMember.role === TeamMemberRole.OWNER) {
    throw createError({
      statusCode: 400,
      message: 'Cannot remove owner. Transfer ownership first.',
    });
  }

  // Only owner can remove admins
  if (targetMember.role === TeamMemberRole.ADMIN && membership.role !== TeamMemberRole.OWNER) {
    throw createError({
      statusCode: 403,
      message: 'Only owner can remove admins',
    });
  }

  // Remove member
  await prisma.teamMember.delete({
    where: {
      teamId_userId: {
        teamId,
        userId: targetUserId,
      },
    },
  });

  return {
    success: true,
    message: 'Member removed successfully',
  };
});
