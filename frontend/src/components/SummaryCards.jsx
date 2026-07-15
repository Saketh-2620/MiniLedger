import React from 'react';
import { Grid, Card, CardContent, Typography, Box } from '@mui/material';
import TrendingUpIcon    from '@mui/icons-material/TrendingUp';
import TrendingDownIcon  from '@mui/icons-material/TrendingDown';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ReceiptIcon       from '@mui/icons-material/Receipt';

function StatCard({ title, value, icon, color, bgcolor }) {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h5" fontWeight={700} color={color}>
              {value}
            </Typography>
          </Box>
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              bgcolor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function SummaryCards({ totalIncome, totalExpenses, netBalance, transactionCount }) {
  const fmt = (n) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Total Income"
          value={fmt(totalIncome)}
          icon={<TrendingUpIcon sx={{ color: 'success.main' }} />}
          color="success.main"
          bgcolor="success.light"
        />
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Total Expenses"
          value={fmt(totalExpenses)}
          icon={<TrendingDownIcon sx={{ color: 'error.main' }} />}
          color="error.main"
          bgcolor="error.light"
        />
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Net Balance"
          value={fmt(netBalance)}
          icon={<AccountBalanceIcon sx={{ color: netBalance >= 0 ? 'primary.main' : 'error.main' }} />}
          color={netBalance >= 0 ? 'primary.main' : 'error.main'}
          bgcolor={netBalance >= 0 ? 'primary.light' : 'error.light'}
        />
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Transactions"
          value={transactionCount}
          icon={<ReceiptIcon sx={{ color: 'text.secondary' }} />}
          color="text.primary"
          bgcolor="grey.100"
        />
      </Grid>
    </Grid>
  );
}
