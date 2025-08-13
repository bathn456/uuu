// ImageKit-based backend service for Firebase deployment
import { AdminAuth } from "./admin-auth";

const IMAGEKIT_PUBLIC_KEY = "your_imagekit_public_key";
const IMAGEKIT_URL_ENDPOINT = "https://ik.imagekit.io/your_imagekit_id";

// Mock data structure for algorithms and projects
interface Algorithm {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  content?: string;
  files?: any[];
  createdAt: string;
}

interface Project {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  status: string;
  createdAt: string;
}

// Local storage keys
const ALGORITHMS_KEY = 'deep_learning_algorithms';
const PROJECTS_KEY = 'deep_learning_projects';
const ADMIN_AUTH_KEY = 'admin_authenticated';

class ImageKitBackendService {
  private isAuthenticated(): boolean {
    return AdminAuth.getInstance().isAuthenticated();
  }

  // Algorithm management
  async getAlgorithms(): Promise<Algorithm[]> {
    try {
      const stored = localStorage.getItem(ALGORITHMS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      
      // Default algorithms if none exist
      const defaultAlgorithms: Algorithm[] = [
        {
          id: '1',
          title: 'Attention Mechanism',
          description: 'Understanding how attention works in neural networks',
          category: 'Deep Learning',
          tags: ['attention', 'neural-networks', 'transformers'],
          content: 'Attention mechanisms allow models to focus on relevant parts of the input...',
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          title: 'Transformer Architecture',
          description: 'Deep dive into the transformer model architecture',
          category: 'NLP',
          tags: ['transformer', 'nlp', 'architecture'],
          content: 'The Transformer architecture revolutionized natural language processing...',
          createdAt: new Date().toISOString()
        }
      ];
      
      localStorage.setItem(ALGORITHMS_KEY, JSON.stringify(defaultAlgorithms));
      return defaultAlgorithms;
    } catch (error) {
      console.error('Error fetching algorithms:', error);
      return [];
    }
  }

  async createAlgorithm(algorithmData: Omit<Algorithm, 'id' | 'createdAt'>): Promise<Algorithm> {
    if (!this.isAuthenticated()) {
      throw new Error('Authentication required');
    }

    const algorithm: Algorithm = {
      ...algorithmData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };

    const algorithms = await this.getAlgorithms();
    algorithms.push(algorithm);
    localStorage.setItem(ALGORITHMS_KEY, JSON.stringify(algorithms));
    
    return algorithm;
  }

  async deleteAlgorithm(id: string): Promise<void> {
    if (!this.isAuthenticated()) {
      throw new Error('Authentication required');
    }

    const algorithms = await this.getAlgorithms();
    const filteredAlgorithms = algorithms.filter(alg => alg.id !== id);
    localStorage.setItem(ALGORITHMS_KEY, JSON.stringify(filteredAlgorithms));
  }

  // Project management
  async getProjects(): Promise<Project[]> {
    try {
      const stored = localStorage.getItem(PROJECTS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      
      // Default projects if none exist
      const defaultProjects: Project[] = [
        {
          id: '1',
          title: 'Neural Style Transfer',
          description: 'Implementation of artistic style transfer using deep learning',
          technologies: ['Python', 'TensorFlow', 'CNN'],
          status: 'completed',
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          title: 'Sentiment Analysis Model',
          description: 'Building a sentiment analysis model for social media data',
          technologies: ['Python', 'PyTorch', 'BERT'],
          status: 'in-progress',
          createdAt: new Date().toISOString()
        }
      ];
      
      localStorage.setItem(PROJECTS_KEY, JSON.stringify(defaultProjects));
      return defaultProjects;
    } catch (error) {
      console.error('Error fetching projects:', error);
      return [];
    }
  }

  async createProject(projectData: Omit<Project, 'id' | 'createdAt'>): Promise<Project> {
    if (!this.isAuthenticated()) {
      throw new Error('Authentication required');
    }

    const project: Project = {
      ...projectData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };

    const projects = await this.getProjects();
    projects.push(project);
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    
    return project;
  }

  async deleteProject(id: string): Promise<void> {
    if (!this.isAuthenticated()) {
      throw new Error('Authentication required');
    }

    const projects = await this.getProjects();
    const filteredProjects = projects.filter(proj => proj.id !== id);
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(filteredProjects));
  }

  // File management through ImageKit
  async uploadFile(file: File, folder?: string): Promise<any> {
    if (!this.isAuthenticated()) {
      throw new Error('Authentication required');
    }

    // For demo purposes, simulate file upload
    // In a real implementation, you would upload to ImageKit
    const fileData = {
      id: Date.now().toString(),
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file), // Temporary URL for demo
      uploadedAt: new Date().toISOString()
    };

    // Store file metadata in localStorage
    const files = this.getStoredFiles();
    files.push(fileData);
    localStorage.setItem('uploaded_files', JSON.stringify(files));

    return fileData;
  }

  async getFiles(): Promise<any[]> {
    return this.getStoredFiles();
  }

  private getStoredFiles(): any[] {
    try {
      const stored = localStorage.getItem('uploaded_files');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  async deleteFile(id: string): Promise<void> {
    if (!this.isAuthenticated()) {
      throw new Error('Authentication required');
    }

    const files = this.getStoredFiles();
    const filteredFiles = files.filter(file => file.id !== id);
    localStorage.setItem('uploaded_files', JSON.stringify(filteredFiles));
  }

  // Authentication
  async adminLogin(email: string, password: string): Promise<{ success: boolean; token?: string; message: string }> {
    // Simple authentication check
    if (email === 'admin@example.com' && password === 'batu4567_%%') {
      const token = 'imagekit-admin-token-' + Date.now();
      AdminAuth.getInstance().setToken(token);
      return {
        success: true,
        token,
        message: 'Admin login successful'
      };
    } else {
      return {
        success: false,
        message: 'Invalid credentials'
      };
    }
  }

  async adminLogout(): Promise<void> {
    AdminAuth.getInstance().clearAuth();
  }
}

export const imagekitBackend = new ImageKitBackendService();
export default imagekitBackend;