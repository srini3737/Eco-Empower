require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function testAdminQuery() {
    console.log("Testing Admin Users Query...");

    const { data: users, error } = await supabase
        .from('users')
        .select(`
            id,
            username,
            email,
            role,
            created_at,
            wallets (balance)
        `)
        .order('created_at', { ascending: false });

    if (error) {
        require('fs').writeFileSync('results.txt', "Query Error: " + JSON.stringify(error));
    } else {
        let output = "Query Success!\n";
        output += "Number of users found: " + users.length + "\n";

        users.forEach((user, index) => {
            output += `\nUser ${index + 1}: ${user.username} (${user.role})\n`;
            output += "Wallet Raw Data: " + JSON.stringify(user.wallets) + "\n";

            // Test extraction logic
            let balance = 0;
            if (Array.isArray(user.wallets) && user.wallets.length > 0) {
                balance = user.wallets[0].balance;
            } else if (user.wallets && typeof user.wallets === 'object') {
                balance = user.wallets.balance;
            }
            output += "Extracted Balance: " + balance + "\n";
        });
        require('fs').writeFileSync('results.txt', output);
    }
}

testAdminQuery();
