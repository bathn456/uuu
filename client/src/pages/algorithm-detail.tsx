import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { ArrowLeft, FileText, Image, Play, Trash2, Plus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Header } from '@/components/header';
import { useAdmin } from '@/components/admin-provider';
import { useToast } from '@/hooks/use-toast';
import { AdminAuth } from '@/lib/admin-auth';
import { UploadModal } from '@/components/upload-modal';
import type { Algorithm, AlgorithmContent } from '@shared/schema';

export default function AlgorithmDetail() {
  const [, navigate] = useLocation();
  const params = useParams();
  const algorithmId = params.id;
  
  const [selectedContent, setSelectedContent] = useState<AlgorithmContent | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const { isAdmin } = useAdmin();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const adminAuth = AdminAuth.getInstance();

  const { data: algorithm, isLoading: algorithmLoading } = useQuery<Algorithm>({
    queryKey: ['/api/algorithms', algorithmId],
    enabled: !!algorithmId,
  });

  const { data: content = [], isLoading: contentLoading } = useQuery<AlgorithmContent[]>({
    queryKey: ['/api/algorithms', algorithmId, 'content'],
    enabled: !!algorithmId,
  });

  const deleteContentMutation = useMutation({
    mutationFn: async (contentId: string) => {
      await fetch(`/api/content/${contentId}`, {
        method: 'DELETE',
        headers: adminAuth.getAuthHeaders(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/algorithms', algorithmId, 'content'] });
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

  const deleteAlgorithmMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/algorithms/${id}`, {
        method: 'DELETE',
        headers: adminAuth.getAuthHeaders(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/algorithms'] });
      navigate('/');
      toast({ title: 'Algorithm deleted successfully' });
    },
    onError: () => {
      toast({ 
        title: 'Failed to delete algorithm', 
        variant: 'destructive' 
      });
    },
  });

  const handleDeleteAlgorithm = (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}" and all its content?`)) {
      deleteAlgorithmMutation.mutate(id);
    }
  };

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

  if (algorithmLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-96 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="h-96 bg-gray-200 rounded-xl"></div>
              <div className="lg:col-span-2 h-96 bg-gray-200 rounded-xl"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!algorithm) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-16">
            <h1 className="text-2xl font-bold text-neutral-800 mb-4">Algorithm Not Found</h1>
            <Button onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-neutral-50">
        <Header />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Algorithm Header */}
          <div className="mb-8">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Algorithms
            </Button>
            
            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
                    <i className={`${algorithm.icon} text-primary text-2xl`}></i>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-neutral-800">{algorithm.title}</h1>
                    <p className="text-lg text-neutral-600 mt-2">{algorithm.description}</p>
                    <div className="flex items-center gap-4 mt-4 text-sm text-neutral-500">
                      <span>{algorithm.resourceCount} learning materials</span>
                      <span>Created: {new Date(algorithm.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                
                {isAdmin && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setIsUploadOpen(true)}
                      className="bg-accent hover:bg-accent/90 text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Content
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleDeleteAlgorithm(algorithm!.id, algorithm!.title)}
                      className="hover:bg-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Algorithm
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Content List */}
            <div className="bg-white rounded-xl shadow-md">
              <div className="p-6 border-b border-neutral-200">
                <h2 className="text-xl font-semibold text-neutral-800">Learning Materials</h2>
              </div>
              
              <ScrollArea className="h-[600px]">
                <div className="p-4">
                  {contentLoading ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-16 bg-gray-200 rounded-lg animate-pulse"></div>
                      ))}
                    </div>
                  ) : content.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
                      <p className="text-neutral-500 mb-4">No learning materials yet</p>
                      {isAdmin && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsUploadOpen(true)}
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
                          className={`p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 cursor-pointer transition-colors ${
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
                                  {item.category} • {formatFileSize(item.fileSize)}
                                </p>
                              </div>
                            </div>
                            {isAdmin && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteContent(item.id, item.title);
                                }}
                                className="text-neutral-400 hover:text-red-500 p-1 ml-2"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Content Viewer */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-md">
              <ScrollArea className="h-[600px]">
                <div className="p-6">
                  {selectedContent ? (
                    <div>
                      <div className="mb-6">
                        <h3 className="text-2xl font-semibold text-neutral-800 mb-2">
                          {selectedContent.title}
                        </h3>
                        {selectedContent.description && (
                          <p className="text-neutral-600 mb-4">{selectedContent.description}</p>
                        )}
                        <div className="flex items-center gap-6 text-sm text-neutral-500">
                          <span className="px-3 py-1 bg-neutral-100 rounded-full">
                            {selectedContent.category}
                          </span>
                          <span>Size: {formatFileSize(selectedContent.fileSize)}</span>
                          <span>Type: {selectedContent.fileType}</span>
                        </div>
                      </div>

                      <div className="border border-neutral-200 rounded-lg p-6 bg-neutral-50">
                        {selectedContent.fileType.includes('image') ? (
                          <img
                            src={`/uploads/${selectedContent.fileName}`}
                            alt={selectedContent.title}
                            className="max-w-full h-auto rounded"
                          />
                        ) : selectedContent.fileType.includes('pdf') ? (
                          <div className="text-center py-12">
                            <FileText className="w-20 h-20 text-neutral-400 mx-auto mb-6" />
                            <h4 className="text-lg font-medium text-neutral-700 mb-2">PDF Document</h4>
                            <p className="text-neutral-500 mb-6">{selectedContent.fileName}</p>
                            <Button asChild>
                              <a
                                href={`/uploads/${selectedContent.fileName}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center"
                              >
                                Open PDF
                              </a>
                            </Button>
                          </div>
                        ) : (
                          <div className="text-center py-12">
                            <FileText className="w-20 h-20 text-neutral-400 mx-auto mb-6" />
                            <h4 className="text-lg font-medium text-neutral-700 mb-2">
                              {selectedContent.fileName}
                            </h4>
                            <p className="text-neutral-500 mb-6">
                              {selectedContent.fileType}
                            </p>
                            <Button asChild>
                              <a
                                href={`/uploads/${selectedContent.fileName}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center"
                              >
                                Download File
                              </a>
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-24">
                      <FileText className="w-20 h-20 text-neutral-300 mx-auto mb-6" />
                      <h3 className="text-xl font-semibold text-neutral-600 mb-2">
                        Select a learning material
                      </h3>
                      <p className="text-neutral-500">
                        Choose a file from the left sidebar to view its content
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </main>
      </div>

      <UploadModal
        algorithmId={algorithmId!}
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={() => {
          setIsUploadOpen(false);
          queryClient.invalidateQueries({ queryKey: ['/api/algorithms', algorithmId, 'content'] });
          queryClient.invalidateQueries({ queryKey: ['/api/algorithms'] });
        }}
      />
    </>
  );
}
