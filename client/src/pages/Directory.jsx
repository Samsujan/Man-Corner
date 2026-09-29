import React, { useEffect, useMemo, useState } from 'react';
import API from '../utils/api';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
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
  Tabs,
  Tab,
  Chip,
  IconButton,
  InputAdornment,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CallIcon from '@mui/icons-material/Call';
import EmailIcon from '@mui/icons-material/Email';
import ContactsIcon from '@mui/icons-material/Contacts';

const contactTypes = ['Supplier', 'Staff', 'Customer', 'Other'];
const typeColors = {
  Supplier: { bgcolor: '#fdebd0', color: '#9a6b0d' },
  Staff: { bgcolor: '#d4e6f1', color: '#1a5276' },
  Customer: { bgcolor: '#d5f5e3', color: '#1e8449' },
  Other: { bgcolor: '#eaecee', color: '#566573' },
};
const emptyForm = { name: '', type: 'Supplier', phone: '', email: '', notes: '' };

const Directory = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState('All');
  const [search, setSearch] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchContacts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const response = await API.get('/contacts');
      setContacts(response.data);
    } catch (requestError) {
      console.error('Failed to fetch contacts:', requestError);
    } finally {
      setLoading(false);
    }
  };

  const visibleContacts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return contacts.filter((contact) => {
      const matchesType = activeType === 'All' || contact.type === activeType;
      const matchesSearch =
        !term ||
        contact.name?.toLowerCase().includes(term) ||
        contact.phone?.toLowerCase().includes(term) ||
        contact.email?.toLowerCase().includes(term);
      return matchesType && matchesSearch;
    });
  }, [contacts, activeType, search]);

  const openAddDialog = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setError('');
    setOpenDialog(true);
  };

  const openEditDialog = (contact) => {
    setEditingId(contact._id);
    setFormData({
      name: contact.name || '',
      type: contact.type || 'Supplier',
      phone: contact.phone || '',
      email: contact.email || '',
      notes: contact.notes || '',
    });
    setError('');
    setOpenDialog(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSave = async () => {
    setError('');
    try {
      if (editingId) {
        await API.put(`/contacts/${editingId}`, formData);
      } else {
        await API.post('/contacts', formData);
      }
      setOpenDialog(false);
      fetchContacts();
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Could not save contact');
    }
  };

  const handleDelete = async (contact) => {
    if (!window.confirm(`Remove ${contact.name} from the directory?`)) return;
    try {
      await API.delete(`/contacts/${contact._id}`);
      fetchContacts();
    } catch (requestError) {
      alert(requestError.response?.data?.error || 'Could not delete contact');
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
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          p: { xs: 2.5, sm: 3.5 },
          flexWrap: 'wrap',
          gap: 2,
          borderRadius: 5,
          background: 'linear-gradient(115deg, rgba(104,70,47,0.09) 0%, rgba(200,154,98,0.14) 100%)',
          border: '1px solid rgba(104,70,47,0.09)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              display: 'grid',
              placeItems: 'center',
              width: 58,
              height: 58,
              borderRadius: '19px',
              color: '#68462f',
              bgcolor: 'rgba(255,253,250,0.8)',
              boxShadow: '0 7px 18px rgba(57,39,25,0.08)',
            }}
          >
            <ContactsIcon sx={{ fontSize: 29 }} />
          </Box>
          <Box>
            <Typography variant="overline" sx={{ color: '#a17851', fontWeight: 700, letterSpacing: '0.14em' }}>
              YOUR CAFE NETWORK
            </Typography>
            <Typography
              variant="h3"
              sx={{ fontFamily: "'Playfair Display', serif", color: '#503622', fontWeight: 700, lineHeight: 1.05 }}
            >
              Directory
            </Typography>
            <Typography variant="body2" sx={{ color: '#82766a', mt: 0.5 }}>
              {contacts.length} {contacts.length === 1 ? 'contact' : 'contacts'} saved
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          sx={{ bgcolor: '#68462f', px: 2.25, '&:hover': { bgcolor: '#503622' } }}
          startIcon={<AddIcon />}
          onClick={openAddDialog}
        >
          Add Contact
        </Button>
      </Box>

      <Card sx={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(111, 78, 55, 0.08)' }}>
        <CardContent>
          <TextField
            fullWidth
            size="small"
            placeholder="Search by name, phone, or email…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: '#a08670' }} />
                </InputAdornment>
              ),
            }}
          />

          <Tabs
            value={activeType}
            onChange={(event, value) => setActiveType(value)}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              mb: 2,
              minHeight: 36,
              '& .MuiTab-root': {
                minHeight: 36,
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: '20px',
                mr: 1,
                color: '#6f4e37',
              },
              '& .Mui-selected': { bgcolor: '#6f4e37', color: '#fff !important' },
              '& .MuiTabs-indicator': { display: 'none' },
            }}
          >
            <Tab value="All" label="All" />
            {contactTypes.map((type) => (
              <Tab key={type} value={type} label={type} />
            ))}
          </Tabs>

          <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #eee2d8' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f3f0' }}>
                  <TableCell>Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Notes</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visibleContacts.map((contact) => (
                  <TableRow key={contact._id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{contact.name}</TableCell>
                    <TableCell>
                      <Chip size="small" label={contact.type} sx={typeColors[contact.type] || typeColors.Other} />
                    </TableCell>
                    <TableCell>
                      {contact.phone && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.3 }}>
                          <CallIcon fontSize="inherit" sx={{ color: '#888' }} />
                          <Typography variant="body2">{contact.phone}</Typography>
                        </Box>
                      )}
                      {contact.email && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <EmailIcon fontSize="inherit" sx={{ color: '#888' }} />
                          <Typography variant="body2">{contact.email}</Typography>
                        </Box>
                      )}
                      {!contact.phone && !contact.email && '—'}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#777' }}>
                        {contact.notes || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => openEditDialog(contact)}>
                        <EditIcon fontSize="small" sx={{ color: '#6f4e37' }} />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(contact)}>
                        <DeleteOutlineIcon fontSize="small" color="error" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {visibleContacts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">No contacts found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle>{editingId ? 'Edit Contact' : 'Add Contact'}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {error && <Alert severity="error">{error}</Alert>}

            <TextField
              fullWidth
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />

            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select name="type" value={formData.type} onChange={handleChange} label="Type">
                {contactTypes.map((type) => (
                  <MenuItem key={type} value={type}>{type}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="e.g., +91 98765 43210"
            />

            <TextField
              fullWidth
              label="Email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="optional"
            />

            <TextField
              fullWidth
              label="Notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              multiline
              minRows={2}
              placeholder="Anything worth remembering about this contact"
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button fullWidth variant="outlined" onClick={() => setOpenDialog(false)}>
                Cancel
              </Button>
              <Button
                fullWidth
                variant="contained"
                sx={{ bgcolor: '#6f4e37' }}
                onClick={handleSave}
                disabled={!formData.name.trim()}
              >
                {editingId ? 'Save Changes' : 'Add Contact'}
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default Directory;
