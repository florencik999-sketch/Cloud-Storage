require("dotenv").config();
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const app = express();
app.use(cors());
app.use(express.json());

/* =========================
   🔐 AUTH CONFIG
========================= */
const AUTH_SECRET = process.env.AUTH_SECRET;
const USERS_FILE = path.join(__dirname, "../data/users.json");

/* =========================
   💾 STORAGE PATH (D DRIVE)
========================= */
const BASE = "D:\\Cloud Storage Data";

if (!fs.existsSync(BASE)) {
  fs.mkdirSync(BASE, { recursive: true });
}

// Initialize users file if it doesn't exist
if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, JSON.stringify({}, null, 2));
}

/* =========================
   🔒 SECURITY (PATH CLEAN)
========================= */
function safePath(p = "") {
  return p.replace(/(\.\.[/\\])/g, "");
}

/* =========================
   � USER MANAGEMENT
========================= */
function getUsers() {
  try {
    const data = fs.readFileSync(USERS_FILE, "utf8");
    return JSON.parse(data);
  } catch (err) {
    return {};
  }
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

async function addUser(username, password) {
  const users = getUsers();
  if (users[username]) {
    throw new Error("User already exists");
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  users[username] = { password: hashedPassword };
  saveUsers(users);
  // Create user directory
  const userDir = path.join(BASE, username);
  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true });
  }
}

/* =========================
   �📦 MULTER CONFIG
========================= */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const username = req.user.user;
    let folder = safePath(req.body.folder || "");
    const uploadPath = path.join(BASE, username, folder);

    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype.startsWith("image/") ||
      file.mimetype.startsWith("video/")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only images and videos allowed"));
    }
  },
});

/* =========================
   🔐 AUTH MIDDLEWARE
========================= */
function authMiddleware(req, res, next) {
  const header = req.headers.authorization;

  if (!header) {
    return res.status(403).json({ message: "No token" });
  }

  const token = header.split(" ")[1]; // Bearer TOKEN

  try {
    const decoded = jwt.verify(token, AUTH_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
}

/* =========================
   � REGISTER ROUTE
========================= */
app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password required" });
  }

  try {
    await addUser(username, password);
    res.json({ message: "User registered successfully" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/* =========================
   �🔑 LOGIN ROUTE
========================= */
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const users = getUsers();
  const user = users[username];

  if (user) {
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (isValidPassword) {
      const token = jwt.sign(
        { user: username },
        AUTH_SECRET,
        { expiresIn: "2h" }, // token expires
      );

      return res.json({ token });
    }
  }

  res.status(401).json({ message: "Invalid credentials" });
});

/* =========================
   📁 LIST FILES/FOLDERS
========================= */
app.get("/list", authMiddleware, (req, res) => {
  const relativePath = safePath(req.query.path || "");
  const dir = path.join(BASE, req.user.user, relativePath);

  if (!fs.existsSync(dir)) {
    return res.json([]);
  }

  const items = fs.readdirSync(dir).map((name) => {
    const full = path.join(dir, name);
    const isDir = fs.statSync(full).isDirectory();

    return {
      name,
      type: isDir ? "folder" : "file",
    };
  });

  res.json(items);
});

/* =========================
   📁 CREATE FOLDER
========================= */
app.post("/create-folder", authMiddleware, (req, res) => {
  const relativePath = safePath(req.body.path || "");
  const dir = path.join(BASE, req.user.user, relativePath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  res.json({ message: "Folder created" });
});

/* =========================
   📤 UPLOAD (MULTIPLE FILES)
========================= */
app.post("/upload", authMiddleware, upload.array("images"), (req, res) => {
  console.log("Folder:", req.body.folder);
  console.log("Files uploaded:", req.files.length);

  res.json({
    message: "Upload successful",
    files: req.files,
  });
});

/* =========================
   ❌ DELETE FILE/FOLDER
========================= */
app.post("/delete", authMiddleware, (req, res) => {
  const relativePath = safePath(req.body.path || "");
  const target = path.join(BASE, req.user.user, relativePath);

  if (fs.existsSync(target)) {
    fs.rmSync(target, { recursive: true, force: true });
  }

  res.json({ message: "Deleted successfully" });
});

/* =========================
   🖼 SERVE FILES
========================= */
app.get("/files", authMiddleware, (req, res) => {
  const filePath = req.path.substring(7); // Remove "/files/" prefix (6 chars + 1 for /)
  const safeFilePath = safePath(filePath);
  const fullPath = path.join(BASE, req.user.user, safeFilePath);

  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
    res.sendFile(fullPath);
  } else {
    res.status(404).json({ message: "File not found" });
  }
});

/* =========================
   🧪 ROOT TEST
========================= */
app.get("/", (req, res) => {
  res.send("Cloud Storage Server Running");
});

/* =========================
   🚀 START SERVER
========================= */
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
