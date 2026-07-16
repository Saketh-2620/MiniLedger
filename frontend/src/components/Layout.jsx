import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Drawer, AppBar, Toolbar, Typography, IconButton,
  List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Avatar, Menu, MenuItem, Divider, useTheme, useMediaQuery,
} from '@mui/material';
import MenuIcon                 from '@mui/icons-material/Menu';
import DashboardIcon            from '@mui/icons-material/Dashboard';
import ReceiptLongIcon          from '@mui/icons-material/ReceiptLong';
import CategoryIcon             from '@mui/icons-material/Category';
import NotificationsIcon        from '@mui/icons-material/Notifications';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import LogoutIcon               from '@mui/icons-material/Logout';
import { useAuth } from '../context/AuthContext';

const DRAWER_WIDTH = 220;

const NAV_ITEMS = [
  { label: 'Dashboard',     path: '/dashboard',     icon: <DashboardIcon /> },
  { label: 'Transactions',  path: '/transactions',  icon: <ReceiptLongIcon /> },
  { label: 'Categories',    path: '/categories',    icon: <CategoryIcon /> },
  { label: 'Notifications', path: '/notifications', icon: <NotificationsIcon /> },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const location         = useLocation();
  const theme            = useTheme();
  const isMobile         = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl,   setAnchorEl]   = useState(null);

  // ── Sidebar content ───────────────────────────────────────────────────────
  // Desktop: brand shown here only (AppBar has no title on desktop)
  // Mobile:  no brand here (AppBar already shows it)
  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {!isMobile && (
        <>
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccountBalanceWalletIcon color="primary" />
            <Typography variant="h6" fontWeight={700} color="primary">
              Mini-Ledger
            </Typography>
          </Box>
          <Divider />
        </>
      )}
      <List sx={{ flexGrow: 1, pt: 1 }}>
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                onClick={() => { navigate(item.path); setMobileOpen(false); }}
                selected={isActive}
                sx={{
                  mx: 1, borderRadius: 1,
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'white',
                    '& .MuiListItemIcon-root': { color: 'white' },
                    '&:hover': { bgcolor: 'primary.dark' },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

      {/* ── Top AppBar ────────────────────────────────────────────────────── */}
      <AppBar
        position="fixed"
        elevation={1}
        sx={{ zIndex: (t) => t.zIndex.drawer + 1, bgcolor: 'white', color: 'text.primary' }}
      >
        <Toolbar>
          {/* Hamburger — mobile only */}
          {isMobile && (
            <IconButton edge="start" onClick={() => setMobileOpen(true)} sx={{ mr: 1 }}>
              <MenuIcon />
            </IconButton>
          )}

          {/* Brand title in AppBar on mobile only — desktop has it in the sidebar */}
          {isMobile ? (
            <Typography variant="h6" sx={{ flexGrow: 1, color: 'primary.main', fontWeight: 700 }}>
              Mini-Ledger
            </Typography>
          ) : (
            <Box sx={{ flexGrow: 1 }} />
          )}

          {/* Avatar + user menu — always visible */}
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} size="small">
            <Avatar
              src={user?.avatar_url}
              alt={user?.name}
              sx={{ width: 34, height: 34, bgcolor: 'primary.main' }}
            >
              {user?.name?.[0]}
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem disabled>
              <Box>
                <Typography variant="body2" fontWeight={600}>{user?.name}</Typography>
                <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
              </Box>
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => { setAnchorEl(null); logout(); }}>
              <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Spacer so content clears the fixed AppBar */}
      <Toolbar />

      {/* ── Body row: sidebar + main content ─────────────────────────────── */}
      <Box sx={{ display: 'flex', flexGrow: 1 }}>

        {/* Permanent sidebar — desktop only */}
        {!isMobile && (
          <Drawer
            variant="permanent"
            sx={{
              width: DRAWER_WIDTH,
              flexShrink: 0,
              '& .MuiDrawer-paper': {
                width: DRAWER_WIDTH,
                boxSizing: 'border-box',
                position: 'relative',
                height: '100%',
              },
            }}
          >
            {drawerContent}
          </Drawer>
        )}

        {/* Temporary drawer — mobile only */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH },
          }}
        >
          {drawerContent}
        </Drawer>

        {/* Main content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            minWidth: 0,
            bgcolor: 'background.default',
            minHeight: '100%',
            overflow: 'auto',
          }}
        >
          <Box
            sx={{
              maxWidth: 1100,
              mx: 'auto',
              px: { xs: 2, sm: 3 },
              py: 3,
            }}
          >
            <Outlet />
          </Box>
        </Box>

      </Box>
    </Box>
  );
}
