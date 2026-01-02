import { getAuthenticatedUser, requireTeamOwner } from '~/server/utils/auth';
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

  // Only OWNER can delete a team
  await requireTeamOwner(event, teamId, user.id);

  // Delete team (cascade will delete all related data)
  await prisma.team.delete({
    where: { id: teamId },
  });

  return {
    success: true,
    message: 'Team deleted successfully',
  };
});
