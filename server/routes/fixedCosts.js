const express = require('express');
const supabase = require('../lib/supabase');
const authMiddleware = require('../middleware/auth');
const allowedCategories = require('../constants/expenseCategories');
const router = express.Router();

const requireOwner = (req, res) => {
  if (req.user.role === 'owner') return true;
  res.status(403).json({ error: 'Only owners can manage fixed costs' });
  return false;
};

const formatFixedCost = row => ({ ...row, _id: row.id, amount: Number(row.amount) });

// First day of the current month (UTC) — used as the key that ties a fixed
// cost to that month's auto-generated expense row.
const currentCostMonth = () => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().split('T')[0];
};

// Creates or updates the current month's expense entry for a fixed cost so
// the amount flows into Expenses/P&L without creating duplicate rows.
const syncMonthlyExpense = async (fixedCost, userId) => {
  const costMonth = currentCostMonth();
  const amount = Number(fixedCost.amount);

  const { data: existing, error: findError } = await supabase
    .from('mc_expenses')
    .select('id')
    .eq('fixed_cost_id', fixedCost.id)
    .eq('cost_month', costMonth)
    .maybeSingle();
  if (findError) throw findError;

  if (amount <= 0) {
    if (existing) {
      const { error } = await supabase.from('mc_expenses').delete().eq('id', existing.id);
      if (error) throw error;
    }
    return;
  }

  if (existing) {
    const { error } = await supabase
      .from('mc_expenses')
      .update({ amount, description: fixedCost.name, category: fixedCost.category })
      .eq('id', existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('mc_expenses').insert({
      description: fixedCost.name,
      category: fixedCost.category,
      amount,
      date: new Date().toISOString(),
      payment_method: 'Online',
      created_by: userId,
      fixed_cost_id: fixedCost.id,
      cost_month: costMonth
    });
    if (error) throw error;
  }
};

router.get('/', authMiddleware, async (req, res) => {
  if (!requireOwner(req, res)) return;
  try {
    const { data, error } = await supabase
      .from('mc_fixed_costs')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) throw error;
    res.json(data.map(formatFixedCost));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  if (!requireOwner(req, res)) return;
  try {
    const { name, category, amount } = req.body;
    if (typeof name !== 'string' || !name.trim() ||
        !allowedCategories.includes(category) ||
        !Number.isFinite(Number(amount)) || Number(amount) < 0) {
      return res.status(400).json({ error: 'Valid name, category, and amount are required' });
    }

    const { data, error } = await supabase
      .from('mc_fixed_costs')
      .insert({ name: name.trim(), category, amount: Number(amount) })
      .select('*')
      .single();
    if (error) throw error;
    await syncMonthlyExpense(data, req.user.id);
    res.status(201).json(formatFixedCost(data));
  } catch (error) {
    const duplicate = error.code === '23505';
    res.status(duplicate ? 409 : 400).json({
      error: duplicate ? 'A fixed cost with this name already exists' : error.message
    });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  if (!requireOwner(req, res)) return;
  try {
    const updates = {};
    const { amount, category, active } = req.body;
    if (amount !== undefined) {
      if (!Number.isFinite(Number(amount)) || Number(amount) < 0) {
        return res.status(400).json({ error: 'Amount must be a non-negative number' });
      }
      updates.amount = Number(amount);
    }
    if (category !== undefined) {
      if (!allowedCategories.includes(category)) {
        return res.status(400).json({ error: `Category must be one of: ${allowedCategories.join(', ')}` });
      }
      updates.category = category;
    }
    if (active !== undefined) {
      updates.active = Boolean(active);
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'Provide at least one field to update' });
    }
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('mc_fixed_costs')
      .update(updates)
      .eq('id', req.params.id)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Fixed cost not found' });

    if (data.active) {
      await syncMonthlyExpense(data, req.user.id);
    }
    res.json(formatFixedCost(data));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  if (!requireOwner(req, res)) return;
  try {
    const { data, error } = await supabase
      .from('mc_fixed_costs')
      .delete()
      .eq('id', req.params.id)
      .select('id')
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Fixed cost not found' });
    res.json({ message: 'Fixed cost deleted' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
