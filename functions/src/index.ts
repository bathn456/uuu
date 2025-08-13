import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import express from 'express';
import cors from 'cors';

// Initialize Firebase Admin
admin.initializeApp();

// Initialize Express app
const app = express();

// Trust proxy for Firebase Functions
app.set("trust proxy", 1);
app.disable("x-powered-by");

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb", parameterLimit: 10000 }));

// CORS configuration
app.use(cors({
  origin: true,
  credentials: true
}));

// Basic routes for your deep learning platform
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Admin authentication endpoint
app.post('/api/auth/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Simple admin check (you should implement proper authentication)
    if (email === 'admin@example.com' && password === 'batu4567_%%') {
      const token = 'admin-token-' + Date.now();
      res.json({ 
        success: true, 
        token,
        message: 'Admin login successful'
      });
    } else {
      res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Get algorithms endpoint
app.get('/api/algorithms', async (req, res) => {
  try {
    // Get algorithms from Firestore
    const snapshot = await admin.firestore().collection('algorithms').get();
    const algorithms = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json(algorithms);
  } catch (error) {
    console.error('Error fetching algorithms:', error);
    res.status(500).json({ error: 'Failed to fetch algorithms' });
  }
});

// Create algorithm endpoint
app.post('/api/algorithms', async (req, res) => {
  try {
    const algorithmData = req.body;
    const docRef = await admin.firestore().collection('algorithms').add({
      ...algorithmData,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.json({ 
      id: docRef.id, 
      ...algorithmData,
      message: 'Algorithm created successfully'
    });
  } catch (error) {
    console.error('Error creating algorithm:', error);
    res.status(500).json({ error: 'Failed to create algorithm' });
  }
});

// Delete algorithm endpoint
app.delete('/api/algorithms/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await admin.firestore().collection('algorithms').doc(id).delete();
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting algorithm:', error);
    res.status(500).json({ error: 'Failed to delete algorithm' });
  }
});

// Get projects endpoint
app.get('/api/projects', async (req, res) => {
  try {
    const snapshot = await admin.firestore().collection('projects').get();
    const projects = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Create project endpoint
app.post('/api/projects', async (req, res) => {
  try {
    const projectData = req.body;
    const docRef = await admin.firestore().collection('projects').add({
      ...projectData,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.json({ 
      id: docRef.id, 
      ...projectData,
      message: 'Project created successfully'
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Delete project endpoint
app.delete('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await admin.firestore().collection('projects').doc(id).delete();
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// Files endpoints (using Firestore for metadata and local/cloud storage)
app.get('/api/files', async (req, res) => {
  try {
    const snapshot = await admin.firestore().collection('files').get();
    const files = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json(files);
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

// Export the Express app as a Firebase Function
export const api = onRequest({
  memory: '1GiB',
  timeoutSeconds: 540,
  maxInstances: 10
}, app);