import { getAuthenticatedUser, requireTeamAdmin, verifyTagBelongsToTeam } from '~/server/utils/auth';
import { updateTagSchema } from '~/server/utils/validation';
import { prisma } from '~/server/utils/prisma';

export default defineEventHandler(async (event) => {
  const user = await getAuthenticatedUser(event);
  const teamId = parseInt(getRouterParam(event, 'teamId') || '');
  const tagId = parseInt(getRouterParam(event, 'tagId') || '');

  if (isNaN(teamId) || isNaN(tagId)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid team or tag ID',
    });
  }

  // Verify user is admin or owner
  await requireTeamAdmin(event, teamId, user.id);

  // Verify tag belongs to team
  await verifyTagBelongsToTeam(tagId, teamId);

  const body = await readBody(event);
  const data = updateTagSchema.parse(body);

  // If name is being updated, check it's not taken
  if (data.name) {
    const existingTag = await prisma.tag.findUnique({
      where: {
        teamId_name: {
          teamId,
          name: data.name,
        },
      },
    });

    if (existingTag && existingTag.id !== tagId) {
      throw createError({
        statusCode: 400,
        message: 'A tag with this name already exists in this team',
      });
    }
  }

  // Update tag
  const tag = await prisma.tag.update({
    where: { id: tagId },
    data,
  });

  return { tag };
});
