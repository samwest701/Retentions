require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// PostgreSQL connection
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
  ssl: {
    rejectUnauthorized: false, // Set to true in production with a verified CA
  },
});

// Input validation middleware
const validateInput = (schema) => async (req, res, next) => {
  try {
    await schema.validateAsync(req.body);
    next();
  } catch (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
};

// Middleware to verify JWT
const authenticate = (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) throw new Error("No token provided");

    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(401).json({ error: "Authentication failed" });
  }
};

// Create tables (run once)
pool.query(`
CREATE TABLE IF NOT EXISTS users (
id SERIAL PRIMARY KEY,
email TEXT UNIQUE NOT NULL,
password TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS clients (
id SERIAL PRIMARY KEY,
user_id INTEGER REFERENCES users(id),
name TEXT NOT NULL,
discount_rate INTEGER NOT NULL,
subscription_status TEXT DEFAULT 'active',
subscription_start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
next_billing_date TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '1 month')
);
CREATE TABLE IF NOT EXISTS cancellations (
id SERIAL PRIMARY KEY,
client_id INTEGER REFERENCES clients(id),
user_id TEXT NOT NULL,
discount_offered BOOLEAN,
accepted BOOLEAN,
reason TEXT,
feedback TEXT,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Register a new user
app.post("/api/register", async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email",
      [email, hashedPassword]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.constraint === "users_email_key") {
      return res.status(409).json({ error: "Email already exists" });
    }
    res.status(500).json({ error: "Server error" });
  }
});

// Log in a user
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [
    email,
  ]);
  if (result.rows.length === 0) {
    return res.status(400).json({ error: "Invalid email or password" });
  }
  const user = result.rows[0];
  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return res.status(400).json({ error: "Invalid email or password" });
  }
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);
  res.json({ token });
});

// Add a new client
app.post("/api/clients", authenticate, async (req, res) => {
  const { name, discount_rate } = req.body;

  try {
    if (!name || discount_rate === undefined) {
      return res
        .status(400)
        .json({ error: "Name and discount rate are required" });
    }

    const result = await pool.query(
      "INSERT INTO clients (user_id, name, discount_rate) VALUES ($1, $2, $3) RETURNING *",
      [req.user.id, name, discount_rate]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Track cancellation event
app.post("/api/cancellations", authenticate, async (req, res) => {
  const { client_id, user_id, discount_offered, accepted, reason, feedback } =
    req.body;

  const client = await pool.query(
    "SELECT subscription_status FROM clients WHERE id = $1",
    [client_id]
  );

  if (accepted) {
    // Update client with new discount and reset status
    await pool.query(
      `UPDATE clients 
       SET subscription_status = 'active', 
           next_billing_date = CURRENT_TIMESTAMP + INTERVAL '1 month'
       WHERE id = $1`,
      [client_id]
    );
  } else {
    // Mark subscription as cancelled
    await pool.query(
      "UPDATE clients SET subscription_status = 'cancelled' WHERE id = $1",
      [client_id]
    );
  }

  const result = await pool.query(
    `INSERT INTO cancellations 
     (client_id, user_id, discount_offered, accepted, reason, feedback) 
     VALUES ($1, $2, $3, $4, $5, $6) 
     RETURNING *`,
    [client_id, user_id, discount_offered, accepted, reason, feedback]
  );

  res.json(result.rows[0]);
});

// Get all clients for the logged-in user
app.get("/api/clients", authenticate, async (req, res) => {
  const result = await pool.query("SELECT * FROM clients WHERE user_id = $1", [
    req.user.id,
  ]);
  res.json(result.rows);
});

// Get cancellation analytics for the logged-in user
app.get("/api/analytics", authenticate, async (req, res) => {
  const result = await pool.query(
    `
    SELECT 
        clients.name,
        clients.subscription_status,
        COUNT(cancellations.id) AS total_cancellations,
        SUM(CASE WHEN cancellations.accepted THEN 1 ELSE 0 END) AS accepted_offers,
        ROUND(AVG(CASE WHEN cancellations.accepted THEN clients.discount_rate ELSE 0 END), 2) AS avg_retention_discount,
        STRING_AGG(DISTINCT cancellations.reason, ', ') AS common_reasons
    FROM clients
    LEFT JOIN cancellations ON clients.id = cancellations.client_id
    WHERE clients.user_id = $1
    GROUP BY clients.name, clients.subscription_status;
    `,
    [req.user.id]
  );
  res.json(result.rows);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something broke!" });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
