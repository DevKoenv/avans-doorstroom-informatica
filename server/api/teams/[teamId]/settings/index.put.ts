import { getAuthenticatedUser, requireTeamAdmin } from '~/server/utils/auth';
import { updateTeamSettingsSchema } from '~/server/utils/validation';
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

  // Only admins can update settings
  await requireTeamAdmin(event, teamId, user.id);

  const body = await readBody(event);
  const data = updateTeamSettingsSchema.parse(body);

  // Upsert settings
  const settings = await prisma.teamSettings.upsert({
    where: { teamId },
    create: {
      teamId,
      ...data,
    },
    update: data,
  });

  return { settings };
});
