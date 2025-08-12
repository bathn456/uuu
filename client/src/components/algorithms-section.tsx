import { useState } from 'react';
import { Search, Plus, Trash2, ArrowRight } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAdmin } from '@/components/admin-provider';
import { useToast } from '@/hooks/use-toast';
import { AdminAuth } from '@/lib/admin-auth';
import { apiRequest } from '@/lib/queryClient';
import { ContentModal } from '@/components/content-modal';
import { FileUploadModal } from '@/components/file-upload-modal';
import { FileListModal } from '@/components/file-list-modal';
import type { Algorithm } from '@shared/schema';

export function AlgorithmsSection() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<Algorithm | null>(null);
  const [newAlgorithm, setNewAlgorithm] = useState({
    title: '',
    description: '',
    icon: 'fas fa-brain',
  });

  const { isAdmin } = useAdmin();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const adminAuth = AdminAuth.getInstance();

  const { data: algorithms = [], isLoading } = useQuery<Algorithm[]>({
    queryKey: ['/api/algorithms'],
  });

  const createAlgorithmMutation = useMutation({
    mutationFn: async (data: typeof newAlgorithm) => {
      const response = await apiRequest('POST', '/api/algorithms', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/algorithms'] });
      setIsAddDialogOpen(false);
      setNewAlgorithm({ title: '', description: '', icon: 'fas fa-brain' });
      toast({ title: 'Algorithm created successfully' });
    },
    onError: () => {
      toast({ 
        title: 'Failed to create algorithm', 
        variant: 'destructive' 
      });
    },
  });

  const deleteAlgorithmMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/algorithms/${id}`, {
        method: 'DELETE',
        headers: adminAuth.getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error(`Delete failed: ${response.status}`);
      }
      return { id };
    },
    onMutate: async (deletedId: string) => {
      console.log('Delete onMutate - deleting ID:', deletedId);
      
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/algorithms'] });
      
      // Snapshot the previous value
      const previousAlgorithms = queryClient.getQueryData<Algorithm[]>(['/api/algorithms']);
      console.log('Previous algorithms:', previousAlgorithms);
      
      // Optimistically update to the new value
      queryClient.setQueryData<Algorithm[]>(['/api/algorithms'], (old) => {
        console.log('Old data:', old);
        const filtered = old ? old.filter(algorithm => algorithm.id !== deletedId) : [];
        console.log('Filtered data:', filtered);
        return filtered;
      });
      
      return { previousAlgorithms };
    },
    onSuccess: (data, deletedId) => {
      console.log('Delete successful for ID:', deletedId);
      toast({ title: 'Algorithm deleted successfully' });
      // Don't invalidate immediately - trust the optimistic update
    },
    onError: (error, deletedId, context) => {
      console.log('Delete failed for ID:', deletedId, error);
      // If the mutation fails, use the context to roll back
      if (context?.previousAlgorithms) {
        queryClient.setQueryData(['/api/algorithms'], context.previousAlgorithms);
      }
      toast({ 
        title: 'Failed to delete algorithm', 
        variant: 'destructive' 
      });
    },
  });

  const filteredAlgorithms = algorithms.filter((algorithm: Algorithm) =>
    algorithm.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    algorithm.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateAlgorithm = () => {
    if (!newAlgorithm.title.trim() || !newAlgorithm.description.trim()) {
      toast({ 
        title: 'Please fill in all fields', 
        variant: 'destructive' 
      });
      return;
    }
    createAlgorithmMutation.mutate(newAlgorithm);
  };

  const handleDeleteAlgorithm = (id: string, title: string) => {
    console.log('Attempting to delete algorithm:', { id, title });
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      console.log('Confirmed deletion, calling mutation');
      deleteAlgorithmMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <section id="algorithms" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-96 mx-auto mb-16"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section id="algorithms" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-neutral-800 mb-4">Learn Algorithms</h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Explore comprehensive guides and visual explanations for cutting-edge deep learning algorithms
            </p>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-4">
            <div className="relative w-full md:w-96">
              <Input
                type="text"
                placeholder="Search algorithms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-3 border border-neutral-200 rounded-xl"
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
            </div>
            
            {isAdmin && (
              <div className="flex gap-2 flex-wrap">
                <FileUploadModal 
                  category="algorithm" 
                  triggerText="Add File" 
                />
                <FileListModal 
                  category="algorithm" 
                  triggerText="Delete Files" 
                />
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-accent hover:bg-accent/90 text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Algorithm
                    </Button>
                  </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Algorithm</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={newAlgorithm.title}
                        onChange={(e) => setNewAlgorithm({ ...newAlgorithm, title: e.target.value })}
                        placeholder="Algorithm name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newAlgorithm.description}
                        onChange={(e) => setNewAlgorithm({ ...newAlgorithm, description: e.target.value })}
                        placeholder="Brief description"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="icon">Icon (FontAwesome class)</Label>
                      <Input
                        id="icon"
                        value={newAlgorithm.icon}
                        onChange={(e) => setNewAlgorithm({ ...newAlgorithm, icon: e.target.value })}
                        placeholder="fas fa-brain"
                      />
                    </div>
                    <Button 
                      onClick={handleCreateAlgorithm} 
                      className="w-full"
                      disabled={createAlgorithmMutation.isPending}
                    >
                      {createAlgorithmMutation.isPending ? 'Creating...' : 'Create Algorithm'}
                    </Button>
                  </div>
                </DialogContent>
                </Dialog>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredAlgorithms.map((algorithm: Algorithm) => (
              <div
                key={algorithm.id}
                className="bg-white border border-neutral-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <i className={`${algorithm.icon} text-primary text-xl`}></i>
                  </div>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDeleteAlgorithm(algorithm.id, algorithm.title);
                      }}
                      className="text-neutral-400 hover:text-red-500 transition-colors p-1 z-10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <h3 className="text-xl font-semibold text-neutral-800 mb-2">
                  {algorithm.title}
                </h3>
                <p className="text-neutral-600 mb-4">{algorithm.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-500">
                    {algorithm.resourceCount} resources
                  </span>
                  <Button
                    variant="ghost"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedAlgorithm(algorithm);
                    }}
                    className="text-blue-600 hover:text-blue-700 font-medium p-0"
                  >
                    Learn More <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {filteredAlgorithms.length === 0 && (
            <div className="text-center py-16">
              <p className="text-neutral-500 text-lg">No algorithms found matching your search.</p>
            </div>
          )}
        </div>
      </section>

      {selectedAlgorithm && (
        <ContentModal
          algorithm={selectedAlgorithm}
          isOpen={!!selectedAlgorithm}
          onClose={() => setSelectedAlgorithm(null)}
        />
      )}
    </>
  );
}
