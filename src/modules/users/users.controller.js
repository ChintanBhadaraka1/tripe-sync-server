import { getMe, updateMe, getDashboardStats } from './users.service.js';
import { updateProfileSchema } from './users.schemas.js';

export async function getProfile(req, res, next) {
  try {
    const user = await getMe(req.user.id);
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const data = updateProfileSchema.parse(req.body);
    const user = await updateMe(req.user.id, data);
    res.json({ message: 'Profile updated.', user });
  } catch (err) {
    next(err);
  }
}

export async function getDashboardStatsHandler(req, res, next) {
  try {
    const stats = await getDashboardStats(req.user.id);
    res.json({ stats });
  } catch (err) {
    next(err);
  }
}
