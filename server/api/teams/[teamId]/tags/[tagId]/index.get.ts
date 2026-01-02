import { getAuthenticatedUser, requireTeamMembership, verifyTagBelongsToTeam } from '~/server/utils/auth';
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

  // Verify user is a member
  await requireTeamMembership(event, teamId, user.id);

  // Verify tag belongs to team
  const tag = await verifyTagBelongsToTeam(tagId, teamId);

  // Get tag with bookmarks count
  const tagWithCount = await prisma.tag.findUnique({
    where: { id: tagId },
    include: {
      _count: {
        select: {
          bookmarks: true,
        },
      },
    },
  });

  return { tag: tagWithCount };
});
