const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');
require('dotenv').config();

const router = express.Router();

// Get user profile (and lazy-create public.users row if missing)
router.get('/me', auth, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT id, username, email, theme, "profilePic" FROM public.users WHERE id = $1', [req.user.id]);
    
    if (rows.length === 0) {
      // Lazy insert the user into public.users since Supabase Auth just created them in auth.users
      const defaultUsername = req.user.email.split('@')[0];
      await pool.execute(
        'INSERT INTO public.users (id, username, email, theme) VALUES ($1, $2, $3, $4)',
        [req.user.id, defaultUsername, req.user.email, 'light']
      );
      return res.json({ id: req.user.id, username: defaultUsername, email: req.user.email, theme: 'light', profilePic: null });
    }
    
    // Rename postgres column to match frontend expectations
    const user = rows[0];
    user.profilePic = user.profilePic || user['profilePic'];
    res.json(user);
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user profile
router.put('/me', auth, async (req, res) => {
  const { username, theme, profilePic } = req.body;
  
  try {
    let sql = 'UPDATE public.users SET username = $1, theme = $2';
    let params = [username, theme || 'light'];
    if (profilePic !== undefined) {
      sql += ', "profilePic" = $3';
      params.push(profilePic);
    }

    sql += ` WHERE id = $${params.length + 1}`;
    params.push(req.user.id);

    await pool.execute(sql, params);

    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

