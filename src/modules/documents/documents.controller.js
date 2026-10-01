import { 
  createTripDocument, 
  getTripDocuments, 
  deleteTripDocument,
  createPersonalDocument,
  getPersonalDocuments,
  deletePersonalDocument,
  shareDocumentToTrip,
  unshareDocumentFromTrip
} from './documents.service.js';

// ─── Trip Documents ───

export async function httpCreateDocument(req, res, next) {
  try {
    const { title, fileUrl } = req.body;
    const doc = await createTripDocument(req.params.tripId, req.user.id, { title, fileUrl });
    res.status(201).json({ message: 'Document added', doc });
  } catch (err) { next(err); }
}

export async function httpGetDocuments(req, res, next) {
  try {
    const docs = await getTripDocuments(req.params.tripId);
    res.json(docs); // { directDocs, sharedDocs }
  } catch (err) { next(err); }
}

export async function httpDeleteDocument(req, res, next) {
  try {
    await deleteTripDocument(req.params.tripId, req.params.docId, req.user.id);
    res.json({ message: 'Document deleted' });
  } catch (err) { next(err); }
}

// ─── Shared Documents in Trip ───

export async function httpShareDocument(req, res, next) {
  try {
    const { documentId } = req.body;
    const shared = await shareDocumentToTrip(req.user.id, req.params.tripId, documentId);
    res.status(201).json({ message: 'Document shared to trip', shared });
  } catch (err) { next(err); }
}

export async function httpUnshareDocument(req, res, next) {
  try {
    await unshareDocumentFromTrip(req.user.id, req.params.tripId, req.params.docId);
    res.json({ message: 'Document unshared from trip' });
  } catch (err) { next(err); }
}

// ─── Personal Documents ───

export async function httpCreatePersonalDocument(req, res, next) {
  try {
    const { title, fileUrl } = req.body;
    const doc = await createPersonalDocument(req.user.id, { title, fileUrl });
    res.status(201).json({ message: 'Personal document uploaded', doc });
  } catch (err) { next(err); }
}

export async function httpGetPersonalDocuments(req, res, next) {
  try {
    const docs = await getPersonalDocuments(req.user.id);
    res.json({ docs });
  } catch (err) { next(err); }
}

export async function httpDeletePersonalDocument(req, res, next) {
  try {
    await deletePersonalDocument(req.user.id, req.params.docId);
    res.json({ message: 'Personal document deleted' });
  } catch (err) { next(err); }
}
