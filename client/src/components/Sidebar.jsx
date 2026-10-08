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
  const isInvestmentManager = user?.email?.toLowerCase() === 'matamsamsujanp@gmail.com';
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      label: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/dashboard',
      roles: ['owner'],
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
      roles: ['owner'],
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

  const allItems = [...menuItems, ...ownerOnlyItems].filter((item) => (
    item.roles.includes(user?.role) || (item.path === '/expenses' && isInvestmentManager)
  ));

  const handleNavigation = (path) => {
    navigate(path);
    onClose();
  };

  const isActive = (path) => location.pathname === path;

  return (
    <Drawer anchor="left" open={open} onClose={onClose}>
      <Box
        sx={{
          width: { xs: 296, sm: 312 },
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          bgcolor: '#fffaf0',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 2.5,
            background: 'linear-gradient(135deg, #3c2d0c 0%, #725614 72%, #92701c 100%)',
            color: '#fff',
            minHeight: 136,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
          }}
        >
          <Box
            sx={{
              width: 38,
              height: 38,
              display: 'grid',
              placeItems: 'center',
              borderRadius: '13px',
              bgcolor: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.15)',
              mb: 1.5,
            }}
          >
            <RestaurantMenuIcon sx={{ fontSize: 21, color: '#f3d8ad' }} />
          </Box>
          <Typography
            variant="h6"
            sx={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 700,
              lineHeight: 1.1,
            }}
          >
            Maná Corner
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.74, fontStyle: 'italic' }}>
            Something to Eat
          </Typography>
          <Typography variant="overline" display="block" sx={{ opacity: 0.57, mt: 1.25, lineHeight: 1 }}>
            {user?.role} workspace
          </Typography>
        </Box>

        <Divider />

        {/* Navigation Items */}
        <List sx={{ flex: 1, py: 2, px: 1.25 }}>
          {allItems.map((item) => (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                selected={isActive(item.path)}
                sx={{
                  borderRadius: 2.5,
                  minHeight: 48,
                  bgcolor: isActive(item.path) ? '#f8edc7' : 'transparent',
                  borderLeft: isActive(item.path) ? '3px solid #b1841e' : '3px solid transparent',
                  paddingLeft: '13px',
                  '&:hover': {
                    bgcolor: '#fbf4dc',
                  },
                  '&.Mui-selected': {
                    bgcolor: '#f8edc7',
                    '&:hover': { bgcolor: '#f2e3ae' },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive(item.path) ? '#86600d' : '#86796d',
                    minWidth: 42,
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
                      color: isActive(item.path) ? '#5a4311' : '#51483f',
                      fontSize: '0.92rem',
                    },
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        <Divider />

        {/* Footer Info */}
        <Box sx={{ p: 2, bgcolor: '#fbf4dc', fontSize: '0.8rem', color: '#887a6e' }}>
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
