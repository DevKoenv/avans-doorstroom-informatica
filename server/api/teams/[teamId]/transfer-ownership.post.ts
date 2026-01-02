import { getAuthenticatedUser, requireTeamOwner } from '~/server/utils/auth';
import { transferOwnershipSchema } from '~/server/utils/validation';
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

  // Only current owner can transfer ownership
  await requireTeamOwner(event, teamId, user.id);

  const body = await readBody(event);
  const data = transferOwnershipSchema.parse(body);

  // Verify new owner is a member of the team
  const newOwnerMember = await prisma.teamMember.findUnique({
    where: {
      teamId_userId: {
        teamId,
        userId: data.newOwnerId,
      },
    },
  });

  if (!newOwnerMember) {
    throw createError({
      statusCode: 404,
      message: 'New owner must be a member of the team',
    });
  }

  // Use transaction to update both memberships atomically
  await prisma.$transaction([
    // Demote current owner to admin
    prisma.teamMember.update({
      where: {
        teamId_userId: {
          teamId,
          userId: user.id,
        },
      },
      data: {
        role: TeamMemberRole.ADMIN,
      },
    }),
    // Promote new owner
    prisma.teamMember.update({
      where: {
        teamId_userId: {
          teamId,
          userId: data.newOwnerId,
        },
      },
      data: {
        role: TeamMemberRole.OWNER,
      },
    }),
  ]);

  return {
    success: true,
    message: 'Ownership transferred successfully',
  };
});
