import { Router } from 'express';
import { register, login, refresh, logout } from './auth.controller.js';

const router = Router();

// POST /api/v1/auth/register
router.post('/register', register);

// POST /api/v1/auth/login
router.post('/login', login);

// POST /api/v1/auth/refresh
router.post('/refresh', refresh);

// POST /api/v1/auth/logout
router.post('/logout', logout);

export default router;
