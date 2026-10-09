import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import API from '../utils/api';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Container,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  LinearProgress,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DownloadIcon from '@mui/icons-material/Download';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import PrintIcon from '@mui/icons-material/Print';

const getLocalDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getChecklistDate = (cadence) => {
  const date = new Date();
  if (cadence === 'weekly') {
    const daysFromMonday = (date.getDay() + 6) % 7;
    date.setDate(date.getDate() - daysFromMonday);
  }
  return getLocalDate(date);
};

const csvCell = (value) => {
  let text = String(value ?? '');
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};

const CafeChecklists = () => {
  const { user } = useSelector((state) => state.auth);
  const [cadence, setCadence] = useState('daily');
  const checklistDate = useMemo(() => getChecklistDate(cadence), [cadence]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingTask, setSavingTask] = useState('');
  const [error, setError] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskCategory, setTaskCategory] = useState('Ingredients');
  const [taskNotes, setTaskNotes] = useState('');
  const [adding, setAdding] = useState(false);

  const fetchTasks = useCallback(async () => {
    setError('');
    try {
      const response = await API.get('/checklists', { params: { cadence, date: checklistDate } });
      setTasks(response.data);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Checklist could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [cadence, checklistDate]);

  useEffect(() => {
    setLoading(true);
    fetchTasks();
  }, [fetchTasks]);

  const toggleTask = async (task) => {
    setSavingTask(task.id);
    setError('');
    try {
      await API.post('/checklists', {
        taskId: task.id,
        date: checklistDate,
        completed: !task.completed,
      });
      setTasks((current) => current.map((item) => (
        item.id === task.id ? { ...item, completed: !task.completed } : item
      )));
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Could not update checklist item.');
    } finally {
      setSavingTask('');
    }
  };

  const addTask = async (event) => {
    event.preventDefault();
    if (!taskTitle.trim()) return;
    setAdding(true);
    setError('');
    try {
      await API.post('/checklists/tasks', {
        title: taskTitle.trim(), cadence, category: taskCategory, notes: taskNotes.trim(),
      });
      setTaskTitle('');
      setTaskNotes('');
      await fetchTasks();
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Could not add checklist item.');
    } finally {
      setAdding(false);
    }
  };

  const removeTask = async (task) => {
    if (!window.confirm(`Remove “${task.title}” from the ${cadence} checklist?`)) return;
    setError('');
    try {
      await API.delete(`/checklists/tasks/${task.id}`);
      setTasks((current) => current.filter((item) => item.id !== task.id));
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Could not remove checklist item.');
    }
  };

  const downloadChecklist = () => {
    const rows = [
      ['Cadence', 'Period starting', 'Category', 'Ingredient / item', 'Menu use / notes', 'Stock / quantity', 'Complete'],
      ...tasks.map((task) => [cadence, checklistDate, task.category, task.title, task.notes || '', '', task.completed ? 'Yes' : 'No']),
    ];
    const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(',')).join('\r\n')}`;
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `mana-corner-${cadence}-checklist-${checklistDate}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const completedCount = tasks.filter((task) => task.completed).length;
  const progress = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;
  const groupedTasks = useMemo(() => {
    const groups = new Map();
    tasks.forEach((task) => {
      if (!groups.has(task.category)) groups.set(task.category, []);
      groups.get(task.category).push(task);
    });
    return [...groups.entries()];
  }, [tasks]);

  if (user?.role !== 'owner') {
    return <Container sx={{ mt: 5 }}><Alert severity="warning">Only owners can access cafe checklists.</Alert></Container>;
  }

  return (
    <Container maxWidth="lg" className="cafe-checklist-print" sx={{ py: 4 }}>
      <style>{`
        @media print {
          @page { margin: 12mm; }
          body * { visibility: hidden !important; }
          .cafe-checklist-print, .cafe-checklist-print * { visibility: visible !important; }
          .cafe-checklist-print { position: absolute !important; inset: 0 !important; width: 100% !important; max-width: none !important; padding: 0 !important; margin: 0 !important; }
          .cafe-checklist-no-print { display: none !important; }
          .cafe-checklist-print .MuiListItem-root { break-inside: avoid; border-bottom: 1px solid #aaa !important; }
          .cafe-checklist-print .MuiListItemButton-root { padding: 3px 0 !important; min-height: 32px !important; }
          .cafe-checklist-print .MuiListItemText-primary { font-size: 10pt !important; }
          .cafe-checklist-print .MuiListItemText-secondary { font-size: 8pt !important; color: #444 !important; }
          .cafe-checklist-print .MuiCheckbox-root { color: #222 !important; padding: 4px !important; }
        }
      `}</style>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 2, flexWrap: 'wrap', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FactCheckIcon sx={{ color: '#247f78', fontSize: 34 }} />
          <Box>
            <Typography variant="overline" sx={{ color: '#247f78', fontWeight: 700 }}>CAFE OPERATIONS</Typography>
            <Typography variant="h3" sx={{ fontFamily: "'Playfair Display', serif", color: '#503622', fontWeight: 700 }}>
              Checklists
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {cadence === 'daily' ? `Today · ${checklistDate}` : `Week starting · ${checklistDate}`}
            </Typography>
          </Box>
        </Box>
        <Stack className="cafe-checklist-no-print" direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<PrintIcon />} onClick={() => window.print()} disabled={!tasks.length}>
            Print
          </Button>
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={downloadChecklist} disabled={!tasks.length}>
            Download CSV
          </Button>
        </Stack>
      </Box>

      <Tabs
        className="cafe-checklist-no-print"
        value={cadence}
        onChange={(event, value) => setCadence(value)}
        sx={{ borderBottom: '1px solid #e8e0d8', mb: 2, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } }}
      >
        <Tab value="daily" label="Daily" />
        <Tab value="weekly" label="Weekly" />
      </Tabs>

      <Box className="cafe-checklist-no-print" sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <LinearProgress variant="determinate" value={progress} sx={{ flex: 1, height: 8, borderRadius: 4 }} />
        <Typography variant="body2" sx={{ minWidth: 94, textAlign: 'right', fontWeight: 700 }}>
          {completedCount} / {tasks.length} done
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Box className="cafe-checklist-no-print" component="form" onSubmit={addTask} sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
        <TextField
          size="small"
          label="Add checklist item"
          value={taskTitle}
          onChange={(event) => setTaskTitle(event.target.value)}
          sx={{ flex: '1 1 260px' }}
        />
        <FormControl size="small" sx={{ minWidth: 170 }}>
          <InputLabel>Category</InputLabel>
          <Select value={taskCategory} label="Category" onChange={(event) => setTaskCategory(event.target.value)}>
            {['Ingredients', 'Inventory · Protein', 'Inventory · Dairy', 'Inventory · Dairy and protein', 'Inventory · Dairy and condiments', 'Inventory · Bakery', 'Inventory · Produce', 'Inventory · Staples', 'Inventory · Cooking essentials', 'Inventory · Seasoning', 'Inventory · Beverages', 'Inventory · Frozen', 'Inventory · Packaging', 'Inventory · Weekly count', 'Preparation', 'Food safety', 'Cleaning', 'Packaging', 'Safety', 'Equipment', 'Purchasing', 'Cash and admin', 'Miscellaneous']
              .map((category) => <MenuItem key={category} value={category}>{category}</MenuItem>)}
          </Select>
        </FormControl>
        <TextField
          size="small"
          label="Menu use / notes"
          value={taskNotes}
          onChange={(event) => setTaskNotes(event.target.value)}
          sx={{ flex: '1 1 220px' }}
        />
        <Button type="submit" variant="contained" startIcon={<AddIcon />} disabled={adding || !taskTitle.trim()} sx={{ bgcolor: '#68462f' }}>
          Add item
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 7 }}><CircularProgress /></Box>
      ) : tasks.length === 0 ? (
        <Alert severity="info">No items in this checklist yet.</Alert>
      ) : (
        <Stack spacing={3}>
          {groupedTasks.map(([category, categoryTasks]) => (
            <Box component="section" key={category}>
              <Typography variant="h6" sx={{ color: '#503622', fontWeight: 700, mb: 0.5 }}>{category}</Typography>
              <Divider />
              <List disablePadding>
                {categoryTasks.map((task) => (
                  <ListItem
                    key={task.id}
                    disablePadding
                    secondaryAction={(
                      <Tooltip title="Remove checklist item">
                        <IconButton edge="end" size="small" aria-label={`Remove ${task.title}`} onClick={() => removeTask(task)}>
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    sx={{ borderBottom: '1px solid #eee7df', pr: 6 }}
                  >
                    <ListItemButton onClick={() => toggleTask(task)} disabled={savingTask === task.id} dense>
                      <ListItemIcon sx={{ minWidth: 42 }}>
                        <Checkbox edge="start" checked={task.completed} tabIndex={-1} disableRipple />
                      </ListItemIcon>
                      <ListItemText
                        primary={task.title}
                        secondary={task.notes || undefined}
                        primaryTypographyProps={{ sx: { textDecoration: task.completed ? 'line-through' : 'none', color: task.completed ? 'text.secondary' : 'text.primary' } }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Box>
          ))}
        </Stack>
      )}
    </Container>
  );
};

export default CafeChecklists;