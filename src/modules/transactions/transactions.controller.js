import {
  createTransaction,
  getTripTransactions,
  updateTransaction,
  deleteTransaction,
  createPersonalExpense,
  getMyPersonalExpenses,
  deletePersonalExpense
} from './transactions.service.js';
import { createTransactionSchema, personalExpenseSchema } from './transactions.schemas.js';

export async function httpCreateTransaction(req, res, next) {
  try {
    const data = createTransactionSchema.parse(req.body);
    const transaction = await createTransaction(req.params.tripId, data);
    res.status(201).json({ transaction });
  } catch (err) { next(err); }
}

export async function httpUpdateTransaction(req, res, next) {
  try {
    const data = createTransactionSchema.parse(req.body);
    const transaction = await updateTransaction(req.params.transactionId, req.params.tripId, data);
    res.json({ transaction });
  } catch (err) { next(err); }
}

export async function httpGetTripTransactions(req, res, next) {
  try {
    const transactions = await getTripTransactions(req.params.tripId);
    res.json({ transactions });
  } catch (err) { next(err); }
}

export async function httpDeleteTransaction(req, res, next) {
  try {
    await deleteTransaction(req.params.transactionId, req.params.tripId);
    res.json({ message: 'Transaction deleted.' });
  } catch (err) { next(err); }
}

export async function httpCreatePersonalExpense(req, res, next) {
  try {
    const data = personalExpenseSchema.parse(req.body);
    const expense = await createPersonalExpense(req.params.tripId, req.user.id, data);
    res.status(201).json({ expense });
  } catch (err) { next(err); }
}

export async function httpGetMyPersonalExpenses(req, res, next) {
  try {
    const expenses = await getMyPersonalExpenses(req.params.tripId, req.user.id);
    res.json({ expenses });
  } catch (err) { next(err); }
}

export async function httpDeletePersonalExpense(req, res, next) {
  try {
    await deletePersonalExpense(req.params.expenseId, req.params.tripId, req.user.id);
    res.json({ message: 'Personal expense deleted.' });
  } catch (err) { next(err); }
}
