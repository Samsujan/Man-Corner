import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Menu,
  MenuItem,
  Avatar,
  IconButton,
  Chip,
} from '@mui/material';
import CoffeeIcon from '@mui/icons-material/LocalCafe';
import MenuIcon from '@mui/icons-material/Menu';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';

const Navbar = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
    handleClose();
  };

  return (
    <>
      <AppBar
        position="sticky"
        sx={{
          background: 'linear-gradient(110deg, #392719 0%, #68462f 60%, #79583c 100%)',
          boxShadow: '0 8px 24px rgba(57, 39, 25, 0.18)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 64, sm: 72 }, px: { xs: 2, sm: 3 } }}>
          <IconButton
            color="inherit"
            onClick={() => setSidebarOpen(true)}
            sx={{
              mr: 1.5,
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 2.5,
              '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' },
            }}
          >
            <MenuIcon />
          </IconButton>
          <Box
            sx={{
              mr: 2,
              width: 40,
              height: 40,
              display: 'grid',
              placeItems: 'center',
              borderRadius: '14px',
              color: '#f8e9cf',
              bgcolor: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.14)',
            }}
          >
            <CoffeeIcon sx={{ fontSize: 24 }} />
          </Box>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography
              variant="h6"
              sx={{
                fontFamily: "'Playfair Display', serif",
                fontWeight: 700,
                lineHeight: 1.05,
                letterSpacing: '0.01em',
              }}
            >
              Maná Corner
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', letterSpacing: '0.08em' }}>
              SOMETHING TO EAT
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.75, sm: 1.5 } }}>
            <Avatar
              sx={{
                width: 38,
                height: 38,
                bgcolor: '#ead0a9',
                color: '#503622',
                cursor: 'pointer',
                fontWeight: 600,
                border: '2px solid rgba(255,255,255,0.35)',
              }}
              onClick={handleMenu}
            >
              {user?.name?.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                {user?.name}
              </Typography>
              <Chip
                size="small"
                label={user?.role}
                sx={{
                  mt: 0.25,
                  height: 18,
                  textTransform: 'capitalize',
                  fontSize: '0.65rem',
                  color: '#f7e9d4',
                  bgcolor: 'rgba(255,255,255,0.13)',
                  '& .MuiChip-label': { px: 0.8 },
                }}
              />
            </Box>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem disabled>
                <Typography variant="caption">{user?.role?.toUpperCase()}</Typography>
              </MenuItem>
              <MenuItem onClick={handleClose}>Profile</MenuItem>
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </>
  );
};

export default Navbar;
