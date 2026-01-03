const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Validate environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  console.error('ERROR: Missing Supabase credentials in .env file');
  console.error('Please set SUPABASE_URL and SUPABASE_KEY');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

module.exports = supabase;
