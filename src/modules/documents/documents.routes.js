import { Router } from 'express';
import { 
  httpCreateDocument, 
  httpGetDocuments, 
  httpDeleteDocument,
  httpShareDocument,
  httpUnshareDocument
} from './documents.controller.js';

const router = Router({ mergeParams: true });

// Trip Documents
router.post('/', httpCreateDocument);
router.get('/', httpGetDocuments);
router.delete('/:docId', httpDeleteDocument);

// Shared Personal Documents
router.post('/shared', httpShareDocument);
router.delete('/shared/:docId', httpUnshareDocument);

export default router;
