import {
  inviteByEmail,
  getMyPendingInvitations,
  respondToInvitation,
  getTripInvitations
} from './invitations.service.js';
import { inviteUserSchema } from './invitations.schemas.js';

export async function httpInviteByEmail(req, res, next) {
  try {
    const { email } = inviteUserSchema.parse(req.body);
    const invite = await inviteByEmail(req.params.tripId, req.user.id, email);
    res.status(201).json({ message: 'Invitation sent.', invite });
  } catch (err) { next(err); }
}

export async function httpGetMyPendingInvitations(req, res, next) {
  try {
    const invitations = await getMyPendingInvitations(req.user.id, req.user.email);
    res.json({ invitations });
  } catch (err) { next(err); }
}

export async function httpAcceptInvitation(req, res, next) {
  try {
    const result = await respondToInvitation(req.params.inviteId, req.user.id, true);
    res.json(result);
  } catch (err) { next(err); }
}

export async function httpDeclineInvitation(req, res, next) {
  try {
    const result = await respondToInvitation(req.params.inviteId, req.user.id, false);
    res.json(result);
  } catch (err) { next(err); }
}

export async function httpGetTripInvitations(req, res, next) {
  try {
    const invitations = await getTripInvitations(req.params.tripId);
    res.json({ invitations });
  } catch (err) { next(err); }
}
