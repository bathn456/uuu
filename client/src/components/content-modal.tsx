import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, FileText, Image, Play, Trash2, BookOpen, Maximize, Download, Eye } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAdmin } from '@/components/admin-provider';
import { useToast } from '@/hooks/use-toast';
import { AdminAuth } from '@/lib/admin-auth';
import { EnhancedUploadModal } from '@/components/enhanced-upload-modal';
import { HandwrittenNotes } from '@/components/handwritten-notes';
import { NoteEditor } from '@/components/note-editor';
import type { Algorithm, AlgorithmContent, Note } from '@shared/schema';

interface ContentModalProps {
  algorithm: Algorithm;
  isOpen: boolean;
  onClose: () => void;
}

export function ContentModal({ algorithm, isOpen, onClose }: ContentModalProps) {
  const [selectedContent, setSelectedContent] = useState<AlgorithmContent | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [showHandwrittenNotes, setShowHandwrittenNotes] = useState(true);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const { isAdmin } = useAdmin();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const adminAuth = AdminAuth.getInstance();

  const { data: content = [], isLoading } = useQuery<AlgorithmContent[]>({
    queryKey: ['/api/algorithms', algorithm.id, 'content'],
    enabled: isOpen,
  });

  // Remove debug logs to clean up console
  useEffect(() => {
    // Authentication status tracking removed for cleaner console
  }, [isAdmin, adminAuth, content]);

  const { data: notes = [] } = useQuery<Note[]>({
    queryKey: ['/api/algorithms', algorithm.id, 'notes'],
    enabled: isOpen,
  });

  const deleteContentMutation = useMutation({
    mutationFn: async (contentId: string) => {
      await fetch(`/api/content/${contentId}`, {
        method: 'DELETE',
        headers: adminAuth.getAuthHeaders(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/algorithms', algorithm.id, 'content'] });
      queryClient.invalidateQueries({ queryKey: ['/api/algorithms'] });
      setSelectedContent(null);
      toast({ title: 'Content deleted successfully' });
    },
    onError: () => {
      toast({ 
        title: 'Failed to delete content', 
        variant: 'destructive' 
      });
    },
  });

  const handleDeleteContent = (contentId: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      deleteContentMutation.mutate(contentId);
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />;
    if (fileType.includes('image')) return <Image className="w-5 h-5 text-blue-500" />;
    if (fileType.includes('video')) return <Play className="w-5 h-5 text-green-500" />;
    return <FileText className="w-5 h-5 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Simple fullscreen management with mobile support
  const closeFullscreen = () => {
    console.log('Closing fullscreen image');
    setFullscreenImage(null);
  };

  useEffect(() => {
    if (!fullscreenImage) return;

    console.log('Fullscreen image opened:', fullscreenImage);

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        console.log('Escape key pressed - closing fullscreen');
        closeFullscreen();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'auto';
    };
  }, [fullscreenImage]);

  return (
    <>
      
      <Dialog 
        open={isOpen} 
        onOpenChange={(open) => {
          // Prevent dialog from closing when fullscreen is active
          if (fullscreenImage) return;
          if (!open) onClose();
        }}
      >
        <DialogContent className="max-w-6xl w-full max-h-[90vh] p-0">
          <DialogTitle className="sr-only">{algorithm.title} - Content Modal</DialogTitle>
          <DialogDescription className="sr-only">
            View and manage learning materials for {algorithm.title}
          </DialogDescription>
          <div className="flex items-center justify-between p-6 border-b border-neutral-200">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <i className={`${algorithm.icon} text-primary text-xl`}></i>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-neutral-800">{algorithm.title}</h2>
                <p className="text-neutral-600">{algorithm.description}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant={showHandwrittenNotes ? "default" : "outline"}
                onClick={() => setShowHandwrittenNotes(!showHandwrittenNotes)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                {showHandwrittenNotes ? "Hide Notes" : "Show Notes"}
              </Button>
              {isAdmin && selectedContent && (
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteContent(selectedContent.id, selectedContent.title)}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Selected
                </Button>
              )}
              {isAdmin && (
                <Button
                  onClick={() => setIsUploadOpen(true)}
                  className="bg-accent hover:bg-accent/90 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Content
                </Button>
              )}
            </div>
          </div>

          <div className="flex h-[calc(90vh-140px)]">
            <div className="w-1/3 border-r border-neutral-200">
              <ScrollArea className="h-full">
                <div className="p-4">
                  <h3 className="font-semibold text-neutral-800 mb-4">Learning Materials</h3>
                  
                  {isLoading ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-16 bg-gray-200 rounded-lg animate-pulse"></div>
                      ))}
                    </div>
                  ) : content.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
                      <p className="text-neutral-500">No learning materials yet</p>
                      {isAdmin && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsUploadOpen(true)}
                          className="mt-4"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Content
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {content.map((item: AlgorithmContent) => (
                        <div
                          key={item.id}
                          className={`p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50 cursor-pointer transition-colors ${
                            selectedContent?.id === item.id ? 'bg-neutral-50 border-primary' : ''
                          }`}
                          onClick={() => setSelectedContent(item)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              {getFileIcon(item.fileType)}
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-neutral-800 truncate">
                                  {item.title}
                                </p>
                                <p className="text-sm text-neutral-500">
                                  {item.fileType.split('/')[1]?.toUpperCase()} • {formatFileSize(item.fileSize)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-2">
                              <Button
                                variant="ghost" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const downloadUrl = `/uploads/${item.filePath.includes('/') ? item.filePath.split('/').pop() : item.filePath}`;
                                  const link = document.createElement('a');
                                  link.href = downloadUrl;
                                  link.download = item.fileName || 'download';
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                }}
                                className="text-neutral-400 hover:text-blue-500 p-2"
                                title="Download file"
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              {isAdmin && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteContent(item.id, item.title);
                                  }}
                                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 font-semibold border-2 border-red-600 shadow-lg"
                                  title="Delete content"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  DELETE
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            <div className="flex-1">
              <ScrollArea className="h-full">
                <div className="p-6">
                  {showHandwrittenNotes && !selectedContent && (
                    <div className="space-y-8">
                      <HandwrittenNotes algorithm={algorithm} />
                      <NoteEditor algorithmId={algorithm.id} notes={notes} isAdmin={isAdmin} />
                    </div>
                  )}
                  
                  {selectedContent ? (
                    <div>
                      <div className="mb-6">
                        <h3 className="text-xl font-semibold text-neutral-800 mb-2">
                          {selectedContent.title}
                        </h3>
                        {selectedContent.description && (
                          <p className="text-neutral-600">{selectedContent.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-4 text-sm text-neutral-500">
                          <span>Category: {selectedContent.category}</span>
                          <span>Size: {formatFileSize(selectedContent.fileSize)}</span>
                          <span>Type: {selectedContent.fileType}</span>
                        </div>
                      </div>

                      <div className="border border-neutral-200 rounded-lg p-4 bg-neutral-50">
                        {selectedContent.fileType.includes('image') ? (
                          <div className="relative">
                            <img
                              src={`/uploads/${selectedContent.filePath.includes('/') ? selectedContent.filePath.split('/').pop() : selectedContent.filePath}`}
                              alt={selectedContent.title}
                              className="w-full max-w-full h-auto rounded object-contain"
                              onError={(e) => {
                                console.error('Failed to load image:', selectedContent.filePath);
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                            <div className="absolute top-2 right-2 z-10 flex gap-2">
                              <button
                                onClick={() => {
                                  const imagePath = `/uploads/${selectedContent.filePath.includes('/') ? selectedContent.filePath.split('/').pop() : selectedContent.filePath}`;
                                  setFullscreenImage(imagePath);
                                }}
                                className="w-8 h-8 bg-white/90 hover:bg-white shadow-md rounded flex items-center justify-center"
                                title="View fullscreen"
                              >
                                <Maximize className="w-4 h-4" />
                              </button>
                              <a
                                href={`/api/download/${selectedContent.id}`}
                                download={selectedContent.title}
                                className="w-8 h-8 bg-white/90 hover:bg-white shadow-md rounded flex items-center justify-center"
                                title="Ultra-HQ Download"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            </div>
                          </div>
                        ) : selectedContent.fileType.includes('pdf') ? (
                          <div className="text-center py-8">
                            <FileText className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
                            <p className="text-neutral-600 mb-4">PDF Document</p>
                            <div className="flex gap-3">
                              <Button asChild>
                                <a
                                  href={`/uploads/${selectedContent.filePath.includes('/') ? selectedContent.filePath.split('/').pop() : selectedContent.filePath}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center"
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  Open PDF
                                </a>
                              </Button>
                              <Button variant="outline" asChild>
                                <a
                                  href={`/api/download/${selectedContent.id}`}
                                  download={selectedContent.title}
                                  className="inline-flex items-center"
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  Ultra-HQ Download
                                </a>
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <FileText className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
                            <p className="text-neutral-600 mb-4">
                              {selectedContent.fileName}
                            </p>
                            <div className="flex gap-3">
                              <Button asChild>
                                <a
                                  href={`/uploads/${selectedContent.filePath.includes('/') ? selectedContent.filePath.split('/').pop() : selectedContent.filePath}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center"
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  Open File
                                </a>
                              </Button>
                              <Button variant="outline" asChild>
                                <a
                                  href={`/api/download/${selectedContent.id}`}
                                  download={selectedContent.title}
                                  className="inline-flex items-center"
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  Ultra-HQ Download
                                </a>
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : !showHandwrittenNotes ? (
                    <div className="text-center py-20">
                      <FileText className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-neutral-600 mb-2">
                        Select a file to view
                      </h3>
                      <p className="text-neutral-500">
                        Choose a learning material from the left sidebar
                      </p>
                    </div>
                  ) : null}
                </div>
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <EnhancedUploadModal
        algorithmId={algorithm.id}
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={() => {
          setIsUploadOpen(false);
          queryClient.invalidateQueries({ queryKey: ['/api/algorithms', algorithm.id, 'content'] });
          queryClient.invalidateQueries({ queryKey: ['/api/algorithms'] });
        }}
      />
      
      {/* Fullscreen Image Overlay */}
      {fullscreenImage && createPortal(
        <div 
          className="fixed inset-0 bg-black bg-opacity-90"
          style={{ zIndex: 999999, pointerEvents: 'none' }}
        >
          {/* Interactive Container */}
          <div 
            className="absolute inset-0 flex items-center justify-center"
            style={{ pointerEvents: 'auto' }}
          >
            {/* Image */}
            <img 
              src={fullscreenImage} 
              alt="Fullscreen"
              className="max-w-[90vw] max-h-[90vh] object-contain"
              style={{ pointerEvents: 'auto' }}
            />
          </div>
          
          {/* Instructions */}
          <div 
            className="fixed top-4 left-4 text-white text-sm"
            style={{ pointerEvents: 'auto' }}
          >
            Press ESC or use X button to close
          </div>
          
          {/* Close Button - Right Center */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              console.log('Close button clicked from fullscreen');
              closeFullscreen();
            }}
            className="fixed right-6 top-1/2 transform -translate-y-1/2 bg-gray-600 hover:bg-gray-700 text-white p-3 rounded-full shadow-lg transition-all duration-200"
            style={{ pointerEvents: 'auto' }}
            title="Close fullscreen"
          >
            <X className="w-5 h-5" />
          </button>

          
        </div>,
        document.body
      )}
    </>
  );
}
