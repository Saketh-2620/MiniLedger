const jwt    = require('jsonwebtoken');
const crypto = require('crypto');
const pool   = require('../db/pool');

const ACCESS_TOKEN_EXPIRY  = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
const REFRESH_TOKEN_MS     = 7 * 24 * 60 * 60 * 1000;

/**
 * Issue a short-lived JWT access token.
 */
function generateAccessToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
}

/**
 * Create a refresh token, hash it, persist in DB, return raw token.
 */
async function generateRefreshToken(userId) {
  const rawToken  = crypto.randomBytes(64).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_MS);

  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, tokenHash, expiresAt]
  );

  return rawToken;
}

/**
 * Validate a raw refresh token. Returns the user row or null.
 */
async function validateRefreshToken(rawToken) {
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  const { rows } = await pool.query(
    `SELECT rt.*, u.id as user_id, u.email, u.name
     FROM refresh_tokens rt
     JOIN users u ON u.id = rt.user_id
     WHERE rt.token_hash = $1 AND rt.expires_at > NOW()`,
    [tokenHash]
  );

  return rows[0] || null;
}

/**
 * Revoke a single refresh token.
 */
async function revokeRefreshToken(rawToken) {
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  await pool.query('DELETE FROM refresh_tokens WHERE token_hash = $1', [tokenHash]);
}

/**
 * Revoke all refresh tokens for a user (full logout).
 */
async function revokeAllRefreshTokens(userId) {
  await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  validateRefreshToken,
  revokeRefreshToken,
  revokeAllRefreshTokens,
};
