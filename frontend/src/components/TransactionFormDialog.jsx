import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem, Stack, Alert,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { createTransaction, updateTransaction } from '../api/transactions';

const EMPTY_FORM = {
  type:        'expense',
  amount:      '',
  description: '',
  date:        dayjs(),
  category_id: '',
};

export default function TransactionFormDialog({
  open, onClose, onSaved, transaction, categories,
}) {
  const isEdit = Boolean(transaction);
  const [form,    setForm]    = useState(EMPTY_FORM);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState(null);

  // Populate form when editing
  useEffect(() => {
    if (transaction) {
      setForm({
        type:        transaction.type,
        amount:      String(transaction.amount),
        description: transaction.description || '',
        date:        dayjs(transaction.date),
        category_id: transaction.category_id || '',
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setError(null);
  }, [transaction, open]);

  const handleChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async () => {
    setError(null);

    if (!form.amount || parseFloat(form.amount) <= 0) {
      setError('Amount must be a positive number.');
      return;
    }
    if (!form.date || !form.date.isValid()) {
      setError('Please pick a valid date.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        type:        form.type,
        amount:      parseFloat(form.amount),
        description: form.description || null,
        date:        form.date.format('YYYY-MM-DD'),
        category_id: form.category_id || null,
      };

      if (isEdit) {
        await updateTransaction(transaction.id, payload);
      } else {
        await createTransaction(payload);
      }
      onSaved();
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to save transaction.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? 'Edit Transaction' : 'Add Transaction'}</DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          
          <TextField
            select label="Type" value={form.type}
            onChange={handleChange('type')} fullWidth required
          >
            <MenuItem value="income">Income</MenuItem>
            <MenuItem value="expense">Expense</MenuItem>
          </TextField>

          
          <TextField
            label="Amount" type="number" value={form.amount}
            onChange={handleChange('amount')} fullWidth required
            inputProps={{ min: 0.01, step: 0.01 }}
          />

          
          <DatePicker
            label="Date"
            value={form.date}
            onChange={(val) => setForm((prev) => ({ ...prev, date: val }))}
            slotProps={{ textField: { fullWidth: true, required: true } }}
          />

          
          <TextField
            select label="Category (optional)" value={form.category_id}
            onChange={handleChange('category_id')} fullWidth
          >
            <MenuItem value="">None</MenuItem>
            {categories.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.name}
              </MenuItem>
            ))}
          </TextField>

          
          <TextField
            label="Description (optional)" value={form.description}
            onChange={handleChange('description')} fullWidth multiline rows={2}
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button
          variant="contained" onClick={handleSubmit} disabled={saving}
        >
          {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Transaction'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
