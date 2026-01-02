import { getAuthenticatedUser, requireTeamAdmin } from '~/server/utils/auth';
import { updateTeamSchema } from '~/server/utils/validation';
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
  const data = updateTeamSchema.parse(body);

  // If slug is being updated, check it's not taken
  if (data.slug) {
    const existingTeam = await prisma.team.findUnique({
      where: { slug: data.slug },
    });

    if (existingTeam && existingTeam.id !== teamId) {
      throw createError({
        statusCode: 400,
        message: 'A team with this slug already exists',
      });
    }
  }

  // Update team
  const team = await prisma.team.update({
    where: { id: teamId },
    data,
  });

  return { team };
});
