import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import { insertAlgorithmSchema, insertAlgorithmContentSchema, insertProjectSchema, insertFileSchema, insertNoteSchema } from "../shared/schema.js";
import multer from "multer";
import path from "path";
import { z } from "zod";
import rateLimit from 'express-rate-limit';
import { AdminAuth, requireAdmin, securityHeaders, AuthenticatedRequest, loginRateLimit } from "./auth.js";
import ImageKitService from "./imagekit-service.js";

// Configure multer for file uploads with high quality settings
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 2 * 1024 * 1024 * 1024, // Increased to 2GB limit for ultra-high quality files
    fieldSize: 50 * 1024 * 1024, // 50MB field size limit for massive data
    fields: 50, // Maximum number of fields
    files: 20, // Maximum number of files per request
  },
  // Preserve original filename and add quality options
  preservePath: false,
  // Optional: Add file filter for better quality control
  fileFilter: (req, file, cb) => {
    // Allow highest quality file types for professional content
    const allowedTypes = [
      // Ultra-high quality image formats
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 
      'image/tiff', 'image/tif', 'image/bmp', 'image/svg+xml', 'image/avif',
      'image/heic', 'image/heif', 'image/raw', 'image/dng', 'image/cr2',
      // Professional documents
      'application/pdf', 'text/plain', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      // Professional video formats (4K/8K support)
      'video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov',
      'video/quicktime', 'video/x-msvideo', 'video/mkv', 'video/x-matroska',
      'video/mp2t', 'video/3gpp', 'video/x-flv', 'video/x-ms-wmv',
      // Professional audio formats
      'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3', 'audio/flac',
      'audio/aac', 'audio/x-aiff', 'audio/x-wav', 'audio/x-m4a'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const error = new Error(`File type '${file.mimetype}' not supported for ultra-high quality upload. Supported formats include professional image, video, audio, and document formats.`);
      cb(error as any, false);
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Apply security headers to all routes
  app.use(securityHeaders);

  // General rate limiting
  const generalRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: { error: 'Too many requests from this IP, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(generalRateLimit);

  // Strict rate limiting for login attempts
  const strictLoginLimit = rateLimit(loginRateLimit);

  // Algorithm routes
  app.get("/api/algorithms", async (req, res) => {
    try {
      // Set response headers for optimal caching
      res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minutes cache
      res.setHeader('ETag', `algorithms-${Date.now()}`);
      
      const algorithms = await storage.getAlgorithms();
      res.json(algorithms);
    } catch (error) {
      console.error('Error fetching algorithms:', error);
      res.status(500).json({ message: "Failed to fetch algorithms" });
    }
  });

  app.get("/api/algorithms/:id", async (req, res) => {
    try {
      const algorithm = await storage.getAlgorithm(req.params.id);
      if (!algorithm) {
        return res.status(404).json({ message: "Algorithm not found" });
      }
      res.json(algorithm);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch algorithm" });
    }
  });

  app.post("/api/algorithms", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertAlgorithmSchema.parse(req.body);
      const algorithm = await storage.createAlgorithm(validatedData);
      res.status(201).json(algorithm);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create algorithm" });
    }
  });

  app.delete("/api/algorithms/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteAlgorithm(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete algorithm" });
    }
  });

  // Algorithm content routes
  app.get("/api/algorithm-content", async (req, res) => {
    try {
      const content = await storage.getAllAlgorithmContent();
      res.json(content);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch algorithm content" });
    }
  });

  app.get("/api/algorithms/:id/content", async (req, res) => {
    try {
      const content = await storage.getAlgorithmContent(req.params.id);
      res.json(content);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch algorithm content" });
    }
  });

  app.post("/api/algorithms/:id/content", requireAdmin, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const contentData = {
        algorithmId: req.params.id,
        title: req.body.title || req.file.originalname,
        description: req.body.description || '',
        fileName: req.file.filename, // Use hashed filename for proper serving
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        filePath: req.file.filename, // Store hashed filename for consistent access
        category: req.body.category || 'tutorial',
      };

      const validatedData = insertAlgorithmContentSchema.parse(contentData);
      const content = await storage.createAlgorithmContent(validatedData);
      res.status(201).json(content);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create content" });
    }
  });

  app.delete("/api/content/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteAlgorithmContent(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete content" });
    }
  });

  // Project routes
  app.get("/api/projects", async (req, res) => {
    try {
      // Optimize caching for projects
      res.setHeader('Cache-Control', 'public, max-age=600'); // 10 minutes cache
      
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (error) {
      console.error('Error fetching projects:', error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.post("/api/projects", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(validatedData);
      res.status(201).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  app.delete("/api/projects/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteProject(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // File management routes
  app.get("/api/files", async (req, res) => {
    try {
      // Optimize file list caching
      res.setHeader('Cache-Control', 'public, max-age=180'); // 3 minutes cache
      
      const { category, relatedId } = req.query;
      const files = await storage.getFiles(
        category as string,
        relatedId as string
      );
      res.json(files);
    } catch (error) {
      console.error('Error fetching files:', error);
      res.status(500).json({ message: "Failed to fetch files" });
    }
  });

  app.post("/api/files", requireAdmin, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Check if ImageKit is configured and should be used
      const useImageKit = ImageKitService.isConfigured() && (req.body.useImageKit === 'true' || req.body.useImageKit === true);
      
      let fileData: any = {
        fileName: req.file.filename,
        originalName: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        filePath: req.file.path,
        category: req.body.category || 'general',
        relatedId: req.body.relatedId || null,
        isImagekitStored: 0
      };

      // Upload to ImageKit if configured and requested
      if (useImageKit) {
        try {
          const imagekitResult = await ImageKitService.uploadLocalFile(req.file.path, {
            fileName: req.file.originalname,
            folder: `/deep-learning-platform/${req.body.category || 'general'}`,
            tags: [req.body.category || 'general', 'uploaded-file']
          });

          fileData = {
            ...fileData,
            isImagekitStored: 1,
            imagekitFileId: imagekitResult.fileId,
            imagekitUrl: imagekitResult.url,
            imagekitThumbnailUrl: imagekitResult.thumbnailUrl
          };

          console.log('File uploaded to ImageKit successfully:', imagekitResult.url);
        } catch (imagekitError) {
          console.error('ImageKit upload failed, falling back to local storage:', imagekitError);
          // Continue with local storage if ImageKit fails
        }
      }

      const validatedData = insertFileSchema.parse(fileData);
      const file = await storage.createFile(validatedData);
      res.status(201).json(file);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error('File upload error:', error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  app.delete("/api/files/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteFile(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete file" });
    }
  });

  app.delete("/api/files/category/:category", requireAdmin, async (req, res) => {
    try {
      const { relatedId } = req.query;
      await storage.deleteFilesByCategory(
        req.params.category,
        relatedId as string
      );
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete files" });
    }
  });

  // Serve uploaded files by hashed filename
  // High-quality download endpoint - supports both files and algorithm content
  app.get("/api/download/:fileId", async (req, res) => {
    try {
      const { fileId } = req.params;
      
      // First, try to find the file in regular files
      const files = await storage.getFiles();
      let file = files.find(f => f.id === fileId);
      let filePath;
      let originalName;
      
      if (file) {
        filePath = path.join(process.cwd(), 'uploads', file.fileName);
        originalName = file.originalName;
      } else {
        // If not found in files, search in algorithm content
        const algorithms = await storage.getAlgorithms();
        let content: any = null;
        
        for (const algorithm of algorithms) {
          const algorithmContent = await storage.getAlgorithmContent(algorithm.id);
          content = algorithmContent.find(c => c.id === fileId);
          if (content) break;
        }
        
        if (!content) {
          return res.status(404).json({ message: "File not found" });
        }
        
        // Use content properties as file properties
        file = {
          id: content.id,
          fileName: content.fileName,
          fileType: content.fileType,
          fileSize: content.fileSize,
          createdAt: content.createdAt,
          filePath: content.filePath,
          category: content.category,
          relatedId: content.algorithmId,
          originalName: content.title,
          uploadedBy: 'admin',
          imagekitFileId: null,
          imagekitUrl: null,
          imagekitThumbnailUrl: null,
          isImagekitStored: 0
        };
        filePath = path.join(process.cwd(), 'uploads', content.fileName);
        originalName = content.title; // Use title as original name for algorithm content
      }
      
      if (!file) {
        return res.status(404).json({ message: "File not found after processing" });
      }
      
      const fs = await import('fs');
      
      if (!fs.existsSync(filePath)) {
        console.error(`Physical file not found: ${filePath}`);
        return res.status(404).json({ message: "Physical file not found" });
      }
      
      // Set ultra-high quality download headers with performance optimization
      res.setHeader('Content-Type', file.fileType);
      res.setHeader('Content-Length', file.fileSize.toString());
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Quality-Mode', 'ultra-high');
      res.setHeader('Last-Modified', new Date(file.createdAt).toUTCString());
      
      const encodedFilename = encodeURIComponent(originalName || 'download');
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFilename}`);
      
      // Add format-specific quality headers
      if (file.fileType.startsWith('image/')) {
        res.setHeader('X-Image-Quality', 'lossless');
        res.setHeader('X-Color-Space', 'full-range');
      } else if (file.fileType.startsWith('video/')) {
        res.setHeader('X-Video-Quality', '4k-uhd');
        res.setHeader('X-Video-Encoding', 'high-bitrate');
      } else if (file.fileType.startsWith('audio/')) {
        res.setHeader('X-Audio-Quality', 'studio-master');
        res.setHeader('X-Audio-Bitrate', 'lossless');
      }
      
      res.sendFile(filePath);
    } catch (error) {
      console.error('Error in high-quality download:', error);
      res.status(500).json({ message: "Download failed" });
    }
  });

  app.get("/uploads/:filename", async (req, res) => {
    try {
      const hashedFilename = req.params.filename; // This is the hashed filename from multer
      const filePath = path.join(process.cwd(), 'uploads', hashedFilename);
      
      console.log('Attempting to serve file with hashed name:', hashedFilename);
      console.log('Full path:', filePath);
      
      // Check if file exists
      const fs = await import('fs');
      if (!fs.existsSync(filePath)) {
        console.error(`File not found at path: ${filePath}`);
        return res.status(404).json({ message: "File not found" });
      }
      
      // Get file info from database using hashed filename
      const files = await storage.getFiles();
      const file = files.find(f => f.fileName === hashedFilename);
      
      if (file) {
        // Set headers for maximum quality delivery
        res.setHeader('Content-Type', file.fileType);
        res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year cache for static files
        res.setHeader('Accept-Ranges', 'bytes'); // Enable range requests for large files
        res.setHeader('X-Content-Type-Options', 'nosniff');
        
        const encodedFilename = encodeURIComponent(file.originalName);
        res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodedFilename}`);
        
        // Add quality-specific headers for images and videos
        if (file.fileType.startsWith('image/')) {
          res.setHeader('X-Image-Quality', 'maximum');
        } else if (file.fileType.startsWith('video/')) {
          res.setHeader('X-Video-Quality', 'ultra-hd');
        }
      } else {
        // Fallback content type detection
        const stats = fs.statSync(filePath);
        const buffer = fs.readFileSync(filePath, { encoding: null });
        
        // Detect image type from file signature
        let contentType = 'application/octet-stream';
        if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
          contentType = 'image/png';
        } else if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
          contentType = 'image/jpeg';
        } else if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
          contentType = 'image/gif';
        } else if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
          contentType = 'application/pdf';
        }
        
        res.setHeader('Content-Type', contentType);
      }
      
      res.sendFile(filePath);
    } catch (error) {
      console.error('Error serving file:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Notes routes
  app.get("/api/algorithms/:algorithmId/notes", async (req, res) => {
    try {
      const { algorithmId } = req.params;
      const notes = await storage.getNotes(algorithmId);
      res.json(notes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notes" });
    }
  });

  app.post("/api/algorithms/:algorithmId/notes", requireAdmin, async (req, res) => {
    try {
      const { algorithmId } = req.params;
      const noteData = insertNoteSchema.parse({
        ...req.body,
        algorithmId
      });
      
      const note = await storage.createNote(noteData);
      res.status(201).json(note);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid note data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create note" });
      }
    }
  });

  app.put("/api/notes/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = insertNoteSchema.partial().parse(req.body);
      
      const note = await storage.updateNote(id, updateData);
      res.json(note);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid note data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update note" });
      }
    }
  });

  app.delete("/api/notes/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteNote(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete note" });
    }
  });

  // ImageKit routes
  app.get("/api/imagekit/auth", requireAdmin, (req, res) => {
    try {
      if (!ImageKitService.isConfigured()) {
        return res.status(503).json({ 
          error: "ImageKit is not configured",
          configured: false
        });
      }

      const authParams = ImageKitService.getAuthParams();
      res.json({
        ...authParams,
        configured: true,
        publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
        urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
      });
    } catch (error) {
      console.error('ImageKit auth error:', error);
      res.status(500).json({ error: "Failed to generate ImageKit auth" });
    }
  });

  app.post("/api/imagekit/upload", requireAdmin, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      if (!ImageKitService.isConfigured()) {
        return res.status(503).json({ error: "ImageKit is not configured" });
      }

      const uploadResult = await ImageKitService.uploadLocalFile(req.file.path, {
        fileName: req.file.originalname,
        folder: `/deep-learning-platform/${req.body.folder || 'uploads'}`,
        tags: req.body.tags ? req.body.tags.split(',') : ['upload'],
        useUniqueFileName: true
      });

      // Clean up local file after successful upload
      try {
        require('fs').unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.warn('Failed to cleanup local file:', cleanupError);
      }

      res.json(uploadResult);
    } catch (error) {
      console.error('ImageKit upload error:', error);
      res.status(500).json({ error: "Failed to upload to ImageKit" });
    }
  });

  app.get("/api/imagekit/optimize/:path(*)", (req, res) => {
    try {
      if (!ImageKitService.isConfigured()) {
        return res.status(503).json({ error: "ImageKit is not configured" });
      }

      const filePath = req.params.path;
      const { width, height, quality, format } = req.query;

      const optimizedUrl = ImageKitService.getOptimizedUrl(`/${filePath}`, {
        width: width ? parseInt(width as string) : undefined,
        height: height ? parseInt(height as string) : undefined,
        quality: quality ? parseInt(quality as string) : undefined,
        format: format as any
      });

      res.redirect(optimizedUrl);
    } catch (error) {
      console.error('ImageKit optimization error:', error);
      res.status(500).json({ error: "Failed to generate optimized URL" });
    }
  });

  app.delete("/api/imagekit/:fileId", requireAdmin, async (req, res) => {
    try {
      if (!ImageKitService.isConfigured()) {
        return res.status(503).json({ error: "ImageKit is not configured" });
      }

      await ImageKitService.deleteFile(req.params.fileId);
      res.status(204).send();
    } catch (error) {
      console.error('ImageKit delete error:', error);
      res.status(500).json({ error: "Failed to delete from ImageKit" });
    }
  });

  app.get("/api/imagekit/files", requireAdmin, async (req, res) => {
    try {
      if (!ImageKitService.isConfigured()) {
        return res.status(503).json({ error: "ImageKit is not configured" });
      }

      const { skip, limit, search, folder } = req.query;
      const files = await ImageKitService.listFiles({
        skip: skip ? parseInt(skip as string) : 0,
        limit: limit ? parseInt(limit as string) : 20,
        searchQuery: search as string,
        folder: folder as string
      });

      res.json(files);
    } catch (error) {
      console.error('ImageKit list files error:', error);
      res.status(500).json({ error: "Failed to list ImageKit files" });
    }
  });

  // Enhanced admin login route with security
  app.post("/api/admin/login", strictLoginLimit, async (req, res) => {
    try {
      const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
      const { password } = req.body;

      // Input validation
      if (!password || typeof password !== 'string' || password.length > 100) {
        return res.status(400).json({ 
          error: "Invalid password format",
          code: 'INVALID_FORMAT'
        });
      }

      // Check if IP is locked out
      if (AdminAuth.isLockedOut(clientIP)) {
        return res.status(429).json({ 
          error: "Account temporarily locked due to too many failed attempts. Please try again in 15 minutes.",
          code: 'ACCOUNT_LOCKED'
        });
      }

      // Verify password
      const isValid = await AdminAuth.verifyPassword(password);
      
      if (!isValid) {
        // Record failed attempt
        AdminAuth.recordFailedAttempt(clientIP);
        
        // Add delay for failed attempts
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        return res.status(401).json({ 
          error: "Invalid credentials",
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Clear failed attempts on successful login
      AdminAuth.clearFailedAttempts(clientIP);

      // Generate secure JWT token
      const loginTime = Date.now();
      const sessionId = AdminAuth.generateSessionId();
      
      const token = AdminAuth.generateToken({
        id: 'admin',
        role: 'administrator',
        loginTime,
        sessionId,
        ip: clientIP
      });

      // Log successful login (in production, use proper logging)
      console.log(`Admin login successful from IP: ${clientIP} at ${new Date().toISOString()}`);

      res.json({ 
        token,
        expiresIn: '24h',
        loginTime: new Date(loginTime).toISOString()
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ 
        error: "Login service temporarily unavailable",
        code: 'SERVER_ERROR'
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
