require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const consul = require('consul');

const app = express();





// Middleware
app.use(bodyParser.json());
app.use(cors());

const consulClient = new consul({
  host: 'localhost',
  port: 8500,
  promisify: true,
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP' });
});



async function getMongoDBUri() {
  let mongoUri = '';
  let isUsingConsul = false; // Track if Consul service is used

  try {
    const mongoServiceName = process.env.MONGO_SERVICE; // Use 'mong  o' as the default service name
    const services = await consulClient.catalog.service.nodes(mongoServiceName);
    if (services && services.length > 0) {
      const randomIndex = Math.floor(Math.random() * services.length);
      const mongoInstance = services[randomIndex];
      mongoUri = `mongodb://${mongoInstance.Address}:${mongoInstance.ServicePort}/todos`;
      isUsingConsul = true; // Update flag
    } else {
      console.error(`MongoDB service "${mongoServiceName}" not found in Consul. Falling back to local MongoDB.`);
    }
  } catch (error) {
    console.error('Error getting MongoDB service from Consul:', error);
  }

  // If mongoUri is still empty, fallback to local MongoDB
  if (!mongoUri) {
    mongoUri = process.env.MONGO_URL || 'mongodb://localhost:27017/todos';
  }

  // Log whether Consul is used or fallback to local MongoDB
  if (isUsingConsul) {
    console.log('Using MongoDB URI retrieved from Consul:', mongoUri);
  } else {
    console.log('Using local MongoDB URI:', mongoUri);
  }

  return mongoUri;
}

// Connect to MongoDB
async function connectToMongoDB() {
  try {
    const mongoUri = await getMongoDBUri();
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
  }
}

connectToMongoDB().catch(console.error);

// Define Todo Schema
const todoSchema = new mongoose.Schema({
  text: String,
  completed: Boolean,
});

const Todo = mongoose.model('Todo', todoSchema);

app.get('/', async (req, res) => {
  res.json({ message: 'Welcome there....' });
});

// Routes
app.get('/todos', async (req, res) => {
  try {
    const todos = await Todo.find();
    res.json(todos);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/todos', async (req, res) => {
  try {
    const newTodo = new Todo({
      text: req.body.text,
      completed: req.body.completed || false,
    });
    const savedTodo = await newTodo.save();
    res.json(savedTodo);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.put('/todos/:id', async (req, res) => {
  try {
    const updatedTodo = await Todo.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedTodo);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.delete('/todos/:id', async (req, res) => {
  try {
    await Todo.findByIdAndDelete(req.params.id);
    res.json({ message: 'Todo deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));