import { getAuthenticatedUser, requireTeamAdmin } from '~/server/utils/auth';
import { updateTeamMemberSchema } from '~/server/utils/validation';
import { TeamMemberRole } from '~/prisma/generated/prisma';
import { prisma } from '~/server/utils/prisma';

export default defineEventHandler(async (event) => {
  const user = await getAuthenticatedUser(event);
  const teamId = parseInt(getRouterParam(event, 'teamId') || '');
  const targetUserId = parseInt(getRouterParam(event, 'userId') || '');

  if (isNaN(teamId) || isNaN(targetUserId)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid team or user ID',
    });
  }

  // Verify user is admin or owner
  const membership = await requireTeamAdmin(event, teamId, user.id);

  const body = await readBody(event);
  const data = updateTeamMemberSchema.parse(body);

  // Get target member
  const targetMember = await prisma.teamMember.findUnique({
    where: {
      teamId_userId: {
        teamId,
        userId: targetUserId,
      },
    },
  });

  if (!targetMember) {
    throw createError({
      statusCode: 404,
      message: 'Member not found',
    });
  }

  // Cannot change owner's role (must use transfer-ownership)
  if (targetMember.role === TeamMemberRole.OWNER) {
    throw createError({
      statusCode: 400,
      message: 'Cannot change owner role. Use transfer-ownership instead.',
    });
  }

  // Only owner can promote to admin or change admin roles
  if (
    (data.role === TeamMemberRole.ADMIN || targetMember.role === TeamMemberRole.ADMIN) &&
    membership.role !== TeamMemberRole.OWNER
  ) {
    throw createError({
      statusCode: 403,
      message: 'Only owner can manage admin roles',
    });
  }

  // Update member role
  const updatedMember = await prisma.teamMember.update({
    where: {
      teamId_userId: {
        teamId,
        userId: targetUserId,
      },
    },
    data: {
      role: data.role,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });

  return { member: updatedMember };
});
