require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Mistral } = require("@mistralai/mistralai");
const mongoose = require("mongoose");
const socketIo = require("socket.io");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const Scholarship = require("./models/Scholarship");
const User = require("./models/User");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: "*" }));
app.use(express.json());

const apiKey = process.env.MISTRAL_API_KEY;
const agentId = process.env.AGENT_ID;
const client = new Mistral({ apiKey });

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Error:", err));

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ msg: "Unauthorized" });
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(401).json({ msg: "User not found" });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ msg: "Invalid token" });
  }
};

app.post("/api/auth/signup", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const exist = await User.findOne({ email });
    if (exist) return res.status(400).json({ msg: "User already exists" });
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch {
    res.status(500).json({ msg: "Signup failed" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "Invalid credentials" });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ msg: "Invalid credentials" });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch {
    res.status(500).json({ msg: "Login failed" });
  }
});

app.post("/api/auth/logout", (req, res) => {
  res.json({ msg: "Logged out" });
});

app.get("/api/auth/profile", protect, (req, res) => {
  res.json(req.user);
});

app.post("/chat", async (req, res) => {
  const { message, history } = req.body;
  if (!message) return res.status(400).json({ error: "Message is required" });
  const fullMessages = Array.isArray(history) ? [...history] : [];
  fullMessages.push({ role: "user", content: message });
  try {
    const chatResponse = await client.agents.complete({ agentId, messages: fullMessages });
    const botReply = chatResponse.choices[0]?.message?.content || "Sorry, I didn't understand that.";
    fullMessages.push({ role: "assistant", content: botReply });
    res.json({ reply: botReply, updatedHistory: fullMessages });
  } catch (error) {
    console.error("Mistral API error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/scholarships", async (req, res) => {
  const { title, description, amount, deadline } = req.body;
  if (!title || !description || !amount || !deadline) return res.status(400).json({ msg: "All fields required" });
  try {
    const newScholarship = await Scholarship.create({ title, description, amount, deadline });
    res.status(201).json({ msg: "Scholarship added", scholarship: newScholarship });
  } catch {
    res.status(500).json({ msg: "Failed to add scholarship" });
  }
});

app.get("/api/scholarships", async (req, res) => {
  try {
    const scholarships = await Scholarship.find().sort({ createdAt: -1 });
    res.json(scholarships);
  } catch {
    res.status(500).json({ msg: "Failed to fetch scholarships" });
  }
});

app.get("/api/scholarships/:id", async (req, res) => {
  try {
    const scholarship = await Scholarship.findById(req.params.id);
    if (!scholarship) return res.status(404).json({ msg: "Scholarship not found" });
    res.json(scholarship);
  } catch {
    res.status(500).json({ msg: "Error fetching scholarship" });
  }
});

app.put("/api/scholarships/:id", async (req, res) => {
  try {
    const updated = await Scholarship.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ msg: "Scholarship not found" });
    res.json({ msg: "Scholarship updated", scholarship: updated });
  } catch {
    res.status(500).json({ msg: "Failed to update scholarship" });
  }
});

app.delete("/api/scholarships/:id", async (req, res) => {
  try {
    const deleted = await Scholarship.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ msg: "Scholarship not found" });
    res.json({ msg: "Scholarship deleted" });
  } catch {
    res.status(500).json({ msg: "Failed to delete scholarship" });
  }
});

app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).select("-password");
    res.json(users);
  } catch {
    res.status(500).json({ msg: "Failed to fetch users" });
  }
});

app.post("/save-token", async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ msg: "Token is required" });
  try {
    console.log("Push token saved:", token);
    res.status(200).json({ msg: "Token received" });
  } catch {
    res.status(500).json({ msg: "Failed to save token" });
  }
});

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  socket.on("sendMessage", (data) => {
    const message = {
      text: (data.text || "").toString().trim(),
      sender: (data.sender || "Anonymous").toString().trim(),
    };
    io.emit("receiveMessage", message);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
