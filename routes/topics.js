const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const Topic = require("../models/Topic");
const Reply = require("../models/Reply");
const { auth, optionalAuth } = require("../middleware/auth");

// @route   GET /api/topics
// @desc    Get all topics with pagination
// @access  Public
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const sort = req.query.sort || "-lastActivity";

    const topics = await Topic.find()
      .populate("author", "username avatar")
      .populate("recentParticipants", "username avatar")
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Topic.countDocuments();

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
    console.error("Get topics error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching topics",
    });
  }
});

// @route   GET /api/topics/:id
// @desc    Get single topic
// @access  Public
router.get("/:id", optionalAuth, async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id)
      .populate("author", "username avatar bio")
      .populate("recentParticipants", "username avatar");

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: "Topic not found",
      });
    }

    // Increment view count
    topic.views += 1;
    await topic.save();

    res.json({
      success: true,
      data: topic,
    });
  } catch (error) {
    console.error("Get topic error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching topic",
    });
  }
});

// @route   POST /api/topics
// @desc    Create new topic
// @access  Private
router.post(
  "/",
  auth,
  [
    body("title")
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage("Title must be 5-200 characters"),
    body("content")
      .trim()
      .isLength({ min: 10 })
      .withMessage("Content must be at least 10 characters"),
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

      const { title, content, tags } = req.body;

      const topic = await Topic.create({
        title,
        content,
        author: req.userId,
        recentParticipants: [req.userId],
        tags: tags || [],
      });

      await topic.populate("author", "username avatar");

      res.status(201).json({
        success: true,
        message: "Topic created successfully",
        data: topic,
      });
    } catch (error) {
      console.error("Create topic error:", error);
      res.status(500).json({
        success: false,
        message: "Error creating topic",
      });
    }
  }
);

// @route   PUT /api/topics/:id
// @desc    Update topic
// @access  Private (owner only)
router.put(
  "/:id",
  auth,
  [
    body("title")
      .optional()
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage("Title must be 5-200 characters"),
    body("content")
      .optional()
      .trim()
      .isLength({ min: 10 })
      .withMessage("Content must be at least 10 characters"),
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

      const topic = await Topic.findById(req.params.id);

      if (!topic) {
        return res.status(404).json({
          success: false,
          message: "Topic not found",
        });
      }

      // Check ownership
      if (topic.author.toString() !== req.userId.toString()) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to update this topic",
        });
      }

      const { title, content, tags } = req.body;

      if (title) topic.title = title;
      if (content) topic.content = content;
      if (tags) topic.tags = tags;
      topic.lastActivity = new Date();

      await topic.save();
      await topic.populate("author", "username avatar");

      res.json({
        success: true,
        message: "Topic updated successfully",
        data: topic,
      });
    } catch (error) {
      console.error("Update topic error:", error);
      res.status(500).json({
        success: false,
        message: "Error updating topic",
      });
    }
  }
);

// @route   DELETE /api/topics/:id
// @desc    Delete topic
// @access  Private (owner only)
router.delete("/:id", auth, async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id);

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: "Topic not found",
      });
    }

    // Check ownership
    if (topic.author.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this topic",
      });
    }

    // Delete all replies for this topic
    await Reply.deleteMany({ topic: topic._id });

    // Delete topic
    await Topic.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Topic and all replies deleted successfully",
    });
  } catch (error) {
    console.error("Delete topic error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting topic",
    });
  }
});

// @route   GET /api/topics/:id/replies
// @desc    Get replies for a topic
// @access  Public
router.get("/:id/replies", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const replies = await Reply.find({ topic: req.params.id })
      .populate("author", "username avatar")
      .sort("createdAt")
      .skip(skip)
      .limit(limit);

    const total = await Reply.countDocuments({ topic: req.params.id });

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
    console.error("Get replies error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching replies",
    });
  }
});

module.exports = router;
