import { getAuthenticatedUser, requireTeamMembership, verifyCollectionBelongsToTeam } from '~/server/utils/auth';
import { createBookmarkSchema } from '~/server/utils/validation';
import { TeamMemberRole } from '~/prisma/generated/prisma';
import { prisma } from '~/server/utils/prisma';

export default defineEventHandler(async (event) => {
  const user = await getAuthenticatedUser(event);
  const teamId = parseInt(getRouterParam(event, 'teamId') || '');
  const collectionId = parseInt(getRouterParam(event, 'collectionId') || '');

  if (isNaN(teamId) || isNaN(collectionId)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid team or collection ID',
    });
  }

  // Verify user is a member
  const membership = await requireTeamMembership(event, teamId, user.id);

  // Check permissions based on team settings
  const settings = await prisma.teamSettings.findUnique({
    where: { teamId },
  });

  if (
    membership.role === TeamMemberRole.MEMBER &&
    settings &&
    !settings.allowMemberBookmarkCreate
  ) {
    throw createError({
      statusCode: 403,
      message: 'Members are not allowed to create bookmarks',
    });
  }

  // Verify collection belongs to team
  await verifyCollectionBelongsToTeam(collectionId, teamId);

  const body = await readBody(event);
  const data = createBookmarkSchema.parse(body);

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

  // Create bookmark
  const tagConnections = data.tagIds && data.tagIds.length > 0
    ? {
        tags: {
          create: data.tagIds.map((tagId) => ({
            tagId,
          })),
        },
      }
    : {};

  const bookmark = await prisma.bookmark.create({
    data: {
      title: data.title,
      url: data.url,
      description: data.description,
      favicon: data.favicon,
      status: data.status,
      collectionId,
      ...tagConnections,
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
