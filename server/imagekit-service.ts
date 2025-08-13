import ImageKit from 'imagekit';
import fs from 'fs';
import path from 'path';

// ImageKit configuration using environment variables with fallback
let imagekit: ImageKit | null = null;

// Only initialize ImageKit if all required environment variables are present
if (process.env.IMAGEKIT_PUBLIC_KEY && 
    process.env.IMAGEKIT_PRIVATE_KEY && 
    process.env.IMAGEKIT_URL_ENDPOINT) {
  imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
  });
} else {
  console.log('ImageKit not configured - falling back to local file storage');
}

export interface ImageKitUploadOptions {
  file: Buffer | string; // Buffer or file path
  fileName: string;
  folder?: string;
  useUniqueFileName?: boolean;
  tags?: string[];
  customCoordinates?: string;
  responseFields?: string[];
}

export interface ImageKitUploadResult {
  fileId: string;
  name: string;
  url: string;
  thumbnailUrl: string;
  height: number;
  width: number;
  size: number;
  filePath: string;
  tags?: string[];
}

export class ImageKitService {
  /**
   * Upload file to ImageKit with optimization
   */
  static async uploadFile(options: ImageKitUploadOptions): Promise<ImageKitUploadResult> {
    if (!imagekit) {
      throw new Error('ImageKit is not configured. Please provide IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, and IMAGEKIT_URL_ENDPOINT environment variables.');
    }

    try {
      const uploadResponse = await imagekit.upload({
        file: options.file,
        fileName: options.fileName,
        folder: options.folder || '/deep-learning-platform',
        useUniqueFileName: options.useUniqueFileName !== false,
        tags: options.tags || [],
        customCoordinates: options.customCoordinates,
        responseFields: options.responseFields || ['tags', 'customCoordinates', 'isPrivateFile']
      });

      return {
        fileId: uploadResponse.fileId,
        name: uploadResponse.name,
        url: uploadResponse.url,
        thumbnailUrl: uploadResponse.thumbnailUrl || uploadResponse.url,
        height: uploadResponse.height || 0,
        width: uploadResponse.width || 0,
        size: uploadResponse.size,
        filePath: uploadResponse.filePath,
        tags: uploadResponse.tags
      };
    } catch (error) {
      console.error('ImageKit upload error:', error);
      throw new Error(`ImageKit upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload file from local filesystem to ImageKit
   */
  static async uploadLocalFile(filePath: string, options: Partial<ImageKitUploadOptions> = {}): Promise<ImageKitUploadResult> {
    try {
      // Read file buffer
      const fileBuffer = fs.readFileSync(filePath);
      const fileName = options.fileName || path.basename(filePath);

      return await this.uploadFile({
        file: fileBuffer,
        fileName,
        folder: options.folder,
        useUniqueFileName: options.useUniqueFileName,
        tags: options.tags,
        customCoordinates: options.customCoordinates,
        responseFields: options.responseFields
      });
    } catch (error) {
      console.error('Local file upload error:', error);
      throw new Error(`Failed to upload local file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete file from ImageKit
   */
  static async deleteFile(fileId: string): Promise<void> {
    if (!imagekit) {
      throw new Error('ImageKit is not configured. Please provide IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, and IMAGEKIT_URL_ENDPOINT environment variables.');
    }

    try {
      await imagekit.deleteFile(fileId);
    } catch (error) {
      console.error('ImageKit delete error:', error);
      throw new Error(`ImageKit delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get optimized image URL with transformations
   */
  static getOptimizedUrl(filePath: string, options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'auto' | 'webp' | 'jpg' | 'png';
    progressive?: boolean;
  } = {}): string {
    if (!imagekit) {
      // Return the original file path if ImageKit is not configured
      return filePath;
    }

    const transformation: Array<{ name: string; value: string }> = [];

    if (options.width) transformation.push({ name: 'width', value: options.width.toString() });
    if (options.height) transformation.push({ name: 'height', value: options.height.toString() });
    if (options.quality) transformation.push({ name: 'quality', value: options.quality.toString() });
    if (options.format) transformation.push({ name: 'format', value: options.format });
    if (options.progressive) transformation.push({ name: 'progressive', value: 'true' });

    return imagekit.url({
      path: filePath,
      transformation: transformation
    });
  }

  /**
   * Get authentication parameters for client-side uploads
   */
  static getAuthParams(): { signature: string; expire: number; token: string } {
    if (!imagekit) {
      throw new Error('ImageKit is not configured. Please provide IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, and IMAGEKIT_URL_ENDPOINT environment variables.');
    }

    return imagekit.getAuthenticationParameters();
  }

  /**
   * List files in ImageKit
   */
  static async listFiles(options: {
    skip?: number;
    limit?: number;
    searchQuery?: string;
    folder?: string;
  } = {}): Promise<any[]> {
    if (!imagekit) {
      throw new Error('ImageKit is not configured. Please provide IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, and IMAGEKIT_URL_ENDPOINT environment variables.');
    }

    try {
      const response = await imagekit.listFiles({
        skip: options.skip || 0,
        limit: options.limit || 20,
        searchQuery: options.searchQuery,
        path: options.folder
      });
      return response;
    } catch (error) {
      console.error('ImageKit list files error:', error);
      throw new Error(`Failed to list files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if ImageKit is properly configured
   */
  static isConfigured(): boolean {
    return !!(
      process.env.IMAGEKIT_PUBLIC_KEY &&
      process.env.IMAGEKIT_PRIVATE_KEY &&
      process.env.IMAGEKIT_URL_ENDPOINT
    );
  }
}

export default ImageKitService;