// Image Optimization Utilities

class ImageOptimizer {
    static MAX_WIDTH = 1080;
    static MAX_HEIGHT = 1080;
    static QUALITY = 0.85;
    static WEBP_QUALITY = 0.8;

    /**
     * Resize image to max dimensions while maintaining aspect ratio
     * @param {File} file - Original image file
     * @returns {Promise<{file: File, optimizations: string[]}>}
     */
    static async optimizeImage(file) {
        return new Promise((resolve, reject) => {
            const optimizations = [];
            
            // Check file type
            if (!this.isValidImageType(file)) {
                reject(new Error('Geçersiz dosya tipi. Sadece JPG, PNG ve WebP destekleniyor.'));
                return;
            }

            // Check file size (max 10MB to stay within free limits)
            if (file.size > 10 * 1024 * 1024) {
                reject(new Error('Dosya boyutu 10MB\'dan küçük olmalıdır.'));
                return;
            }

            const img = new Image();
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            img.onload = () => {
                try {
                    // Calculate new dimensions
                    const { width, height, resized } = this.calculateDimensions(
                        img.width, 
                        img.height
                    );

                    if (resized) {
                        optimizations.push(`Boyut: ${img.width}x${img.height} → ${width}x${height}`);
                    }

                    // Set canvas dimensions
                    canvas.width = width;
                    canvas.height = height;

                    // Draw image with high quality (EXIF data automatically stripped)
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // Note: Canvas automatically removes EXIF data during redraw
                    optimizations.push('Meta veriler temizlendi (EXIF, GPS vb.)');

                    // Determine output format and quality
                    const outputFormat = this.getOptimalFormat(file.type);
                    const quality = outputFormat === 'image/webp' ? 
                        this.WEBP_QUALITY : this.QUALITY;

                    // Convert to blob
                    canvas.toBlob((blob) => {
                        if (!blob) {
                            reject(new Error('Görsel optimize edilemedi.'));
                            return;
                        }

                        // Create new file
                        const optimizedFile = new File(
                            [blob], 
                            this.generateFileName(file.name, outputFormat),
                            { type: outputFormat }
                        );

                        // Add format optimization info
                        if (outputFormat !== file.type) {
                            const fromFormat = this.getFormatName(file.type);
                            const toFormat = this.getFormatName(outputFormat);
                            optimizations.push(`Format: ${fromFormat} → ${toFormat}`);
                        }

                        // Add size optimization info
                        const sizeDiff = ((file.size - optimizedFile.size) / file.size * 100);
                        if (sizeDiff > 0) {
                            optimizations.push(`Dosya boyutu: ${Math.round(sizeDiff)}% azaldı`);
                        }

                        resolve({ 
                            file: optimizedFile, 
                            optimizations,
                            originalSize: file.size,
                            optimizedSize: optimizedFile.size,
                            originalDimensions: { width: img.width, height: img.height },
                            optimizedDimensions: { width, height }
                        });

                    }, outputFormat, quality);

                } catch (error) {
                    reject(new Error(`Optimizasyon hatası: ${error.message}`));
                }
            };

            img.onerror = () => {
                reject(new Error('Görsel yüklenemedi. Geçerli bir resim dosyası seçin.'));
            };

            // Load image
            img.src = URL.createObjectURL(file);
        });
    }

    /**
     * Check if file is a valid image type
     * @param {File} file 
     * @returns {boolean}
     */
    static isValidImageType(file) {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        return validTypes.includes(file.type);
    }

    /**
     * Calculate optimal dimensions while maintaining aspect ratio
     * @param {number} originalWidth 
     * @param {number} originalHeight 
     * @returns {Object}
     */
    static calculateDimensions(originalWidth, originalHeight) {
        let width = originalWidth;
        let height = originalHeight;
        let resized = false;

        // Check if resize is needed
        if (width > this.MAX_WIDTH || height > this.MAX_HEIGHT) {
            const aspectRatio = width / height;
            
            if (width > height) {
                // Landscape orientation
                width = this.MAX_WIDTH;
                height = width / aspectRatio;
                
                if (height > this.MAX_HEIGHT) {
                    height = this.MAX_HEIGHT;
                    width = height * aspectRatio;
                }
            } else {
                // Portrait orientation
                height = this.MAX_HEIGHT;
                width = height * aspectRatio;
                
                if (width > this.MAX_WIDTH) {
                    width = this.MAX_WIDTH;
                    height = width / aspectRatio;
                }
            }
            
            // Round to integer
            width = Math.round(width);
            height = Math.round(height);
            resized = true;
        }

        return { width, height, resized };
    }

    /**
     * Get optimal output format based on input and browser support
     * @param {string} inputType 
     * @returns {string}
     */
    static getOptimalFormat(inputType) {
        // Check WebP support
        const canvas = document.createElement('canvas');
        const supportsWebP = canvas.toDataURL('image/webp').indexOf('image/webp') === 5;
        
        // If browser supports WebP and input is JPG/PNG, convert to WebP
        if (supportsWebP && (inputType === 'image/jpeg' || inputType === 'image/png')) {
            return 'image/webp';
        }
        
        // Otherwise keep original format
        return inputType;
    }

    /**
     * Generate optimized file name
     * @param {string} originalName 
     * @param {string} outputFormat 
     * @returns {string}
     */
    static generateFileName(originalName, outputFormat) {
        const nameWithoutExt = originalName.replace(/\.[^/.]+$/, "");
        const extension = this.getFileExtension(outputFormat);
        
        // Add timestamp to avoid caching issues
        const timestamp = Date.now();
        return `${nameWithoutExt}_optimized_${timestamp}.${extension}`;
    }

    /**
     * Get file extension from MIME type
     * @param {string} mimeType 
     * @returns {string}
     */
    static getFileExtension(mimeType) {
        const extensions = {
            'image/jpeg': 'jpg',
            'image/png': 'png',
            'image/webp': 'webp'
        };
        return extensions[mimeType] || 'jpg';
    }

    /**
     * Get human readable format name
     * @param {string} mimeType 
     * @returns {string}
     */
    static getFormatName(mimeType) {
        const formats = {
            'image/jpeg': 'JPG',
            'image/png': 'PNG', 
            'image/webp': 'WebP'
        };
        return formats[mimeType] || 'Bilinmeyen';
    }

    /**
     * Format file size for display
     * @param {number} bytes 
     * @returns {string}
     */
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Create image preview URL
     * @param {File} file 
     * @returns {string}
     */
    static createPreviewUrl(file) {
        return URL.createObjectURL(file);
    }

    /**
     * Cleanup preview URL to prevent memory leaks
     * @param {string} url 
     */
    static cleanupPreviewUrl(url) {
        if (url && url.startsWith('blob:')) {
            URL.revokeObjectURL(url);
        }
    }
}

// Export for use in other files
window.ImageOptimizer = ImageOptimizer;