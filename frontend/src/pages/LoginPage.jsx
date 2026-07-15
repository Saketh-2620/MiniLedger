import React from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box, Button, Card, CardContent, Typography, Alert, Divider,
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { loginWithGoogle } from '../api/auth';

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const error = searchParams.get('error');

  const errorMessages = {
    oauth_failed:  'Google sign-in failed. Please try again.',
    auth_failed:   'Authentication failed. Please try again.',
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 400, width: '100%', p: 2 }}>
        <CardContent>
          {/* Logo + Title */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
            <AccountBalanceWalletIcon sx={{ fontSize: 56, color: 'primary.main', mb: 1 }} />
            <Typography variant="h4" component="h1" gutterBottom>
              Mini-Ledger
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              Your smart personal finance tracker
            </Typography>
          </Box>

          {/* Error alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorMessages[error] || 'Something went wrong. Please try again.'}
            </Alert>
          )}

          <Divider sx={{ mb: 3 }} />

          {/* Google Sign-In */}
          <Button
            variant="contained"
            fullWidth
            size="large"
            startIcon={<GoogleIcon />}
            onClick={loginWithGoogle}
            sx={{ py: 1.5 }}
          >
            Continue with Google
          </Button>

          <Typography variant="caption" color="text.secondary" display="block" align="center" sx={{ mt: 2 }}>
            By signing in, you agree to our terms of service.
            Your email is only used to send financial summaries.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
