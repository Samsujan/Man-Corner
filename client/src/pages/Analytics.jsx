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
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Analytics = () => {
  const { user } = useSelector((state) => state.auth);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [budget, setBudget] = useState(null);

  useEffect(() => {
    if (user?.role === 'owner') {
      fetchAnalytics();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchAnalytics = async () => {
    try {
      const [plRes, recRes, forecastRes, budgetRes] = await Promise.all([
        API.get('/analytics/profit-loss'),
        API.get('/analytics/recommendations'),
        API.get('/analytics/forecast'),
        API.get('/analytics/budget-plan'),
      ]);

      setData(plRes.data);
      setRecommendations(recRes.data.recommendations || []);
      setForecast(forecastRes.data);
      setBudget(budgetRes.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'owner' && !loading) {
    return (
      <Container sx={{ mt: 5 }}>
        <Alert severity="warning">
          🔒 Only owners can access analytics. You have access to billing only.
        </Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography
        variant="h3"
        sx={{
          fontFamily: "'Playfair Display', serif",
          color: '#6f4e37',
          fontWeight: 700,
          mb: 3,
        }}
      >
        📊 Business Analytics & Insights
      </Typography>

      {/* Profit & Loss Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(111, 78, 55, 0.1)' }}>
            <CardContent>
              <Typography color="textSecondary" sx={{ mb: 1 }}>
                Revenue
              </Typography>
              <Typography variant="h5" sx={{ color: '#27ae60', fontWeight: 700 }}>
                ₹{data?.revenue?.toFixed(2) || '0'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(111, 78, 55, 0.1)' }}>
            <CardContent>
              <Typography color="textSecondary" sx={{ mb: 1 }}>
                Expenses
              </Typography>
              <Typography variant="h5" sx={{ color: '#e74c3c', fontWeight: 700 }}>
                ₹{data?.totalExpenses?.toFixed(2) || '0'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(111, 78, 55, 0.1)' }}>
            <CardContent>
              <Typography color="textSecondary" sx={{ mb: 1 }}>
                Net Profit
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography
                  variant="h5"
                  sx={{
                    color: data?.profit >= 0 ? '#27ae60' : '#e74c3c',
                    fontWeight: 700,
                  }}
                >
                  ₹{data?.profit?.toFixed(2) || '0'}
                </Typography>
                {data?.profit >= 0 ? (
                  <TrendingUpIcon sx={{ color: '#27ae60' }} />
                ) : (
                  <TrendingDownIcon sx={{ color: '#e74c3c' }} />
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(111, 78, 55, 0.1)' }}>
            <CardContent>
              <Typography color="textSecondary" sx={{ mb: 1 }}>
                Profit Margin
              </Typography>
              <Typography variant="h5" sx={{ color: '#3498db', fontWeight: 700 }}>
                {data?.profitMargin}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Forecasting & Budget Planning */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: '12px' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                📈 Expense Forecast
              </Typography>
              <Box sx={{ bgcolor: '#f5f3f0', p: 2, borderRadius: '8px' }}>
                <Typography color="textSecondary" sx={{ mb: 1 }}>
                  Historical Average
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  ₹{forecast?.historicalAverage?.toFixed(2) || '0'}
                </Typography>

                <Typography color="textSecondary" sx={{ mb: 1 }}>
                  Trend
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {forecast?.trendPercentage > 0 ? '+' : ''}{forecast?.trendPercentage}%
                  </Typography>
                  {forecast?.trendPercentage > 0 ? (
                    <TrendingUpIcon sx={{ color: '#e74c3c' }} />
                  ) : (
                    <TrendingDownIcon sx={{ color: '#27ae60' }} />
                  )}
                </Box>

                <Alert severity={forecast?.trendPercentage > 0 ? 'warning' : 'success'}>
                  {forecast?.message}
                </Alert>

                <Box sx={{ mt: 2, p: 2, bgcolor: '#e8f5e9', borderRadius: '8px' }}>
                  <Typography color="textSecondary" sx={{ mb: 1, fontSize: '0.9rem' }}>
                    Forecasted Monthly Expense
                  </Typography>
                  <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#1b5e20' }}>
                    ₹{forecast?.forecastedMonthlyExpense?.toFixed(2) || '0'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: '12px' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                🎯 Budget Planning
              </Typography>
              <Box sx={{ bgcolor: '#f5f3f0', p: 2, borderRadius: '8px' }}>
                <Typography color="textSecondary" sx={{ mb: 1 }}>
                  Last Month Actual
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  ₹{budget?.lastMonthActual?.toFixed(2) || '0'}
                </Typography>

                <Typography color="textSecondary" sx={{ mb: 1 }}>
                  Recommended Monthly Budget
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  ₹{budget?.recommendedMonthlyBudget?.toFixed(2) || '0'}
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ color: '#888', mb: 1, display: 'block' }}>
                    Safety Buffer ({((budget?.safetyBuffer / budget?.lastMonthActual * 100) || 0).toFixed(1)}%)
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={((budget?.safetyBuffer / budget?.recommendedMonthlyBudget * 100) || 0)}
                    sx={{ height: 8, borderRadius: '4px', bgcolor: '#e0e0e0' }}
                  />
                </Box>

                <Box sx={{ p: 2, bgcolor: '#e3f2fd', borderRadius: '8px' }}>
                  <Typography color="textSecondary" sx={{ mb: 1, fontSize: '0.9rem' }}>
                    Quarterly Budget Forecast
                  </Typography>
                  <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#0d47a1' }}>
                    ₹{budget?.quarterlyBudgetForecast?.toFixed(2) || '0'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Cost-Cutting Recommendations */}
      <Card sx={{ borderRadius: '12px', mb: 4 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            💡 AI-Powered Cost Optimization Suggestions
          </Typography>

          {recommendations.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {recommendations.map((rec, idx) => (
                <Box
                  key={idx}
                  sx={{
                    p: 2,
                    borderLeft: `4px solid ${rec.priority === 'HIGH' ? '#e74c3c' : rec.priority === 'MEDIUM' ? '#f39c12' : '#3498db'}`,
                    bgcolor: '#f5f3f0',
                    borderRadius: '4px',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography sx={{ fontWeight: 600 }}>
                      {rec.priority === 'HIGH' ? '🔴' : rec.priority === 'MEDIUM' ? '🟡' : '⚪'}{' '}
                      {rec.category}
                    </Typography>
                    <Typography
                      sx={{
                        fontWeight: 700,
                        color: '#e74c3c',
                      }}
                    >
                      Potential Savings: {rec.potentialSavings}
                    </Typography>
                  </Box>
                  <Typography variant="body2">{rec.suggestion}</Typography>
                </Box>
              ))}
            </Box>
          ) : (
            <Alert severity="info">
              Keep monitoring your expenses. Recommendations will appear once more data is available.
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Business Intelligence Summary */}
      <Card sx={{ borderRadius: '12px', bgcolor: '#f5f3f0' }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            🤖 Business Intelligence Summary
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ p: 2, bgcolor: '#fff', borderRadius: '8px', borderLeft: '4px solid #6f4e37' }}>
              <Typography variant="body2">
                <strong>Current Status:</strong> Your business is{' '}
                {data?.profit > 0 ? (
                  <span style={{ color: '#27ae60' }}>performing well 📈</span>
                ) : (
                  <span style={{ color: '#e74c3c' }}>facing challenges 📉</span>
                )}
              </Typography>
            </Box>

            <Box sx={{ p: 2, bgcolor: '#fff', borderRadius: '8px', borderLeft: '4px solid #6f4e37' }}>
              <Typography variant="body2">
                <strong>Cost Analysis:</strong> Expenses represent{' '}
                {((data?.totalExpenses / (data?.revenue + data?.totalExpenses) * 100) || 0).toFixed(1)}% of your
                revenue. Aim for 60-70% for healthy margins.
              </Typography>
            </Box>

            <Box sx={{ p: 2, bgcolor: '#fff', borderRadius: '8px', borderLeft: '4px solid #6f4e37' }}>
              <Typography variant="body2">
                <strong>Next Steps:</strong>{' '}
                {recommendations.length > 0
                  ? `Focus on ${recommendations[0].category} optimization for maximum savings.`
                  : 'Continue tracking your spending patterns for better insights.'}
              </Typography>
            </Box>

            <Box sx={{ p: 2, bgcolor: '#fff', borderRadius: '8px', borderLeft: '4px solid #6f4e37' }}>
              <Typography variant="body2">
                <strong>Profit Outlook:</strong> At your current trajectory, you can expect{' '}
                <span style={{ fontWeight: 700, color: '#3498db' }}>
                  ₹{(data?.profit * 12).toFixed(2)}
                </span>{' '}
                annual profit.
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default Analytics;
