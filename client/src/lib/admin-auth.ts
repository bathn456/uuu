interface LoginResponse {
  token: string;
  expiresIn: string;
  loginTime: string;
}

interface LoginError {
  error: string;
  code: string;
}

export class AdminAuth {
  private static instance: AdminAuth;
  private token: string | null = null;
  private loginTime: number | null = null;
  private readonly TOKEN_KEY = 'admin-auth-token';
  private readonly LOGIN_TIME_KEY = 'admin-login-time';

  private constructor() {
    this.token = localStorage.getItem(this.TOKEN_KEY);
    const storedTime = localStorage.getItem(this.LOGIN_TIME_KEY);
    this.loginTime = storedTime ? parseInt(storedTime) : null;
    
    // Check token validity on initialization
    this.validateStoredToken();
  }

  static getInstance(): AdminAuth {
    if (!AdminAuth.instance) {
      AdminAuth.instance = new AdminAuth();
    }
    return AdminAuth.instance;
  }

  private validateStoredToken(): void {
    if (this.token && this.loginTime) {
      const tokenAge = Date.now() - this.loginTime;
      const MAX_TOKEN_AGE = 24 * 60 * 60 * 1000; // 24 hours
      
      if (tokenAge > MAX_TOKEN_AGE) {
        this.logout();
      }
    }
  }

  isAdmin(): boolean {
    return !!this.token && this.isTokenValid();
  }

  private isTokenValid(): boolean {
    if (!this.token || !this.loginTime) return false;
    
    try {
      // Basic JWT structure validation
      const parts = this.token.split('.');
      if (parts.length !== 3) return false;
      
      // Check token age
      const tokenAge = Date.now() - this.loginTime;
      const MAX_TOKEN_AGE = 24 * 60 * 60 * 1000; // 24 hours
      
      return tokenAge < MAX_TOKEN_AGE;
    } catch {
      return false;
    }
  }

  async login(password: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Input validation
      if (!password || typeof password !== 'string') {
        return { success: false, error: 'Password is required' };
      }

      if (password.length > 100) {
        return { success: false, error: 'Password is too long' };
      }

      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok) {
        const loginData = data as LoginResponse;
        this.token = loginData.token;
        this.loginTime = Date.now();
        
        // Store securely
        localStorage.setItem(this.TOKEN_KEY, loginData.token);
        localStorage.setItem(this.LOGIN_TIME_KEY, this.loginTime.toString());
        
        return { success: true };
      } else {
        const error = data as LoginError;
        let userMessage = 'Login failed';
        
        switch (error.code) {
          case 'INVALID_CREDENTIALS':
            userMessage = 'Invalid password';
            break;
          case 'ACCOUNT_LOCKED':
            userMessage = 'Account locked due to too many failed attempts. Please try again in 15 minutes.';
            break;
          case 'INVALID_FORMAT':
            userMessage = 'Invalid password format';
            break;
          case 'SERVER_ERROR':
            userMessage = 'Server error. Please try again later.';
            break;
          default:
            userMessage = error.error || 'Login failed';
        }
        
        return { success: false, error: userMessage };
      }
    } catch (error) {
      console.error('Login request failed:', error);
      return { success: false, error: 'Network error. Please check your connection.' };
    }
  }

  logout(): void {
    this.token = null;
    this.loginTime = null;
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.LOGIN_TIME_KEY);
    
    // Clear any cached admin data
    localStorage.removeItem('admin-preferences');
    localStorage.removeItem('admin-session');
    // Also clear old token format if it exists
    localStorage.removeItem('adminToken');
    console.log('Admin logged out and tokens cleared');
  }

  // Force clear invalid tokens and require re-login
  static clearInvalidTokens(): void {
    localStorage.removeItem('admin-auth-token');
    localStorage.removeItem('admin-login-time');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('admin-preferences');
    localStorage.removeItem('admin-session');
    console.log('Cleared all admin tokens due to authentication issues');
  }

  getAuthHeaders(): Record<string, string> {
    if (!this.isAdmin()) {
      return {};
    }
    
    return { 
      Authorization: `Bearer ${this.token}`,
      'X-Admin-Session': 'active'
    };
  }

  getTokenInfo(): { valid: boolean; timeLeft?: number } {
    if (!this.isTokenValid()) {
      return { valid: false };
    }
    
    const tokenAge = Date.now() - (this.loginTime || 0);
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    const timeLeft = maxAge - tokenAge;
    
    return {
      valid: true,
      timeLeft: Math.max(0, timeLeft)
    };
  }

  // Auto-logout when token expires
  startTokenExpirationCheck(): void {
    setInterval(() => {
      if (!this.isTokenValid()) {
        this.logout();
        // Optionally redirect to login or show notification
        window.location.reload();
      }
    }, 60000); // Check every minute
  }
}
