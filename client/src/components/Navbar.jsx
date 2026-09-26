import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  Menu,
  MenuItem,
  Avatar,
  IconButton,
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
          bgcolor: '#6f4e37',
          boxShadow: '0 2px 8px rgba(111, 78, 55, 0.15)',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            onClick={() => setSidebarOpen(true)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <CoffeeIcon sx={{ mr: 2, fontSize: 32 }} />
          <Typography
            variant="h5"
            sx={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 700,
              flexGrow: 1,
            }}
          >
            Maná Corner
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              sx={{
                bgcolor: '#d4a574',
                color: '#6f4e37',
                cursor: 'pointer',
                fontWeight: 600,
              }}
              onClick={handleMenu}
            >
              {user?.name?.charAt(0).toUpperCase()}
            </Avatar>
            <Typography variant="body2">{user?.name}</Typography>

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
