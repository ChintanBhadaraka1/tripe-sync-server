import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { getProfile, updateProfile, getDashboardStatsHandler } from './users.controller.js';
import {
  httpCreatePersonalDocument,
  httpGetPersonalDocuments,
  httpDeletePersonalDocument
} from '../documents/documents.controller.js';

const router = Router();

// All user routes require authentication
router.use(authenticate);

// GET /api/v1/users/me
router.get('/me', getProfile);

// GET /api/v1/users/me/stats
router.get('/me/stats', getDashboardStatsHandler);

// PATCH /api/v1/users/me
router.patch('/me', updateProfile);

// Personal Documents
router.post('/me/documents', httpCreatePersonalDocument);
router.get('/me/documents', httpGetPersonalDocuments);
router.delete('/me/documents/:docId', httpDeletePersonalDocument);

export default router;
