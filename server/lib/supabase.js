const { createClient } = require('@supabase/supabase-js');

const requiredEnvironment = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'JWT_SECRET',
  'OWNER_SETUP_KEY'
];
const missingEnvironment = requiredEnvironment.filter(name => !process.env[name]);

if (missingEnvironment.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvironment.join(', ')}`);
}
if (process.env.JWT_SECRET.length < 32 || process.env.OWNER_SETUP_KEY.length < 32) {
  throw new Error('JWT_SECRET and OWNER_SETUP_KEY must each be at least 32 characters long');
}

const projectUrl = new URL(process.env.SUPABASE_URL);
if (!['http:', 'https:'].includes(projectUrl.protocol)) {
  throw new Error('SUPABASE_URL must use HTTP or HTTPS');
}

const apiPath = projectUrl.pathname.replace(/\/+$/, '');
if (apiPath && apiPath !== '/rest/v1') {
  throw new Error('SUPABASE_URL must be the project URL, not a dashboard or REST endpoint URL');
}
projectUrl.pathname = '';
projectUrl.search = '';
projectUrl.hash = '';

const supabase = createClient(
  projectUrl.origin,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

module.exports = supabase;
