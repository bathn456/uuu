import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Settings, Github, Linkedin, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAdmin } from '@/components/admin-provider';
import { useToast } from '@/hooks/use-toast';

export function Header() {
  const [location] = useLocation();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { isAdmin, login, logout } = useAdmin();
  const { toast } = useToast();

  const handleAdminLogin = async () => {
    const result = await login(password);
    if (result.success) {
      toast({ title: "Admin access granted" });
      setIsLoginOpen(false);
      setEmail('');
      setPassword('');
    } else {
      toast({ 
        title: "Login failed", 
        description: result.error || "Invalid admin password",
        variant: "destructive" 
      });
    }
  };

  const handleLogout = () => {
    logout();
    toast({ title: "Logged out" });
  };

  const navLinks = [
    { href: '/', label: 'Home' },
  ];

  return (
    <header className="bg-white shadow-sm border-b border-neutral-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <i className="fas fa-brain text-white text-lg"></i>
            </div>
            <h1 className="text-xl font-semibold text-neutral-800">
              Deep Learning with Batuhan Yılmaz
            </h1>
          </Link>
          
          <nav className="hidden md:flex space-x-8">
            {/* Navigation removed - only logo/home link remains */}
          </nav>

          <div className="flex items-center space-x-3">
            {/* Social Media Links */}
            <a
              href="https://www.linkedin.com/in/batuhan-y%C4%B1lmaz-20a309232/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-600 hover:bg-blue-100 hover:text-blue-600 transition-all duration-200"
              data-testid="link-linkedin"
            >
              <Linkedin className="w-4 h-4" />
            </a>
            
            <a
              href="https://github.com/bathn456"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-600 hover:bg-neutral-800 hover:text-white transition-all duration-200"
              data-testid="link-github"
            >
              <Github className="w-4 h-4" />
            </a>

            <a
              href="mailto:ybatu42@gmail.com"
              className="w-9 h-9 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-600 hover:bg-red-100 hover:text-red-600 transition-all duration-200"
              data-testid="link-email"
            >
              <Mail className="w-4 h-4" />
            </a>

            {/* Admin Button */}
            {isAdmin ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="hidden md:flex"
                data-testid="button-admin-logout"
              >
                <Settings className="w-4 h-4 mr-2" />
                Admin (Logout)
              </Button>
            ) : (
              <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="hidden md:flex" data-testid="button-admin-login">
                    <Settings className="w-4 h-4 mr-2" />
                    Admin
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Admin Login</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="admin-email">Email</Label>
                      <Input
                        id="admin-email"
                        type="email"
                        placeholder="ybatu42@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        data-testid="input-admin-email"
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
                        data-testid="input-admin-password"
                      />
                    </div>
                    <Button onClick={handleAdminLogin} className="w-full" data-testid="button-admin-submit">
                      Login
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Mobile menu - removed navigation links */}
      </div>
    </header>
  );
}
