import { getAuthenticatedUser } from '~/server/utils/auth';
import { createTeamSchema } from '~/server/utils/validation';
import { TeamMemberRole } from '~/prisma/generated/prisma';
import { prisma } from '~/server/utils/prisma';

export default defineEventHandler(async (event) => {
  const user = await getAuthenticatedUser(event);
  const body = await readBody(event);

  // Validate input
  const data = createTeamSchema.parse(body);

  // Check if slug is already taken
  const existingTeam = await prisma.team.findUnique({
    where: { slug: data.slug },
  });

  if (existingTeam) {
    throw createError({
      statusCode: 400,
      message: 'A team with this slug already exists',
    });
  }

  // Create team with creator as OWNER
  const team = await prisma.team.create({
    data: {
      name: data.name,
      description: data.description,
      avatar: data.avatar,
      slug: data.slug,
      members: {
        create: {
          userId: user.id,
          role: TeamMemberRole.OWNER,
        },
      },
      settings: {
        create: {
          // Use default values from schema
        },
      },
    },
    include: {
      members: {
        where: {
          userId: user.id,
        },
        select: {
          role: true,
        },
      },
    },
  });

  return {
    team: {
      ...team,
      role: team.members[0].role,
    },
  };
});
