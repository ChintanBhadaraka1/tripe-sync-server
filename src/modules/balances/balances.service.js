import prisma from '../../utils/prisma.js';

export async function getBalances(tripId) {
  // 1. Fetch members
  const members = await prisma.tripMember.findMany({
    where: { tripId, status: { not: 'REMOVED' } },
    select: { id: true, userId: true, displayName: true, user: { select: { id: true, name: true } } }
  });

  // 2. Fetch all expenses and payments
  const transactions = await prisma.transaction.findMany({
    where: { tripId },
    include: { payers: true, splits: true }
  });

  const settlements = await prisma.settlement.findMany({
    where: { tripId }
  });

  // 3. Initialize balances
  const balances = {};
  for (const m of members) {
    balances[m.id] = { 
      memberId: m.id, 
      userId: m.userId || m.user?.id || null,
      name: m.displayName || m.user?.name || 'Unknown',
      paid: 0, 
      owed: 0, 
      net: 0 
    };
  }

  // Helper to safely add to balances (handles removed members if their ID still exists in old records)
  const addBalance = (id, field, amount) => {
    if (!balances[id]) {
      balances[id] = { memberId: id, name: 'Removed Member', paid: 0, owed: 0, net: 0 };
    }
    balances[id][field] += amount;
  };

  // 4. Aggregate Transactions
  for (const tx of transactions) {
    for (const p of tx.payers) {
      addBalance(p.memberId, 'paid', p.paidAmount);
    }
    for (const s of tx.splits) {
      addBalance(s.memberId, 'owed', s.owedAmount);
    }
  }

  // 5. Aggregate Settlements
  // A settlement means Payer gives money to Receiver.
  // This effectively means Payer "paid" for the trip (increases their paid amount)
  // and Receiver "received" / owed that money to the trip (increases their owed amount).
  for (const s of settlements) {
    addBalance(s.payerId, 'paid', s.amount);
    addBalance(s.receiverId, 'owed', s.amount);
  }

  // 6. Calculate Nets
  const activeBalances = Object.values(balances);
  for (const b of activeBalances) {
    b.net = b.paid - b.owed; // +ve means receives money, -ve means owes money
  }

  // 7. Calculate Settle-Up Plan (Greedy Algorithm)
  const debtors = activeBalances.filter(b => b.net < 0).map(b => ({ ...b, absNet: Math.abs(b.net) })).sort((a, b) => b.absNet - a.absNet);
  const creditors = activeBalances.filter(b => b.net > 0).map(b => ({ ...b })).sort((a, b) => b.net - a.net);

  const suggestedPayments = [];
  let d = 0;
  let c = 0;

  while (d < debtors.length && c < creditors.length) {
    const debtor = debtors[d];
    const creditor = creditors[c];

    const amount = Math.min(debtor.absNet, creditor.net);
    
    if (amount > 0) { // filter out zero dust
      suggestedPayments.push({
        from: debtor.memberId,
        fromName: debtor.name,
        to: creditor.memberId,
        toName: creditor.name,
        amount
      });
    }

    debtor.absNet -= amount;
    creditor.net -= amount;

    // Use epsilon for float inaccuracies, though amounts are in integers (paise)
    if (debtor.absNet === 0) d++;
    if (creditor.net === 0) c++;
  }

  return {
    balances: activeBalances,
    suggestedPayments,
    totalTripCost: transactions.reduce((sum, tx) => sum + tx.amount, 0)
  };
}

export async function getCategorySummary(tripId) {
  const transactions = await prisma.transaction.groupBy({
    by: ['category'],
    where: { tripId },
    _sum: { amount: true }
  });

  return transactions.map(t => ({
    category: t.category,
    amount: t._sum.amount || 0
  })).sort((a, b) => b.amount - a.amount);
}

export async function recordSettlement(tripId, data) {
  return prisma.settlement.create({
    data: {
      tripId,
      payerId: data.payerId,
      receiverId: data.receiverId,
      amount: data.amount,
      date: data.date || new Date(),
      note: data.note
    }
  });
}

export async function deleteSettlement(tripId, settlementId) {
  await prisma.settlement.delete({ where: { id: settlementId, tripId } });
}
