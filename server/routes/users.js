const express = require('express');
const supabase = require('../lib/supabase');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

const ownerPermissions = {
  billing: true,
  expenses: true,
  analytics: true,
  users: true,
  profitShare: true
};
const guestPermissions = {
  billing: true,
  expenses: false,
  analytics: false,
  users: false,
  profitShare: false
};
const formatUser = user => ({ ...user, _id: user.id });

const requireOwner = (req, res) => {
  if (req.user.role === 'owner') return true;
  res.status(403).json({ error: 'Only owners can manage users' });
  return false;
};

router.get('/', authMiddleware, async (req, res) => {
  if (!requireOwner(req, res)) return;

  try {
    const { data, error } = await supabase
      .from('mc_users')
      .select('id, name, email, role, permissions, created_at')
      .order('created_at', { ascending: true });
    if (error) throw error;
    res.json(data.map(formatUser));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  if (!requireOwner(req, res)) return;

  try {
    const updates = {};
    const { name, email, role } = req.body;
    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ error: 'Name cannot be empty' });
      }
      updates.name = name.trim();
    }
    if (email !== undefined) {
      if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        return res.status(400).json({ error: 'A valid email is required' });
      }
      updates.email = email.trim().toLowerCase();
    }
    if (role !== undefined) {
      if (!['owner', 'guest'].includes(role)) {
        return res.status(400).json({ error: 'Role must be owner or guest' });
      }
      if (role === 'guest' && req.params.id === req.user.id) {
        return res.status(409).json({ error: 'You cannot remove your own owner access' });
      }
      updates.role = role;
      updates.permissions = role === 'owner' ? ownerPermissions : guestPermissions;
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'Provide at least one supported field to update' });
    }

    if (role === 'guest') {
      const { data: target, error: targetError } = await supabase
        .from('mc_users')
        .select('id, role')
        .eq('id', req.params.id)
        .maybeSingle();
      if (targetError) throw targetError;
      if (!target) return res.status(404).json({ error: 'User not found' });
      if (target.role === 'owner') {
        const { count, error: countError } = await supabase
          .from('mc_users')
          .select('id', { count: 'exact', head: true })
          .eq('role', 'owner');
        if (countError) throw countError;
        if (count <= 1) return res.status(409).json({ error: 'At least one owner account must remain' });
      }
    }

    const { data, error } = await supabase
      .from('mc_users')
      .update(updates)
      .eq('id', req.params.id)
      .select('id, name, email, role, permissions, created_at')
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'User not found' });
    res.json(formatUser(data));
  } catch (error) {
    const conflict = error.code === '23505' || error.code === 'P0001';
    res.status(conflict ? 409 : 400).json({
      error: error.code === '23505' ? 'An account with this email already exists' : error.message
    });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  if (!requireOwner(req, res)) return;

  try {
    const { data: target, error: targetError } = await supabase
      .from('mc_users')
      .select('id, role')
      .eq('id', req.params.id)
      .maybeSingle();
    if (targetError) throw targetError;
    if (!target) return res.status(404).json({ error: 'User not found' });
    if (target.id === req.user.id) {
      return res.status(409).json({ error: 'You cannot delete your own account' });
    }
    if (target.role === 'owner') {
      const { count, error: countError } = await supabase
        .from('mc_users')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'owner');
      if (countError) throw countError;
      if (count <= 1) return res.status(409).json({ error: 'At least one owner account must remain' });
    }

    const { error } = await supabase.from('mc_users').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(error.code === 'P0001' ? 409 : 400).json({ error: error.message });
  }
});

module.exports = router;
