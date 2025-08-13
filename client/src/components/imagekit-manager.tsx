import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Upload, Image, Download, Trash2, Settings, Zap, Cloud, Eye, ExternalLink } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface ImageKitFile {
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

interface ImageKitAuth {
  signature: string;
  expire: number;
  token: string;
  configured: boolean;
  publicKey: string;
  urlEndpoint: string;
}

export function ImageKitManager() {
  const [imageKitAuth, setImageKitAuth] = useState<ImageKitAuth | null>(null);
  const [uploadFiles, setUploadFiles] = useState<FileList | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [imagekitFiles, setImagekitFiles] = useState<ImageKitFile[]>([]);
  const [useImageKit, setUseImageKit] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [optimizationOptions, setOptimizationOptions] = useState({
    width: 800,
    height: 600,
    quality: 80,
    format: 'auto' as 'auto' | 'webp' | 'jpg' | 'png'
  });
  
  const { toast } = useToast();

  useEffect(() => {
    fetchImageKitAuth();
    fetchImageKitFiles();
  }, []);

  const fetchImageKitAuth = async () => {
    try {
      const response = await fetch('/api/imagekit/auth', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      setImageKitAuth(data);
      
      if (!data.configured) {
        toast({
          title: 'ImageKit Configuration',
          description: 'ImageKit is not configured. Some features will be limited to local storage.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Failed to fetch ImageKit auth:', error);
      toast({
        title: 'Connection Error',
        description: 'Failed to connect to ImageKit service.',
        variant: 'destructive'
      });
    }
  };

  const fetchImageKitFiles = async () => {
    try {
      if (!imageKitAuth?.configured) return;
      
      const response = await fetch('/api/imagekit/files', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      setImagekitFiles(data);
    } catch (error) {
      console.error('Failed to fetch ImageKit files:', error);
    }
  };

  const handleFileUpload = async () => {
    if (!uploadFiles || uploadFiles.length === 0) {
      toast({
        title: 'No Files',
        description: 'Please select files to upload.',
        variant: 'destructive'
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const totalFiles = uploadFiles.length;
      let successCount = 0;

      for (let i = 0; i < totalFiles; i++) {
        const file = uploadFiles[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'imagekit-uploads');
        formData.append('tags', 'upload,managed');
        formData.append('useImageKit', useImageKit.toString());

        try {
          const response = useImageKit && imageKitAuth?.configured
            ? await fetch('/api/imagekit/upload', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: formData
              })
            : await fetch('/api/files', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: formData
              });
          
          if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`);
          }
          
          await response.json();

          successCount++;
          setUploadProgress(Math.round((i + 1) / totalFiles * 100));
          
          toast({
            title: 'Upload Success',
            description: `${file.name} uploaded successfully ${useImageKit && imageKitAuth?.configured ? 'to ImageKit' : 'locally'}`
          });
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error);
          toast({
            title: 'Upload Failed',
            description: `Failed to upload ${file.name}`,
            variant: 'destructive'
          });
        }
      }

      if (successCount > 0) {
        fetchImageKitFiles();
        setUploadFiles(null);
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Error',
        description: 'An error occurred during upload.',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteFile = async (fileId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/imagekit/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Delete failed: ${response.statusText}`);
      }
      
      setImagekitFiles(prev => prev.filter(f => f.fileId !== fileId));
      
      toast({
        title: 'File Deleted',
        description: `${fileName} has been deleted from ImageKit.`
      });
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete file from ImageKit.',
        variant: 'destructive'
      });
    }
  };

  const generateOptimizedUrl = (filePath: string) => {
    if (!imageKitAuth?.configured || !imageKitAuth.urlEndpoint) return '';
    
    const params = new URLSearchParams({
      width: optimizationOptions.width.toString(),
      height: optimizationOptions.height.toString(),
      quality: optimizationOptions.quality.toString(),
      format: optimizationOptions.format
    });
    
    return `/api/imagekit/optimize${filePath}?${params}`;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">ImageKit Manager</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your images with cloud optimization and CDN delivery
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={imageKitAuth?.configured ? 'default' : 'destructive'}>
            {imageKitAuth?.configured ? 'Connected' : 'Not Configured'}
          </Badge>
          {imageKitAuth?.configured && (
            <Badge variant="outline" className="text-green-600">
              <Cloud className="w-3 h-3 mr-1" />
              ImageKit Ready
            </Badge>
          )}
        </div>
      </div>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="optimize">Optimize</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="w-5 h-5 mr-2" />
                Upload Files
              </CardTitle>
              <CardDescription>
                Upload images and files to ImageKit for optimization and CDN delivery
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="use-imagekit"
                  checked={useImageKit}
                  onCheckedChange={setUseImageKit}
                  disabled={!imageKitAuth?.configured}
                />
                <Label htmlFor="use-imagekit">
                  Upload to ImageKit (cloud storage with optimization)
                </Label>
              </div>

              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <Label htmlFor="file-upload" className="cursor-pointer">
                      <span className="mt-2 block text-sm font-medium text-gray-900 dark:text-white">
                        Click to upload files
                      </span>
                      <Input
                        id="file-upload"
                        type="file"
                        multiple
                        accept="image/*,video/*,audio/*,.pdf"
                        className="hidden"
                        onChange={(e) => setUploadFiles(e.target.files)}
                      />
                    </Label>
                    <p className="mt-1 text-xs text-gray-500">
                      Support for images, videos, audio, and documents
                    </p>
                  </div>
                </div>
              </div>

              {uploadFiles && uploadFiles.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Selected Files ({uploadFiles.length})</h4>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {Array.from(uploadFiles).map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <span className="text-sm truncate">{file.name}</span>
                        <span className="text-xs text-gray-500">{formatFileSize(file.size)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isUploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Uploading files...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                </div>
              )}

              <Button 
                onClick={handleFileUpload} 
                disabled={!uploadFiles || uploadFiles.length === 0 || isUploading}
                className="w-full"
              >
                {isUploading ? 'Uploading...' : `Upload ${uploadFiles ? uploadFiles.length : 0} Files`}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="files" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Image className="w-5 h-5 mr-2" />
                ImageKit Files ({imagekitFiles.length})
              </CardTitle>
              <CardDescription>
                Manage files stored in ImageKit cloud storage
              </CardDescription>
            </CardHeader>
            <CardContent>
              {imagekitFiles.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No files found in ImageKit storage
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {imagekitFiles.map((file) => (
                    <Card key={file.fileId} className="overflow-hidden">
                      <div className="aspect-video bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        {file.thumbnailUrl ? (
                          <img
                            src={file.thumbnailUrl}
                            alt={file.name}
                            className="max-w-full max-h-full object-contain"
                            loading="lazy"
                          />
                        ) : (
                          <Image className="w-12 h-12 text-gray-400" />
                        )}
                      </div>
                      <CardContent className="p-3 space-y-2">
                        <h4 className="font-medium text-sm truncate" title={file.name}>
                          {file.name}
                        </h4>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{formatFileSize(file.size)}</span>
                          {file.width && file.height && (
                            <span>{file.width}x{file.height}</span>
                          )}
                        </div>
                        {file.tags && file.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {file.tags.slice(0, 2).map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => window.open(file.url, '_blank')}
                          >
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = file.url;
                              link.download = file.name;
                              link.click();
                            }}
                          >
                            <Download className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteFile(file.fileId, file.name)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimize" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="w-5 h-5 mr-2" />
                Image Optimization
              </CardTitle>
              <CardDescription>
                Test ImageKit's real-time optimization features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="width">Width (px)</Label>
                  <Input
                    id="width"
                    type="number"
                    value={optimizationOptions.width}
                    onChange={(e) => setOptimizationOptions(prev => ({
                      ...prev,
                      width: parseInt(e.target.value) || 800
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="height">Height (px)</Label>
                  <Input
                    id="height"
                    type="number"
                    value={optimizationOptions.height}
                    onChange={(e) => setOptimizationOptions(prev => ({
                      ...prev,
                      height: parseInt(e.target.value) || 600
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="quality">Quality (%)</Label>
                  <Input
                    id="quality"
                    type="number"
                    min="1"
                    max="100"
                    value={optimizationOptions.quality}
                    onChange={(e) => setOptimizationOptions(prev => ({
                      ...prev,
                      quality: parseInt(e.target.value) || 80
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="format">Format</Label>
                  <select
                    id="format"
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                    value={optimizationOptions.format}
                    onChange={(e) => setOptimizationOptions(prev => ({
                      ...prev,
                      format: e.target.value as any
                    }))}
                  >
                    <option value="auto">Auto</option>
                    <option value="webp">WebP</option>
                    <option value="jpg">JPEG</option>
                    <option value="png">PNG</option>
                  </select>
                </div>
              </div>

              {imagekitFiles.length > 0 && (
                <div>
                  <Label>Test with sample image</Label>
                  <select
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 mt-1"
                    value={previewUrl}
                    onChange={(e) => setPreviewUrl(e.target.value)}
                  >
                    <option value="">Select an image to preview optimization</option>
                    {imagekitFiles
                      .filter(f => f.url.match(/\.(jpg|jpeg|png|webp)$/i))
                      .map((file) => (
                        <option key={file.fileId} value={file.filePath}>
                          {file.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {previewUrl && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Original</h4>
                    <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                      <img
                        src={`${imageKitAuth?.urlEndpoint}${previewUrl}`}
                        alt="Original"
                        className="w-full h-auto"
                        loading="lazy"
                      />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Optimized</h4>
                    <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                      <img
                        src={generateOptimizedUrl(previewUrl)}
                        alt="Optimized"
                        className="w-full h-auto"
                        loading="lazy"
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                ImageKit Configuration
              </CardTitle>
              <CardDescription>
                Current ImageKit connection and settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Status</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant={imageKitAuth?.configured ? 'default' : 'destructive'}>
                      {imageKitAuth?.configured ? 'Connected' : 'Not Configured'}
                    </Badge>
                  </div>
                </div>
                {imageKitAuth?.configured && (
                  <>
                    <div>
                      <Label>Public Key</Label>
                      <Input
                        value={imageKitAuth.publicKey || ''}
                        disabled
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>URL Endpoint</Label>
                      <Input
                        value={imageKitAuth.urlEndpoint || ''}
                        disabled
                        className="mt-1"
                      />
                    </div>
                  </>
                )}
              </div>

              {!imageKitAuth?.configured && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
                    ImageKit Not Configured
                  </h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    To use ImageKit features, please configure your ImageKit credentials in the environment settings.
                    You'll need your Public Key, Private Key, and URL Endpoint from your ImageKit dashboard.
                  </p>
                </div>
              )}

              <Button onClick={fetchImageKitAuth} variant="outline">
                Refresh Configuration
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ImageKitManager;