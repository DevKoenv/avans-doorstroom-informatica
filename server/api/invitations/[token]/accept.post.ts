import { getAuthenticatedUser } from '~/server/utils/auth';
import { prisma } from '~/server/utils/prisma';

export default defineEventHandler(async (event) => {
  const user = await getAuthenticatedUser(event);
  const token = getRouterParam(event, 'token');

  if (!token) {
    throw createError({
      statusCode: 400,
      message: 'Invalid invitation token',
    });
  }

  // Find invitation
  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: {
      team: true,
    },
  });

  if (!invitation) {
    throw createError({
      statusCode: 404,
      message: 'Invitation not found',
    });
  }

  // Check if already accepted
  if (invitation.accepted) {
    throw createError({
      statusCode: 400,
      message: 'Invitation has already been accepted',
    });
  }

  // Check if expired
  if (invitation.expires < new Date()) {
    throw createError({
      statusCode: 400,
      message: 'Invitation has expired',
    });
  }

  // Check if email matches user
  // Only allow accepting if the invitation was sent to the user's email
  if (user.email !== invitation.email) {
    throw createError({
      statusCode: 403,
      message: 'This invitation was sent to a different email address. Please log in with the correct account.',
    });
  }

  // Check if user is already a member
  const existingMember = await prisma.teamMember.findUnique({
    where: {
      teamId_userId: {
        teamId: invitation.teamId,
        userId: user.id,
      },
    },
  });

  if (existingMember) {
    throw createError({
      statusCode: 400,
      message: 'You are already a member of this team',
    });
  }

  // Accept invitation - create team membership and mark invitation as accepted
  const teamMember = await prisma.$transaction(async (tx) => {
    // Create team membership
    const member = await tx.teamMember.create({
      data: {
        teamId: invitation.teamId,
        userId: user.id,
        role: invitation.role,
      },
      include: {
        team: true,
      },
    });

    // Mark invitation as accepted
    await tx.invitation.update({
      where: { id: invitation.id },
      data: { accepted: true },
    });

    return member;
  });

  return {
    success: true,
    message: 'Invitation accepted successfully',
    team: teamMember.team,
  };
});
