const express = require('express');
const multer = require('multer');
const { randomUUID } = require('crypto');
const supabase = require('../lib/supabase');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

const allowedGstRates = [5, 12, 18, 28];
const imageBucket = 'mana-corner-menu-images';
const allowedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(req, file, callback) {
    if (!allowedImageTypes.has(file.mimetype)) {
      return callback(new Error('Menu images must be JPG, PNG, or WEBP files'));
    }
    callback(null, true);
  }
});

const isStorageImage = image => typeof image === 'string' && !/^https?:\/\//i.test(image);
const getImageUrl = async image => {
  if (!image || !isStorageImage(image)) return image || null;
  const { data, error } = await supabase.storage.from(imageBucket).createSignedUrl(image, 60 * 60);
  if (error) throw error;
  return data.signedUrl;
};
const formatMenuItem = async item => ({
  ...item,
  _id: item.id,
  price: Number(item.price),
  gstRate: Number(item.gst_rate),
  image: await getImageUrl(item.image)
});
const formatCategory = category => ({ ...category, _id: category.id });

const removeStorageImage = async image => {
  if (!image || !isStorageImage(image)) return;
  const { error } = await supabase.storage.from(imageBucket).remove([image]);
  if (error) console.error('Failed to remove old menu image:', error.message);
};

const uploadMenuImage = async (file, userId) => {
  const extension = file.mimetype.split('/')[1].replace('jpeg', 'jpg');
  const path = `${userId}/${randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from(imageBucket).upload(path, file.buffer, {
    contentType: file.mimetype,
    upsert: false
  });
  if (error) throw error;
  return path;
};

async function getCategoryNames() {
  const { data, error } = await supabase.from('mc_categories').select('name');
  if (error) throw error;
  return data.map(category => category.name);
}

router.get('/categories', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('mc_categories')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });
    if (error) throw error;
    res.json(data.map(formatCategory));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/categories', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({ error: 'Only owners can add categories' });
    }

    const { name } = req.body;
    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const { count, error: countError } = await supabase
      .from('mc_categories')
      .select('id', { head: true, count: 'exact' });
    if (countError) throw countError;

    const { data, error } = await supabase
      .from('mc_categories')
      .insert({ name: name.trim(), sort_order: (count || 0) + 1 })
      .select('*')
      .single();
    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'That category already exists' });
      }
      throw error;
    }
    res.status(201).json(formatCategory(data));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/categories/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({ error: 'Only owners can delete categories' });
    }

    const { data: category, error: fetchError } = await supabase
      .from('mc_categories')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();
    if (fetchError) throw fetchError;
    if (!category) return res.status(404).json({ error: 'Category not found' });

    const { count, error: countError } = await supabase
      .from('mc_menu_items')
      .select('id', { head: true, count: 'exact' })
      .eq('category', category.name)
      .eq('active', true);
    if (countError) throw countError;
    if (count > 0) {
      return res.status(400).json({ error: 'Move or remove the menu items in this category first' });
    }

    const { error } = await supabase.from('mc_categories').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Category deleted' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('mc_menu_items')
      .select('*')
      .eq('active', true)
      .order('name');
    if (error) throw error;
    res.json(await Promise.all(data.map(formatMenuItem)));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authMiddleware, imageUpload.single('image'), async (req, res) => {
  let uploadedImage;
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({ error: 'Only owners can add menu items' });
    }

    const { name, category, price, gstRate = 5, description } = req.body;
    const categoryNames = await getCategoryNames();
    if (typeof name !== 'string' || !name.trim() ||
        !categoryNames.includes(category) ||
        price === '' || !Number.isFinite(Number(price)) || Number(price) < 0 ||
        !allowedGstRates.includes(Number(gstRate))) {
      return res.status(400).json({ error: 'Valid name, category, price, and GST rate are required' });
    }

    if (req.file) uploadedImage = await uploadMenuImage(req.file, req.user.id);

    const { data, error } = await supabase
      .from('mc_menu_items')
      .insert({
        name: name.trim(),
        category,
        price: Number(price),
        gst_rate: Number(gstRate),
        description: description || null,
        image: uploadedImage || null,
        active: true
      })
      .select('*')
      .single();
    if (error) throw error;
    uploadedImage = null;
    res.status(201).json(await formatMenuItem(data));
  } catch (error) {
    if (uploadedImage) {
      const { error: cleanupError } = await supabase.storage.from(imageBucket).remove([uploadedImage]);
      if (cleanupError) console.error('Failed to remove unreferenced menu image:', cleanupError.message);
    }
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', authMiddleware, imageUpload.single('image'), async (req, res) => {
  let uploadedImage;
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({ error: 'Only owners can update menu items' });
    }

    const updates = {};
    const { name, category, price, gstRate, description, removeImage, active } = req.body;
    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ error: 'Name cannot be empty' });
      }
      updates.name = name.trim();
    }
    if (category !== undefined) {
      const categoryNames = await getCategoryNames();
      if (!categoryNames.includes(category)) {
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
    if (active !== undefined) updates.active = Boolean(active);

    const { data: existingItem, error: existingItemError } = await supabase
      .from('mc_menu_items')
      .select('image')
      .eq('id', req.params.id)
      .maybeSingle();
    if (existingItemError) throw existingItemError;
    if (!existingItem) return res.status(404).json({ error: 'Menu item not found' });

    if (req.file) {
      uploadedImage = await uploadMenuImage(req.file, req.user.id);
      updates.image = uploadedImage;
    } else if (removeImage === 'true') {
      updates.image = null;
    }

    const { data, error } = await supabase
      .from('mc_menu_items')
      .update(updates)
      .eq('id', req.params.id)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Menu item not found' });
    uploadedImage = null;
    if (data.image !== existingItem.image) await removeStorageImage(existingItem.image);
    res.json(await formatMenuItem(data));
  } catch (error) {
    if (uploadedImage) {
      const { error: cleanupError } = await supabase.storage.from(imageBucket).remove([uploadedImage]);
      if (cleanupError) console.error('Failed to remove unreferenced menu image:', cleanupError.message);
    }
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
