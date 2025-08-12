import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

// Generate a secure secret key for JWT (fixed for development)
const JWT_SECRET = 'deep-learning-platform-jwt-secret-key-for-development-only-2025';
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(64).toString('hex');

// Hash the admin password (in production, store this in database)
const ADMIN_PASSWORD_HASH = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'batu4567_%%', 12);

// Failed login attempts tracking
const failedAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

// Clean up old failed attempts every hour
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of failedAttempts.entries()) {
    if (now - data.lastAttempt > LOCKOUT_DURATION) {
      failedAttempts.delete(ip);
    }
  }
}, 60 * 60 * 1000);

export interface AuthenticatedRequest extends Request {
  admin?: {
    id: string;
    loginTime: number;
  };
}

export class AdminAuth {
  // Check if IP is locked out
  static isLockedOut(ip: string): boolean {
    const attempts = failedAttempts.get(ip);
    if (!attempts) return false;

    return (
      attempts.count >= MAX_FAILED_ATTEMPTS &&
      Date.now() - attempts.lastAttempt < LOCKOUT_DURATION
    );
  }

  // Record failed login attempt
  static recordFailedAttempt(ip: string): void {
    const attempts = failedAttempts.get(ip) || { count: 0, lastAttempt: 0 };
    attempts.count += 1;
    attempts.lastAttempt = Date.now();
    failedAttempts.set(ip, attempts);
  }

  // Clear failed attempts for IP
  static clearFailedAttempts(ip: string): void {
    failedAttempts.delete(ip);
  }

  // Generate secure JWT token
  static generateToken(payload: any): string {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: '24h',
      issuer: 'deep-learning-platform',
      audience: 'admin',
    });
  }

  // Verify JWT token
  static verifyToken(token: string): any {
    try {
      const result = jwt.verify(token, JWT_SECRET, {
        issuer: 'deep-learning-platform',
        audience: 'admin',
      });
      return result;
    } catch (error) {
      if (error instanceof Error) {
        console.log('Token verification failed:', error.message);
      } else {
        console.log('Token verification failed:', error);
      }
      return null;
    }
  }

  // Verify admin password
  static async verifyPassword(password: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
    } catch (error) {
      return false;
    }
  }

  // Generate secure session ID
  static generateSessionId(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}

// Rate limiting middleware for login attempts
export const loginRateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many login attempts from this IP, please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
};

// Admin authentication middleware
export const requireAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    console.log('Auth middleware - Headers:', { authorization: authHeader });

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Auth middleware - No valid Bearer token');
      return res.status(401).json({
        error: 'Access denied. No valid authentication token provided.',
        code: 'NO_TOKEN',
      });
    }

    const token = authHeader.substring(7);
    console.log('Auth middleware - Extracted token length:', token.length);
    console.log('Auth middleware - JWT_SECRET available:', !!JWT_SECRET);

    const decoded = AdminAuth.verifyToken(token);
    console.log('Auth middleware - Token verification result:', !!decoded);

    if (!decoded) {
      console.log('Auth middleware - Token verification failed');
      return res.status(401).json({
        error: 'Access denied. Invalid or expired token.',
        code: 'INVALID_TOKEN',
      });
    }

    // Check token age (force re-login after 24 hours)
    if ('loginTime' in decoded && typeof decoded.loginTime === 'number') {
      const tokenAge = Date.now() - decoded.loginTime;
      if (tokenAge > 24 * 60 * 60 * 1000) {
        return res.status(401).json({
          error: 'Token expired. Please login again.',
          code: 'TOKEN_EXPIRED',
        });
      }
    }

    req.admin = decoded;
    next();
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }
  }
};

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  // Remove server identification
  res.removeHeader('X-Powered-By');

  next();
};

export { JWT_SECRET, SESSION_SECRET };
