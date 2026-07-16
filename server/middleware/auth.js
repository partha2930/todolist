const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = 'https://lrsbckwyfkulmbjnrsiq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxyc2Jja3d5Zmt1bG1iam5yc2lxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxNzg5OTIsImV4cCI6MjA5OTc1NDk5Mn0.dkqzDHdkYzvSYwzP7Sq41ag4sO_3yhbkQxaICYv-Y5A';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

module.exports = async function (req, res, next) {
  const authHeader = req.header('Authorization');
  let token = authHeader;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ error: 'No token, authorization denied' });
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Token is not valid' });
    }

    req.user = { id: user.id, email: user.email };
    next();
  } catch (err) {
    res.status(401).json({ error: 'Server error verifying token' });
  }
};
