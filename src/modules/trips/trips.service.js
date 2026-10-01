import prisma from '../../utils/prisma.js';
import { generateShareCode } from '../../utils/shareCode.js';
import { createError } from '../../middleware/errorHandler.js';

// ─── Selects ──────────────────────────────────────────────────────────────────

const tripSelect = {
  id: true,
  name: true,
  description: true,
  startDate: true,
  expectedEndDate: true,
  shareCode: true,
  createdAt: true,
  createdBy: { select: { id: true, name: true, email: true } },
  members: {
    where: { status: { not: 'REMOVED' } },
    select: {
      id: true,
      userId: true,
      role: true,
      status: true,
      displayName: true,
      joinedAt: true,
      user: { select: { id: true, name: true, email: true } },
    },
  },
  _count: {
    select: {
      members: { where: { status: { not: 'REMOVED' } } },
      transactions: true,
      travelTickets: true,
      hotelBookings: true,
      rentalDetails: true,
      documents: true,
    }
  }
};

// ─── Service Functions ────────────────────────────────────────────────────────

export async function createTrip(userId, data) {
  let shareCode;
  for (let i = 0; i < 5; i++) {
    const candidate = generateShareCode();
    const exists = await prisma.trip.findUnique({ where: { shareCode: candidate } });
    if (!exists) { shareCode = candidate; break; }
  }
  if (!shareCode) throw createError(500, 'Failed to generate share code. Please try again.');

  const user = await prisma.user.findUnique({ where: { id: userId } });

  const trip = await prisma.$transaction(async (tx) => {
    const newTrip = await tx.trip.create({
      data: {
        ...data,
        shareCode,
        createdById: userId,
      },
    });
    await tx.tripMember.create({
      data: { tripId: newTrip.id, userId, role: 'OWNER', status: 'ACTIVE', displayName: user.name },
    });
    return newTrip;
  });

  return getTrip(trip.id);
}

export async function getMyTrips(userId) {
  const memberships = await prisma.tripMember.findMany({
    where: { userId, status: { not: 'REMOVED' } },
    include: {
      trip: {
        select: {
          ...tripSelect,
          _count: { select: { members: { where: { status: { not: 'REMOVED' } } } } },
        },
      },
    },
    orderBy: { joinedAt: 'desc' },
  });
  return memberships.map((m) => ({ ...m.trip, myRole: m.role }));
}

export async function getTrip(tripId) {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: tripSelect,
  });
  if (!trip) throw createError(404, 'Trip not found.');
  return trip;
}

export async function updateTrip(tripId, data) {
  return prisma.trip.update({
    where: { id: tripId },
    data,
    select: tripSelect,
  });
}

export async function deleteTrip(tripId) {
  await prisma.trip.delete({ where: { id: tripId } });
}

export async function getTripMembers(tripId) {
  return prisma.tripMember.findMany({
    where: { tripId, status: { not: 'REMOVED' } },
    select: {
      id: true,
      role: true,
      status: true,
      displayName: true,
      joinedAt: true,
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { joinedAt: 'asc' },
  });
}

export async function addPlaceholderMember(tripId, displayName) {
  return prisma.tripMember.create({
    data: {
      tripId,
      displayName,
      status: 'PLACEHOLDER'
    }
  });
}

export async function renameTripMember(tripId, memberId, displayName) {
  return prisma.tripMember.update({
    where: { id: memberId, tripId },
    data: { displayName }
  });
}

export async function removeTripMember(tripId, memberId, requesterUserId) {
  const member = await prisma.tripMember.findUnique({ where: { id: memberId, tripId } });
  if (!member) throw createError(404, 'Member not found in this trip.');
  if (member.role === 'OWNER') throw createError(403, 'Cannot remove the trip owner.');
  if (member.userId === requesterUserId) throw createError(400, 'Use "Leave trip" to remove yourself.');
  
  // Hard delete if it's an unclaimed placeholder, otherwise soft delete (mark removed) to keep expense history
  if (member.status === 'PLACEHOLDER' && !member.userId) {
    await prisma.tripMember.delete({ where: { id: member.id } });
  } else {
    await prisma.tripMember.update({ where: { id: member.id }, data: { status: 'REMOVED' } });
  }
}

export async function unlinkTripMember(tripId, memberId) {
  const member = await prisma.tripMember.findUnique({ where: { id: memberId, tripId } });
  if (!member) throw createError(404, 'Member not found.');
  if (member.role === 'OWNER') throw createError(403, 'Cannot unlink the trip owner.');
  
  return prisma.tripMember.update({
    where: { id: member.id },
    data: { userId: null, status: 'PLACEHOLDER', claimedAt: null }
  });
}

export async function regenerateShareCode(tripId) {
  let shareCode;
  for (let i = 0; i < 5; i++) {
    const candidate = generateShareCode();
    const exists = await prisma.trip.findUnique({ where: { shareCode: candidate } });
    if (!exists) { shareCode = candidate; break; }
  }
  if (!shareCode) throw createError(500, 'Failed to regenerate share code.');
  return prisma.trip.update({
    where: { id: tripId },
    data: { shareCode },
    select: { shareCode: true },
  });
}

export async function previewJoinTrip(code) {
  const trip = await prisma.trip.findUnique({ 
    where: { shareCode: code },
    select: {
      id: true,
      name: true,
      members: {
        where: { status: 'PLACEHOLDER', userId: null },
        select: { id: true, displayName: true }
      }
    }
  });
  if (!trip) throw createError(404, 'Invalid share code. No trip found.');
  return trip;
}

export async function joinTripByCode(userId, code, claimMemberId = null) {
  const trip = await prisma.trip.findUnique({ where: { shareCode: code } });
  if (!trip) throw createError(404, 'Invalid share code. No trip found.');

  const existing = await prisma.tripMember.findFirst({
    where: { tripId: trip.id, userId, status: { not: 'REMOVED' } },
  });
  if (existing) throw createError(409, 'You are already a member of this trip.');

  const user = await prisma.user.findUnique({ where: { id: userId } });

  await prisma.$transaction(async (tx) => {
    if (claimMemberId) {
      // Claim existing placeholder
      const placeholder = await tx.tripMember.findUnique({ where: { id: claimMemberId } });
      if (!placeholder || placeholder.tripId !== trip.id) throw createError(404, 'Placeholder not found.');
      if (placeholder.userId) throw createError(409, 'This member has already been claimed.');
      
      await tx.tripMember.update({
        where: { id: claimMemberId },
        data: { userId, status: 'ACTIVE', claimedAt: new Date() }
      });
    } else {
      // Join as new
      await tx.tripMember.create({
        data: { tripId: trip.id, userId, role: 'MEMBER', status: 'ACTIVE', displayName: user.name },
      });
    }
  });

  return getTrip(trip.id);
}
