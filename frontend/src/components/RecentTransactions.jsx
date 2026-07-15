import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, CardContent, CardActions, Typography, Box,
  Chip, Divider, Button, List, ListItem, ListItemText,
} from '@mui/material';

export default function RecentTransactions({ transactions = [] }) {
  const navigate = useNavigate();

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>Recent Transactions</Typography>
        <Divider sx={{ mb: 1 }} />

        {transactions.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
            No transactions yet.
          </Typography>
        ) : (
          <List disablePadding>
            {transactions.map((txn, idx) => (
              <React.Fragment key={txn.id}>
                {idx > 0 && <Divider component="li" />}
                <ListItem disableGutters>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight={500} sx={{ flexGrow: 1 }}>
                          {txn.description || txn.category_name || '—'}
                        </Typography>
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          color={txn.type === 'income' ? 'success.main' : 'error.main'}
                        >
                          {txn.type === 'expense' ? '−' : '+'}
                          {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(txn.amount)}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">{txn.date}</Typography>
                        {txn.category_name && (
                          <Chip label={txn.category_name} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.65rem' }} />
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        )}
      </CardContent>
      <CardActions>
        <Button size="small" onClick={() => navigate('/transactions')}>
          View All Transactions
        </Button>
      </CardActions>
    </Card>
  );
}
