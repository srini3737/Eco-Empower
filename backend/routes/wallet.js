const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { verifyToken } = require('./auth');

// GET /api/wallet/balance/:userId - Get wallet balance
router.get('/balance/:userId', verifyToken, async (req, res) => {
    try {
        const { userId } = req.params;

        // Ensure user can only access their own wallet
        if (req.userId !== userId && req.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }

        const { data: wallet, error } = await supabase
            .from('wallets')
            .select('balance')
            .eq('user_id', userId)
            .single();

        if (error) {
            // If wallet doesn't exist, create it
            const { data: newWallet } = await supabase
                .from('wallets')
                .insert([{ user_id: userId, balance: 0 }])
                .select()
                .single();

            return res.json({ success: true, balance: 0 });
        }

        res.json({
            success: true,
            balance: wallet.balance
        });
    } catch (error) {
        console.error('Get balance error:', error);
        res.status(500).json({ error: 'Failed to get balance' });
    }
});

// POST /api/wallet/add - Add funds to wallet
router.post('/add', verifyToken, async (req, res) => {
    try {
        const { amount } = req.body;
        const userId = req.userId;

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }

        // Get current balance
        const { data: wallet } = await supabase
            .from('wallets')
            .select('balance')
            .eq('user_id', userId)
            .single();

        const newBalance = (wallet?.balance || 0) + parseFloat(amount);

        // Update wallet
        const { error: updateError } = await supabase
            .from('wallets')
            .update({ balance: newBalance, updated_at: new Date() })
            .eq('user_id', userId);

        if (updateError) throw updateError;

        // Record transaction
        await supabase
            .from('transactions')
            .insert([
                {
                    user_id: userId,
                    type: 'credit',
                    amount: parseFloat(amount),
                    description: 'Funds added to wallet'
                }
            ]);

        res.json({
            success: true,
            balance: newBalance,
            message: 'Funds added successfully'
        });
    } catch (error) {
        console.error('Add funds error:', error);
        res.status(500).json({ error: 'Failed to add funds' });
    }
});

// POST /api/wallet/deduct - Deduct funds from wallet
router.post('/deduct', verifyToken, async (req, res) => {
    try {
        const { amount } = req.body;
        const userId = req.userId;

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }

        // Get current balance
        const { data: wallet } = await supabase
            .from('wallets')
            .select('balance')
            .eq('user_id', userId)
            .single();

        const currentBalance = wallet?.balance || 0;

        if (currentBalance < amount) {
            return res.status(400).json({
                error: 'Insufficient funds',
                balance: currentBalance
            });
        }

        const newBalance = currentBalance - parseFloat(amount);

        // Update wallet
        const { error: updateError } = await supabase
            .from('wallets')
            .update({ balance: newBalance, updated_at: new Date() })
            .eq('user_id', userId);

        if (updateError) throw updateError;

        // Record transaction
        await supabase
            .from('transactions')
            .insert([
                {
                    user_id: userId,
                    type: 'debit',
                    amount: parseFloat(amount),
                    description: 'Purchase from Eco Wallet'
                }
            ]);

        res.json({
            success: true,
            balance: newBalance,
            message: 'Funds deducted successfully'
        });
    } catch (error) {
        console.error('Deduct funds error:', error);
        res.status(500).json({ error: 'Failed to deduct funds' });
    }
});

// GET /api/wallet/transactions/:userId - Get transaction history
router.get('/transactions/:userId', verifyToken, async (req, res) => {
    try {
        const { userId } = req.params;

        // Ensure user can only access their own transactions
        if (req.userId !== userId && req.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }

        const { data: transactions, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({
            success: true,
            transactions: transactions || []
        });
    } catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({ error: 'Failed to get transactions' });
    }
});

module.exports = router;
