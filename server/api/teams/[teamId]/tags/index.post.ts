import { getAuthenticatedUser, requireTeamMembership } from '~/server/utils/auth';
import { createTagSchema } from '~/server/utils/validation';
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

  // Check permissions based on team settings
  const settings = await prisma.teamSettings.findUnique({
    where: { teamId },
  });

  if (
    membership.role === TeamMemberRole.MEMBER &&
    settings &&
    !settings.allowMemberTagCreate
  ) {
    throw createError({
      statusCode: 403,
      message: 'Members are not allowed to create tags',
    });
  }

  const body = await readBody(event);
  const data = createTagSchema.parse(body);

  // Check if tag name already exists in this team
  const existingTag = await prisma.tag.findUnique({
    where: {
      teamId_name: {
        teamId,
        name: data.name,
      },
    },
  });

  if (existingTag) {
    throw createError({
      statusCode: 400,
      message: 'A tag with this name already exists in this team',
    });
  }

  // Create tag
  const tag = await prisma.tag.create({
    data: {
      ...data,
      teamId,
    },
  });

  return { tag };
});
