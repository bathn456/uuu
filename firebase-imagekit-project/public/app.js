// Main Application Logic

class PhotoUploader {
    constructor() {
        this.selectedFile = null;
        this.optimizedFile = null;
        this.isUploading = false;
        this.currentPreviewUrl = null;
        
        // DOM elements
        this.fileInput = null;
        this.fileInfo = null;
        this.previewContainer = null;
        this.previewImage = null;
        this.uploadBtn = null;
        this.progressContainer = null;
        this.progressFill = null;
        this.progressPercent = null;
        this.progressStatus = null;
        this.resultSection = null;
        this.errorSection = null;
        
        this.initializeElements();
        this.attachEventListeners();
    }

    /**
     * Initialize DOM elements
     */
    initializeElements() {
        this.fileInput = document.getElementById('file-input');
        this.fileInfo = document.getElementById('file-info');
        this.previewContainer = document.getElementById('preview-container');
        this.previewImage = document.getElementById('preview-image');
        this.uploadBtn = document.getElementById('upload-btn');
        this.progressContainer = document.getElementById('progress-container');
        this.progressFill = document.getElementById('progress-fill');
        this.progressPercent = document.getElementById('progress-percent');
        this.progressStatus = document.getElementById('progress-status');
        this.resultSection = document.getElementById('result-section');
        this.errorSection = document.getElementById('error-section');
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        if (this.fileInput) {
            this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        }
        
        if (this.uploadBtn) {
            this.uploadBtn.addEventListener('click', () => this.handleUpload());
        }
        
        // Result section buttons
        const copyUrlBtn = document.getElementById('copy-url-btn');
        if (copyUrlBtn) {
            copyUrlBtn.addEventListener('click', () => this.copyResultUrl());
        }
        
        const uploadAnotherBtn = document.getElementById('upload-another-btn');
        if (uploadAnotherBtn) {
            uploadAnotherBtn.addEventListener('click', () => this.resetUploader());
        }
        
        const retryBtn = document.getElementById('retry-btn');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => this.handleUpload());
        }
    }

    /**
     * Handle file selection
     * @param {Event} e 
     */
    async handleFileSelect(e) {
        const file = e.target.files[0];
        
        if (!file) {
            this.clearSelection();
            return;
        }

        // Security validation
        if (window.SecurityUtils) {
            const validation = window.SecurityUtils.validateFileUpload(file);
            if (!validation.isValid) {
                this.showToast(validation.errors.join(', '), 'error');
                this.clearSelection();
                return;
            }
        }

        try {
            this.selectedFile = file;
            this.showFileInfo(file);
            
            // Show preview
            await this.showPreview(file);
            
            // Optimize image
            this.setStatus('Görsel optimize ediliyor...');
            
            const result = await window.ImageOptimizer.optimizeImage(file);
            this.optimizedFile = result.file;
            
            // Update preview with optimized version
            await this.showOptimizedPreview(result);
            
            // Show upload button
            this.uploadBtn.classList.remove('hidden');
            
            this.setStatus('Yüklemeye hazır');
            
        } catch (error) {
            console.error('File processing error:', error);
            this.showToast(error.message, 'error');
            this.clearSelection();
        }
    }

    /**
     * Show file information
     * @param {File} file 
     */
    showFileInfo(file) {
        const fileName = document.querySelector('.file-name');
        const fileSize = document.querySelector('.file-size');
        const fileType = document.querySelector('.file-type');
        
        if (fileName) fileName.textContent = file.name;
        if (fileSize) fileSize.textContent = window.ImageOptimizer.formatFileSize(file.size);
        if (fileType) fileType.textContent = window.ImageOptimizer.getFormatName(file.type);
        
        this.fileInfo.classList.remove('hidden');
    }

    /**
     * Show image preview
     * @param {File} file 
     */
    async showPreview(file) {
        // Clean up previous preview
        if (this.currentPreviewUrl) {
            window.ImageOptimizer.cleanupPreviewUrl(this.currentPreviewUrl);
        }
        
        // Create new preview
        this.currentPreviewUrl = window.ImageOptimizer.createPreviewUrl(file);
        this.previewImage.src = this.currentPreviewUrl;
        
        this.previewContainer.classList.remove('hidden');
    }

    /**
     * Show optimized preview with details
     * @param {Object} result 
     */
    async showOptimizedPreview(result) {
        // Update preview with optimized image
        const optimizedUrl = window.ImageOptimizer.createPreviewUrl(result.file);
        this.previewImage.src = optimizedUrl;
        
        // Clean up old URL
        if (this.currentPreviewUrl && this.currentPreviewUrl !== optimizedUrl) {
            window.ImageOptimizer.cleanupPreviewUrl(this.currentPreviewUrl);
        }
        this.currentPreviewUrl = optimizedUrl;
        
        // Update optimization badge
        const badge = document.querySelector('.optimization-badge');
        if (badge) {
            badge.textContent = `${result.optimizations.length} Optimizasyon Uygulandı`;
            badge.style.background = 'var(--success)';
        }
    }

    /**
     * Handle file upload
     */
    async handleUpload() {
        if (!this.optimizedFile || this.isUploading) {
            return;
        }

        // Check authentication
        const authManager = window.getAuthManager();
        if (!authManager || !authManager.isAuthenticated()) {
            this.showToast('Yükleme için giriş yapmanız gerekiyor.', 'error');
            return;
        }

        try {
            this.isUploading = true;
            this.setUploadingState(true);
            this.hideResults();
            
            // Start upload process
            this.updateProgress(0, 'Yükleme başlatılıyor...');
            
            // Get authentication token
            const idToken = await authManager.getIdToken();
            if (!idToken) {
                throw new Error('Kimlik doğrulama token\'ı alınamadı.');
            }
            
            // Get ImageKit auth
            this.updateProgress(10, 'Depolama servisi ile bağlantı kuruluyor...');
            const authResponse = await this.getImageKitAuth(idToken);
            
            // Upload to ImageKit
            this.updateProgress(20, 'Fotoğraf yükleniyor...');
            const uploadResult = await this.uploadToImageKit(authResponse);
            
            this.updateProgress(100, 'Yükleme tamamlandı!');
            
            // Show success result
            this.showSuccessResult(uploadResult);
            
        } catch (error) {
            console.error('Upload failed:', error);
            this.showErrorResult(error.message);
        } finally {
            this.isUploading = false;
            this.setUploadingState(false);
        }
    }

    /**
     * Get ImageKit authentication from Firebase Functions
     * @param {string} idToken 
     * @returns {Promise<Object>}
     */
    async getImageKitAuth(idToken) {
        // Demo mode authentication
        if (window.DEMO_MODE) {
            return this.getDemoImageKitAuth();
        }

        const response = await fetch(window.imagekitConfig.authenticationEndpoint, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${idToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Kimlik doğrulama hatası: ${response.status}`);
        }

        return await response.json();
    }

    /**
     * Get demo ImageKit authentication
     * @returns {Promise<Object>}
     */
    async getDemoImageKitAuth() {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return {
            signature: 'demo-signature-' + Date.now(),
            expire: Math.floor(Date.now() / 1000) + 3600,
            token: 'demo-token-' + Math.random().toString(36).substring(7)
        };
    }

    /**
     * Upload file to ImageKit
     * @param {Object} authData 
     * @returns {Promise<Object>}
     */
    async uploadToImageKit(authData) {
        // Demo mode upload simulation
        if (window.DEMO_MODE) {
            return this.simulateDemoUpload();
        }

        const formData = new FormData();
        
        // Add file
        formData.append('file', this.optimizedFile);
        
        // Add ImageKit auth parameters
        formData.append('publicKey', window.imagekitConfig.publicKey);
        formData.append('signature', authData.signature);
        formData.append('expire', authData.expire.toString());
        formData.append('token', authData.token);
        
        // Add upload options
        formData.append('fileName', this.optimizedFile.name);
        formData.append('folder', '/uploads');
        
        // Add transformations for CDN optimization
        formData.append('transformation', JSON.stringify([
            {
                quality: 'auto',
                format: 'auto'
            }
        ]));

        // Upload with progress tracking
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            
            // Track upload progress
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const percentComplete = Math.round(20 + (e.loaded / e.total) * 70);
                    this.updateProgress(percentComplete, 'Yükleniyor...');
                }
            });
            
            // Handle completion
            xhr.addEventListener('load', () => {
                if (xhr.status === 200) {
                    try {
                        const result = JSON.parse(xhr.responseText);
                        resolve(result);
                    } catch (error) {
                        reject(new Error('Sunucu yanıtı işlenemedi.'));
                    }
                } else {
                    reject(new Error(`Yükleme hatası: ${xhr.status}`));
                }
            });
            
            // Handle errors
            xhr.addEventListener('error', () => {
                reject(new Error('Ağ hatası oluştu.'));
            });
            
            // Send request
            xhr.open('POST', 'https://upload.imagekit.io/api/v1/files/upload');
            xhr.send(formData);
        });
    }

    /**
     * Simulate demo upload for testing
     * @returns {Promise<Object>}
     */
    async simulateDemoUpload() {
        // Simulate upload progress
        for (let i = 20; i <= 90; i += 10) {
            await new Promise(resolve => setTimeout(resolve, 200));
            this.updateProgress(i, 'Demo yükleme simülasyonu...');
        }

        // Final delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Create demo result with blob URL for preview
        const demoUrl = URL.createObjectURL(this.optimizedFile);
        
        return {
            url: demoUrl,
            name: this.optimizedFile.name,
            size: this.optimizedFile.size,
            fileId: 'demo-file-' + Date.now(),
            filePath: '/demo/uploads/' + this.optimizedFile.name,
            width: 1080, // Assume optimized dimensions
            height: 720,
            isDemo: true
        };
    }

    /**
     * Show success result
     * @param {Object} uploadResult 
     */
    showSuccessResult(uploadResult) {
        // Set result URL
        const resultUrlInput = document.getElementById('result-url');
        if (resultUrlInput) {
            resultUrlInput.value = uploadResult.url;
        }
        
        // Set result image
        const resultImage = document.getElementById('result-image');
        if (resultImage) {
            resultImage.src = uploadResult.url;
            resultImage.alt = uploadResult.name;
        }
        
        // Show optimizations
        const optimizationList = document.getElementById('optimization-list');
        if (optimizationList) {
            // Get optimization info from our processing
            const optimizations = [
                'WebP formatına dönüştürüldü (daha küçük dosya boyutu)',
                `Boyut optimize edildi (max ${window.ImageOptimizer.MAX_WIDTH}px)`,
                'ImageKit CDN üzerinden servis ediliyor',
                'Otomatik cache kontrolü aktif (1 yıl)',
                'Responsive görsel transformasyonları hazır'
            ];
            
            optimizationList.innerHTML = '';
            optimizations.forEach(opt => {
                const li = document.createElement('li');
                li.textContent = opt;
                optimizationList.appendChild(li);
            });
        }
        
        this.resultSection.classList.remove('hidden');
        this.showToast('Fotoğraf başarıyla yüklendi! 🎉', 'success');
    }

    /**
     * Show error result
     * @param {string} message 
     */
    showErrorResult(message) {
        const errorMessage = document.getElementById('error-message');
        if (errorMessage) {
            errorMessage.textContent = message;
        }
        
        this.errorSection.classList.remove('hidden');
        this.showToast('Yükleme başarısız oldu.', 'error');
    }

    /**
     * Hide all result sections
     */
    hideResults() {
        this.resultSection.classList.add('hidden');
        this.errorSection.classList.add('hidden');
    }

    /**
     * Update progress bar and status
     * @param {number} percent 
     * @param {string} status 
     */
    updateProgress(percent, status) {
        if (this.progressFill) {
            this.progressFill.style.width = `${percent}%`;
        }
        
        if (this.progressPercent) {
            this.progressPercent.textContent = `${percent}%`;
        }
        
        if (this.progressStatus) {
            this.progressStatus.textContent = status;
        }
        
        this.progressContainer.classList.remove('hidden');
    }

    /**
     * Set uploading state
     * @param {boolean} isUploading 
     */
    setUploadingState(isUploading) {
        if (this.uploadBtn) {
            this.uploadBtn.disabled = isUploading;
            this.uploadBtn.textContent = isUploading ? 'Yükleniyor...' : 'Yükle';
        }
        
        if (this.fileInput) {
            this.fileInput.disabled = isUploading;
        }
        
        // Show/hide progress
        if (isUploading) {
            this.progressContainer.classList.remove('hidden');
        } else {
            setTimeout(() => {
                if (!this.isUploading) {
                    this.progressContainer.classList.add('hidden');
                }
            }, 2000);
        }
    }

    /**
     * Copy result URL to clipboard
     */
    async copyResultUrl() {
        const resultUrlInput = document.getElementById('result-url');
        if (!resultUrlInput || !resultUrlInput.value) return;
        
        try {
            await navigator.clipboard.writeText(resultUrlInput.value);
            this.showToast('URL panoya kopyalandı!', 'success');
        } catch (error) {
            // Fallback for older browsers
            resultUrlInput.select();
            document.execCommand('copy');
            this.showToast('URL panoya kopyalandı!', 'success');
        }
    }

    /**
     * Reset uploader to initial state
     */
    resetUploader() {
        // Clear file selection
        this.clearSelection();
        
        // Hide results
        this.hideResults();
        
        // Reset form
        if (this.fileInput) {
            this.fileInput.value = '';
        }
        
        // Hide upload button
        if (this.uploadBtn) {
            this.uploadBtn.classList.add('hidden');
        }
        
        // Hide progress
        if (this.progressContainer) {
            this.progressContainer.classList.add('hidden');
        }
    }

    /**
     * Clear file selection and preview
     */
    clearSelection() {
        this.selectedFile = null;
        this.optimizedFile = null;
        
        // Clean up preview URL
        if (this.currentPreviewUrl) {
            window.ImageOptimizer.cleanupPreviewUrl(this.currentPreviewUrl);
            this.currentPreviewUrl = null;
        }
        
        // Hide elements
        if (this.fileInfo) this.fileInfo.classList.add('hidden');
        if (this.previewContainer) this.previewContainer.classList.add('hidden');
        if (this.uploadBtn) this.uploadBtn.classList.add('hidden');
    }

    /**
     * Set status message
     * @param {string} message 
     */
    setStatus(message) {
        console.log('Status:', message);
    }

    /**
     * Show toast notification
     * @param {string} message 
     * @param {string} type 
     */
    showToast(message, type = 'success') {
        // Use AuthManager's toast method if available
        const authManager = window.getAuthManager();
        if (authManager) {
            authManager.showToast(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }
}

// Initialize uploader when DOM is loaded
let photoUploader;

document.addEventListener('DOMContentLoaded', () => {
    photoUploader = new PhotoUploader();
});

// Export for use in other files
window.PhotoUploader = PhotoUploader;
window.getPhotoUploader = () => photoUploader;