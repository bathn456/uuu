import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as cors from 'cors';
import * as crypto from 'crypto';

// Initialize Firebase Admin
admin.initializeApp();

// Configure CORS for all origins (you may want to restrict this in production)
const corsHandler = cors({
    origin: true,
    credentials: true
});

/**
 * ImageKit Authentication endpoint
 * Provides secure authentication tokens for ImageKit uploads
 */
export const imagekitAuth = functions.https.onRequest(async (request, response) => {
    // Handle CORS preflight requests
    corsHandler(request, response, async () => {
        try {
            // Only allow GET requests
            if (request.method !== 'GET') {
                response.status(405).json({ 
                    error: 'Method not allowed',
                    message: 'Only GET requests are supported'
                });
                return;
            }

            // Check for Authorization header
            const authHeader = request.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                response.status(401).json({ 
                    error: 'Unauthorized',
                    message: 'Missing or invalid authorization header'
                });
                return;
            }

            // Extract and verify ID token
            const idToken = authHeader.split('Bearer ')[1];
            
            try {
                // Verify the ID token with Firebase Admin
                const decodedToken = await admin.auth().verifyIdToken(idToken);
                
                // Log successful authentication (optional)
                console.log('Authenticated user:', decodedToken.email);
                
                // Generate ImageKit authentication parameters
                const authParams = generateImageKitAuth();
                
                // Return authentication parameters
                response.status(200).json(authParams);
                
            } catch (tokenError) {
                console.error('Token verification failed:', tokenError);
                response.status(401).json({ 
                    error: 'Invalid token',
                    message: 'Failed to verify authentication token'
                });
                return;
            }
            
        } catch (error) {
            console.error('ImageKit auth error:', error);
            response.status(500).json({ 
                error: 'Internal server error',
                message: 'Failed to generate authentication parameters'
            });
        }
    });
});

/**
 * Generate ImageKit authentication parameters
 * @returns {Object} Authentication parameters for ImageKit upload
 */
function generateImageKitAuth() {
    // Get ImageKit private key from environment variables
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
    
    if (!privateKey) {
        throw new Error('ImageKit private key not configured');
    }

    // Generate authentication parameters
    const token = crypto.randomBytes(16).toString('hex');
    const expire = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
    
    // Create signature using HMAC-SHA1
    const stringToSign = token + expire;
    const signature = crypto
        .createHmac('sha1', privateKey)
        .update(stringToSign)
        .digest('hex');

    return {
        token,
        expire,
        signature
    };
}

/**
 * Health check endpoint
 * Simple endpoint to verify that functions are working
 */
export const healthCheck = functions.https.onRequest(async (request, response) => {
    corsHandler(request, response, () => {
        response.status(200).json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            message: 'Firebase Functions are running correctly'
        });
    });
});

/**
 * Get usage statistics (optional)
 * This can help track usage and stay within free tier limits
 */
export const getUsageStats = functions.https.onRequest(async (request, response) => {
    corsHandler(request, response, async () => {
        try {
            // Check for Authorization header
            const authHeader = request.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                response.status(401).json({ 
                    error: 'Unauthorized',
                    message: 'Authentication required'
                });
                return;
            }

            // Extract and verify ID token
            const idToken = authHeader.split('Bearer ')[1];
            
            try {
                const decodedToken = await admin.auth().verifyIdToken(idToken);
                
                // Here you could track usage in Firestore if needed
                // For now, just return basic info
                
                const stats = {
                    user: decodedToken.email,
                    timestamp: new Date().toISOString(),
                    message: 'Usage tracking is available',
                    // You can add actual usage tracking here
                    uploadsToday: 0, // Implement actual tracking
                    monthlyUploads: 0, // Implement actual tracking
                    totalStorage: '0 MB' // Implement actual tracking
                };
                
                response.status(200).json(stats);
                
            } catch (tokenError) {
                response.status(401).json({ 
                    error: 'Invalid token',
                    message: 'Failed to verify authentication token'
                });
                return;
            }
            
        } catch (error) {
            console.error('Usage stats error:', error);
            response.status(500).json({ 
                error: 'Internal server error',
                message: 'Failed to get usage statistics'
            });
        }
    });
});