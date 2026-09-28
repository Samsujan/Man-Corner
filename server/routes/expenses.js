const express = require('express');
const multer = require('multer');
const { randomUUID } = require('crypto');
const supabase = require('../lib/supabase');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

const bucketName = 'mana-corner-receipts';
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

const addSignedReceiptUrl = async expense => {
  const result = { ...expense, _id: expense.id, amount: Number(expense.amount) };
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
  if (!requireOwner(req, res)) return;

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
        created_by: req.user.id
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
