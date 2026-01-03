require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function fixWallets() {
    let output = "";
    try {
        console.log("Checking Admin Wallet...");
        output += "Checking Admin Wallet...\n";

        // 1. Get Admin
        const { data: adminUser, error: adminError } = await supabase
            .from('users')
            .select('*')
            .eq('username', 'admin')
            .single();

        if (adminError) {
            output += "Error finding admin: " + JSON.stringify(adminError) + "\n";
        } else {
            output += "Admin found: " + adminUser.id + "\n";

            // Check admin wallet
            const { data: adminWallet } = await supabase
                .from('wallets')
                .select('*')
                .eq('user_id', adminUser.id)
                .single();

            if (!adminWallet) {
                output += "Admin wallet missing. Creating...\n";
                const { error: createError } = await supabase
                    .from('wallets')
                    .insert([{ user_id: adminUser.id, balance: 0 }]);

                if (createError) output += "Error creating admin wallet: " + createError.message + "\n";
                else output += "Admin wallet created successfully.\n";
            } else {
                output += "Admin wallet exists. Balance: " + adminWallet.balance + "\n";
            }
        }

        // 2. Check all users
        output += "\n--- Audit All Users ---\n";
        const { data: users } = await supabase.from('users').select('id, username, wallets(balance)');

        if (users) {
            users.forEach(u => {
                let bal = "N/A";
                if (u.wallets && u.wallets.length > 0) bal = u.wallets[0].balance;
                else if (u.wallets && typeof u.wallets === 'object') bal = u.wallets.balance; // In case handling is different

                output += `User: ${u.username}, Wallet: ${JSON.stringify(u.wallets)}, Balance: ${bal}\n`;
            });
        }

    } catch (e) {
        output += "Exception: " + e.message + "\n";
    }

    require('fs').writeFileSync('fix_results.txt', output);
    console.log("Done.");
}

fixWallets();
