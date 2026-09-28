import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
  Badge,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import PaidIcon from '@mui/icons-material/Paid';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import PeopleIcon from '@mui/icons-material/People';
import ContactsIcon from '@mui/icons-material/Contacts';

const Sidebar = ({ open, onClose }) => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      label: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/dashboard',
      roles: ['owner', 'guest'],
    },
    {
      label: 'Billing',
      icon: <ShoppingCartIcon />,
      path: '/billing',
      roles: ['owner', 'guest'],
      badge: '🧾',
    },
    {
      label: 'Directory',
      icon: <ContactsIcon />,
      path: '/directory',
      roles: ['owner', 'guest'],
    },
  ];

  const ownerOnlyItems = [
    {
      label: 'Menu Management',
      icon: <RestaurantMenuIcon />,
      path: '/menu',
      roles: ['owner'],
    },
    {
      label: 'Expenses',
      icon: <ReceiptIcon />,
      path: '/expenses',
      roles: ['owner'],
      badge: '💸',
    },
    {
      label: 'Analytics',
      icon: <AnalyticsIcon />,
      path: '/analytics',
      roles: ['owner'],
      badge: '📊',
    },
    {
      label: 'Profit Sharing',
      icon: <PaidIcon />,
      path: '/profit-share',
      roles: ['owner'],
      badge: '💰',
    },
    {
      label: 'Accounts',
      icon: <PeopleIcon />,
      path: '/users',
      roles: ['owner'],
    },
  ];

  const allItems = [...menuItems, ...ownerOnlyItems].filter((item) =>
    item.roles.includes(user?.role)
  );

  const handleNavigation = (path) => {
    navigate(path);
    onClose();
  };

  const isActive = (path) => location.pathname === path;

  return (
    <Drawer anchor="left" open={open} onClose={onClose}>
      <Box
        sx={{
          width: 280,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
      >
        {/* Header */}
        <Box sx={{ p: 2, background: 'linear-gradient(135deg, #6f4e37 0%, #4a3120 100%)', color: '#fff' }}>
          <Typography
            variant="h6"
            sx={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 700,
            }}
          >
            Maná Corner
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.8 }}>
            Something to Eat
          </Typography>
          <Typography variant="caption" display="block" sx={{ opacity: 0.65 }}>
            {user?.role.toUpperCase()} DASHBOARD
          </Typography>
        </Box>

        <Divider />

        {/* Navigation Items */}
        <List sx={{ flex: 1, py: 2 }}>
          {allItems.map((item) => (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                selected={isActive(item.path)}
                sx={{
                  bgcolor: isActive(item.path) ? '#f5f3f0' : 'transparent',
                  borderLeft: isActive(item.path) ? '4px solid #6f4e37' : 'none',
                  paddingLeft: isActive(item.path) ? '12px' : '16px',
                  '&:hover': {
                    bgcolor: '#fafaf9',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive(item.path) ? '#6f4e37' : 'inherit',
                    minWidth: 40,
                  }}
                >
                  {item.badge ? (
                    <Badge badgeContent={item.badge} overlap="circular">
                      {item.icon}
                    </Badge>
                  ) : (
                    item.icon
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  sx={{
                    '& .MuiTypography-root': {
                      fontWeight: isActive(item.path) ? 600 : 500,
                      color: isActive(item.path) ? '#6f4e37' : 'inherit',
                    },
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        <Divider />

        {/* Footer Info */}
        <Box sx={{ p: 2, bgcolor: '#f5f3f0', fontSize: '0.8rem', color: '#888' }}>
          <Typography variant="caption">
            Website: www.manàcorner.com
          </Typography>
          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
            © 2026 Maná Corner
          </Typography>
        </Box>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
