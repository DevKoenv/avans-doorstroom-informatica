import { getAuthenticatedUser, requireTeamMembership } from '~/server/utils/auth';
import { TeamMemberRole } from '~/prisma/generated/prisma';
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
  const membership = await requireTeamMembership(event, teamId, user.id);

  // Check if user is the owner
  if (membership.role === TeamMemberRole.OWNER) {
    throw createError({
      statusCode: 400,
      message: 'Owner cannot leave the team. Transfer ownership first.',
    });
  }

  // Remove membership
  await prisma.teamMember.delete({
    where: {
      teamId_userId: {
        teamId,
        userId: user.id,
      },
    },
  });

  return {
    success: true,
    message: 'Successfully left the team',
  };
});
