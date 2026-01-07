const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const Topic = require("../models/Topic");
const Reply = require("../models/Reply");
const { auth } = require("../middleware/auth");

// @route   GET /api/users/me
// @desc    Get current user profile
// @access  Private
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    // Get user stats
    const topicsCount = await Topic.countDocuments({ author: req.userId });
    const repliesCount = await Reply.countDocuments({ author: req.userId });

    res.json({
      success: true,
      data: {
        ...user.toJSON(),
        stats: {
          topics: topicsCount,
          replies: repliesCount,
        },
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching profile",
    });
  }
});

// @route   PUT /api/users/me
// @desc    Update current user profile
// @access  Private
router.put(
  "/me",
  auth,
  [
    body("username")
      .optional()
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage("Username must be 3-30 characters"),
    body("bio")
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage("Bio cannot exceed 200 characters"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { username, bio, avatar } = req.body;
      const updateData = {};

      if (username) {
        // Check if username is taken
        const existingUser = await User.findOne({
          username,
          _id: { $ne: req.userId },
        });
        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: "Username already taken",
          });
        }
        updateData.username = username;
      }

      if (bio !== undefined) updateData.bio = bio;
      if (avatar) updateData.avatar = avatar;

      const user = await User.findByIdAndUpdate(req.userId, updateData, {
        new: true,
        runValidators: true,
      });

      res.json({
        success: true,
        message: "Profile updated successfully",
        data: user,
      });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({
        success: false,
        message: "Error updating profile",
      });
    }
  }
);

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get user stats
    const topicsCount = await Topic.countDocuments({ author: req.params.id });
    const repliesCount = await Reply.countDocuments({ author: req.params.id });

    res.json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        avatar: user.avatar,
        bio: user.bio,
        createdAt: user.createdAt,
        stats: {
          topics: topicsCount,
          replies: repliesCount,
        },
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user",
    });
  }
});

// @route   GET /api/users/:id/topics
// @desc    Get topics by user
// @access  Public
router.get("/:id/topics", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const topics = await Topic.find({ author: req.params.id })
      .populate("author", "username avatar")
      .sort("-createdAt")
      .skip(skip)
      .limit(limit);

    const total = await Topic.countDocuments({ author: req.params.id });

    res.json({
      success: true,
      data: topics,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get user topics error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user topics",
    });
  }
});

// @route   GET /api/users/:id/replies
// @desc    Get replies by user
// @access  Public
router.get("/:id/replies", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const replies = await Reply.find({ author: req.params.id })
      .populate("author", "username avatar")
      .populate("topic", "title")
      .sort("-createdAt")
      .skip(skip)
      .limit(limit);

    const total = await Reply.countDocuments({ author: req.params.id });

    res.json({
      success: true,
      data: replies,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get user replies error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user replies",
    });
  }
});

module.exports = router;
