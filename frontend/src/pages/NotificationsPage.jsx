import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Alert, CircularProgress, Paper,
  List, ListItem, ListItemText, Chip, Divider,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon       from '@mui/icons-material/Error';
import HourglassIcon   from '@mui/icons-material/HourglassEmpty';
import { getNotifications } from '../api/notifications';

const STATUS_CONFIG = {
  sent:    { color: 'success', icon: <CheckCircleIcon fontSize="small" /> },
  failed:  { color: 'error',   icon: <ErrorIcon fontSize="small" />       },
  pending: { color: 'warning', icon: <HourglassIcon fontSize="small" />   },
};

const TYPE_LABELS = {
  weekly_summary:    'Weekly Summary',
  monthly_report:    'Monthly Report',
  large_transaction: 'Large Transaction Alert',
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);

  useEffect(() => {
    getNotifications()
      .then(setNotifications)
      .catch(() => setError('Failed to load notifications.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Notification History</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        A log of all email notifications sent to your account.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper>
          <List disablePadding>
            {notifications.length === 0 ? (
              <ListItem>
                <ListItemText
                  primary="No notifications yet."
                  secondary="You'll receive weekly summaries every Monday and monthly reports on the 1st."
                />
              </ListItem>
            ) : (
              notifications.map((n, idx) => {
                const statusCfg = STATUS_CONFIG[n.status] || STATUS_CONFIG.pending;
                return (
                  <React.Fragment key={n.id}>
                    {idx > 0 && <Divider component="li" />}
                    <ListItem alignItems="flex-start">
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1" fontWeight={500}>
                              {TYPE_LABELS[n.type] || n.type}
                            </Typography>
                            <Chip
                              label={n.status}
                              size="small"
                              color={statusCfg.color}
                              icon={statusCfg.icon}
                            />
                          </Box>
                        }
                        secondary={
                          <Box component="span">
                            <Typography variant="caption" color="text.secondary" component="span">
                              Created: {new Date(n.created_at).toLocaleString()}
                            </Typography>
                            {n.sent_at && (
                              <Typography variant="caption" color="text.secondary" component="span" sx={{ ml: 2 }}>
                                Sent: {new Date(n.sent_at).toLocaleString()}
                              </Typography>
                            )}
                            {n.metadata?.error && (
                              <Typography variant="caption" color="error" component="span" sx={{ ml: 2 }}>
                                Error: {n.metadata.error}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  </React.Fragment>
                );
              })
            )}
          </List>
        </Paper>
      )}
    </Box>
  );
}
