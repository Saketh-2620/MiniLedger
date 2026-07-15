const express  = require('express');
const passport = require('passport');
const {
  generateAccessToken,
  generateRefreshToken,
  validateRefreshToken,
  revokeRefreshToken,
  revokeAllRefreshTokens,
} = require('../services/tokenService');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days
};

// ── Google OAuth ──────────────────────────────────────────────────────────────

// Step 1: Redirect user to Google consent screen
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Step 2: Google redirects back here after user grants consent
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.CLIENT_URL}/login?error=oauth_failed` }),
  async (req, res) => {
    try {
      const user         = req.user;
      const accessToken  = generateAccessToken(user);
      const refreshToken = await generateRefreshToken(user.id);

      // Refresh token goes in httpOnly cookie
      res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

      // Redirect to frontend with access token in query param
      // Frontend reads it once, stores in memory, then discards from URL
      res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${accessToken}`);
    } catch (err) {
      console.error('OAuth callback error:', err);
      res.redirect(`${process.env.CLIENT_URL}/login?error=server_error`);
    }
  }
);

// ── Token Refresh ─────────────────────────────────────────────────────────────

// POST /api/auth/refresh
// Reads httpOnly cookie, issues a new access token
router.post('/refresh', async (req, res, next) => {
  try {
    const rawToken = req.cookies?.refreshToken;
    if (!rawToken) {
      return res.status(401).json({ error: 'No refresh token provided' });
    }

    const tokenRow = await validateRefreshToken(rawToken);
    if (!tokenRow) {
      return res.status(401).json({ error: 'Refresh token invalid or expired' });
    }

    // Rotate: revoke old, issue new
    await revokeRefreshToken(rawToken);
    const newRefreshToken = await generateRefreshToken(tokenRow.user_id);
    const accessToken     = generateAccessToken({
      id:    tokenRow.user_id,
      email: tokenRow.email,
      name:  tokenRow.name,
    });

    res.cookie('refreshToken', newRefreshToken, COOKIE_OPTIONS);
    res.json({ accessToken });
  } catch (err) {
    next(err);
  }
});

// ── Logout ────────────────────────────────────────────────────────────────────

// POST /api/auth/logout  (single device)
router.post('/logout', async (req, res, next) => {
  try {
    const rawToken = req.cookies?.refreshToken;
    if (rawToken) await revokeRefreshToken(rawToken);
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/logout-all  (all devices)
router.post('/logout-all', authenticate, async (req, res, next) => {
  try {
    await revokeAllRefreshTokens(req.user.id);
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out from all devices' });
  } catch (err) {
    next(err);
  }
});

// ── Current User ──────────────────────────────────────────────────────────────

// GET /api/auth/me  — returns current user from JWT
router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
