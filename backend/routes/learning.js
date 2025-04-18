const express = require('express');
const router = express.Router();
const Learning = require('../models/Learning');
const { authMiddleware } = require('./auth'); // Correct middleware import

// GET /api/learning - Fetch user learning data (Protected)
router.get('/', authMiddleware, async (req, res) => {
  try {
    let learning = await Learning.findOne({ userId: req.user });

    // Create a new learning record if none exists
    if (!learning) {
      learning = new Learning({ userId: req.user });
      await learning.save();
    }

    res.json(learning);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// POST /api/learning/complete - Update learning progress (Protected)
router.post('/complete', authMiddleware, async (req, res) => {
  const { type, score } = req.body;

  try {
    // Find or create a learning record for the user
    let learning = await Learning.findOne({ userId: req.user });
    if (!learning) {
      learning = new Learning({ userId: req.user });
    }

    // Update learning progress
    if (type === 'challenge') learning.challengesCompleted += 1;
    if (type === 'quiz') learning.quizScore += score;

    await learning.save();
    res.json(learning);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// GET /api/learning/leaderboard - Retrieve leaderboard (Public)
router.get('/leaderboard', async (req, res) => {
  try {
    const leaderboard = await Learning.aggregate([
      { $sort: { quizScore: -1 } }, // Sort by quizScore descending
      { $limit: 10 }, // Limit to top 10 users
      {
        $lookup: {
          from: 'users', // Match with 'users' collection
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $project: {
          email: { $arrayElemAt: ['$user.email', 0] }, // Extract the email
          quizScore: 1,
          challengesCompleted: 1,
        },
      },
    ]);

    res.json(leaderboard);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
