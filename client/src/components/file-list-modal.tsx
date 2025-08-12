import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Trash2, FileText, Image, Video, Music, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { File } from '@shared/schema';

interface FileListModalProps {
  category: 'algorithm' | 'project';
  relatedId?: string;
  triggerText: string;
}

function getFileIcon(fileType: string) {
  if (fileType.startsWith('image/')) return <Image className="w-4 h-4" />;
  if (fileType.startsWith('video/')) return <Video className="w-4 h-4" />;
  if (fileType.startsWith('audio/')) return <Music className="w-4 h-4" />;
  return <FileText className="w-4 h-4" />;
}

function formatFileSize(bytes: number) {
  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

export function FileListModal({ category, relatedId, triggerText }: FileListModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: files = [], isLoading } = useQuery({
    queryKey: ['/api/files', category, relatedId],
    queryFn: () => {
      const params = new URLSearchParams();
      params.append('category', category);
      if (relatedId) params.append('relatedId', relatedId);
      return fetch(`/api/files?${params}`).then(res => res.json());
    },
    enabled: isOpen,
  });

  const deleteMutation = useMutation({
    mutationFn: async (fileId: string) => {
      return apiRequest(`/api/files/${fileId}`, 'DELETE');
    },
    onSuccess: () => {
      toast({
        title: "File deleted",
        description: "The file has been removed from the system.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
    },
    onError: (error: any) => {
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete file",
        variant: "destructive",
      });
    },
  });

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      const params = new URLSearchParams();
      if (relatedId) params.append('relatedId', relatedId);
      return apiRequest(`/api/files/category/${category}?${params}`, 'DELETE');
    },
    onSuccess: () => {
      toast({
        title: "All files deleted",
        description: "All files in this category have been removed.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
    },
    onError: (error: any) => {
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete files",
        variant: "destructive",
      });
    },
  });

  const handleDeleteFile = (fileId: string) => {
    deleteMutation.mutate(fileId);
  };

  const handleDeleteAll = () => {
    if (files.length === 0) return;
    
    if (confirm(`Are you sure you want to delete all ${files.length} files?`)) {
      deleteAllMutation.mutate();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Trash2 className="w-4 h-4 mr-2" />
          {triggerText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage Files - {category === 'algorithm' ? 'Algorithms' : 'Projects'}</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">Loading files...</div>
            </div>
          ) : files.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">No files found</div>
            </div>
          ) : (
            <div className="space-y-2">
              {files.map((file: File) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-gray-50 dark:bg-gray-800"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {getFileIcon(file.fileType)}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {file.originalName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatFileSize(file.fileSize)} • {file.fileType}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100"
                      asChild
                    >
                      <a href={`/api/download/${file.id}`} download={file.originalName}>
                        <Download className="w-4 h-4 mr-1" />
                        Ultra-HQ Download
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteFile(file.id)}
                      disabled={deleteMutation.isPending}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {files.length > 0 && (
          <div className="border-t pt-4 flex justify-between">
            <Button
              variant="destructive"
              onClick={handleDeleteAll}
              disabled={deleteAllMutation.isPending}
            >
              {deleteAllMutation.isPending ? 'Deleting...' : `Delete All ${files.length} Files`}
            </Button>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}