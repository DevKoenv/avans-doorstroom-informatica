import { getAuthenticatedUser, requireTeamAdmin, verifyTagBelongsToTeam } from '~/server/utils/auth';
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

  // Check query param for force delete
  const query = getQuery(event);
  const force = query.force === 'true';

  // Check if tag is in use
  const tag = await prisma.tag.findUnique({
    where: { id: tagId },
    include: {
      _count: {
        select: {
          bookmarks: true,
        },
      },
    },
  });

  if (tag && tag._count.bookmarks > 0 && !force) {
    throw createError({
      statusCode: 400,
      message: `Cannot delete tag "${tag.name}" because it is currently used by ${tag._count.bookmarks} bookmark(s). Please remove the tag from all bookmarks first.`,
    });
  }

  // Delete tag (cascade will delete bookmark associations)
  await prisma.tag.delete({
    where: { id: tagId },
  });

  return {
    success: true,
    message: 'Tag deleted successfully',
  };
});
