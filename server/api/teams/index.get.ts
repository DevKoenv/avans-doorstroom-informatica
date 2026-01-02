import { getAuthenticatedUser } from '~/server/utils/auth';
import { prisma } from '~/server/utils/prisma';

export default defineEventHandler(async (event) => {
  const user = await getAuthenticatedUser(event);

  // Get all teams where user is a member
  const teams = await prisma.team.findMany({
    where: {
      members: {
        some: {
          userId: user.id,
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
      _count: {
        select: {
          members: true,
          collections: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Transform to include user's role directly
  const teamsWithRole = teams.map((team) => ({
    id: team.id,
    name: team.name,
    description: team.description,
    avatar: team.avatar,
    slug: team.slug,
    role: team.members[0].role,
    memberCount: team._count.members,
    collectionCount: team._count.collections,
    createdAt: team.createdAt,
    updatedAt: team.updatedAt,
  }));

  return {
    teams: teamsWithRole,
  };
});
