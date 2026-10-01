import { Router } from 'express';
import { requireTripMember } from '../../middleware/tripMember.js';
import {
  httpGetBalances,
  httpGetCategorySummary,
  httpRecordSettlement,
  httpDeleteSettlement
} from './balances.controller.js';

const router = Router({ mergeParams: true });

router.get('/', httpGetBalances);
router.get('/summary', httpGetCategorySummary);
router.post('/settlements', httpRecordSettlement);
router.delete('/settlements/:settlementId', httpDeleteSettlement);

export default router;
