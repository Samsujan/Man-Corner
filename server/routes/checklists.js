const express = require('express');
const supabase = require('../lib/supabase');
const authMiddleware = require('../middleware/auth');
const router = express.Router();
const cadences = new Set(['daily', 'weekly']);

const requireOwner = (req, res) => {
  if (req.user.role === 'owner') return true;
  res.status(403).json({ error: 'Only owners can manage cafe checklists' });
  return false;
};

const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime());

router.get('/', authMiddleware, async (req, res) => {
  if (!requireOwner(req, res)) return;
  const { cadence, date } = req.query;
  if (!cadences.has(cadence) || !validDate(date)) {
    return res.status(400).json({ error: 'A valid cadence and checklist date are required' });
  }

  try {
    const [{ data: tasks, error: taskError }, { data: checks, error: checkError }] = await Promise.all([
      supabase.from('mc_checklist_tasks').select('id, title, category, cadence, sort_order, notes')
        .eq('cadence', cadence).eq('active', true).order('sort_order').order('title'),
      supabase.from('mc_checklist_checks').select('task_id, completed, completed_at')
        .eq('checklist_date', date)
    ]);
    if (taskError) throw taskError;
    if (checkError) throw checkError;
    const checksByTask = new Map(checks.map(check => [check.task_id, check]));
    res.json(tasks.map(task => ({
      ...task,
      completed: checksByTask.get(task.id)?.completed || false,
      completedAt: checksByTask.get(task.id)?.completed_at || null
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  if (!requireOwner(req, res)) return;
  const { taskId, date, completed } = req.body;
  if (typeof taskId !== 'string' || !validDate(date) || typeof completed !== 'boolean') {
    return res.status(400).json({ error: 'Valid task, date, and completion state are required' });
  }

  try {
    const { data: task, error: taskError } = await supabase.from('mc_checklist_tasks')
      .select('id').eq('id', taskId).eq('active', true).maybeSingle();
    if (taskError) throw taskError;
    if (!task) return res.status(404).json({ error: 'Checklist item not found' });
    const { data, error } = await supabase.from('mc_checklist_checks').upsert({
      task_id: taskId,
      checklist_date: date,
      completed,
      completed_by: completed ? req.user.id : null,
      completed_at: completed ? new Date().toISOString() : null
    }, { onConflict: 'task_id,checklist_date' }).select('*').single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/tasks', authMiddleware, async (req, res) => {
  if (!requireOwner(req, res)) return;
  const { title, cadence, category = 'Miscellaneous', notes = '' } = req.body;
  if (typeof title !== 'string' || !title.trim() || !cadences.has(cadence) ||
      typeof category !== 'string' || !category.trim() || typeof notes !== 'string') {
    return res.status(400).json({ error: 'A title, cadence, category, and valid notes are required' });
  }

  try {
    const { count, error: countError } = await supabase.from('mc_checklist_tasks')
      .select('id', { count: 'exact', head: true }).eq('cadence', cadence);
    if (countError) throw countError;
    const { data, error } = await supabase.from('mc_checklist_tasks').insert({
      title: title.trim(),
      cadence,
      category: category.trim(),
      notes: notes.trim() || null,
      sort_order: (count || 0) + 1,
      created_by: req.user.id
    }).select('id, title, category, cadence, sort_order, notes').single();
    if (error) throw error;
    res.status(201).json({ ...data, completed: false, completedAt: null });
  } catch (error) {
    res.status(error.code === '23505' ? 409 : 400).json({
      error: error.code === '23505' ? 'That checklist item already exists' : error.message
    });
  }
});

router.delete('/tasks/:id', authMiddleware, async (req, res) => {
  if (!requireOwner(req, res)) return;
  try {
    const { data, error } = await supabase.from('mc_checklist_tasks')
      .update({ active: false }).eq('id', req.params.id).select('id').maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Checklist item not found' });
    res.json({ message: 'Checklist item removed' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;