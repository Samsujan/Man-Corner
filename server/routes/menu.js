const express = require('express');
const supabase = require('../lib/supabase');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

const allowedCategories = ['Coffee', 'Tea', 'Snacks', 'Pastries', 'Beverages', 'Desserts'];
const allowedGstRates = [5, 12, 18, 28];
const formatMenuItem = item => ({
  ...item,
  _id: item.id,
  price: Number(item.price),
  gstRate: Number(item.gst_rate)
});

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('mc_menu_items')
      .select('*')
      .eq('active', true)
      .order('name');
    if (error) throw error;
    res.json(data.map(formatMenuItem));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({ error: 'Only owners can add menu items' });
    }

    const { name, category, price, gstRate = 5, description, image } = req.body;
    if (typeof name !== 'string' || !name.trim() ||
        !allowedCategories.includes(category) ||
        price === '' || !Number.isFinite(Number(price)) || Number(price) < 0 ||
        !allowedGstRates.includes(Number(gstRate))) {
      return res.status(400).json({ error: 'Valid name, category, price, and GST rate are required' });
    }

    const { data, error } = await supabase
      .from('mc_menu_items')
      .insert({
        name: name.trim(),
        category,
        price: Number(price),
        gst_rate: Number(gstRate),
        description: description || null,
        image: image || null,
        active: true
      })
      .select('*')
      .single();
    if (error) throw error;
    res.status(201).json(formatMenuItem(data));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({ error: 'Only owners can update menu items' });
    }

    const updates = {};
    const { name, category, price, gstRate, description, image, active } = req.body;
    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ error: 'Name cannot be empty' });
      }
      updates.name = name.trim();
    }
    if (category !== undefined) {
      if (!allowedCategories.includes(category)) {
        return res.status(400).json({ error: 'Invalid category' });
      }
      updates.category = category;
    }
    if (price !== undefined) {
      if (price === '' || !Number.isFinite(Number(price)) || Number(price) < 0) {
        return res.status(400).json({ error: 'Price must be a non-negative number' });
      }
      updates.price = Number(price);
    }
    if (gstRate !== undefined) {
      if (!allowedGstRates.includes(Number(gstRate))) {
        return res.status(400).json({ error: 'Invalid GST rate' });
      }
      updates.gst_rate = Number(gstRate);
    }
    if (description !== undefined) updates.description = description || null;
    if (image !== undefined) updates.image = image || null;
    if (active !== undefined) updates.active = Boolean(active);

    const { data, error } = await supabase
      .from('mc_menu_items')
      .update(updates)
      .eq('id', req.params.id)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Menu item not found' });
    res.json(formatMenuItem(data));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({ error: 'Only owners can delete menu items' });
    }

    const { data, error } = await supabase
      .from('mc_menu_items')
      .update({ active: false })
      .eq('id', req.params.id)
      .select('id')
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Menu item not found' });
    res.json({ message: 'Menu item deleted' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
