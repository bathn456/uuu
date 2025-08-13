// Firebase Authentication Management

class AuthManager {
    constructor() {
        this.auth = null;
        this.currentUser = null;
        this.isInitialized = false;
        
        // DOM elements
        this.loginSection = null;
        this.uploadSection = null;
        this.loginForm = null;
        this.loginError = null;
        this.userInfo = null;
        this.userEmail = null;
        this.logoutBtn = null;
        
        this.initializeElements();
        this.attachEventListeners();
    }

    /**
     * Initialize DOM elements
     */
    initializeElements() {
        this.loginSection = document.getElementById('login-section');
        this.uploadSection = document.getElementById('upload-section');
        this.loginForm = document.getElementById('login-form');
        this.loginError = document.getElementById('login-error');
        this.userInfo = document.getElementById('user-info');
        this.userEmail = document.getElementById('user-email');
        this.logoutBtn = document.getElementById('logout-btn');
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        if (this.loginForm) {
            this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
        
        if (this.logoutBtn) {
            this.logoutBtn.addEventListener('click', () => this.handleLogout());
        }
    }

    /**
     * Initialize Firebase Auth
     */
    async initializeAuth() {
        try {
            if (!window.firebaseConfig) {
                throw new Error('Firebase yapılandırması bulunamadı. firebase-config.js dosyasını kontrol edin.');
            }

            // Import Firebase modules
            const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
            const { getAuth, onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');

            // Initialize Firebase app
            const app = initializeApp(window.firebaseConfig);
            this.auth = getAuth(app);
            
            // Listen for auth state changes
            onAuthStateChanged(this.auth, (user) => {
                this.handleAuthStateChange(user);
            });

            this.isInitialized = true;
            console.log('Firebase Auth initialized successfully');
            
        } catch (error) {
            console.error('Firebase Auth initialization failed:', error);
            this.showError('Firebase başlatılamadı: ' + error.message);
        }
    }

    /**
     * Handle authentication state changes
     * @param {User|null} user 
     */
    handleAuthStateChange(user) {
        this.currentUser = user;
        
        if (user) {
            // User is signed in
            this.showUploadSection();
            this.updateUserInfo(user);
            console.log('User signed in:', user.email);
        } else {
            // User is signed out
            this.showLoginSection();
            console.log('User signed out');
        }
    }

    /**
     * Handle login form submission
     * @param {Event} e 
     */
    async handleLogin(e) {
        e.preventDefault();
        
        if (!this.isInitialized) {
            this.showError('Kimlik doğrulama sistemi henüz hazır değil. Lütfen bekleyin.');
            return;
        }

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        
        if (!email || !password) {
            this.showError('Email ve şifre gereklidir.');
            return;
        }

        // Show loading
        this.setLoading(true);
        this.hideError();

        try {
            const { signInWithEmailAndPassword } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
            
            // Sign in user
            const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
            
            // Success - auth state change will handle UI update
            console.log('Login successful:', userCredential.user.email);
            
            // Show success toast
            this.showToast('Giriş başarılı! Hoş geldiniz.', 'success');
            
        } catch (error) {
            console.error('Login failed:', error);
            
            // Handle specific error cases
            let errorMessage = 'Giriş yapılamadı.';
            
            switch (error.code) {
                case 'auth/user-not-found':
                    errorMessage = 'Bu email adresi ile kayıtlı kullanıcı bulunamadı.';
                    break;
                case 'auth/wrong-password':
                    errorMessage = 'Hatalı şifre.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Geçersiz email adresi.';
                    break;
                case 'auth/too-many-requests':
                    errorMessage = 'Çok fazla başarısız deneme. Lütfen daha sonra tekrar deneyin.';
                    break;
                case 'auth/network-request-failed':
                    errorMessage = 'Ağ hatası. İnternet bağlantınızı kontrol edin.';
                    break;
                default:
                    errorMessage = error.message || 'Bilinmeyen bir hata oluştu.';
            }
            
            this.showError(errorMessage);
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Handle logout
     */
    async handleLogout() {
        try {
            const { signOut } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
            
            await signOut(this.auth);
            
            // Clear form
            if (this.loginForm) {
                this.loginForm.reset();
            }
            
            // Show success toast
            this.showToast('Başarıyla çıkış yaptınız.', 'success');
            
        } catch (error) {
            console.error('Logout failed:', error);
            this.showToast('Çıkış yapılırken hata oluştu.', 'error');
        }
    }

    /**
     * Show login section, hide upload section
     */
    showLoginSection() {
        if (this.loginSection) this.loginSection.classList.remove('hidden');
        if (this.uploadSection) this.uploadSection.classList.add('hidden');
        if (this.userInfo) this.userInfo.classList.add('hidden');
    }

    /**
     * Show upload section, hide login section
     */
    showUploadSection() {
        if (this.loginSection) this.loginSection.classList.add('hidden');
        if (this.uploadSection) this.uploadSection.classList.remove('hidden');
        if (this.userInfo) this.userInfo.classList.remove('hidden');
    }

    /**
     * Update user info display
     * @param {User} user 
     */
    updateUserInfo(user) {
        if (this.userEmail) {
            this.userEmail.textContent = user.email;
        }
    }

    /**
     * Show error message
     * @param {string} message 
     */
    showError(message) {
        if (this.loginError) {
            this.loginError.textContent = message;
            this.loginError.classList.remove('hidden');
        }
    }

    /**
     * Hide error message
     */
    hideError() {
        if (this.loginError) {
            this.loginError.classList.add('hidden');
        }
    }

    /**
     * Set loading state for login form
     * @param {boolean} isLoading 
     */
    setLoading(isLoading) {
        const submitBtn = this.loginForm?.querySelector('button[type="submit"]');
        const inputs = this.loginForm?.querySelectorAll('input');
        
        if (submitBtn) {
            submitBtn.disabled = isLoading;
            submitBtn.textContent = isLoading ? 'Giriş yapılıyor...' : 'Giriş Yap';
        }
        
        if (inputs) {
            inputs.forEach(input => {
                input.disabled = isLoading;
            });
        }
    }

    /**
     * Show toast notification
     * @param {string} message 
     * @param {string} type - success, error, warning
     */
    showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        container.appendChild(toast);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 5000);
    }

    /**
     * Check if user is authenticated
     * @returns {boolean}
     */
    isAuthenticated() {
        return this.currentUser !== null;
    }

    /**
     * Get current user's ID token
     * @returns {Promise<string|null>}
     */
    async getIdToken() {
        if (!this.currentUser) return null;
        
        try {
            return await this.currentUser.getIdToken();
        } catch (error) {
            console.error('Failed to get ID token:', error);
            return null;
        }
    }

    /**
     * Get current user email
     * @returns {string|null}
     */
    getCurrentUserEmail() {
        return this.currentUser?.email || null;
    }
}

// Initialize auth manager when DOM is loaded
let authManager;

document.addEventListener('DOMContentLoaded', async () => {
    authManager = new AuthManager();
    await authManager.initializeAuth();
});

// Export for use in other files
window.AuthManager = AuthManager;
window.getAuthManager = () => authManager;