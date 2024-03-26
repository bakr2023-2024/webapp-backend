require("dotenv").config();
const express = require("express");
const app = express();
const { Client } = require("pg");
const cors = require("cors");
const client = new Client({
  host: process.env.CLOUD_HOST,
  port: process.env.CLOUD_PORT,
  user: process.env.CLOUD_USER,
  password: process.env.CLOUD_PASSWORD,
  database: process.env.CLOUD_DATABASE,
  ssl: {
    rejectUnauthorized: false,
  },
});

(async function func() {
  try {
    await client.connect();
  } catch (err) {
    console.error(err);
  }
})();

app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

// GET all users
app.get("/users", async (req, res) => {
  try {
    const result = await client.query("SELECT * FROM users");
    const users = result.rows;
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Error fetching users" });
  }
});

// // GET a single user by ID
app.get("/users/:id", async (req, res) => {
  const userId = req.params.id;
  try {
    const result = await client.query("SELECT * FROM users WHERE id = $1", [
      userId,
    ]);
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Error fetching user" });
  }
});

// // POST create a new user
app.post("/users", async (req, res) => {
  const { name, job } = req.body;
  if (!name || !job) {
    res.status(400).json({ error: "Name and job are required" });
    return;
  }
  try {
    const result = await client.query(
      "INSERT INTO users(name, job) VALUES ($1, $2) RETURNING *",
      [name, job]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Error creating user" });
  }
});

// // PUT update an existing user
app.put("/users/:id", async (req, res) => {
  const userId = req.params.id;
  const { name, job } = req.body;
  if (!name || !job) {
    res.status(400).json({ error: "Name and job are required" });
    return;
  }
  try {
    const result = await client.query(
      "UPDATE users SET name = $1, job = $2 WHERE id = $3 RETURNING *",
      [name, job, userId]
    );
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Error updating user" });
  }
});

// // DELETE delete an existing user
app.delete("/users/:id", async (req, res) => {
  const userId = req.params.id;
  try {
    const result = await client.query(
      "DELETE FROM users WHERE id = $1 RETURNING *",
      [userId]
    );
    if (result.rows.length > 0) {
      res.json({ message: "User deleted successfully" });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Error deleting user" });
  }
});

app.listen(3000, () => {
  console.log(`Server is running on http://localhost:3000`);
});
