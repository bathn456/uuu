import { useState } from 'react';
import { Upload, X, StickyNote, FileText } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { AdminAuth } from '@/lib/admin-auth';

interface EnhancedUploadModalProps {
  algorithmId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EnhancedUploadModal({ algorithmId, isOpen, onClose, onSuccess }: EnhancedUploadModalProps) {
  const [activeTab, setActiveTab] = useState('file');
  
  // File upload state
  const [file, setFile] = useState<File | null>(null);
  const [fileFormData, setFileFormData] = useState({
    title: '',
    description: '',
    category: 'tutorial',
  });

  // Note state
  const [noteFormData, setNoteFormData] = useState({
    title: '',
    content: '',
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const adminAuth = AdminAuth.getInstance();

  const fileUploadMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('No file selected');

      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('title', fileFormData.title || file.name);
      uploadData.append('description', fileFormData.description);
      uploadData.append('category', fileFormData.category);

      console.log('Making upload request with headers:', adminAuth.getAuthHeaders());
      
      const response = await fetch(`/api/algorithms/${algorithmId}/content`, {
        method: 'POST',
        headers: adminAuth.getAuthHeaders(),
        body: uploadData,
      });

      console.log('Upload response status:', response.status);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
        console.error('Upload error:', error);
        throw new Error(error.message || 'Upload failed');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'File uploaded successfully' });
      resetFileForm();
      queryClient.invalidateQueries({ queryKey: ['/api/algorithms', algorithmId, 'content'] });
      queryClient.invalidateQueries({ queryKey: ['/api/algorithms'] });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Upload failed', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  const noteCreateMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/algorithms/${algorithmId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...adminAuth.getAuthHeaders(),
        },
        body: JSON.stringify(noteFormData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create note');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Note created successfully' });
      resetNoteForm();
      queryClient.invalidateQueries({ queryKey: ['/api/algorithms', algorithmId, 'notes'] });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Failed to create note', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  const resetFileForm = () => {
    setFile(null);
    setFileFormData({ title: '', description: '', category: 'tutorial' });
  };

  const resetNoteForm = () => {
    setNoteFormData({ title: '', content: '' });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!fileFormData.title) {
        setFileFormData(prev => ({ ...prev, title: selectedFile.name }));
      }
    }
  };

  const handleFileUpload = () => {
    if (!file) {
      toast({ 
        title: 'Please select a file', 
        variant: 'destructive' 
      });
      return;
    }
    fileUploadMutation.mutate();
  };

  const handleNoteCreate = () => {
    if (!noteFormData.title.trim() || !noteFormData.content.trim()) {
      toast({ 
        title: 'Please fill in both title and content', 
        variant: 'destructive' 
      });
      return;
    }
    noteCreateMutation.mutate();
  };

  const handleClose = () => {
    resetFileForm();
    resetNoteForm();
    setActiveTab('file');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Content</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="file">
              <FileText className="w-4 h-4 mr-1" />
              File
            </TabsTrigger>
            <TabsTrigger value="note">
              <StickyNote className="w-4 h-4 mr-1" />
              Note
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="file" className="space-y-4">
            {/* Compact File Upload Area */}
            <div className="border-2 border-dashed border-neutral-300 rounded-lg p-4 text-center hover:border-primary transition-colors">
              <Upload className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-neutral-600 mb-1">
                {file ? file.name : 'Choose file to upload'}
              </p>
              <input
                type="file"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
                accept=".pdf,.png,.jpg,.jpeg,.gif,.mp4,.html,.txt,.doc,.docx"
              />
              <Button variant="outline" size="sm" asChild>
                <label htmlFor="file-upload" className="cursor-pointer">
                  Browse
                </label>
              </Button>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="file-title" className="text-sm">Title</Label>
                <Input
                  id="file-title"
                  value={fileFormData.title}
                  onChange={(e) => setFileFormData({ ...fileFormData, title: e.target.value })}
                  placeholder="File title"
                  className="h-8"
                />
              </div>
              <div>
                <Label htmlFor="file-category" className="text-sm">Category</Label>
                <Select value={fileFormData.category} onValueChange={(value) => setFileFormData({ ...fileFormData, category: value })}>
                  <SelectTrigger id="file-category" className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tutorial">Tutorial</SelectItem>
                    <SelectItem value="example">Example</SelectItem>
                    <SelectItem value="reference">Reference</SelectItem>
                    <SelectItem value="exercise">Exercise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" size="sm" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                size="sm"
                onClick={handleFileUpload} 
                disabled={!file || fileUploadMutation.isPending}
              >
                {fileUploadMutation.isPending ? 'Uploading...' : 'Upload'}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="note" className="space-y-4">
            <div>
              <Label htmlFor="note-title" className="text-sm">Note Title</Label>
              <Input
                id="note-title"
                value={noteFormData.title}
                onChange={(e) => setNoteFormData({ ...noteFormData, title: e.target.value })}
                placeholder="Enter note title"
                className="h-8"
              />
            </div>
            
            <div>
              <Label htmlFor="note-content" className="text-sm">Content</Label>
              <Textarea
                id="note-content"
                value={noteFormData.content}
                onChange={(e) => setNoteFormData({ ...noteFormData, content: e.target.value })}
                placeholder="Write your notes here..."
                rows={5}
                className="resize-none text-sm"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" size="sm" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                size="sm"
                onClick={handleNoteCreate} 
                disabled={!noteFormData.title.trim() || !noteFormData.content.trim() || noteCreateMutation.isPending}
              >
                {noteCreateMutation.isPending ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}