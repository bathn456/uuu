import { useState } from 'react';
import { ExternalLink, Plus, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileUploadModal } from '@/components/file-upload-modal';
import { FileListModal } from '@/components/file-list-modal';
import { useAdmin } from '@/components/admin-provider';
import { useToast } from '@/hooks/use-toast';
import { AdminAuth } from '@/lib/admin-auth';
import { apiRequest } from '@/lib/queryClient';
import type { Project } from '@shared/schema';

export function ProjectsSection() {
  const [selectedCategory, setSelectedCategory] = useState('All Projects');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    category: '',
    year: '',
    tags: '',
    imageUrl: '',
    projectUrl: '',
  });

  const { isAdmin } = useAdmin();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const adminAuth = AdminAuth.getInstance();

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });

  const createProjectMutation = useMutation({
    mutationFn: async (data: any) => {
      const projectData = {
        ...data,
        tags: data.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean),
      };
      const response = await apiRequest('POST', '/api/projects', projectData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      setIsAddDialogOpen(false);
      setNewProject({
        title: '', description: '', category: '', year: '', tags: '', imageUrl: '', projectUrl: ''
      });
      toast({ title: 'Project created successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to create project', variant: 'destructive' });
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
        headers: adminAuth.getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Failed to delete project');
      }
    },
    onMutate: async (deletedId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/projects'] });
      
      // Snapshot the previous value
      const previousProjects = queryClient.getQueryData(['/api/projects']);
      
      // Optimistically update to the new value
      const oldData = previousProjects as Project[] || [];
      const filteredData = oldData.filter(project => project.id !== deletedId);
      queryClient.setQueryData(['/api/projects'], filteredData);
      
      return { previousProjects };
    },
    onSuccess: (data, deletedId) => {
      toast({ title: 'Project deleted successfully' });
    },
    onError: (error, deletedId, context) => {
      // If the mutation fails, use the context to roll back
      if (context?.previousProjects) {
        queryClient.setQueryData(['/api/projects'], context.previousProjects);
      }
      toast({ 
        title: 'Failed to delete project', 
        variant: 'destructive' 
      });
    },
  });

  const categories = ['All Projects', ...Array.from(new Set(projects.map((p: Project) => p.category)))];

  const filteredProjects = selectedCategory === 'All Projects' 
    ? projects 
    : projects.filter((p: Project) => p.category === selectedCategory);

  const handleCreateProject = () => {
    if (!newProject.title.trim() || !newProject.description.trim() || !newProject.category.trim()) {
      toast({ title: 'Please fill in required fields', variant: 'destructive' });
      return;
    }
    createProjectMutation.mutate(newProject);
  };

  const handleDeleteProject = (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      deleteProjectMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <section id="projects" className="py-20 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-96 mx-auto mb-16"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-80 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="projects" className="py-20 bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-neutral-800 mb-4">Projects</h2>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            Practical implementations and real-world applications of deep learning algorithms
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-3 rounded-xl font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-primary text-white'
                  : 'bg-white text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              {category}
            </Button>
          ))}
        </div>

        {isAdmin && (
          <div className="flex justify-center gap-4 mb-8">
            <FileUploadModal 
              category="project" 
              triggerText="Add File" 
            />
            <FileListModal 
              category="project" 
              triggerText="Delete Files" 
            />
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-accent hover:bg-accent/90 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Project
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xs">
                <DialogHeader>
                  <DialogTitle>Add New Project</DialogTitle>
                  <DialogDescription className="sr-only">
                    Create a new project with details like title, description, category, and year
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={newProject.title}
                      onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                      placeholder="Project title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={newProject.description}
                      onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                      placeholder="Project description"
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Input
                      id="category"
                      value={newProject.category}
                      onChange={(e) => setNewProject({ ...newProject, category: e.target.value })}
                      placeholder="e.g., Computer Vision, NLP"
                    />
                  </div>
                  <div>
                    <Label htmlFor="year">Year *</Label>
                    <Input
                      id="year"
                      value={newProject.year}
                      onChange={(e) => setNewProject({ ...newProject, year: e.target.value })}
                      placeholder="2024"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                    <Input
                      id="tags"
                      value={newProject.tags}
                      onChange={(e) => setNewProject({ ...newProject, tags: e.target.value })}
                      placeholder="PyTorch, Transformers, BERT"
                    />
                  </div>
                  <div>
                    <Label htmlFor="imageUrl">Image URL</Label>
                    <Input
                      id="imageUrl"
                      value={newProject.imageUrl}
                      onChange={(e) => setNewProject({ ...newProject, imageUrl: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  <div>
                    <Label htmlFor="projectUrl">Project URL</Label>
                    <Input
                      id="projectUrl"
                      value={newProject.projectUrl}
                      onChange={(e) => setNewProject({ ...newProject, projectUrl: e.target.value })}
                      placeholder="https://github.com/username/repo"
                    />
                  </div>
                  <Button 
                    onClick={handleCreateProject} 
                    className="w-full"
                    disabled={createProjectMutation.isPending}
                  >
                    {createProjectMutation.isPending ? 'Creating...' : 'Create Project'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProjects.map((project: Project) => (
            <div
              key={project.id}
              className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-200"
            >
              {project.imageUrl && (
                <img
                  src={project.imageUrl}
                  alt={project.title}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                    project.category === 'Computer Vision' 
                      ? 'bg-primary/10 text-primary'
                      : project.category === 'NLP'
                      ? 'bg-accent/10 text-accent'
                      : 'bg-primary/10 text-primary'
                  }`}>
                    {project.category}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-neutral-500">{project.year}</span>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteProject(project.id, project.title)}
                        className="text-neutral-400 hover:text-red-500 transition-colors p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-neutral-800 mb-2">
                  {project.title}
                </h3>
                <p className="text-neutral-600 mb-4">{project.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    {project.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-neutral-100 text-neutral-600 text-xs rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  {project.projectUrl && (
                    <Button variant="ghost" size="sm" asChild>
                      <a 
                        href={project.projectUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary-dark font-medium"
                      >
                        View <ExternalLink className="w-4 h-4 ml-1" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <div className="text-center py-16">
            <p className="text-neutral-500 text-lg">No projects found in this category.</p>
          </div>
        )}
      </div>
    </section>
  );
}
