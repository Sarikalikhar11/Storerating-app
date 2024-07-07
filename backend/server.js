const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 5000;
const DB_URI =
  'mongodb+srv://sarikalikhar11:Sudhirkonge11@rolixer-task.byuadmc.mongodb.net/';

mongoose
  .connect(DB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log(err));

// User Schema
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  address: { type: String, required: true },
  role: { type: String, enum: ['admin', 'user', 'storeOwner'], required: true },
});

// Store Schema
const StoreSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  address: { type: String, required: true },
  rating: { type: Number, default: 0 },
});

const User = mongoose.model('User', UserSchema);
const Store = mongoose.model('Store', StoreSchema);

// Middleware to authenticate and authorize
const auth = (roles) => (req, res, next) => {
  try {
    const authHeader = req.headers['x-auth-token'];
    const token = authHeader && authHeader.split(' ')[1];
    // const token = req.header('x-auth-token');
    if (!token)
      return res.status(401).send('Access Denied. No token provided.');

    try {
      const decoded = jwt.verify(token, 'jwtSecret');
      req.user = decoded;
      if (!roles.includes(req.user.role))
        return res.status(403).send('Access Denied. Not authorized.');
      next();
    } catch (err) {
      res.status(400).send('Invalid token.');
    }
  } catch (err) {
    console.log(err);
  }
};

// Register Route
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password, address, role } = req.body;

    if (!name || !email || !password || !address || !role) {
      return res.status(400).send('All fields are required.');
    }

    let user = await User.findOne({ email });
    if (user) return res.status(400).send('User already exists.');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      name,
      email,
      password: hashedPassword,
      address,
      role,
    });

    await user.save();

    const token = jwt.sign({ _id: user._id, role: user.role }, 'jwtSecret');
    res.header('x-auth-token', token).send('User registered successfully.');
  } catch (err) {
    console.log(err);
  }
});

// Login Route
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).send('All fields are required.');

    const user = await User.findOne({ email });
    if (!user) return res.status(400).send('Invalid email or password.');

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword)
      return res.status(400).send('Invalid email or password.');

    const token = jwt.sign({ _id: user._id, role: user.role }, 'jwtSecret');
    res.header('x-auth-token', token).send('Logged in successfully.');
  } catch (err) {
    console.log(err);
  }
});

// Admin: Add Stores and Users
app.post('/api/admin/add-store', auth(['admin']), async (req, res) => {
  try {
    const { name, email, address } = req.body;

    if (!name || !email || !address) {
      return res.status(400).send('All fields are required.');
    }

    const store = new Store({
      name,
      email,
      address,
    });

    await store.save();
    res.send('Store added successfully.');
  } catch (err) {
    console.log(err);
  }
});

app.post('/api/admin/add-user', auth(['admin']), async (req, res) => {
  try {
    const { name, email, password, address, role } = req.body;

    if (!name || !email || !password || !address || !role) {
      return res.status(400).send('All fields are required.');
    }

    let user = await User.findOne({ email });
    if (user) return res.status(400).send('User already exists.');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      name,
      email,
      password: hashedPassword,
      address,
      role,
    });

    await user.save();
    res.send('User added successfully.');
  } catch (err) {
    console.log(err);
  }
});

// Add this route to fetch all stores
app.get('/api/stores', async (req, res) => {
  try {
    const stores = await Store.find();
    res.json(stores);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

app.get('/api/users', auth(['admin']), async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// Start the server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
