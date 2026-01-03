const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { verifyToken } = require('./auth');

// POST /api/orders - Create new order
router.post('/', verifyToken, async (req, res) => {
    try {
        const { items, total } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Order items are required' });
        }

        if (!total || total <= 0) {
            return res.status(400).json({ error: 'Invalid order total' });
        }

        const { data: order, error } = await supabase
            .from('orders')
            .insert([
                {
                    user_id: req.userId,
                    username: req.username,
                    items_json: JSON.stringify(items),
                    total: parseFloat(total)
                }
            ])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            order: {
                id: order.id,
                items: JSON.parse(order.items_json),
                total: order.total,
                created_at: order.created_at
            }
        });
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ error: 'Failed to create order' });
    }
});

// GET /api/orders/:userId - Get user orders
router.get('/:userId', verifyToken, async (req, res) => {
    try {
        const { userId } = req.params;

        // Ensure user can only access their own orders
        if (req.userId !== userId && req.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }

        const { data: orders, error } = await supabase
            .from('orders')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Parse items_json for each order
        const formattedOrders = orders?.map(order => ({
            id: order.id,
            items: JSON.parse(order.items_json),
            total: order.total,
            created_at: order.created_at
        })) || [];

        res.json({
            success: true,
            orders: formattedOrders
        });
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ error: 'Failed to get orders' });
    }
});

module.exports = router;
