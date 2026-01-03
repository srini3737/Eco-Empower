require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function createAdmin() {
    console.log("Creating admin user...");

    const username = 'admin';
    const password = 'admin123';
    const email = 'admin@eco.com';

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if user exists
    const { data: existingUser, error: findError } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

    if (existingUser) {
        console.log("Admin user already exists. Updating password and role...");
        const { error: updateError } = await supabase
            .from('users')
            .update({
                password_hash: hashedPassword,
                role: 'admin'
            })
            .eq('username', username);

        if (updateError) {
            console.error("Error updating admin:", updateError.message);
        } else {
            console.log("Admin updated successfully!");
        }
    } else {
        console.log("Creating new admin user...");
        const { error: createError } = await supabase
            .from('users')
            .insert([{
                username: username,
                email: email,
                password_hash: hashedPassword,
                role: 'admin'
            }]);

        if (createError) {
            console.error("Error creating admin:", createError.message);
        } else {
            console.log("Admin created successfully!");
        }
    }
}

createAdmin();
