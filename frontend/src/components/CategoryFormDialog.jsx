import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Stack, Alert,
} from '@mui/material';
import { createCategory, updateCategory } from '../api/categories';

const EMPTY_FORM = { name: '' };

export default function CategoryFormDialog({ open, onClose, onSaved, category }) {
  const isEdit = Boolean(category);
  const [form,   setForm]   = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState(null);

  useEffect(() => {
    if (category) {
      setForm({ name: category.name });
    } else {
      setForm(EMPTY_FORM);
    }
    setError(null);
  }, [category, open]);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, name: e.target.value }));

  const handleSubmit = async () => {
    setError(null);
    if (!form.name.trim()) {
      setError('Category name is required.');
      return;
    }

    setSaving(true);
    try {
      // default_type is omitted — type is decided per transaction, not per category
      const payload = { name: form.name.trim() };

      if (isEdit) {
        await updateCategory(category.id, payload);
      } else {
        await createCategory(payload);
      }
      onSaved();
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to save category.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{isEdit ? 'Edit Category' : 'Add Category'}</DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label="Category Name"
            value={form.name}
            onChange={handleChange}
            fullWidth
            required
            autoFocus
            placeholder="e.g. Rent, Salary, Groceries"
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={saving}>
          {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Category'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
