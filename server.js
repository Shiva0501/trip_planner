const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, ''))); // Serve static files

// In-memory "database" (in a real app, use MongoDB, PostgreSQL, etc.)
let users = [];
let trips = [];

// Load data from files if they exist
try {
    const usersData = fs.readFileSync('data/users.json');
    users = JSON.parse(usersData);
} catch (error) {
    console.log('No users file found, starting with empty array');
}

try {
    const tripsData = fs.readFileSync('data/trips.json');
    trips = JSON.parse(tripsData);
} catch (error) {
    console.log('No trips file found, starting with empty array');
}

// Ensure data directory exists
if (!fs.existsSync('data')) {
    fs.mkdirSync('data');
}

// Helper function to save data to files
function saveData() {
    fs.writeFileSync('data/users.json', JSON.stringify(users, null, 2));
    fs.writeFileSync('data/trips.json', JSON.stringify(trips, null, 2));
}

// JWT Secret (in production, use environment variable)
const JWT_SECRET = 'your-super-secret-jwt-key-that-should-be-long-and-random';

// Routes

// Serve HTML files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/signin.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'signin.html'));
});

app.get('/dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// API Routes

// User Registration
app.post('/api/auth/register', async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;
        
        // Validate input
        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({ 
                error: 'All fields are required' 
            });
        }
        
        // Check if user already exists
        const existingUser = users.find(u => u.email === email);
        if (existingUser) {
            return res.status(400).json({ 
                error: 'User with this email already exists' 
            });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create new user
        const newUser = {
            id: Date.now().toString(),
            firstName,
            lastName,
            email,
            password: hashedPassword,
            createdAt: new Date().toISOString()
        };
        
        users.push(newUser);
        saveData();
        
        // Create JWT token
        const token = jwt.sign(
            { id: newUser.id, email: newUser.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        // Return user data (without password) and token
        const { password: _, ...userWithoutPassword } = newUser;
        res.json({ 
            user: userWithoutPassword, 
            token 
        });
        
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            error: 'Registration failed' 
        });
    }
});

// User Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Validate input
        if (!email || !password) {
            return res.status(400).json({ 
                error: 'Email and password are required' 
            });
        }
        
        // Find user
        const user = users.find(u => u.email === email);
        if (!user) {
            return res.status(401).json({ 
                error: 'Invalid credentials' 
            });
        }
        
        // Check password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ 
                error: 'Invalid credentials' 
            });
        }
        
        // Create JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        // Return user data (without password) and token
        const { password: _, ...userWithoutPassword } = user;
        res.json({ 
            user: userWithoutPassword, 
            token 
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            error: 'Login failed' 
        });
    }
});

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (token == null) return res.sendStatus(401);
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

