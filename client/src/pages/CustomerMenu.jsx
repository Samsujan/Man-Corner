import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  CircularProgress,
  Container,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import API from '../utils/api';

const CATEGORY_ORDER = ['Morning', 'Afternoon', 'Evening Snacks', 'Dinner', 'All Day Items'];

const CustomerMenu = () => {
  const [items, setItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    API.get('/menu')
      .then((response) => setItems(response.data))
      .catch((requestError) => {
        setError(requestError.response?.data?.error || 'The menu could not be loaded. Please try again.');
      })
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const available = new Set(items.map((item) => item.category));
    const ordered = CATEGORY_ORDER.filter((category) => available.has(category));
    const other = [...available].filter((category) => !CATEGORY_ORDER.includes(category));
    return ['All', ...ordered, ...other];
  }, [items]);

  const visibleGroups = useMemo(() => {
    const groups = new Map();
    items.forEach((item) => {
      if (activeCategory !== 'All' && item.category !== activeCategory) return;
      if (!groups.has(item.category)) groups.set(item.category, []);
      groups.get(item.category).push(item);
    });
    return [...groups.entries()].sort(([first], [second]) => (
      CATEGORY_ORDER.indexOf(first) - CATEGORY_ORDER.indexOf(second)
    ));
  }, [items, activeCategory]);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fffdfa', pb: 5 }}>
      <Box
        component="header"
        sx={{
          px: 2,
          py: { xs: 4, sm: 5 },
          color: '#fffaf2',
          bgcolor: '#392719',
          borderBottom: '5px solid #c89a62',
        }}
      >
        <Container maxWidth="md">
          <Typography variant="overline" sx={{ color: '#edcf9e', fontWeight: 700 }}>
            SELF SERVICE
          </Typography>
          <Typography variant="h2" sx={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
            Maná Corner
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.76)' }}>
            Something to Eat
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ pt: 3 }}>
        <Typography variant="h4" sx={{ mb: 1.5, fontFamily: "'Playfair Display', serif", color: '#503622', fontWeight: 700 }}>
          Menu
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {!error && !loading && (
          <Tabs
            value={activeCategory}
            onChange={(event, value) => setActiveCategory(value)}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              mb: 2,
              borderBottom: '1px solid #e8e0d8',
              '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, color: '#6f4e37' },
              '& .Mui-selected': { color: '#503622 !important' },
              '& .MuiTabs-indicator': { bgcolor: '#98745b', height: 3 },
            }}
          >
            {categories.map((category) => <Tab key={category} value={category} label={category} />)}
          </Tabs>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress sx={{ color: '#6f4e37' }} />
          </Box>
        ) : (
          <Stack spacing={3}>
            {visibleGroups.map(([category, categoryItems]) => (
              <Box component="section" key={category}>
                <Typography variant="h5" sx={{ mb: 0.5, color: '#503622', fontWeight: 700 }}>
                  {category}
                </Typography>
                <Stack divider={<Box sx={{ borderBottom: '1px solid #eee7df' }} />}>
                  {categoryItems.map((item) => (
                    <Box
                      key={item._id}
                      sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, py: 1.5 }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ color: '#332a23', fontWeight: 650, overflowWrap: 'anywhere' }}>
                          {item.name}
                        </Typography>
                        {item.description && (
                          <Typography variant="body2" sx={{ color: '#82766a' }}>
                            {item.description}
                          </Typography>
                        )}
                        <Typography variant="caption" sx={{ color: '#82766a' }}>
                          Preparation: 10-15 mins
                        </Typography>
                      </Box>
                      <Typography sx={{ flexShrink: 0, color: '#68462f', fontWeight: 700 }}>
                        ₹{Number(item.price).toFixed(2)}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>
            ))}
            {!error && visibleGroups.length === 0 && (
              <Typography color="text.secondary">No menu items are available right now.</Typography>
            )}
          </Stack>
        )}
      </Container>
    </Box>
  );
};

export default CustomerMenu;