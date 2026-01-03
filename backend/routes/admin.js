const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { verifyToken } = require('./auth');

// Middleware to check admin role
const requireAdmin = (req, res, next) => {
    if (req.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

// GET /api/admin/users - Get all users
router.get('/users', verifyToken, requireAdmin, async (req, res) => {
    try {
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

        console.log("Users Query Response:", JSON.stringify(users, null, 2));

        if (error) throw error;

        // Format response
        const formattedUsers = users.map(user => {
            let balance = 0;
            if (Array.isArray(user.wallets) && user.wallets.length > 0) {
                balance = user.wallets[0].balance;
            } else if (user.wallets && typeof user.wallets === 'object') {
                balance = user.wallets.balance;
            }

            return {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                created_at: user.created_at,
                wallet_balance: balance || 0
            };
        });

        res.json({
            success: true,
            users: formattedUsers
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Failed to get users' });
    }
});

// GET /api/admin/feedbacks - Get all feedbacks
router.get('/feedbacks', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { data: feedbacks, error } = await supabase
            .from('feedbacks')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({
            success: true,
            feedbacks: feedbacks || []
        });
    } catch (error) {
        console.error('Get feedbacks error:', error);
        res.status(500).json({ error: 'Failed to get feedbacks' });
    }
});

// GET /api/admin/orders - Get all orders
router.get('/orders', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { data: orders, error } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({
            success: true,
            orders: orders || []
        });
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ error: 'Failed to get orders' });
    }
});

// GET /api/admin/stats - Get dashboard statistics
router.get('/stats', verifyToken, requireAdmin, async (req, res) => {
    try {
        // Get total users count
        const { count: totalUsers } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true });

        // Get total orders count
        const { count: totalOrders } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true });

        // Get total wallet holdings
        const { data: wallets } = await supabase
            .from('wallets')
            .select('balance');

        const totalWalletHoldings = wallets?.reduce((sum, w) => sum + (w.balance || 0), 0) || 0;

        // Get total revenue from orders
        const { data: orders } = await supabase
            .from('orders')
            .select('total');

        const totalRevenue = orders?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;

        res.json({
            success: true,
            stats: {
                totalUsers: totalUsers || 0,
                totalOrders: totalOrders || 0,
                totalWalletHoldings: totalWalletHoldings,
                totalRevenue: totalRevenue
            }
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Failed to get statistics' });
    }
});

module.exports = router;