// Get user profile
app.get('/api/auth/profile', authenticateToken, (req, res) => {
    const user = users.find(u => u.id === req.user.id);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    const { password, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
});

// Get all trips for current user
app.get('/api/trips', authenticateToken, (req, res) => {
    const userTrips = trips.filter(trip => 
        trip.userId === req.user.id
    );
    res.json({ trips: userTrips });
});

// Create a new trip
app.post('/api/trips', authenticateToken, async (req, res) => {
    try {
        const { name, destination, type, startDate, endDate, description } = req.body;
        
        // Validate required fields
        if (!name || !destination || !startDate || !endDate) {
            return res.status(400).json({ 
                error: 'Name, destination, start date, and end date are required' 
            });
        }
        
        // Create new trip
        const newTrip = {
            id: Date.now().toString(),
            userId: req.user.id,
            name,
            destination,
            type: type || 'leisure',
            startDate,
            endDate,
            description: description || '',
            createdAt: new Date().toISOString(),
            travelers: [],
            photos: [],
            notes: [],
            itinerary: []
        };
        
        trips.push(newTrip);
        saveData();
        
        res.status(201).json({ trip: newTrip });
        
    } catch (error) {
        console.error('Create trip error:', error);
        res.status(500).json({ 
            error: 'Failed to create trip' 
        });
    }
});

// Get a specific trip
app.get('/api/trips/:id', authenticateToken, (req, res) => {
    const trip = trips.find(t => t.id === req.params.id);
    
    if (!trip) {
        return res.status(404).json({ error: 'Trip not found' });
    }
    
    // Check if user owns this trip
    if (trip.userId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json({ trip });
});

// Update a trip
app.put('/api/trips/:id', authenticateToken, (req, res) => {
    const tripIndex = trips.findIndex(t => t.id === req.params.id);
    
    if (tripIndex === -1) {
        return res.status(404).json({ error: 'Trip not found' });
    }
    
    // Check if user owns this trip
    if (trips[tripIndex].userId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    // Update trip properties
    const { name, destination, type, startDate, endDate, description } = req.body;
    
    if (name) trips[tripIndex].name = name;
    if (destination) trips[tripIndex].destination = destination;
    if (type) trips[tripIndex].type = type;
    if (startDate) trips[tripIndex].startDate = startDate;
    if (endDate) trips[tripIndex].endDate = endDate;
    if (description !== undefined) trips[tripIndex].description = description;
    
    trips[tripIndex].updatedAt = new Date().toISOString();
    
    saveData();
    
    res.json({ trip: trips[tripIndex] });
});

// Delete a trip
app.delete('/api/trips/:id', authenticateToken, (req, res) => {
    const tripIndex = trips.findIndex(t => t.id === req.params.id);
    
    if (tripIndex === -1) {
        return res.status(404).json({ error: 'Trip not found' });
    }
    
    // Check if user owns this trip
    if (trips[tripIndex].userId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    const deletedTrip = trips.splice(tripIndex, 1)[0];
    saveData();
    
    res.json({ message: 'Trip deleted successfully', trip: deletedTrip });
});

// Add a traveler to a trip
app.post('/api/trips/:id/travelers', authenticateToken, (req, res) => {
    const tripIndex = trips.findIndex(t => t.id === req.params.id);
    
    if (tripIndex === -1) {
        return res.status(404).json({ error: 'Trip not found' });
    }
    
    // Check if user owns this trip
    if (trips[tripIndex].userId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    const { name, email, role } = req.body;
    
    if (!name) {
        return res.status(400).json({ error: 'Name is required' });
    }
    
    const newTraveler = {
        id: Date.now().toString(),
        name,
        email: email || '',
        role: role || 'guest',
        createdAt: new Date().toISOString()
    };
    
    if (!trips[tripIndex].travelers) {
        trips[tripIndex].travelers = [];
    }
    
    trips[tripIndex].travelers.push(newTraveler);
    trips[tripIndex].updatedAt = new Date().toISOString();
    
    saveData();
    
    res.status(201).json({ traveler: newTraveler });
});

// Add a photo to a trip
app.post('/api/trips/:id/photos', authenticateToken, (req, res) => {
    const tripIndex = trips.findIndex(t => t.id === req.params.id);
    
    if (tripIndex === -1) {
        return res.status(404).json({ error: 'Trip not found' });
    }
    
    // Check if user owns this trip
    if (trips[tripIndex].userId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    const { url, caption } = req.body;
    
    if (!url) {
        return res.status(400).json({ error: 'Photo URL is required' });
    }
    
    const newPhoto = {
        id: Date.now().toString(),
        url,
        caption: caption || '',
        uploadedAt: new Date().toISOString()
    };
    
    if (!trips[tripIndex].photos) {
        trips[tripIndex].photos = [];
    }
    
    trips[tripIndex].photos.push(newPhoto);
    trips[tripIndex].updatedAt = new Date().toISOString();
    
    saveData();
    
    res.status(201).json({ photo: newPhoto });
});

// Add a note to a trip
app.post('/api/trips/:id/notes', authenticateToken, (req, res) => {
    const tripIndex = trips.findIndex(t => t.id === req.params.id);
    
    if (tripIndex === -1) {
        return res.status(404).json({ error: 'Trip not found' });
    }
    
    // Check if user owns this trip
    if (trips[tripIndex].userId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    const { title, content } = req.body;
    
    if (!title || !content) {
        return res.status(400).json({ 
            error: 'Title and content are required' 
        });
    }
    
    const newNote = {
        id: Date.now().toString(),
        title,
        content,
        createdAt: new Date().toISOString()
    };
    
    if (!trips[tripIndex].notes) {
        trips[tripIndex].notes = [];
    }
    
    trips[tripIndex].notes.push(newNote);
    trips[tripIndex].updatedAt = new Date().toISOString();
    
    saveData();
    
    res.status(201).json({ note: newNote });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Something went wrong!' 
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app;