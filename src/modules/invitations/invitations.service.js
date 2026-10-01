import prisma from '../../utils/prisma.js';
import { createError } from '../../middleware/errorHandler.js';
import { getTrip } from '../trips/trips.service.js';

// ─── Service Functions ────────────────────────────────────────────────────────

export async function inviteByEmail(tripId, inviterId, invitedEmail) {
  // Check if they are already a member
  const existingMember = await prisma.tripMember.findFirst({
    where: { tripId, user: { email: invitedEmail } },
  });
  if (existingMember) {
    throw createError(409, 'User is already a member of this trip.');
  }

  // Check if an invitation is already pending
  const existingInvite = await prisma.invitation.findFirst({
    where: { tripId, invitedEmail, status: 'PENDING' },
  });
  if (existingInvite) {
    throw createError(409, 'An invitation to this email is already pending.');
  }

  // See if user exists to link them immediately
  const user = await prisma.user.findUnique({ where: { email: invitedEmail } });

  const invite = await prisma.invitation.create({
    data: {
      tripId,
      invitedById: inviterId,
      invitedEmail,
      invitedUserId: user?.id || null,
    },
    include: {
      trip: { select: { id: true, name: true, expectedEndDate: true } },
      invitedBy: { select: { id: true, name: true, email: true } },
    }
  });

  return invite;
}

export async function getMyPendingInvitations(userId, userEmail) {
  return prisma.invitation.findMany({
    where: {
      status: 'PENDING',
      OR: [
        { invitedUserId: userId },
        { invitedEmail: userEmail } // Fallback just in case
      ]
    },
    include: {
      trip: { select: { id: true, name: true, startDate: true, expectedEndDate: true } },
      invitedBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function respondToInvitation(inviteId, userId, accept) {
  const invite = await prisma.invitation.findUnique({
    where: { id: inviteId },
    include: { trip: true }
  });

  if (!invite) throw createError(404, 'Invitation not found.');
  if (invite.status !== 'PENDING') throw createError(400, `Invitation is already ${invite.status.toLowerCase()}.`);
  
  // Ensure the person responding is the person invited
  if (invite.invitedUserId !== userId) {
    const me = await prisma.user.findUnique({ where: { id: userId } });
    if (invite.invitedEmail !== me?.email) {
      throw createError(403, 'You are not authorized to respond to this invitation.');
    }
  }

  if (accept) {
    return prisma.$transaction(async (tx) => {
      // Mark accepted
      await tx.invitation.update({
        where: { id: inviteId },
        data: { status: 'ACCEPTED', invitedUserId: userId } // ensure linked
      });
      // Add to trip
      await tx.tripMember.upsert({
        where: { tripId_userId: { tripId: invite.tripId, userId } },
        update: {},
        create: { tripId: invite.tripId, userId, role: 'MEMBER' }
      });
      return { message: 'Invitation accepted. You are now a member of the trip.' };
    });
  } else {
    await prisma.invitation.update({
      where: { id: inviteId },
      data: { status: 'DECLINED', invitedUserId: userId }
    });
    return { message: 'Invitation declined.' };
  }
}

export async function getTripInvitations(tripId) {
  return prisma.invitation.findMany({
    where: { tripId },
    include: {
      invitedBy: { select: { name: true, email: true } },
      invitedUser: { select: { name: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
}
