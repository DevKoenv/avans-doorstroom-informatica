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

  // Verify user is a member of the team
  const membership = await requireTeamMembership(event, teamId, user.id);

  // Get team details
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      _count: {
        select: {
          members: true,
          collections: true,
          tags: true,
        },
      },
    },
  });

  if (!team) {
    throw createError({
      statusCode: 404,
      message: 'Team not found',
    });
  }

  return {
    team: {
      ...team,
      role: membership.role,
    },
  };
});
