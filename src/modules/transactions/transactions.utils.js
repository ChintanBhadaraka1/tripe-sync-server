import { createError } from '../../middleware/errorHandler.js';

export function calculateSplits(totalAmount, splitType, splits) {
  let computedSplits = [];
  
  if (splitType === 'EQUAL') {
    const activeSplits = splits.length;
    if (activeSplits === 0) throw createError(400, 'Must have at least one split.');
    
    const baseAmount = Math.floor(totalAmount / activeSplits);
    let remainder = totalAmount % activeSplits;
    
    computedSplits = splits.map(s => {
      let owed = baseAmount;
      if (remainder > 0) { owed += 1; remainder -= 1; }
      return { memberId: s.memberId, owedAmount: owed };
    });
  } 
  else if (splitType === 'EXACT') {
    const sum = splits.reduce((acc, s) => acc + (s.owedAmount || 0), 0);
    if (sum !== totalAmount) throw createError(400, `Exact splits sum (${sum}) must equal total amount (${totalAmount}).`);
    computedSplits = splits.map(s => ({ memberId: s.memberId, owedAmount: s.owedAmount }));
  } 
  else if (splitType === 'PERCENTAGE') {
    const sumPct = splits.reduce((acc, s) => acc + (s.share || 0), 0);
    if (Math.abs(sumPct - 100) > 0.01) throw createError(400, `Percentages must sum to 100. Got ${sumPct}`);
    
    let allocated = 0;
    computedSplits = splits.map(s => {
      const owed = Math.round((totalAmount * (s.share || 0)) / 100);
      allocated += owed;
      return { memberId: s.memberId, owedAmount: owed, share: s.share };
    });
    if (allocated !== totalAmount && computedSplits.length > 0) {
      computedSplits[0].owedAmount += (totalAmount - allocated);
    }
  } 
  else if (splitType === 'SHARES') {
    const totalShares = splits.reduce((acc, s) => acc + (s.share || 0), 0);
    if (totalShares <= 0) throw createError(400, 'Total shares must be greater than 0.');
    
    let allocated = 0;
    computedSplits = splits.map(s => {
      const owed = Math.round((totalAmount * (s.share || 0)) / totalShares);
      allocated += owed;
      return { memberId: s.memberId, owedAmount: owed, share: s.share };
    });
    if (allocated !== totalAmount && computedSplits.length > 0) {
      computedSplits[0].owedAmount += (totalAmount - allocated);
    }
  }

  return computedSplits;
}
