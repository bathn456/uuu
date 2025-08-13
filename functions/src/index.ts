import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as express from 'express';
import * as cors from 'cors';
import * as multer from 'multer';
import ImageKit from 'imagekit';

// Initialize Firebase Admin
admin.initializeApp();

// Initialize Express app
const app = express();

// CORS configuration
app.use(cors({
  origin: true,
  credentials: true
}));

// Initialize ImageKit
const imagekit = new ImageKit({
  publicKey: functions.config().imagekit?.public_key || process.env.IMAGEKIT_PUBLIC_KEY || '',
  privateKey: functions.config().imagekit?.private_key || process.env.IMAGEKIT_PRIVATE_KEY || '',
  urlEndpoint: functions.config().imagekit?.url_endpoint || process.env.IMAGEKIT_URL_ENDPOINT || ''
});

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for Firebase Functions
    files: 5
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'image/svg+xml', 'image/bmp', 'image/tiff',
      'video/mp4', 'video/webm', 'video/ogg',
      'application/pdf', 'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not supported'), false);
    }
  }
});

// Security middleware
app.use((req, res, next) => {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  next();
});

// ImageKit authentication endpoint
app.get('/imagekit-auth', async (req, res) => {
  try {
    // Verify Firebase Auth token
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    if (!decodedToken.admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Generate ImageKit authentication parameters
    const authParams = imagekit.getAuthenticationParameters();
    
    res.json({
      ...authParams,
      publicKey: imagekit.options.publicKey,
      urlEndpoint: imagekit.options.urlEndpoint,
      configured: !!(imagekit.options.publicKey && imagekit.options.privateKey && imagekit.options.urlEndpoint)
    });
  } catch (error) {
    console.error('ImageKit auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// ImageKit upload endpoint
app.post('/imagekit-upload', upload.single('file'), async (req, res) => {
  try {
    // Verify Firebase Auth token
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    if (!decodedToken.admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Upload to ImageKit
    const uploadResponse = await imagekit.upload({
      file: req.file.buffer,
      fileName: req.file.originalname,
      folder: `/deep-learning-platform/${req.body.folder || 'uploads'}`,
      useUniqueFileName: true,
      tags: req.body.tags ? req.body.tags.split(',') : ['firebase-upload'],
      transformation: {
        pre: 'l-text,i-Deep Learning Platform,fs-16,l-end',
        post: []
      }
    });

    // Store metadata in Firestore
    await admin.firestore().collection('files').add({
      imagekitFileId: uploadResponse.fileId,
      fileName: uploadResponse.name,
      originalName: req.file.originalname,
      url: uploadResponse.url,
      thumbnailUrl: uploadResponse.thumbnailUrl,
      size: uploadResponse.size,
      height: uploadResponse.height,
      width: uploadResponse.width,
      filePath: uploadResponse.filePath,
      tags: uploadResponse.tags,
      uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
      uploadedBy: decodedToken.uid
    });

    res.json({
      fileId: uploadResponse.fileId,
      name: uploadResponse.name,
      url: uploadResponse.url,
      thumbnailUrl: uploadResponse.thumbnailUrl,
      height: uploadResponse.height,
      width: uploadResponse.width,
      size: uploadResponse.size,
      filePath: uploadResponse.filePath,
      tags: uploadResponse.tags
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Get optimized image URL
app.get('/optimize-image', (req, res) => {
  try {
    const { path: imagePath, width, height, quality, format } = req.query;
    
    if (!imagePath) {
      return res.status(400).json({ error: 'Image path is required' });
    }

    const transformation = [];
    if (width) transformation.push(`w-${width}`);
    if (height) transformation.push(`h-${height}`);
    if (quality) transformation.push(`q-${quality}`);
    if (format) transformation.push(`f-${format}`);

    const optimizedUrl = imagekit.url({
      path: imagePath as string,
      transformation: transformation
    });

    res.redirect(optimizedUrl);
  } catch (error) {
    console.error('Optimization error:', error);
    res.status(500).json({ error: 'Optimization failed' });
  }
});

// List files from ImageKit
app.get('/imagekit-files', async (req, res) => {
  try {
    // Verify Firebase Auth token
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    if (!decodedToken.admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { skip = '0', limit = '20', search, folder } = req.query;

    const files = await imagekit.listFiles({
      skip: parseInt(skip as string),
      limit: parseInt(limit as string),
      searchQuery: search as string,
      path: folder as string
    });

    res.json(files);
  } catch (error) {
    console.error('List files error:', error);
    res.status(500).json({ error: 'Failed to list files' });
  }
});

// Delete file from ImageKit
app.delete('/imagekit-file/:fileId', async (req, res) => {
  try {
    // Verify Firebase Auth token
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    if (!decodedToken.admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { fileId } = req.params;

    // Delete from ImageKit
    await imagekit.deleteFile(fileId);

    // Delete metadata from Firestore
    const filesRef = admin.firestore().collection('files');
    const snapshot = await filesRef.where('imagekitFileId', '==', fileId).get();
    
    const batch = admin.firestore().batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    res.status(204).send();
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Delete failed' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    imagekit: !!(imagekit.options.publicKey && imagekit.options.privateKey),
    version: '1.0.0'
  });
});

// Export the Express app as a Firebase Function
export const api = functions
  .runWith({
    memory: '1GB',
    timeoutSeconds: 540,
    maxInstances: 10
  })
  .https.onRequest(app);