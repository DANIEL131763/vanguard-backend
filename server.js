require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt'); // Tambahan untuk enkripsi password

const app = express();

app.use(cors());
app.use(express.json()); 

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    ssl: {
        rejectUnauthorized: false // Wajib ditambahkan untuk keamanan cloud Aiven
    }
});

db.connect((err) => {
    if (err) {
        console.error('Gagal terhubung ke MySQL:', err.message);
        return;
    }
    console.log('✅ Berhasil terhubung ke database MySQL Vanguard Gym!');
});

// API ROUTE: REGISTRASI PENGGUNA BARU
app.post('/register', async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Cek apakah email sudah dipakai sebelumnya
        db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
            if (err) return res.status(500).json({ pesan: 'Terjadi kesalahan pada database.' });
            
            if (results.length > 0) {
                return res.status(400).json({ pesan: 'Email sudah terdaftar! Gunakan email lain.' });
            }

            // 2. Acak/Enkripsi kata sandi agar tidak bisa dibaca oleh siapapun (termasuk admin)
            const hashedPassword = await bcrypt.hash(password, 10);

            // 3. Simpan data ke dalam tabel MySQL
            db.query('INSERT INTO users (email, password) VALUES (?, ?)', [email, hashedPassword], (err, result) => {
                if (err) return res.status(500).json({ pesan: 'Gagal mendaftarkan akun.' });
                res.status(201).json({ pesan: 'Registrasi Berhasil! Silakan kembali ke Login.' });
            });
        });
    } catch (error) {
        res.status(500).json({ pesan: 'Terjadi kesalahan pada server.' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Sistem backend menyala di port http://localhost:${PORT}`);
});