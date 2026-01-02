import { prisma } from '~/server/utils/prisma';

export default defineEventHandler(async (event) => {
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
      team: {
        select: {
          id: true,
          name: true,
          description: true,
          avatar: true,
        },
      },
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
      message: 'This invitation has already been accepted',
    });
  }

  // Check if expired
  if (invitation.expires < new Date()) {
    throw createError({
      statusCode: 400,
      message: 'This invitation has expired',
    });
  }

  // Return invitation details (without sensitive info like token)
  return {
    invitation: {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      team: invitation.team,
      expires: invitation.expires,
    },
  };
});
