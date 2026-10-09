import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import API from '../utils/api';
import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Grid,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from '@mui/material';
import { Bar, Line } from 'react-chartjs-2';
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend, Filler);

const PERIODS = [
  { value: 'daily', label: 'Today' },
  { value: 'weekly', label: 'This week' },
  { value: 'monthly', label: 'This month' },
  { value: 'lifetime', label: 'Lifetime' },
];

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false }, ticks: { color: '#6f6257', maxRotation: 0, autoSkip: true } },
    y: { beginAtZero: true, ticks: { precision: 0, color: '#6f6257' }, grid: { color: '#eee7df' } },
  },
};

const Metric = ({ label, value, detail, color }) => (
  <Card variant="outlined" sx={{ height: '100%', borderRadius: '8px', borderTop: `3px solid ${color}` }}>
    <CardContent>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="h4" sx={{ mt: 0.5, color, fontWeight: 700 }}>{value}</Typography>
      {detail && <Typography variant="caption" color="text.secondary">{detail}</Typography>}
    </CardContent>
  </Card>
);

const ItemTable = ({ title, items, emptyLabel, sold = false }) => (
  <Box component="section">
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 1 }}>
      <Typography variant="h6" sx={{ color: '#503622', fontWeight: 700 }}>{title}</Typography>
      <Typography variant="body2" color="text.secondary">{items.length} items</Typography>
    </Box>
    <Table size="small" aria-label={title}>
      <TableHead>
        <TableRow sx={{ bgcolor: '#f5f3f0' }}>
          <TableCell>Item</TableCell>
          <TableCell>Category</TableCell>
          <TableCell align="right">Units</TableCell>
          {sold && <TableCell align="right">Sales</TableCell>}
        </TableRow>
      </TableHead>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id} hover>
            <TableCell sx={{ fontWeight: 600 }}>{item.name}</TableCell>
            <TableCell>{item.category}</TableCell>
            <TableCell align="right">{item.quantity}</TableCell>
            {sold && <TableCell align="right">₹{Number(item.revenue).toFixed(2)}</TableCell>}
          </TableRow>
        ))}
        {items.length === 0 && (
          <TableRow><TableCell colSpan={sold ? 4 : 3} align="center" sx={{ py: 3, color: 'text.secondary' }}>{emptyLabel}</TableCell></TableRow>
        )}
      </TableBody>
    </Table>
  </Box>
);

const FoodAnalysis = () => {
  const { user } = useSelector((state) => state.auth);
  const [period, setPeriod] = useState('daily');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    API.get('/food-analysis', { params: { period } })
      .then((response) => {
        if (active) setData(response.data);
      })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.error || 'Food analysis could not be loaded.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [period]);

  const soldItems = useMemo(() => data?.soldItems || [], [data]);
  const unsoldItems = data?.unsoldItems || [];
  const topItems = useMemo(() => soldItems.slice(0, 10), [soldItems]);
  const trendData = {
    labels: data?.trend?.labels || [],
    datasets: [{
      label: 'Units sold',
      data: data?.trend?.units || [],
      borderColor: '#247f78',
      backgroundColor: 'rgba(36,127,120,0.12)',
      pointBackgroundColor: '#247f78',
      pointRadius: period === 'daily' ? 0 : 3,
      fill: true,
      tension: 0.25,
    }],
  };
  const topItemsData = {
    labels: topItems.map((item) => item.name),
    datasets: [{
      label: 'Units sold',
      data: topItems.map((item) => item.quantity),
      backgroundColor: '#c28a34',
      borderRadius: 3,
    }],
  };

  if (user?.role !== 'owner') {
    return <Container sx={{ mt: 5 }}><Alert severity="warning">Only owners can access food analysis.</Alert></Container>;
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 2, flexWrap: 'wrap', mb: 2 }}>
        <Box>
          <Typography variant="overline" sx={{ color: '#247f78', fontWeight: 700 }}>MENU PERFORMANCE</Typography>
          <Typography variant="h3" sx={{ fontFamily: "'Playfair Display', serif", color: '#503622', fontWeight: 700 }}>
            Food Analysis
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Sales from completed bills, compared with the active menu.
          </Typography>
        </Box>
        {data && <Typography variant="body2" color="text.secondary">{data.billsCount} bills in period</Typography>}
      </Box>

      <Tabs
        value={period}
        onChange={(event, value) => setPeriod(value)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ borderBottom: '1px solid #e8e0d8', mb: 3, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } }}
      >
        {PERIODS.map((item) => <Tab key={item.value} value={item.value} label={item.label} />)}
      </Tabs>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : data && (
        <>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}><Metric label="Units sold" value={data.unitsSold} detail={`${data.billsCount} completed bills`} color="#247f78" /></Grid>
            <Grid item xs={12} sm={6} md={3}><Metric label="Menu items sold" value={data.activeSoldItems} detail={`of ${data.activeMenuItems} active items`} color="#4a7b54" /></Grid>
            <Grid item xs={12} sm={6} md={3}><Metric label="Not sold" value={data.unsoldItems.length} detail="active menu items with no sales" color="#b16c37" /></Grid>
            <Grid item xs={12} sm={6} md={3}><Metric label="Item sales" value={`₹${Number(data.grossSales).toFixed(2)}`} detail="GST-inclusive; parcel fees excluded" color="#6f4e37" /></Grid>
          </Grid>

          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={12} lg={7}>
              <Card variant="outlined" sx={{ borderRadius: '8px', height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: '#503622', fontWeight: 700, mb: 2 }}>Units sold over time</Typography>
                  <Box sx={{ height: 280 }}><Line data={trendData} options={chartOptions} /></Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} lg={5}>
              <Card variant="outlined" sx={{ borderRadius: '8px', height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: '#503622', fontWeight: 700, mb: 2 }}>Top dishes</Typography>
                  {topItems.length
                    ? <Box sx={{ height: 280 }}><Bar data={topItemsData} options={{ ...chartOptions, indexAxis: 'y' }} /></Box>
                    : <Box sx={{ display: 'grid', placeItems: 'center', height: 280 }}><Typography color="text.secondary">No item sales in this period.</Typography></Box>}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            <Grid item xs={12} lg={7}>
              <ItemTable title="Sold items" items={soldItems} emptyLabel="No menu items sold in this period." sold />
            </Grid>
            <Grid item xs={12} lg={5}>
              <ItemTable title="Not sold" items={unsoldItems} emptyLabel="Every active menu item sold at least once." />
            </Grid>
          </Grid>
        </>
      )}
    </Container>
  );
};

export default FoodAnalysis;