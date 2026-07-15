import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Alert, CircularProgress,
  List, ListItem, ListItemText, ListItemSecondaryAction,
  IconButton, Paper, Divider, Tooltip,
} from '@mui/material';
import AddIcon    from '@mui/icons-material/Add';
import EditIcon   from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { getCategories, deleteCategory } from '../api/categories';
import CategoryFormDialog from '../components/CategoryFormDialog';
import ConfirmDialog      from '../components/ConfirmDialog';


export default function CategoriesPage() {
  const [categories,   setCategories]   = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [formOpen,     setFormOpen]     = useState(false);
  const [editTarget,   setEditTarget]   = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [confirmOpen,  setConfirmOpen]  = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCategories();
      setCategories(data);
    } catch {
      setError('Failed to load categories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleAdd = () => {
    setEditTarget(null);
    setFormOpen(true);
  };

  const handleEdit = (cat) => {
    setEditTarget(cat);
    setFormOpen(true);
  };

  const handleDeleteClick = (cat) => {
    setDeleteTarget(cat);
    setConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteCategory(deleteTarget.id);
      setConfirmOpen(false);
      fetchCategories();
    } catch {
      setError('Failed to delete category.');
      setConfirmOpen(false);
    }
  };

  const handleFormSaved = () => {
    setFormOpen(false);
    fetchCategories();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5">Categories</Typography>
          <Typography variant="body2" color="text.secondary">
            Use categories to organise your transactions. The type (income / expense) is set per transaction.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
          Add Category
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper>
          <List disablePadding>
            {categories.length === 0 ? (
              <ListItem>
                <ListItemText
                  primary="No categories yet."
                  secondary="Add a category to start organizing your transactions."
                />
              </ListItem>
            ) : (
              categories.map((cat, idx) => {
                return (
                  <React.Fragment key={cat.id}>
                    {idx > 0 && <Divider component="li" />}
                    <ListItem>
                      <ListItemText
                        primary={
                          <Typography variant="body1" fontWeight={500}>
                            {cat.name}
                          </Typography>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => handleEdit(cat)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => handleDeleteClick(cat)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </ListItemSecondaryAction>
                    </ListItem>
                  </React.Fragment>
                );
              })
            )}
          </List>
        </Paper>
      )}

      <CategoryFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={handleFormSaved}
        category={editTarget}
      />

      <ConfirmDialog
        open={confirmOpen}
        title="Delete Category"
        message={`Delete "${deleteTarget?.name}"? Transactions in this category will become uncategorized.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </Box>
  );
}
