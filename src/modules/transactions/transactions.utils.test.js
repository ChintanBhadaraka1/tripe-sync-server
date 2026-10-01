import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateSplits } from './transactions.utils.js';

test('calculateSplits - EQUAL split', () => {
  // 1000 paise split 3 ways: 334, 333, 333
  const splits = [{ memberId: 'm1' }, { memberId: 'm2' }, { memberId: 'm3' }];
  const result = calculateSplits(1000, 'EQUAL', splits);
  
  assert.equal(result.length, 3);
  assert.equal(result[0].owedAmount, 334);
  assert.equal(result[1].owedAmount, 333);
  assert.equal(result[2].owedAmount, 333);
  assert.equal(result.reduce((sum, r) => sum + r.owedAmount, 0), 1000);
});

test('calculateSplits - EXACT split', () => {
  const splits = [
    { memberId: 'm1', owedAmount: 500 },
    { memberId: 'm2', owedAmount: 500 }
  ];
  const result = calculateSplits(1000, 'EXACT', splits);
  
  assert.equal(result.length, 2);
  assert.equal(result[0].owedAmount, 500);
  assert.equal(result[1].owedAmount, 500);
});

test('calculateSplits - PERCENTAGE split', () => {
  const splits = [
    { memberId: 'm1', share: 33.33 },
    { memberId: 'm2', share: 33.33 },
    { memberId: 'm3', share: 33.34 }
  ];
  const result = calculateSplits(1000, 'PERCENTAGE', splits);
  
  assert.equal(result.length, 3);
  assert.equal(result[0].owedAmount, 334); // 333 + 1 (remainder adjustment on first split)
  assert.equal(result[1].owedAmount, 333);
  assert.equal(result[2].owedAmount, 333);
  assert.equal(result.reduce((sum, r) => sum + r.owedAmount, 0), 1000);
});

test('calculateSplits - SHARES split', () => {
  const splits = [
    { memberId: 'm1', share: 1 },
    { memberId: 'm2', share: 2 }
  ];
  const result = calculateSplits(1000, 'SHARES', splits);
  
  assert.equal(result.length, 2);
  assert.equal(result[0].owedAmount, 333);
  assert.equal(result[1].owedAmount, 667);
  assert.equal(result.reduce((sum, r) => sum + r.owedAmount, 0), 1000);
});

test('calculateSplits - Throws on invalid EXACT split', () => {
  const splits = [{ memberId: 'm1', owedAmount: 900 }];
  assert.throws(
    () => calculateSplits(1000, 'EXACT', splits),
    /must equal total amount/
  );
});

test('calculateSplits - Throws on invalid PERCENTAGE split', () => {
  const splits = [{ memberId: 'm1', share: 99.9 }];
  assert.throws(
    () => calculateSplits(1000, 'PERCENTAGE', splits),
    /Percentages must sum to 100/
  );
});
