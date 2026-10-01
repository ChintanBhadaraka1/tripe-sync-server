import {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
} from './auth.service.js';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
} from './auth.schemas.js';

export async function register(req, res, next) {
  try {
    const data = registerSchema.parse(req.body);
    const result = await registerUser(data);
    res.status(201).json({
      message: 'Account created successfully.',
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const data = loginSchema.parse(req.body);
    const result = await loginUser(data);
    res.json({
      message: 'Logged in successfully.',
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req, res, next) {
  try {
    const { refreshToken } = refreshSchema.parse(req.body);
    const result = await refreshAccessToken(refreshToken);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function logout(req, res, next) {
  try {
    const { refreshToken } = req.body;
    await logoutUser(refreshToken);
    res.json({ message: 'Logged out successfully.' });
  } catch (err) {
    next(err);
  }
}
