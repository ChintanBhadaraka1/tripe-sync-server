import {
  createTrip,
  getMyTrips,
  getTrip,
  updateTrip,
  deleteTrip,
  getTripMembers,
  removeTripMember,
  unlinkTripMember,
  regenerateShareCode,
  previewJoinTrip,
  joinTripByCode,
  addPlaceholderMember,
  renameTripMember,
} from './trips.service.js';
import { createTripSchema, updateTripSchema, joinTripSchema, joinPreviewSchema, addMemberSchema, renameMemberSchema } from './trips.schemas.js';

export async function httpCreateTrip(req, res, next) {
  try {
    const data = createTripSchema.parse(req.body);
    const trip = await createTrip(req.user.id, data);
    res.status(201).json({ trip });
  } catch (err) { next(err); }
}

export async function httpGetMyTrips(req, res, next) {
  try {
    const trips = await getMyTrips(req.user.id);
    res.json({ trips });
  } catch (err) { next(err); }
}

export async function httpGetTrip(req, res, next) {
  try {
    const trip = await getTrip(req.params.tripId);
    res.json({ trip });
  } catch (err) { next(err); }
}

export async function httpUpdateTrip(req, res, next) {
  try {
    const data = updateTripSchema.parse(req.body);
    const trip = await updateTrip(req.params.tripId, data);
    res.json({ trip });
  } catch (err) { next(err); }
}

export async function httpDeleteTrip(req, res, next) {
  try {
    await deleteTrip(req.params.tripId);
    res.json({ message: 'Trip deleted successfully.' });
  } catch (err) { next(err); }
}

export async function httpGetTripMembers(req, res, next) {
  try {
    const members = await getTripMembers(req.params.tripId);
    res.json({ members });
  } catch (err) { next(err); }
}

export async function httpAddPlaceholderMember(req, res, next) {
  try {
    const { displayName } = addMemberSchema.parse(req.body);
    const member = await addPlaceholderMember(req.params.tripId, displayName);
    res.status(201).json({ member });
  } catch (err) { next(err); }
}

export async function httpRenameTripMember(req, res, next) {
  try {
    const { displayName } = renameMemberSchema.parse(req.body);
    const member = await renameTripMember(req.params.tripId, req.params.memberId, displayName);
    res.json({ member });
  } catch (err) { next(err); }
}

export async function httpRemoveTripMember(req, res, next) {
  try {
    await removeTripMember(req.params.tripId, req.params.memberId, req.user.id);
    res.json({ message: 'Member removed from trip.' });
  } catch (err) { next(err); }
}

export async function httpUnlinkTripMember(req, res, next) {
  try {
    const member = await unlinkTripMember(req.params.tripId, req.params.memberId);
    res.json({ message: 'Member unlinked.', member });
  } catch (err) { next(err); }
}

export async function httpRegenerateShareCode(req, res, next) {
  try {
    const result = await regenerateShareCode(req.params.tripId);
    res.json({ shareCode: result.shareCode });
  } catch (err) { next(err); }
}

export async function httpPreviewJoinTrip(req, res, next) {
  try {
    const { code } = joinPreviewSchema.parse(req.body);
    const trip = await previewJoinTrip(code);
    res.json({ trip });
  } catch (err) { next(err); }
}

export async function httpJoinTripByCode(req, res, next) {
  try {
    const { code, claimMemberId } = joinTripSchema.parse(req.body);
    const trip = await joinTripByCode(req.user.id, code, claimMemberId);
    res.status(201).json({ message: 'Joined trip successfully.', trip });
  } catch (err) { next(err); }
}
