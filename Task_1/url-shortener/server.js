   require('dotenv').config();
   const express = require('express');
   const mongoose = require('mongoose');
   const path = require('path');
   const app = express();

   // Middleware
   app.use(express.json());
   app.use(express.static(path.join(__dirname, 'public')));

   // MongoDB Connection
   mongoose.connect(process.env.MONGODB_URI)
     .then(() => console.log('✅ Connected to MongoDB'))
     .catch(err => console.error('❌ MongoDB connection error:', err));

   // URL Schema
   const urlSchema = new mongoose.Schema({
     longUrl: { type: String, required: true },
     shortCode: { type: String, required: true, unique: true },
     clicks: { type: Number, default: 0 },
     createdAt: { type: Date, default: Date.now }
   });
   const Url = mongoose.model('Url', urlSchema);

   // API Routes
   app.post('/api/shorten', async (req, res) => {
     try {
       const { longUrl } = req.body;
       if (!new URL(longUrl)) return res.status(400).json({ error: 'Invalid URL' });
       
       let url = await Url.findOne({ longUrl });
       if (url) return res.json({ shortUrl: `${req.headers.host}/${url.shortCode}` });
       
       const { nanoid } = await import('nanoid'); // Dynamic import
       const shortCode = nanoid(6);
       url = await Url.create({ longUrl, shortCode });
       res.json({ shortUrl: `${req.headers.host}/${shortCode}` });
     } catch (err) {
       res.status(500).json({ error: 'Server error' });
     }
   });

   app.get('/:shortCode', async (req, res) => {
     try {
       const url = await Url.findOneAndUpdate(
         { shortCode: req.params.shortCode },
         { $inc: { clicks: 1 } }
       );
       if (!url) return res.status(404).send('URL not found');
       res.redirect(url.longUrl);
     } catch (err) {
       res.status(500).send('Server error');
     }
   });

   app.get('/api/urls', async (req, res) => {
     try {
       const urls = await Url.find().sort({ createdAt: -1 });
       res.json(urls);
     } catch (err) {
       res.status(500).json({ error: 'Server error' });
     }
   });

   // Start Server
   app.listen(process.env.PORT, () => {
     console.log(`Server running on http://localhost:${process.env.PORT}`);
   });
   