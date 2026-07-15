import React, { useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from '../context/AuthContext';

/**
 * Google OAuth redirects to /auth/callback?token=<accessToken>.
 * This page reads the token from the URL, stores it in memory,
 * then redirects to the dashboard. The token is removed from the URL immediately.
 */
export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const { loginWithToken } = useAuth();
  const navigate  = useNavigate();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const token = searchParams.get('token');

    // Remove token from URL immediately (security hygiene)
    window.history.replaceState({}, document.title, '/auth/callback');

    if (!token) {
      navigate('/login?error=auth_failed', { replace: true });
      return;
    }

    loginWithToken(token);
  }, [searchParams, loginWithToken, navigate]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
      }}
    >
      <CircularProgress size={48} />
      <Typography color="text.secondary">Signing you in...</Typography>
    </Box>
  );
}
