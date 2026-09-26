import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import API from '../utils/api';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Button,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import PaidIcon from '@mui/icons-material/Paid';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [revenue, expenses, pl] = await Promise.all([
        API.get('/analytics/revenue'),
        API.get('/analytics/expenses-summary'),
        API.get('/analytics/profit-loss'),
      ]);

      setData({
        revenue: revenue.data,
        expenses: expenses.data,
        profitLoss: pl.data,
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h3"
          sx={{
            fontFamily: "'Playfair Display', serif",
            color: '#6f4e37',
            fontWeight: 700,
            mb: 1,
          }}
        >
          Welcome back, {user?.name}! ☕
        </Typography>
        <Typography variant="body1" sx={{ color: '#888' }}>
          {new Date().toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Revenue Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(111, 78, 55, 0.1)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography color="textSecondary" sx={{ mb: 1 }}>
                    Total Revenue
                  </Typography>
                  <Typography variant="h5" sx={{ color: '#6f4e37', fontWeight: 700 }}>
                    ₹{data?.revenue?.totalRevenue?.toFixed(2) || '0'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#888' }}>
                    {data?.revenue?.billCount || 0} bills
                  </Typography>
                </Box>
                <PaidIcon sx={{ fontSize: 40, color: '#6f4e37', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Expenses Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(111, 78, 55, 0.1)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography color="textSecondary" sx={{ mb: 1 }}>
                    Total Expenses
                  </Typography>
                  <Typography variant="h5" sx={{ color: '#e74c3c', fontWeight: 700 }}>
                    ₹{data?.expenses?.totalExpenses?.toFixed(2) || '0'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#888' }}>
                    {data?.expenses?.expenseCount || 0} entries
                  </Typography>
                </Box>
                <ShoppingCartIcon sx={{ fontSize: 40, color: '#e74c3c', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Profit Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(111, 78, 55, 0.1)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography color="textSecondary" sx={{ mb: 1 }}>
                    Net Profit
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{
                      color: data?.profitLoss?.profit >= 0 ? '#27ae60' : '#e74c3c',
                      fontWeight: 700,
                    }}
                  >
                    ₹{data?.profitLoss?.profit?.toFixed(2) || '0'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#888' }}>
                    Margin: {data?.profitLoss?.profitMargin}%
                  </Typography>
                </Box>
                {data?.profitLoss?.profit >= 0 ? (
                  <TrendingUpIcon sx={{ fontSize: 40, color: '#27ae60', opacity: 0.3 }} />
                ) : (
                  <TrendingDownIcon sx={{ fontSize: 40, color: '#e74c3c', opacity: 0.3 }} />
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* GST Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(111, 78, 55, 0.1)' }}>
            <CardContent>
              <Box>
                <Typography color="textSecondary" sx={{ mb: 1 }}>
                  GST Collected
                </Typography>
                <Typography variant="h5" sx={{ color: '#3498db', fontWeight: 700 }}>
                  ₹{data?.profitLoss?.totalGST?.toFixed(2) || '0'}
                </Typography>
                <Typography variant="caption" sx={{ color: '#888' }}>
                  To be paid to government
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {user?.role === 'owner' && (
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Button
              fullWidth
              variant="contained"
              sx={{
                bgcolor: '#6f4e37',
                py: 2,
                '&:hover': { bgcolor: '#4a3120' },
              }}
              onClick={() => (window.location.href = '/billing')}
            >
              📝 Create New Bill
            </Button>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Button
              fullWidth
              variant="outlined"
              sx={{
                borderColor: '#6f4e37',
                color: '#6f4e37',
                py: 2,
              }}
              onClick={() => (window.location.href = '/expenses')}
            >
              💸 Log Expense
            </Button>
          </Grid>
        </Grid>
      )}

      {user?.role === 'guest' && (
        <Card sx={{ borderRadius: '12px', bgcolor: '#fef3cd', border: '1px solid #ffc107' }}>
          <CardContent>
            <Typography sx={{ color: '#856404' }}>
              👋 Welcome! As a guest, you have access to billing features only.
            </Typography>
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

export default Dashboard;
