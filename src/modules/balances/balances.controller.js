import { getBalances, getCategorySummary, recordSettlement, deleteSettlement } from './balances.service.js';
import { settlementSchema } from './balances.schemas.js';

export async function httpGetBalances(req, res, next) {
  try {
    const result = await getBalances(req.params.tripId);
    res.json(result);
  } catch (err) { next(err); }
}

export async function httpGetCategorySummary(req, res, next) {
  try {
    const summary = await getCategorySummary(req.params.tripId);
    res.json({ summary });
  } catch (err) { next(err); }
}

export async function httpRecordSettlement(req, res, next) {
  try {
    const data = settlementSchema.parse(req.body);
    const settlement = await recordSettlement(req.params.tripId, data);
    res.status(201).json({ settlement });
  } catch (err) { next(err); }
}

export async function httpDeleteSettlement(req, res, next) {
  try {
    await deleteSettlement(req.params.tripId, req.params.settlementId);
    res.json({ message: 'Settlement deleted.' });
  } catch (err) { next(err); }
}
