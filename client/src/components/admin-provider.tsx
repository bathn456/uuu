import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AdminAuth } from '@/lib/admin-auth';

interface AdminContextType {
  isAdmin: boolean;
  login: (password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

interface AdminProviderProps {
  children: ReactNode;
}

export function AdminProvider({ children }: AdminProviderProps) {
  const [isAdmin, setIsAdmin] = useState(false);
  const adminAuth = AdminAuth.getInstance();

  useEffect(() => {
    // Clear any invalid tokens first
    const checkAndClearInvalidTokens = () => {
      try {
        // If there are authentication issues, clear everything and start fresh
        const hasOldTokens = localStorage.getItem('adminToken') || 
                           localStorage.getItem('admin-auth-token');
        
        if (hasOldTokens) {
          console.log('Clearing potentially invalid tokens...');
          localStorage.removeItem('adminToken');
          localStorage.removeItem('admin-auth-token');
          localStorage.removeItem('admin-login-time');
          localStorage.removeItem('admin-preferences');
          localStorage.removeItem('admin-session');
        }
      } catch (error) {
        console.log('Error clearing tokens:', error);
      }
    };

    checkAndClearInvalidTokens();
    setIsAdmin(adminAuth.isAdmin());
  }, []);

  const login = async (password: string): Promise<{ success: boolean; error?: string }> => {
    const result = await adminAuth.login(password);
    if (result.success) {
      setIsAdmin(true);
      // Start token expiration monitoring
      adminAuth.startTokenExpirationCheck();
    }
    return result;
  };

  const logout = () => {
    adminAuth.logout();
    setIsAdmin(false);
  };

  return (
    <AdminContext.Provider value={{ isAdmin, login, logout }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}
