import React, { useCallback, useEffect, useState } from 'react';
import API from '../utils/api';
import {
  Alert, Box, Button, CircularProgress, Container, Grid, Paper, Stack, Tab, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Tabs, TextField, Typography,
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';

const localDate = (date = new Date()) => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};
const money = (value) => `₹${Number(value || 0).toFixed(2)}`;

const SummaryCard = ({ label, value }) => (
  <Paper variant="outlined" sx={{ p: 2 }}>
    <Typography variant="caption" color="text.secondary">{label}</Typography>
    <Typography variant="h5" sx={{ fontWeight: 700, color: '#503622' }}>{value}</Typography>
  </Paper>
);

const DailySales = () => {
  const [date, setDate] = useState(() => localDate());
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      setReport((await API.get('/reports/daily-sales', { params: { date } })).data);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Could not load sales.');
    }
  }, [date]);

  useEffect(() => { load(); }, [load]);

  return (
    <Box>
      <Stack className="report-no-print" direction="row" spacing={1} sx={{ mb: 2 }}>
        <TextField size="small" type="date" label="Sales date" value={date} InputLabelProps={{ shrink: true }}
          inputProps={{ max: localDate() }} onChange={(event) => event.target.value && setDate(event.target.value)} />
        <Button variant="outlined" startIcon={<PrintIcon />} onClick={() => window.print()}>Print</Button>
      </Stack>
      {error && <Alert severity="error">{error}</Alert>}
      {!report && !error && <CircularProgress />}
      {report && (
        <>
          <Typography variant="h6" sx={{ mb: 1 }}>Sales on {report.date}</Typography>
          <Grid container spacing={1.5} sx={{ mb: 2 }}>
            <Grid item xs={6} md={3}><SummaryCard label="Total revenue (incl. parcel)" value={money(report.totalRevenue)} /></Grid>
            <Grid item xs={6} md={3}><SummaryCard label="Food sales (incl. GST)" value={money(report.foodSales)} /></Grid>
            <Grid item xs={6} md={3}><SummaryCard label="Parcel charges" value={money(report.parcelCharges)} /></Grid>
            <Grid item xs={6} md={3}><SummaryCard label="GST included" value={money(report.gst)} /></Grid>
            <Grid item xs={6} md={3}><SummaryCard label="Bills" value={report.billCount} /></Grid>
            <Grid item xs={6} md={3}><SummaryCard label="Cancelled orders" value={report.cancelledCount} /></Grid>
            {Object.entries(report.byPayment).map(([method, amount]) => (
              <Grid item xs={6} md={3} key={method}><SummaryCard label={method} value={money(amount)} /></Grid>
            ))}
          </Grid>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Items sold</Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
            <Table size="small">
              <TableHead><TableRow><TableCell>Item</TableCell><TableCell>Service</TableCell><TableCell align="right">Qty</TableCell><TableCell align="right">Amount</TableCell></TableRow></TableHead>
              <TableBody>
                {report.items.map((item) => (
                  <TableRow key={`${item.name}-${item.serviceType}`}>
                    <TableCell>{item.name}</TableCell><TableCell>{item.serviceType}</TableCell>
                    <TableCell align="right">{item.quantity}</TableCell><TableCell align="right">{money(item.amount)}</TableCell>
                  </TableRow>
                ))}
                {report.items.length === 0 && <TableRow><TableCell colSpan={4}>No sales on this day.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Bills</Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead><TableRow><TableCell>Token</TableCell><TableCell>Time</TableCell><TableCell>Order</TableCell><TableCell>Payment</TableCell><TableCell align="right">Parcel</TableCell><TableCell align="right">Total</TableCell></TableRow></TableHead>
              <TableBody>
                {report.bills.map((bill) => (
                  <TableRow key={bill.id}>
                    <TableCell>{bill.tokenNumber || '—'}</TableCell>
                    <TableCell>{new Date(bill.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</TableCell>
                    <TableCell>{bill.tableNumber ? `Table ${bill.tableNumber}` : bill.customerName ? `Parcel · ${bill.customerName}` : 'Walk-in'}</TableCell>
                    <TableCell>{bill.paymentMethod}</TableCell>
                    <TableCell align="right">{money(bill.parcelCharge)}</TableCell>
                    <TableCell align="right">{money(bill.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
};

const unitLabels = { kg: 'By weight (kg)', L: 'By volume (litres)', pcs: 'By quantity (pieces)' };

const GroceryList = () => {
  const [endDate, setEndDate] = useState(() => localDate());
  const [buffer, setBuffer] = useState(10);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      setReport((await API.get('/reports/grocery-requirements', { params: { endDate, days: 7, bufferPercent: buffer } })).data);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Could not load grocery list.');
    }
  }, [endDate, buffer]);

  useEffect(() => { load(); }, [load]);

  return (
    <Box>
      <Stack className="report-no-print" direction="row" spacing={1} sx={{ mb: 2 }}>
        <TextField size="small" type="date" label="Week ending" value={endDate} InputLabelProps={{ shrink: true }}
          inputProps={{ max: localDate() }} onChange={(event) => event.target.value && setEndDate(event.target.value)} />
        <TextField size="small" type="number" label="Buffer %" value={buffer} sx={{ width: 100 }}
          inputProps={{ min: 0, max: 100 }} onChange={(event) => setBuffer(Math.min(100, Math.max(0, Number(event.target.value) || 0)))} />
        <Button variant="outlined" startIcon={<PrintIcon />} onClick={() => window.print()}>Print</Button>
      </Stack>
      {error && <Alert severity="error">{error}</Alert>}
      {!report && !error && <CircularProgress />}
      {report && (
        <>
          <Typography variant="h6">Grocery checklist · {report.startDate} to {report.endDate}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Based on {report.billCount} bills sold. Quantities are estimates per portion plus {report.bufferPercent}% buffer.
          </Typography>
          {['kg', 'L', 'pcs'].map((unit) => {
            const rows = report.groceries.filter((row) => row.unit === unit);
            if (!rows.length) return null;
            return (
              <Box key={unit} sx={{ mb: 2, breakInside: 'avoid' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{unitLabels[unit]}</Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead><TableRow><TableCell width={40}>✓</TableCell><TableCell>Item</TableCell><TableCell align="right">Used last week</TableCell><TableCell align="right">To buy</TableCell><TableCell>Used for</TableCell></TableRow></TableHead>
                    <TableBody>
                      {rows.map((row) => (
                        <TableRow key={row.name}>
                          <TableCell>☐</TableCell>
                          <TableCell>{row.name}</TableCell>
                          <TableCell align="right">{row.required} {unit}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>{row.toBuy} {unit}</TableCell>
                          <TableCell sx={{ fontSize: '0.75rem' }}>{row.usedBy.join(', ')}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            );
          })}
          {report.groceries.length === 0 && <Alert severity="info">No sales found in this week.</Alert>}
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Items sold</Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead><TableRow><TableCell>Item</TableCell><TableCell align="right">Qty sold</TableCell></TableRow></TableHead>
              <TableBody>
                {report.itemsSold.map((item) => (
                  <TableRow key={item.name}><TableCell>{item.name}</TableCell><TableCell align="right">{item.quantity}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {report.unmatched.length > 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>No grocery estimate for: {report.unmatched.join(', ')}</Alert>
          )}
        </>
      )}
    </Box>
  );
};

const SalesReports = () => {
  const [tab, setTab] = useState('sales');
  return (
    <Container maxWidth="lg" className="report-print" sx={{ py: 4 }}>
      <style>{`
        @media print {
          @page { margin: 12mm; }
          body * { visibility: hidden !important; }
          .report-print, .report-print * { visibility: visible !important; }
          .report-print { position: absolute !important; inset: 0 !important; width: 100% !important; max-width: none !important; padding: 0 !important; margin: 0 !important; }
          .report-no-print { display: none !important; }
        }
      `}</style>
      <Typography variant="h3" sx={{ fontFamily: "'Playfair Display', serif", color: '#503622', fontWeight: 700, mb: 2 }}>
        Sales & Groceries
      </Typography>
      <Tabs className="report-no-print" value={tab} onChange={(event, value) => setTab(value)} sx={{ mb: 2 }}>
        <Tab value="sales" label="Daily sales" />
        <Tab value="groceries" label="Weekly grocery list" />
      </Tabs>
      {tab === 'sales' ? <DailySales /> : <GroceryList />}
    </Container>
  );
};

export default SalesReports;
