const express = require('express');
const multer = require('multer');
const { randomUUID } = require('crypto');
const supabase = require('../lib/supabase');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

const bucketName = 'mana-corner-receipts';
const investmentCutoff = '2026-10-03T00:00:00.000Z';
const investmentManagerEmail = 'matamsamsujanp@gmail.com';
const allowedCategories = require('../constants/expenseCategories');
const allowedPaymentMethods = ['Cash', 'Card', 'UPI', 'Online'];
const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter(req, file, callback) {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return callback(new Error('Receipts must be a JPG, PNG, WEBP, or PDF file'));
    }
    callback(null, true);
  }
});

const requireOwner = (req, res) => {
  if (req.user.role === 'owner') return true;
  res.status(403).json({ error: 'Only owners can manage expenses' });
  return false;
};

const canManageInvestments = req =>
  req.user.role === 'owner' || req.user.email?.toLowerCase() === investmentManagerEmail;

const isInvestmentDate = date => new Date(date).toISOString() < investmentCutoff;

const requireInvestmentAccess = (req, res) => {
  if (canManageInvestments(req)) return true;
  res.status(403).json({ error: 'Only owners can manage investments' });
  return false;
};

const addSignedReceiptUrl = async expense => {
  const result = {
    ...expense,
    _id: expense.id,
    amount: Number(expense.amount),
    paymentMethod: expense.payment_method
  };
  if (expense.bill_screenshot) {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(expense.bill_screenshot, 60 * 60);
    if (error) throw error;
    result.billScreenshot = data.signedUrl;
  } else {
    result.billScreenshot = null;
  }
  return result;
};

const applyDateFilter = (query, startDate, endDate) => {
  if (startDate) query = query.gte('date', new Date(startDate).toISOString());
  if (endDate) {
    const end = new Date(endDate);
    if (/^\d{4}-\d{2}-\d{2}$/.test(endDate)) end.setUTCHours(23, 59, 59, 999);
    query = query.lte('date', end.toISOString());
  }
  return query;
};

router.post('/', authMiddleware, upload.single('billScreenshot'), async (req, res) => {
  if (req.user.role !== 'owner' && !canManageInvestments(req)) {
    return res.status(403).json({ error: 'Only owners can manage expenses' });
  }

  let uploadedPath;
  let expenseSaved = false;
  try {
    const { description, category, amount, date, paymentMethod = 'Cash' } = req.body;
    const expenseDate = new Date(date);
    if (typeof description !== 'string' || !description.trim() ||
        !allowedCategories.includes(category) ||
        !Number.isFinite(Number(amount)) || Number(amount) <= 0 ||
        Number.isNaN(expenseDate.getTime()) ||
        !allowedPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({ error: 'Valid description, category, amount, date, and payment method are required' });
    }
    const investment = isInvestmentDate(expenseDate);
    if (req.user.role !== 'owner' && !investment) {
      return res.status(403).json({ error: 'This account can only add investments dated on or before October 2, 2026' });
    }
    const ownerId = req.body.ownerId || (req.user.role === 'owner' ? req.user.id : null);
    if (!ownerId) return res.status(400).json({ error: 'Select a valid owner' });
    if (ownerId !== req.user.id && req.user.email?.toLowerCase() !== investmentManagerEmail) {
      return res.status(403).json({ error: 'You can only attribute entries to yourself' });
    }
    const { data: owner, error: ownerError } = await supabase
      .from('mc_users')
      .select('id')
      .eq('id', ownerId)
      .eq('role', 'owner')
      .maybeSingle();
    if (ownerError) throw ownerError;
    if (!owner) return res.status(400).json({ error: 'Select a valid owner' });

    if (req.file) {
      const extension = req.file.mimetype === 'application/pdf'
        ? 'pdf'
        : req.file.mimetype.split('/')[1];
      uploadedPath = `${req.user.id}/${randomUUID()}.${extension}`;
      const { error } = await supabase.storage
        .from(bucketName)
        .upload(uploadedPath, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false
        });
      if (error) throw error;
    }

    const { data, error } = await supabase
      .from('mc_expenses')
      .insert({
        description: description.trim(),
        category,
        amount: Number(amount),
        date: expenseDate.toISOString(),
        payment_method: paymentMethod,
        bill_screenshot: uploadedPath || null,
        created_by: req.user.id,
        owner_id: ownerId
      })
      .select('*')
      .single();
    if (error) throw error;
    uploadedPath = null;
    expenseSaved = true;
    res.status(201).json(await addSignedReceiptUrl(data));
  } catch (error) {
    if (uploadedPath) {
      const { error: cleanupError } = await supabase.storage.from(bucketName).remove([uploadedPath]);
      if (cleanupError) console.error('Failed to remove an unreferenced expense receipt:', cleanupError.message);
    }
    res.status(expenseSaved ? 500 : 400).json({
      error: expenseSaved
        ? 'Expense was saved, but its receipt link could not be generated. Refresh the expense list.'
        : error.message
    });
  }
});

