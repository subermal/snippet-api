// server.js
// Project 2: Code Snippet Library REST API

// 1. IMPORTS
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config(); // Load .env variables

// 2. CONFIGURATION
const app = express();
const PORT = process.env.PORT || 3000;

// 3. MIDDLEWARE
app.use(cors());          // Allow cross-origin requests (e.g. from frontend)
app.use(express.json());  // Parse JSON bodies in requests

// 4. DATABASE CONNECTION
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ DB Connection Error:", err));
  

  // 5. SCHEMA & MODEL

const snippetSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true, // must have title
    trim: true
  },
  language: {
    type: String,
    required: true,
    lowercase: true, // store "JavaScript" as "javascript"
    trim: true
  },
  code: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ""
  },
  tags: {
    type: [String],
    default: []
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

const Snippet = mongoose.model("Snippet", snippetSchema);


// 6. ROUTES

// TEST ROUTE
app.get("/", (req, res) => {
  res.send("Snippet API is running. Try /api/snippets");
});

// GET ALL SNIPPETS (with optional filtering + limit)
// Example: GET /api/snippets?lang=javascript&tag=db&limit=5
app.get("/api/snippets", async (req, res) => {
  try {
    const filter = {};

    // Filter by language
    if (req.query.lang) {
      filter.language = req.query.lang.toLowerCase();
    }

    // Filter by tag (single tag)
    if (req.query.tag) {
      filter.tags = req.query.tag;
    }

    // Basic search in title/description
    if (req.query.q) {
      const q = req.query.q;
      filter.$or = [
        { title: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } }
      ];
    }

    const limit = parseInt(req.query.limit, 10) || 10;

    const snippets = await Snippet.find(filter)
      .sort({ created_at: -1 }) // newest first
      .limit(limit);

    res.json(snippets);
  } catch (err) {
    console.error("GET /api/snippets error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET ONE SNIPPET BY ID
app.get("/api/snippets/:id", async (req, res) => {
  try {
    const snippet = await Snippet.findById(req.params.id);
    if (!snippet) {
      return res.status(404).json({ message: "Snippet not found" });
    }
    res.json(snippet);
  } catch (err) {
    console.error("GET /api/snippets/:id error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// CREATE NEW SNIPPET
app.post("/api/snippets", async (req, res) => {
  try {
    const { title, language, code, description, tags } = req.body;

    // Simple validation
    if (!title || !language || !code) {
      return res.status(400).json({
        message: "Title, language and code are required"
      });
    }

    const newSnippet = new Snippet({
      title,
      language,
      code,
      description,
      tags
    });

    const savedSnippet = await newSnippet.save();
    res.status(201).json(savedSnippet);
  } catch (err) {
    console.error("POST /api/snippets error:", err);
    res.status(400).json({ message: "Invalid data" });
  }
});

// UPDATE SNIPPET (PUT/PATCH style)
// Example: PATCH /api/snippets/ID  { "title": "Updated title" }
app.patch("/api/snippets/:id", async (req, res) => {
  try {
    const updates = req.body; // what fields to update

    const snippet = await Snippet.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!snippet) {
      return res.status(404).json({ message: "Snippet not found" });
    }

    res.json(snippet);
  } catch (err) {
    console.error("PATCH /api/snippets/:id error:", err);
    res.status(400).json({ message: "Invalid update data" });
  }
});

// DELETE SNIPPET
app.delete("/api/snippets/:id", async (req, res) => {
  try {
    const snippet = await Snippet.findByIdAndDelete(req.params.id);
    if (!snippet) {
      return res.status(404).json({ message: "Snippet not found" });
    }
    res.json({ message: "Snippet deleted" });
  } catch (err) {
    console.error("DELETE /api/snippets/:id error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// 7. START SERVER
app.listen(PORT, () => {
  console.log(`✅ Snippet API running on port ${PORT}`);
});
