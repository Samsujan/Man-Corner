const express = require('express');
const supabase = require('../lib/supabase');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

const allowedTypes = ['Supplier', 'Staff', 'Customer', 'Other'];
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const formatContact = contact => ({ ...contact, _id: contact.id });

const validateContactBody = (body, { partial = false } = {}) => {
  const { name, type, phone, email, notes } = body;
  const updates = {};

  if (!partial || name !== undefined) {
    if (typeof name !== 'string' || !name.trim()) {
      return { error: 'A contact name is required' };
    }
    updates.name = name.trim();
  }
  if (!partial || type !== undefined) {
    if (!allowedTypes.includes(type)) {
      return { error: `Type must be one of: ${allowedTypes.join(', ')}` };
    }
    updates.type = type;
  }
  if (phone !== undefined) {
    if (phone && typeof phone !== 'string') return { error: 'Phone must be text' };
    updates.phone = phone ? phone.trim() : null;
  }
  if (email !== undefined) {
    if (email && (typeof email !== 'string' || !emailPattern.test(email.trim()))) {
      return { error: 'Provide a valid email or leave it blank' };
    }
    updates.email = email ? email.trim().toLowerCase() : null;
  }
  if (notes !== undefined) {
    if (notes && typeof notes !== 'string') return { error: 'Notes must be text' };
    updates.notes = notes ? notes.trim() : null;
  }
  return { updates };
};

// Directory is shared by owners and billing (guest) accounts alike.
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { type, search } = req.query;
    let query = supabase.from('mc_contacts').select('*');
    if (type) {
      if (!allowedTypes.includes(type)) return res.status(400).json({ error: 'Invalid type filter' });
      query = query.eq('type', type);
    }
    if (search && typeof search === 'string' && search.trim()) {
      const term = search.trim().replace(/[%_]/g, match => `\\${match}`);
      query = query.or(`name.ilike.%${term}%,phone.ilike.%${term}%,email.ilike.%${term}%`);
    }
    const { data, error } = await query.order('name', { ascending: true });
    if (error) throw error;
    res.json(data.map(formatContact));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { error: validationError, updates } = validateContactBody(req.body);
    if (validationError) return res.status(400).json({ error: validationError });

    const { data, error } = await supabase
      .from('mc_contacts')
      .insert({ ...updates, created_by: req.user.id })
      .select('*')
      .single();
    if (error) throw error;
    res.status(201).json(formatContact(data));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { error: validationError, updates } = validateContactBody(req.body, { partial: true });
    if (validationError) return res.status(400).json({ error: validationError });
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'Provide at least one field to update' });
    }
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('mc_contacts')
      .update(updates)
      .eq('id', req.params.id)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Contact not found' });
    res.json(formatContact(data));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('mc_contacts')
      .delete()
      .eq('id', req.params.id)
      .select('id')
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Contact not found' });
    res.json({ message: 'Contact deleted' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
