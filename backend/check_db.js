require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

console.log("Checking Supabase connection...");

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_KEY;

if (!url || !key || url.includes('your_supabase_project_url')) {
    console.log("ERROR: .env file not configured!");
    console.log("SUPABASE_URL:", url);
    process.exit(1);
}

const supabase = createClient(url, key);

async function check() {
    // 1. Check if we can connect and query users table
    console.log("Attempting to select from 'users' table...");
    const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });

    if (error) {
        console.log("Database Error:", error.message);
        console.log("Code:", error.code);
        console.log("Details:", error.details);
        if (error.code === 'PGRST204') {
            console.log("Hint: The query returned an error? actually PGRST204 usually means columns? No wait.");
        }
        if (error.message.includes('relation "public.users" does not exist')) {
            console.log("DIAGNOSIS: The database tables have not been created yet.");
            console.log("SOLUTION: Go to Supabase SQL Editor and run the contents of 'database/schema.sql'.");
        } else if (error.code === '42501') {
            console.log("DIAGNOSIS: Permission denied. RLS policies might be blocking or anon key doesn't have access.");
        }
    } else {
        console.log("Connection SUCCESSFUL!");
        console.log("Users table exists.");
    }
}

check();
