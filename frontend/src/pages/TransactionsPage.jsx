import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Button, Alert, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, Chip, TablePagination, MenuItem, TextField,
  Stack, Tooltip,
} from '@mui/material';
import AddIcon    from '@mui/icons-material/Add';
import EditIcon   from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { getTransactions, deleteTransaction } from '../api/transactions';
import { getCategories } from '../api/categories';
import TransactionFormDialog from '../components/TransactionFormDialog';
import ConfirmDialog from '../components/ConfirmDialog';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [categories,   setCategories]   = useState([]);
  const [pagination,   setPagination]   = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);

  // Filters
  const [filterType,     setFilterType]     = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  // Dialogs
  const [formOpen,      setFormOpen]      = useState(false);
  const [editTarget,    setEditTarget]    = useState(null);
  const [deleteTarget,  setDeleteTarget]  = useState(null);
  const [confirmOpen,   setConfirmOpen]   = useState(false);

  const fetchTransactions = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: pagination.limit };
      if (filterType)     params.type        = filterType;
      if (filterCategory) params.category_id = filterCategory;

      const data = await getTransactions(params);
      setTransactions(data.data);
      setPagination(data.pagination);
    } catch {
      setError('Failed to load transactions.');
    } finally {
      setLoading(false);
    }
  }, [filterType, filterCategory, pagination.limit]);

  useEffect(() => {
    fetchTransactions(1);
  }, [filterType, filterCategory]);

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
  }, []);

  const handlePageChange = (_e, newPage) => fetchTransactions(newPage + 1);

  const handleAdd = () => {
    setEditTarget(null);
    setFormOpen(true);
  };

  const handleEdit = (txn) => {
    setEditTarget(txn);
    setFormOpen(true);
  };

  const handleDeleteClick = (txn) => {
    setDeleteTarget(txn);
    setConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteTransaction(deleteTarget.id);
      setConfirmOpen(false);
      fetchTransactions(pagination.page);
    } catch {
      setError('Failed to delete transaction.');
    }
  };

  const handleFormSaved = () => {
    setFormOpen(false);
    fetchTransactions(pagination.page);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Transactions</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
          Add Transaction
        </Button>
      </Box>

      {/* Filters */}
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <TextField
          select label="Type" size="small" value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          sx={{ minWidth: 130 }}
        >
          <MenuItem value="">All Types</MenuItem>
          <MenuItem value="income">Income</MenuItem>
          <MenuItem value="expense">Expense</MenuItem>
        </TextField>

        <TextField
          select label="Category" size="small" value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">All Categories</MenuItem>
          {categories.map((c) => (
            <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
          ))}
        </TextField>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell><strong>Date</strong></TableCell>
              <TableCell><strong>Type</strong></TableCell>
              <TableCell><strong>Category</strong></TableCell>
              <TableCell><strong>Description</strong></TableCell>
              <TableCell align="right"><strong>Amount</strong></TableCell>
              <TableCell align="center"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={28} />
                </TableCell>
              </TableRow>
            ) : transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No transactions found.
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((txn) => (
                <TableRow key={txn.id} hover>
                  <TableCell>{txn.date}</TableCell>
                  <TableCell>
                    <Chip
                      label={txn.type}
                      size="small"
                      sx={{
                        bgcolor: txn.type === 'income' ? 'success.light' : 'error.light',
                        color:   txn.type === 'income' ? 'success.dark'  : 'error.dark',
                        fontWeight: 500,
                      }}
                    />
                  </TableCell>
                  <TableCell>{txn.category_name || '—'}</TableCell>
                  <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {txn.description || '—'}
                  </TableCell>
                  <TableCell align="right">
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      color={txn.type === 'income' ? 'success.main' : 'error.main'}
                    >
                      {txn.type === 'expense' ? '−' : '+'}
                      {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(txn.amount)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => handleEdit(txn)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => handleDeleteClick(txn)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <TablePagination
          component="div"
          count={pagination.total}
          page={pagination.page - 1}
          rowsPerPage={pagination.limit}
          rowsPerPageOptions={[10]}
          onPageChange={handlePageChange}
        />
      </TableContainer>

      {/* Add / Edit dialog */}
      <TransactionFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={handleFormSaved}
        transaction={editTarget}
        categories={categories}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        open={confirmOpen}
        title="Delete Transaction"
        message={`Delete this ${deleteTarget?.type} of ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(deleteTarget?.amount || 0)}? This cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </Box>
  );
}
