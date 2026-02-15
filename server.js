const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Database Setup
const db = new sqlite3.Database('./jobs.db');

db.run(`CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company TEXT,
    role TEXT,
    status TEXT,
    app_date TEXT,
    follow_up TEXT,
    job_link TEXT,
    notes TEXT
)`);

// API Routes
app.get('/api/jobs', (req, res) => {
    db.all("SELECT * FROM jobs", [], (err, rows) => {
        if (err) res.status(500).json({ error: err.message });
        else res.json(rows);
    });
});

app.post('/api/jobs', (req, res) => {
    const { company, role, status, app_date, follow_up, job_link, notes } = req.body;
    const sql = `INSERT INTO jobs (company, role, status, app_date, follow_up,job_link, notes) VALUES (?,?,?,?,?,?,?)`;
    db.run(sql, [company, role, status, app_date, follow_up, job_link, notes], function(err) {
        if (err) res.status(500).json({ error: err.message });
        else res.json({ id: this.lastID });
    });
});
app.put('/api/jobs/:id', (req, res) => {
    const { company, role, status, app_date, follow_up, notes } = req.body;
    const sql = `UPDATE jobs SET company=?, role=?, status=?, app_date=?, follow_up=?, notes=? WHERE id=?`;
    db.run(sql, [company, role, status, app_date, follow_up, notes, req.params.id], (err) => {
        if (err) res.status(500).json({ error: err.message });
        else res.json({ updated: true });
    });
});
app.delete('/api/jobs/:id', (req, res) => {
    db.run(`DELETE FROM jobs WHERE id = ?`, req.params.id, (err) => {
        if (err) res.status(500).json({ error: err.message });
        else res.json({ deleted: true });
    });
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));