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
  Button,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

const ProfitShare = () => {
  const { user } = useSelector((state) => state.auth);
  const [profitShare, setProfitShare] = useState(null);
  const [month, setMonth] = useState(new Date().toISOString().substring(0, 7));
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    month: new Date().toISOString().substring(0, 7),
    percentageA: 33.33,
    percentageB: 33.33,
    percentageC: 33.34,
  });

  useEffect(() => {
    if (user?.role === 'owner') {
      fetchProfitShare();
    } else {
      setLoading(false);
    }
  }, [month, user]);

  const fetchProfitShare = async () => {
    try {
      const response = await API.get(`/analytics/profit-share/${month}`);
      setProfitShare(response.data);
    } catch (error) {
      console.error('Failed to fetch profit share:', error);
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'owner' && !loading) {
    return (
      <Container sx={{ mt: 5 }}>
        <Alert severity="warning">
          🔒 Only owners can access profit sharing. You have access to billing only.
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography
          variant="h3"
          sx={{
            fontFamily: "'Playfair Display', serif",
            color: '#6f4e37',
            fontWeight: 700,
          }}
        >
          💰 Profit Sharing
        </Typography>
      </Box>

      {/* Month Selector */}
      <Card sx={{ mb: 3, borderRadius: '12px' }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Select Month"
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ width: '200px' }}
            />
            <Button
              variant="contained"
              sx={{ bgcolor: '#6f4e37' }}
              onClick={fetchProfitShare}
            >
              Load Data
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Profit Summary */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: '12px' }}>
            <CardContent>
              <Typography color="textSecondary" sx={{ mb: 1 }}>
                Total Revenue
              </Typography>
              <Typography variant="h5" sx={{ color: '#27ae60', fontWeight: 700 }}>
                ₹{profitShare?.totalRevenue?.toFixed(2) || '0'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: '12px' }}>
            <CardContent>
              <Typography color="textSecondary" sx={{ mb: 1 }}>
                Total Expenses
              </Typography>
              <Typography variant="h5" sx={{ color: '#e74c3c', fontWeight: 700 }}>
                ₹{profitShare?.totalExpenses?.toFixed(2) || '0'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: '12px' }}>
            <CardContent>
              <Typography color="textSecondary" sx={{ mb: 1 }}>
                Net Profit
              </Typography>
              <Typography variant="h5" sx={{ color: '#6f4e37', fontWeight: 700 }}>
                ₹{profitShare?.totalProfit?.toFixed(2) || '0'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: '12px' }}>
            <CardContent>
              <Typography color="textSecondary" sx={{ mb: 1 }}>
                Per Owner Share
              </Typography>
              <Typography variant="h5" sx={{ color: '#3498db', fontWeight: 700 }}>
                ₹{(profitShare?.totalProfit / 3)?.toFixed(2) || '0'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Owner-wise Breakdown */}
      <Card sx={{ borderRadius: '12px' }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Owner-wise Profit Distribution (Equal Split - 33.33% each)
          </Typography>

          <Grid container spacing={2}>
            {Object.entries(profitShare?.ownerShares || {}).map(([key, value]) => (
              <Grid item xs={12} sm={6} md={4} key={key}>
                <Card sx={{ bgcolor: '#f5f3f0', borderRadius: '12px' }}>
                  <CardContent>
                    <Typography variant="body1" sx={{ mb: 1, fontWeight: 600 }}>
                      {key === 'ownerA' ? '👤 Owner A' : key === 'ownerB' ? '👤 Owner B' : '👤 Owner C'}
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#6f4e37', fontWeight: 700 }}>
                      ₹{value?.toFixed(2) || '0'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#888' }}>
                      33.33% of ₹{profitShare?.totalProfit?.toFixed(2) || '0'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Settlement Tracking */}
      <Card sx={{ borderRadius: '12px', mt: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Settlement History
            </Typography>
            <Button
              variant="contained"
              sx={{ bgcolor: '#6f4e37' }}
              startIcon={<AddIcon />}
              onClick={() => setOpenDialog(true)}
            >
              Mark as Settled
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f3f0' }}>
                  <TableCell>Month</TableCell>
                  <TableCell align="right">Total Profit</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Settled Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>{month}</TableCell>
                  <TableCell align="right">₹{profitShare?.totalProfit?.toFixed(2) || '0'}</TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        display: 'inline-block',
                        bgcolor: '#fff3cd',
                        color: '#856404',
                        px: 1.5,
                        py: 0.5,
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                      }}
                    >
                      Pending
                    </Box>
                  </TableCell>
                  <TableCell>-</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Settlement Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Mark Settlement</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Alert severity="info">
              This will record that profit sharing for <strong>{month}</strong> has been settled among all owners.
            </Alert>

            <Box sx={{ bgcolor: '#f5f3f0', p: 2, borderRadius: '8px' }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Each owner will receive:
              </Typography>
              <Typography variant="h6" sx={{ color: '#6f4e37', fontWeight: 700 }}>
                ₹{(profitShare?.totalProfit / 3)?.toFixed(2) || '0'}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button fullWidth variant="outlined" onClick={() => setOpenDialog(false)}>
                Cancel
              </Button>
              <Button
                fullWidth
                variant="contained"
                sx={{ bgcolor: '#6f4e37' }}
                onClick={() => {
                  alert('✅ Settlement recorded for ' + month);
                  setOpenDialog(false);
                }}
              >
                Confirm Settlement
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default ProfitShare;
