import prisma from '../../utils/prisma.js';
import { createError } from '../../middleware/errorHandler.js';
import { calculateSplits } from './transactions.utils.js';

// ─── Shared Transactions ──────────────────────────────────────────────────────

export async function createTransaction(tripId, data) {
  // 1. Validate payers sum
  const payersSum = data.payers.reduce((acc, p) => acc + p.paidAmount, 0);
  if (payersSum !== data.amount) {
    throw createError(400, `Sum of payers (${payersSum}) must equal total amount (${data.amount}).`);
  }

  // 2. Validate and calculate splits
  const computedSplits = calculateSplits(data.amount, data.splitType, data.splits);

  // 3. Create transaction and nested records, then optionally link logistic
  const transaction = await prisma.$transaction(async (tx) => {
    const t = await tx.transaction.create({
      data: {
        tripId,
        title: data.title,
        amount: data.amount,
        category: data.category,
        date: data.date || new Date(),
        note: data.note,
        splitType: data.splitType,
        payers: {
          create: data.payers.map(p => ({
            memberId: p.memberId,
            paidAmount: p.paidAmount,
          })),
        },
        splits: {
          create: computedSplits.map(s => ({
            memberId: s.memberId,
            owedAmount: s.owedAmount,
            share: s.share,
          })),
        },
      },
      include: { payers: true, splits: true }
    });

    if (data.linkedLogistic) {
      const { id, type } = data.linkedLogistic;
      if (type === 'TICKET') await tx.travelTicket.update({ where: { id }, data: { transactionId: t.id } });
      else if (type === 'HOTEL') await tx.hotelBooking.update({ where: { id }, data: { transactionId: t.id } });
      else if (type === 'RENTAL') await tx.rentalDetail.update({ where: { id }, data: { transactionId: t.id } });
    }

    return t;
  });

  return transaction;
}

export async function getTripTransactions(tripId) {
  return prisma.transaction.findMany({
    where: { tripId },
    include: {
      payers: { include: { member: { select: { id: true, displayName: true, user: { select: { name: true } } } } } },
      splits: { include: { member: { select: { id: true, displayName: true, user: { select: { name: true } } } } } }
    },
    orderBy: { date: 'desc' }
  });
}

export async function deleteTransaction(transactionId, tripId) {
  const transaction = await prisma.transaction.findUnique({ where: { id: transactionId, tripId } });
  if (!transaction) throw createError(404, 'Transaction not found.');
  await prisma.transaction.delete({ where: { id: transactionId } });
}

export async function updateTransaction(transactionId, tripId, data) {
  // Verify exists
  const existing = await prisma.transaction.findUnique({ where: { id: transactionId, tripId } });
  if (!existing) throw createError(404, 'Transaction not found.');

  // 1. Validate payers sum
  const payersSum = data.payers.reduce((acc, p) => acc + p.paidAmount, 0);
  if (payersSum !== data.amount) {
    throw createError(400, `Sum of payers (${payersSum}) must equal total amount (${data.amount}).`);
  }

  // 2. Validate and calculate splits
  const computedSplits = calculateSplits(data.amount, data.splitType, data.splits);

  // 3. Use a transaction to delete old nested records and update
  const transaction = await prisma.$transaction(async (tx) => {
    // Delete existing payers and splits
    await tx.transactionPayer.deleteMany({ where: { transactionId } });
    await tx.transactionSplit.deleteMany({ where: { transactionId } });

    // Update main transaction and create new payers and splits
    const t = await tx.transaction.update({
      where: { id: transactionId },
      data: {
        title: data.title,
        amount: data.amount,
        category: data.category,
        date: data.date || existing.date,
        note: data.note,
        splitType: data.splitType,
        payers: {
          create: data.payers.map(p => ({
            memberId: p.memberId,
            paidAmount: p.paidAmount,
          })),
        },
        splits: {
          create: computedSplits.map(s => ({
            memberId: s.memberId,
            owedAmount: s.owedAmount,
            share: s.share,
          })),
        },
      },
      include: { payers: true, splits: true }
    });

    if (data.linkedLogistic) {
      const { id, type } = data.linkedLogistic;
      if (type === 'TICKET') await tx.travelTicket.update({ where: { id }, data: { transactionId: t.id } });
      else if (type === 'HOTEL') await tx.hotelBooking.update({ where: { id }, data: { transactionId: t.id } });
      else if (type === 'RENTAL') await tx.rentalDetail.update({ where: { id }, data: { transactionId: t.id } });
    }

    return t;
  });

  return transaction;
}

// ─── Personal Expenses ────────────────────────────────────────────────────────

export async function createPersonalExpense(tripId, userId, data) {
  return prisma.personalExpense.create({
    data: {
      tripId,
      userId,
      title: data.title,
      amount: data.amount,
      category: data.category,
      date: data.date || new Date(),
      note: data.note,
    }
  });
}

export async function getMyPersonalExpenses(tripId, userId) {
  return prisma.personalExpense.findMany({
    where: { tripId, userId },
    orderBy: { date: 'desc' }
  });
}

export async function deletePersonalExpense(expenseId, tripId, userId) {
  const expense = await prisma.personalExpense.findUnique({ where: { id: expenseId, tripId, userId } });
  if (!expense) throw createError(404, 'Personal expense not found.');
  await prisma.personalExpense.delete({ where: { id: expenseId } });
}
