const mongoose = require("mongoose");

const replySchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: [true, "Reply content is required"],
      minlength: [1, "Reply cannot be empty"],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    topic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Topic",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
replySchema.index({ topic: 1, createdAt: 1 });
replySchema.index({ author: 1 });

// Update topic's reply count and last activity after saving
replySchema.post("save", async function () {
  const Topic = mongoose.model("Topic");
  const topic = await Topic.findById(this.topic);

  if (topic) {
    topic.replyCount = await mongoose
      .model("Reply")
      .countDocuments({ topic: this.topic });
    topic.lastActivity = new Date();

    // Add author to recent participants (max 5)
    if (!topic.recentParticipants.includes(this.author)) {
      topic.recentParticipants.unshift(this.author);
      if (topic.recentParticipants.length > 5) {
        topic.recentParticipants = topic.recentParticipants.slice(0, 5);
      }
    }

    await topic.save();
  }
});

// Update topic's reply count after deletion
replySchema.post("findOneAndDelete", async function (doc) {
  if (doc) {
    const Topic = mongoose.model("Topic");
    const replyCount = await mongoose
      .model("Reply")
      .countDocuments({ topic: doc.topic });
    await Topic.findByIdAndUpdate(doc.topic, { replyCount });
  }
});

module.exports = mongoose.model("Reply", replySchema);
