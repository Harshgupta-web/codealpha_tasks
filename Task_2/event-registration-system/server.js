const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/event-registration', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB error:', err));

// Models
const eventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },
    location: { type: String, required: true },
    availableSeats: { type: Number, required: true, min: 0 },
    category: { type: String, required: true }
});

const registrationSchema = new mongoose.Schema({
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    userId: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String }
}, { timestamps: true });

const Event = mongoose.model('Event', eventSchema);
const Registration = mongoose.model('Registration', registrationSchema);

// Seed sample data
async function seedData() {
    const count = await Event.countDocuments();
    if (count === 0) {
        await Event.insertMany([
            {
                title: "Tech Conference 2023",
                description: "Annual technology conference featuring latest trends",
                date: new Date('2023-11-15'),
                location: "Convention Center",
                availableSeats: 100,
                category: "Technology"
            },
            {
                title: "Startup Pitch Competition",
                description: "Startups pitch to investors for funding",
                date: new Date('2023-12-05'),
                location: "Innovation Hub",
                availableSeats: 50,
                category: "Business"
            }
        ]);
        console.log("Sample events added");
    }
}

// API Endpoints
app.get('/api/events', async (req, res) => {
    try {
        const events = await Event.find();
        res.json(events);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/events/:id', async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ error: "Event not found" });
        res.json(event);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/events/:id/register', async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event || event.availableSeats <= 0) {
            return res.status(400).json({ error: "Event not available" });
        }

        const registration = new Registration({
            eventId: event._id,
            userId: req.body.email,
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone
        });

        await registration.save();
        await Event.updateOne({ _id: event._id }, { $inc: { availableSeats: -1 } });
        res.status(201).json(registration);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/users/:email/registrations', async (req, res) => {
    try {
        const registrations = await Registration.find({ email: req.params.email })
            .populate('eventId', 'title date location');
        res.json(registrations);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/registrations/:id', async (req, res) => {
    try {
        const registration = await Registration.findByIdAndDelete(req.params.id);
        if (registration) {
            await Event.updateOne({ _id: registration.eventId }, { $inc: { availableSeats: 1 } });
        }
        res.json({ message: "Registration cancelled" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    await seedData();
});
