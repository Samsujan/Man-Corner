const jwt = require('jsonwebtoken');
const supabase = require('../lib/supabase');

const authMiddleware = async (req, res, next) => {
  const authorization = req.headers.authorization || '';
  const [scheme, token] = authorization.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  try {
    const { data: user, error } = await supabase
      .from('mc_users')
      .select('id, name, email, role')
      .eq('id', decoded.id)
      .maybeSingle();
    if (error) throw error;
    if (!user) return res.status(401).json({ error: 'Account is no longer active' });
    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = authMiddleware;
