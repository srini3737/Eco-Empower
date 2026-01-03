const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { verifyToken } = require('./auth');

// POST /api/feedback - Submit feedback
router.post('/', verifyToken, async (req, res) => {
    try {
        const { message } = req.body;

        if (!message || message.trim() === '') {
            return res.status(400).json({ error: 'Feedback message is required' });
        }

        const { data: feedback, error } = await supabase
            .from('feedbacks')
            .insert([
                {
                    user_id: req.userId,
                    username: req.username,
                    message: message.trim()
                }
            ])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            success: true,
            message: 'Feedback submitted successfully',
            feedback
        });
    } catch (error) {
        console.error('Submit feedback error:', error);
        res.status(500).json({ error: 'Failed to submit feedback' });
    }
});

// GET /api/feedback - Get all feedbacks (for admin)
router.get('/', async (req, res) => {
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

module.exports = router;
