const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const Reply = require("../models/Reply");
const Topic = require("../models/Topic");
const { auth } = require("../middleware/auth");

// @route   POST /api/replies
// @desc    Create a new reply
// @access  Private
router.post(
  "/",
  auth,
  [
    body("content")
      .trim()
      .isLength({ min: 1 })
      .withMessage("Reply content cannot be empty"),
    body("topicId").isMongoId().withMessage("Valid topic ID is required"),
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

      const { content, topicId } = req.body;

      // Check if topic exists
      const topic = await Topic.findById(topicId);
      if (!topic) {
        return res.status(404).json({
          success: false,
          message: "Topic not found",
        });
      }

      const reply = await Reply.create({
        content,
        author: req.userId,
        topic: topicId,
      });

      await reply.populate("author", "username avatar");

      res.status(201).json({
        success: true,
        message: "Reply added successfully",
        data: reply,
      });
    } catch (error) {
      console.error("Create reply error:", error);
      res.status(500).json({
        success: false,
        message: "Error creating reply",
      });
    }
  }
);

// @route   PUT /api/replies/:id
// @desc    Update a reply
// @access  Private (owner only)
router.put(
  "/:id",
  auth,
  [
    body("content")
      .trim()
      .isLength({ min: 1 })
      .withMessage("Reply content cannot be empty"),
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

      const reply = await Reply.findById(req.params.id);

      if (!reply) {
        return res.status(404).json({
          success: false,
          message: "Reply not found",
        });
      }

      // Check ownership
      if (reply.author.toString() !== req.userId.toString()) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to update this reply",
        });
      }

      reply.content = req.body.content;
      await reply.save();
      await reply.populate("author", "username avatar");

      res.json({
        success: true,
        message: "Reply updated successfully",
        data: reply,
      });
    } catch (error) {
      console.error("Update reply error:", error);
      res.status(500).json({
        success: false,
        message: "Error updating reply",
      });
    }
  }
);

// @route   DELETE /api/replies/:id
// @desc    Delete a reply
// @access  Private (owner only)
router.delete("/:id", auth, async (req, res) => {
  try {
    const reply = await Reply.findById(req.params.id);

    if (!reply) {
      return res.status(404).json({
        success: false,
        message: "Reply not found",
      });
    }

    // Check ownership
    if (reply.author.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this reply",
      });
    }

    await Reply.findOneAndDelete({ _id: req.params.id });

    res.json({
      success: true,
      message: "Reply deleted successfully",
    });
  } catch (error) {
    console.error("Delete reply error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting reply",
    });
  }
});

module.exports = router;
