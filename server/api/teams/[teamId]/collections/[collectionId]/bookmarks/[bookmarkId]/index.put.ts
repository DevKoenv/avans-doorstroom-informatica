import { getAuthenticatedUser, requireTeamMembership, verifyBookmarkBelongsToCollection } from '~/server/utils/auth';
import { updateBookmarkSchema } from '~/server/utils/validation';
import { prisma } from '~/server/utils/prisma';

export default defineEventHandler(async (event) => {
  const user = await getAuthenticatedUser(event);
  const teamId = parseInt(getRouterParam(event, 'teamId') || '');
  const collectionId = parseInt(getRouterParam(event, 'collectionId') || '');
  const bookmarkId = parseInt(getRouterParam(event, 'bookmarkId') || '');

  if (isNaN(teamId) || isNaN(collectionId) || isNaN(bookmarkId)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid team, collection, or bookmark ID',
    });
  }

  // Verify user is a member
  await requireTeamMembership(event, teamId, user.id);

  // Verify bookmark belongs to collection and team
  await verifyBookmarkBelongsToCollection(bookmarkId, collectionId, teamId);

  const body = await readBody(event);
  const data = updateBookmarkSchema.parse(body);

  // If tagIds provided, verify they all belong to the team
  if (data.tagIds && data.tagIds.length > 0) {
    const tags = await prisma.tag.findMany({
      where: {
        id: { in: data.tagIds },
        teamId,
      },
    });

    if (tags.length !== data.tagIds.length) {
      throw createError({
        statusCode: 400,
        message: 'One or more tags do not belong to this team',
      });
    }
  }

  // Update bookmark and tags
  const bookmark = await prisma.bookmark.update({
    where: { id: bookmarkId },
    data: {
      title: data.title,
      url: data.url,
      description: data.description,
      favicon: data.favicon,
      status: data.status,
      ...(data.tagIds && {
        tags: {
          deleteMany: {},
          create: data.tagIds.map((tagId) => ({
            tagId,
          })),
        },
      }),
    },
    include: {
      tags: {
        include: {
          tag: true,
        },
      },
    },
  });

  return { bookmark };
});
