import React, { useEffect, useState } from 'react';
import {
  Box, Grid, Typography, CircularProgress, Alert,
  Card, CardContent, Divider,
} from '@mui/material';
import { getSummary } from '../api/summary';
import SummaryCards       from '../components/SummaryCards';
import RecentTransactions from '../components/RecentTransactions';

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    getSummary()
      .then(setSummary)
      .catch(() => setError('Failed to load summary.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>;
  }

  return (
    <Box>
      {/* Page header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Dashboard</Typography>
        <Typography variant="body2" color="text.secondary">
          {summary.period.date_from} — {summary.period.date_to}
        </Typography>
      </Box>

      {/* Summary stat cards */}
      <SummaryCards
        totalIncome={summary.total_income}
        totalExpenses={summary.total_expenses}
        netBalance={summary.net_balance}
        transactionCount={summary.transaction_count}
      />

      {/* Lower two-column section */}
      <Grid container spacing={3} sx={{ mt: 0.5 }}>

        {/* Category breakdown */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Breakdown by Category
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {summary.breakdown.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                  No transactions this period.
                </Typography>
              ) : (
                summary.breakdown.map((item, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      py: 1,
                      borderBottom: idx < summary.breakdown.length - 1 ? '1px solid' : 'none',
                      borderColor: 'divider',
                    }}
                  >
                    {/* Category name + type label as plain text (no chip) */}
                    <Box>
                      <Typography variant="body2" fontWeight={500}>
                        {item.category_name}
                      </Typography>
                      <Typography
                        variant="caption"
                        color={item.type === 'income' ? 'success.main' : 'error.main'}
                        fontWeight={500}
                      >
                        {item.type} · {item.count} txn{item.count !== 1 ? 's' : ''}
                      </Typography>
                    </Box>

                    {/* Amount in INR */}
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      color={item.type === 'income' ? 'success.main' : 'error.main'}
                    >
                      {item.type === 'expense' ? '−' : '+'}
                      {fmt(item.total)}
                    </Typography>
                  </Box>
                ))
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent transactions */}
        <Grid item xs={12} md={6}>
          <RecentTransactions transactions={summary.recent_transactions} />
        </Grid>
      </Grid>
    </Box>
  );
}
