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
  maxAge:   7 * 24 * 60 * 60 * 1000,
};


router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);


router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.CLIENT_URL}/login?error=oauth_failed` }),
  async (req, res) => {
    try {
      const user         = req.user;
      const accessToken  = generateAccessToken(user);
      const refreshToken = await generateRefreshToken(user.id);

      res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

   
      res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${accessToken}`);
    } catch (err) {
      console.error('OAuth callback error:', err);
      res.redirect(`${process.env.CLIENT_URL}/login?error=server_error`);
    }
  }
);


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

    // Rotating refresh token
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


router.post('/logout-all', authenticate, async (req, res, next) => {
  try {
    await revokeAllRefreshTokens(req.user.id);
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out from all devices' });
  } catch (err) {
    next(err);
  }
});


router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
