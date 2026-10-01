import { Router } from 'express';
import { requireTripMember } from '../../middleware/tripMember.js';
import {
  httpCreateTransaction,
  httpGetTripTransactions,
  httpUpdateTransaction,
  httpDeleteTransaction,
  httpCreatePersonalExpense,
  httpGetMyPersonalExpenses,
  httpDeletePersonalExpense
} from './transactions.controller.js';

const router = Router({ mergeParams: true }); // Important: merge params to get :tripId from parent router

// All these routes are nested under /trips/:tripId
// and they will be passed through `requireTripMember` in the parent router.

// ─── Shared Transactions ──────────────────────────────────────────────────────
router.post('/', httpCreateTransaction);
router.get('/', httpGetTripTransactions);
router.patch('/:transactionId', httpUpdateTransaction);
router.delete('/:transactionId', httpDeleteTransaction);

// ─── Personal Expenses ────────────────────────────────────────────────────────
router.post('/personal', httpCreatePersonalExpense);
router.get('/personal', httpGetMyPersonalExpenses);
router.delete('/personal/:expenseId', httpDeletePersonalExpense);

export default router;
