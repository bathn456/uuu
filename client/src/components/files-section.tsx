import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { FileImage, FileText, Download, Trash2, Eye } from 'lucide-react';
import { useAdmin } from '@/components/admin-provider';
import { useToast } from '@/hooks/use-toast';
import { AdminAuth } from '@/lib/admin-auth';
import type { File } from '@shared/schema';

export function FilesSection() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { isAdmin } = useAdmin();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const adminAuth = AdminAuth.getInstance();

  const { data: generalFiles = [], isLoading: loadingFiles } = useQuery<File[]>({
    queryKey: ['/api/files'],
  });

  const { data: algorithmContent = [], isLoading: loadingContent } = useQuery({
    queryKey: ['/api/algorithm-content'],
    queryFn: async () => {
      const response = await fetch('/api/algorithm-content');
      if (!response.ok) throw new Error('Failed to fetch algorithm content');
      return response.json();
    }
  });

  // Combine both file sources into a unified list
  const allFiles = [
    ...generalFiles,
    ...algorithmContent.map((content: any) => ({
      id: content.id,
      fileName: content.fileName,
      originalName: content.title || content.fileName,
      fileType: content.fileType,
      fileSize: content.fileSize,
      filePath: content.filePath,
      category: `algorithm-${content.category}`,
      relatedId: content.algorithmId,
      createdAt: content.createdAt,
      isAlgorithmContent: true
    }))
  ];

  const isLoading = loadingFiles || loadingContent;

  const deleteFileMutation = useMutation({
    mutationFn: async ({ id, isAlgorithmContent }: { id: string; isAlgorithmContent?: boolean }) => {
      const endpoint = isAlgorithmContent ? `/api/content/${id}` : `/api/files/${id}`;
      await fetch(endpoint, {
        method: 'DELETE',
        headers: adminAuth.getAuthHeaders(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
      queryClient.invalidateQueries({ queryKey: ['/api/algorithm-content'] });
      toast({ title: 'File deleted successfully' });
    },
    onError: () => {
      toast({ 
        title: 'Failed to delete file', 
        variant: 'destructive' 
      });
    },
  });

  const handleDeleteFile = (id: string, fileName: string, isAlgorithmContent?: boolean) => {
    if (confirm(`Are you sure you want to delete "${fileName}"?`)) {
      deleteFileMutation.mutate({ id, isAlgorithmContent });
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <FileImage className="w-6 h-6 text-blue-500" />;
    }
    return <FileText className="w-6 h-6 text-neutral-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <section className="py-16 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="py-16 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-neutral-800 mb-4">Uploaded Files</h2>
            <p className="text-lg text-neutral-600">
              View and manage all your uploaded educational materials
            </p>
          </div>

          {allFiles.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
              <p className="text-neutral-500 text-lg mb-4">No files uploaded yet</p>
              <p className="text-neutral-400">Upload files through the algorithm sections to see them here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allFiles.map((file) => (
                <Card key={file.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      {getFileIcon(file.fileType)}
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteFile(file.id, file.originalName, file.isAlgorithmContent)}
                          className="text-neutral-400 hover:text-red-500 transition-colors p-1"
                          data-testid={`button-delete-file-${file.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    
                    <h3 className="font-semibold text-neutral-800 mb-2 truncate" title={file.originalName}>
                      {file.originalName}
                    </h3>
                    
                    <div className="space-y-2 text-sm text-neutral-600 mb-4">
                      <p>Type: {file.fileType}</p>
                      <p>Size: {formatFileSize(file.fileSize)}</p>
                      <p>Category: {file.category}</p>
                      <p>Uploaded: {new Date(file.createdAt).toLocaleDateString()}</p>
                    </div>

                    <div className="flex space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            data-testid={`button-view-file-${file.id}`}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
                          <DialogHeader>
                            <DialogTitle>{file.originalName}</DialogTitle>
                            <DialogDescription>
                              File preview for {file.originalName} ({file.fileType})
                            </DialogDescription>
                          </DialogHeader>
                          <div className="mt-4">
                            {file.fileType.startsWith('image/') ? (
                              <img
                                src={`/uploads/${file.fileName}`}
                                alt={file.originalName}
                                className="max-w-full h-auto rounded-lg"
                                data-testid={`image-preview-${file.id}`}
                              />
                            ) : (
                              <div className="text-center py-8">
                                <FileText className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
                                <p className="text-neutral-600">Preview not available for this file type</p>
                                <a
                                  href={`/uploads/${file.fileName}`}
                                  download={file.originalName}
                                  className="text-blue-600 hover:text-blue-700 underline"
                                >
                                  Download to view
                                </a>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100"
                        data-testid={`button-download-file-${file.id}`}
                      >
                        <a href={`/api/download/${file.id}`} download={file.originalName}>
                          <Download className="w-4 h-4 mr-1" />
                          Ultra-HQ Download
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {selectedFile && (
        <Dialog open={!!selectedFile} onOpenChange={() => setSelectedFile(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{selectedFile.originalName}</DialogTitle>
              <DialogDescription>
                File preview for {selectedFile.originalName} ({selectedFile.fileType})
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              {selectedFile.fileType.startsWith('image/') ? (
                <img
                  src={`/uploads/${selectedFile.fileName}`}
                  alt={selectedFile.originalName}
                  className="max-w-full h-auto"
                />
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
                  <p className="text-neutral-600">Preview not available for this file type</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}