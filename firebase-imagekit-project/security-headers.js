// Security Headers Configuration
// Add these headers to Firebase Functions responses

/**
 * Security headers for Firebase Functions
 * @param {Response} res - Express response object
 */
function setSecurityHeaders(res) {
    res.set({
        // HSTS - Force HTTPS for 1 year
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
        
        // CSP - Content Security Policy
        'Content-Security-Policy': [
            "default-src 'self'",
            "img-src 'self' https://ik.imagekit.io https://*.firebaseapp.com data:",
            "script-src 'self' 'unsafe-inline' https://www.gstatic.com",
            "style-src 'self' 'unsafe-inline'",
            "connect-src 'self' https://*.googleapis.com https://upload.imagekit.io",
            "font-src 'self' data:",
            "object-src 'none'",
            "base-uri 'self'",
            "frame-ancestors 'none'"
        ].join('; '),
        
        // XSS Protection
        'X-XSS-Protection': '1; mode=block',
        
        // Prevent MIME sniffing
        'X-Content-Type-Options': 'nosniff',
        
        // Prevent clickjacking
        'X-Frame-Options': 'DENY',
        
        // Referrer Policy
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        
        // Permissions Policy
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
        
        // Cache Control for sensitive endpoints
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        'Pragma': 'no-cache',
        'Expires': '0'
    });
}

/**
 * Rate limiting configuration for different endpoints
 */
const rateLimits = {
    auth: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5, // 5 attempts per window
        message: 'Too many authentication attempts'
    },
    upload: {
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 10, // 10 uploads per hour
        message: 'Upload limit exceeded'
    },
    general: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // 100 requests per window
        message: 'Rate limit exceeded'
    }
};

/**
 * Sanitize user input to prevent injection attacks
 * @param {string} input 
 * @returns {string}
 */
function sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    
    return input
        .replace(/[<>]/g, '') // Remove HTML tags
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+=/gi, '') // Remove event handlers
        .trim()
        .substring(0, 1000); // Limit length
}

/**
 * Validate file upload security
 * @param {File} file 
 * @returns {Object}
 */
function validateFileUpload(file) {
    const errors = [];
    
    // File size check (10MB max)
    if (file.size > 10 * 1024 * 1024) {
        errors.push('File size exceeds 10MB limit');
    }
    
    // File type check
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        errors.push('Invalid file type. Only JPG, PNG, and WebP allowed');
    }
    
    // File name check
    if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
        errors.push('Invalid file name');
    }
    
    // File extension check
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!allowedExtensions.includes(extension)) {
        errors.push('Invalid file extension');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Generate secure random filename
 * @param {string} originalName 
 * @param {string} mimeType 
 * @returns {string}
 */
function generateSecureFileName(originalName, mimeType) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    
    const extension = mimeType === 'image/webp' ? '.webp' :
                     mimeType === 'image/png' ? '.png' : '.jpg';
    
    return `${timestamp}_${random}${extension}`;
}

/**
 * Log security events
 * @param {string} event 
 * @param {Object} details 
 */
function logSecurityEvent(event, details = {}) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        event,
        ip: details.ip || 'unknown',
        userAgent: details.userAgent || 'unknown',
        userId: details.userId || 'anonymous',
        details: {
            ...details,
            // Remove sensitive data
            ip: undefined,
            userAgent: undefined
        }
    };
    
    console.log('SECURITY_EVENT:', JSON.stringify(logEntry));
}

// Export for use in Firebase Functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        setSecurityHeaders,
        rateLimits,
        sanitizeInput,
        validateFileUpload,
        generateSecureFileName,
        logSecurityEvent
    };
}

// Export for browser use
if (typeof window !== 'undefined') {
    window.SecurityUtils = {
        sanitizeInput,
        validateFileUpload,
        generateSecureFileName
    };
}