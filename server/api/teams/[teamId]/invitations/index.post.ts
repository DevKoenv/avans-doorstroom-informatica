import { getAuthenticatedUser, requireTeamAdmin } from '~/server/utils/auth';
import { createInvitationSchema } from '~/server/utils/validation';
import { TeamMemberRole } from '~/prisma/generated/prisma';
import { prisma } from '~/server/utils/prisma';
import { v4 as uuidv4 } from 'uuid';

export default defineEventHandler(async (event) => {
  const user = await getAuthenticatedUser(event);
  const teamId = parseInt(getRouterParam(event, 'teamId') || '');

  if (isNaN(teamId)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid team ID',
    });
  }

  // Verify user is admin or owner
  await requireTeamAdmin(event, teamId, user.id);

  const body = await readBody(event);
  const data = createInvitationSchema.parse(body);

  // Check if user is already a member
  const existingMember = await prisma.teamMember.findFirst({
    where: {
      teamId,
      user: {
        email: data.email,
      },
    },
  });

  if (existingMember) {
    throw createError({
      statusCode: 400,
      message: 'User is already a member of this team',
    });
  }

  // Check if there's already a pending invitation
  const existingInvitation = await prisma.invitation.findFirst({
    where: {
      teamId,
      email: data.email,
      accepted: false,
      expires: {
        gt: new Date(),
      },
    },
  });

  if (existingInvitation) {
    throw createError({
      statusCode: 400,
      message: 'An invitation is already pending for this email',
    });
  }

  // Create invitation with 7 days expiry
  const token = uuidv4();
  const expires = new Date();
  expires.setDate(expires.getDate() + 7);

  const invitation = await prisma.invitation.create({
    data: {
      email: data.email,
      role: data.role || TeamMemberRole.MEMBER,
      token,
      expires,
      teamId,
    },
    include: {
      team: {
        select: {
          name: true,
        },
      },
    },
  });

  return { invitation };
});
