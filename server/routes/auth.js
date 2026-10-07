const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { timingSafeEqual } = require('crypto');
const supabase = require('../lib/supabase');
const router = express.Router();

const publicUser = user => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  permissions: user.permissions
});

const issueToken = user => jwt.sign(
  { id: user.id, name: user.name, email: user.email, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

const isValidSetupKey = providedKey => {
  const setupKey = process.env.OWNER_SETUP_KEY;
  if (!setupKey || !providedKey) return false;
  const expected = Buffer.from(setupKey);
  const provided = Buffer.from(providedKey);
  return expected.length === provided.length && timingSafeEqual(expected, provided);
};

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const setupKey = req.get('x-owner-setup-key');

    if (typeof name !== 'string' || !name.trim() ||
        !normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) ||
        typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({
        error: 'Name, a valid email, and a password of at least 8 characters are required'
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    let user;

    if (setupKey) {
      if (!isValidSetupKey(setupKey)) {
        return res.status(403).json({ error: 'Invalid owner setup key' });
      }

      const { data, error } = await supabase.rpc('mc_create_initial_owner', {
        p_name: name.trim(),
        p_email: normalizedEmail,
        p_password_hash: passwordHash
      });
      if (error) throw error;
      user = Array.isArray(data) ? data[0] : data;
      if (!user) throw new Error('Initial owner registration did not return an account');
    } else {
      const { data, error } = await supabase
        .from('mc_users')
        .insert({
          name: name.trim(),
          email: normalizedEmail,
          password_hash: passwordHash,
          role: 'guest',
          permissions: {
            billing: true,
            expenses: false,
            analytics: false,
            users: false,
            profitShare: false
          }
        })
        .select('id, name, email, role, permissions')
        .single();
      if (error) {
        if (error.code === 'P0001') {
          return res.status(409).json({ error: error.message });
        }
        throw error;
      }
      user = data;
    }

    res.status(201).json({
      message: 'User registered successfully',
      token: issueToken(user),
      user: publicUser(user)
    });
  } catch (error) {
    const duplicateEmail = error.code === '23505';
    const setupAlreadyUsed = error.message && error.message.includes('initial owner already exists');
    if (duplicateEmail) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }
    if (setupAlreadyUsed) {
      return res.status(409).json({ error: 'The initial owner account has already been created' });
    }
    if (error.code === 'P0001') {
      return res.status(409).json({ error: error.message });
    }

    console.error('Registration failed:', error.code || 'unknown', error.message || 'Unknown error');
    res.status(500).json({
      error: 'Registration could not be completed. Check the API terminal for details.'
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!normalizedEmail || typeof password !== 'string') {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { data: user, error } = await supabase
      .from('mc_users')
      .select('id, name, email, role, permissions, password_hash')
      .eq('email', normalizedEmail)
      .maybeSingle();
    if (error) throw error;

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({
      token: issueToken(user),
      user: publicUser(user)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
