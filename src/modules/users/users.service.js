import prisma from '../../utils/prisma.js';
import { createError } from '../../middleware/errorHandler.js';

export async function getMe(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, phone: true, avatarUrl: true, createdAt: true },
  });
  if (!user) throw createError(404, 'User not found.');
  return user;
}

export async function updateMe(userId, data) {
  if (data.email) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing && existing.id !== userId) {
      throw createError(409, 'Email is already in use.');
    }
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: { id: true, name: true, email: true, phone: true, avatarUrl: true, updatedAt: true },
  });
  return user;
}

export async function getDashboardStats(userId) {
  // Get all trips the user is a member of
  const memberships = await prisma.tripMember.findMany({
    where: { userId },
    select: {
      role: true,
      trip: {
        select: {
          id: true,
          name: true,
          _count: { select: { members: true } },
        },
      },
    },
  });

  const tripIds = memberships.map(m => m.trip.id);
  const totalTrips = tripIds.length;

  // Sum all shared transaction amounts across all trips
  const txAgg = await prisma.transaction.aggregate({
    where: { tripId: { in: tripIds } },
    _sum: { amount: true },
  });
  const totalTracked = txAgg._sum.amount ? Number(txAgg._sum.amount) : 0;

  // Net position: sum of (amount - myShare) where user is NOT the payer (they are owed back)
  //              minus sum of myShare where user IS the payer but others owe them → simplify:
  // For each transaction user paid: they get back (amount - myShare)
  // For each transaction others paid: they owe their share
  // Net = sum(paidByUser.amount - paidByUser.myShare) - sum(othersShareForUser)

  // Get all transactions where user is either a payer or owes a split
  const myTransactions = await prisma.transaction.findMany({
    where: {
      tripId: { in: tripIds },
      OR: [
        { payers: { some: { member: { userId } } } },
        { splits: { some: { member: { userId } } } }
      ]
    },
    include: {
      payers: { where: { member: { userId } } },
      splits: { where: { member: { userId } } }
    },
  });

  // We also want to compute netPosition per trip
  const tripPositions = tripIds.map(id => ({ tripId: id, netPosition: 0 }));

  let netPosition = 0;
  for (const tx of myTransactions) {
    const amountIPaid = tx.payers.reduce((acc, p) => acc + Number(p.paidAmount), 0);
    const myShare = tx.splits.reduce((acc, s) => acc + Number(s.share || s.owedAmount || 0), 0);
    const val = amountIPaid - myShare;
    
    netPosition += val;
    const tp = tripPositions.find(t => t.tripId === tx.tripId);
    if (tp) tp.netPosition += val;
  }

  // Add settlement adjustments per trip
  const settlements = await prisma.settlement.findMany({
    where: {
      tripId: { in: tripIds },
      OR: [
        { receiver: { userId } },
        { payer: { userId } }
      ]
    },
    include: { receiver: true, payer: true }
  });

  for (const s of settlements) {
    const val = Number(s.amount || 0);
    if (s.receiver.userId === userId) {
      netPosition -= val;
      const tp = tripPositions.find(t => t.tripId === s.tripId);
      if (tp) tp.netPosition -= val;
    }
    if (s.payer.userId === userId) {
      netPosition += val;
      const tp = tripPositions.find(t => t.tripId === s.tripId);
      if (tp) tp.netPosition += val;
    }
  }

  const enhancedTrips = memberships.map(m => {
    const tp = tripPositions.find(t => t.tripId === m.trip.id);
    return {
      ...m.trip,
      myRole: m.role,
      netPosition: tp ? Math.round(tp.netPosition * 100) / 100 : 0
    };
  });

  return {
    totalTrips,
    totalTracked,
    netPosition: Math.round(netPosition * 100) / 100,
    trips: enhancedTrips,
  };
}