router.get('/owners', authMiddleware, async (req, res) => {
  if (!requireInvestmentAccess(req, res)) return;
  try {
    const { data, error } = await supabase
      .from('mc_users')
      .select('id, name, email')
      .eq('role', 'owner')
      .order('created_at', { ascending: true });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/investments', authMiddleware, async (req, res) => {
  if (!requireInvestmentAccess(req, res)) return;
  try {
    const { data: expenses, error } = await supabase
      .from('mc_expenses')
      .select('*')
      .lt('date', investmentCutoff)
      .order('date', { ascending: false });
    if (error) throw error;
    const ownerIds = [...new Set(expenses.map(row => row.owner_id || row.created_by).filter(Boolean))];
    const { data: owners, error: ownersError } = ownerIds.length
      ? await supabase.from('mc_users').select('id, name').in('id', ownerIds)
      : { data: [], error: null };
    if (ownersError) throw ownersError;
    const ownersById = Object.fromEntries(owners.map(owner => [owner.id, owner]));
    res.json(await Promise.all(expenses.map(async row => ({
      ...await addSignedReceiptUrl(row),
      owner: ownersById[row.owner_id || row.created_by] || null
    }))));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/investments/:id', authMiddleware, async (req, res) => {
  if (!requireInvestmentAccess(req, res)) return;
  try {
    const { data: existing, error: findError } = await supabase
      .from('mc_expenses')
      .select('id, date, owner_id, created_by')
      .eq('id', req.params.id)
      .maybeSingle();
    if (findError) throw findError;
    if (!existing || !isInvestmentDate(existing.date)) {
      return res.status(404).json({ error: 'Investment not found' });
    }
    const existingOwnerId = existing.owner_id || existing.created_by;
    const canEditOthers = req.user.email?.toLowerCase() === investmentManagerEmail;
    if (req.user.role !== 'owner' && !canEditOthers) {
      return res.status(403).json({ error: 'Only owners can update investments' });
    }
    if (req.user.role === 'owner' && existingOwnerId !== req.user.id && !canEditOthers) {
      return res.status(403).json({ error: 'You can only update your own investments' });
    }

    const { description, category, amount, date, ownerId, paymentMethod } = req.body;
    const updates = {};
    if (description !== undefined) {
      if (typeof description !== 'string' || !description.trim()) {
        return res.status(400).json({ error: 'Description cannot be empty' });
      }
      updates.description = description.trim();
    }
    if (category !== undefined) {
      if (!allowedCategories.includes(category)) return res.status(400).json({ error: 'Invalid category' });
      updates.category = category;
    }
    if (amount !== undefined) {
      if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
        return res.status(400).json({ error: 'Amount must be greater than zero' });
      }
      updates.amount = Number(amount);
    }
    if (date !== undefined) {
      const investmentDate = new Date(date);
      if (Number.isNaN(investmentDate.getTime()) || !isInvestmentDate(investmentDate)) {
        return res.status(400).json({ error: 'Investment date must be on or before October 2, 2026' });
      }
      updates.date = investmentDate.toISOString();
    }
    if (paymentMethod !== undefined) {
      if (!allowedPaymentMethods.includes(paymentMethod)) return res.status(400).json({ error: 'Invalid payment method' });
      updates.payment_method = paymentMethod;
    }
    if (ownerId !== undefined) {
      if (!canEditOthers && ownerId !== req.user.id) {
        return res.status(403).json({ error: 'You can only attribute entries to yourself' });
      }
      const { data: owner, error: ownerError } = await supabase
        .from('mc_users').select('id').eq('id', ownerId).eq('role', 'owner').maybeSingle();
      if (ownerError) throw ownerError;
      if (!owner) return res.status(400).json({ error: 'Select a valid owner' });
      updates.owner_id = ownerId;
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'Provide at least one field to update' });
    }

    const { data, error } = await supabase
      .from('mc_expenses').update(updates).eq('id', req.params.id).select('*').single();
    if (error) throw error;
    const { data: owner, error: ownerError } = await supabase
      .from('mc_users').select('id, name').eq('id', data.owner_id || data.created_by).maybeSingle();
    if (ownerError) throw ownerError;
    res.json({ ...await addSignedReceiptUrl(data), owner: owner || null });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  if (!requireOwner(req, res)) return;

  try {
    const { startDate, endDate, category } = req.query;
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    if ((start && Number.isNaN(start.getTime())) || (end && Number.isNaN(end.getTime()))) {
      return res.status(400).json({ error: 'Date filters must be valid dates' });
    }
    if (start && end && start > end) {
      return res.status(400).json({ error: 'startDate must be before endDate' });
    }
    if (end && /^\d{4}-\d{2}-\d{2}$/.test(endDate)) end.setUTCHours(23, 59, 59, 999);
    let query = supabase.from('mc_expenses').select('*');
    query = applyDateFilter(query, start && start.toISOString(), end && end.toISOString());
    if (category) query = query.eq('category', category);
    const { data: expenses, error } = await query.order('date', { ascending: false });
    if (error) throw error;

    const creatorIds = [...new Set(expenses.map(expense => expense.created_by).filter(Boolean))];
    const { data: users, error: usersError } = creatorIds.length
      ? await supabase.from('mc_users').select('id, name').in('id', creatorIds)
      : { data: [], error: null };
    if (usersError) throw usersError;
    const usersById = Object.fromEntries(users.map(user => [user.id, { ...user, _id: user.id }]));
    res.json(await Promise.all(expenses.map(async expense => ({
      ...await addSignedReceiptUrl(expense),
      createdBy: usersById[expense.created_by] || null
    }))));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  if (!requireOwner(req, res)) return;

  try {
    const { data: expense, error } = await supabase
      .from('mc_expenses')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();
    if (error) throw error;
    if (!expense) return res.status(404).json({ error: 'Expense not found' });

    const [{ data: user, error: userError }, result] = await Promise.all([
      expense.created_by
        ? supabase.from('mc_users').select('id, name').eq('id', expense.created_by).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      addSignedReceiptUrl(expense)
    ]);
    if (userError) throw userError;
    res.json({ ...result, createdBy: user ? { ...user, _id: user.id } : null });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
