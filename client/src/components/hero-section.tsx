import { GraduationCap, Code, User, Linkedin, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useState } from 'react';
import type { Algorithm, Project } from '@shared/schema';

export function HeroSection() {
  const [, navigate] = useLocation();
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  const { data: algorithms = [] } = useQuery<Algorithm[]>({
    queryKey: ['/api/algorithms'],
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    staleTime: 10 * 60 * 1000, // Consider data fresh for 10 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
  });

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="home" className="py-20 bg-gradient-to-br from-primary/5 to-accent/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-neutral-800 mb-6">
          Deep Learning with{' '}
          <span className="text-primary">Batuhan Yılmaz</span>
        </h1>
        <p className="text-xl text-neutral-600 mb-8 max-w-3xl mx-auto leading-relaxed font-serif italic">
          Learn Algorithm not Code
        </p>
        
        <div className="bg-white/60 backdrop-blur-sm border border-primary/20 rounded-2xl p-6 mb-12 max-w-3xl mx-auto">
          <div className="flex items-center justify-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <i className="fas fa-pen-nib text-primary text-sm" data-testid="handwritten-icon"></i>
            </div>
            <h3 className="text-lg font-semibold text-neutral-800">100% Original Hand-Written Notes</h3>
          </div>
          <p className="text-neutral-600 text-center leading-relaxed">
            Every piece of content on this platform is <strong>purely hand-written</strong> — no copy-paste, 
            no AI generation, just authentic educational materials crafted with care. Each algorithm explanation, 
            mathematical derivation, and conceptual breakdown is originally created to ensure the highest quality learning experience.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
          <Dialog open={isAboutOpen} onOpenChange={setIsAboutOpen}>
            <DialogTrigger asChild>
              <Button
                variant="secondary"
                size="lg"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-11 px-8 py-4 bg-white text-primary font-semibold rounded-xl border-2 border-primary/20 hover:bg-primary/5 hover:border-primary transition-all duration-200 shadow-lg hover:shadow-xl text-[20px]"
              >
                <User className="w-5 h-5 mr-3" />
                Who is Batuhan Yılmaz?
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-primary">Batuhan Yılmaz</DialogTitle>
                <DialogDescription className="sr-only">
                  Information about Batuhan Yılmaz, the deep learning developer and educator
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-neutral-700">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                    <i className="fas fa-user-graduate text-white text-lg" data-testid="about-avatar"></i>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-neutral-800">Deep Learning Developper</h3>
                    <p className="text-sm text-neutral-600">Making AI accessible to everyone</p>
                  </div>
                  <div className="flex space-x-2">
                    <a
                      href="https://www.linkedin.com/in/batuhan-y%C4%B1lmaz-20a309232/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 hover:bg-blue-200 transition-colors"
                      data-testid="linkedin-link"
                    >
                      <Linkedin className="w-4 h-4" />
                    </a>
                    <a
                      href="mailto:ybatu42@gmail.com"
                      className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600 hover:bg-red-200 transition-colors"
                      data-testid="email-link"
                    >
                      <Mail className="w-4 h-4" />
                    </a>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-neutral-800 mb-1" data-testid="about-section-philosophy">Philosophy</h4>
                    <p className="text-sm leading-relaxed">
                      "Learn Algorithm not Code" - Understanding mathematical foundations enables 
                      implementation in any programming language.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-neutral-800 mb-1" data-testid="about-section-expertise">Focus Areas</h4>
                    <div className="grid grid-cols-2 gap-1 mt-1">
                      <span className="text-xs bg-neutral-50 p-2 rounded text-primary">Transformers</span>
                      <span className="text-xs bg-neutral-50 p-2 rounded text-primary">Attention</span>
                      <span className="text-xs bg-neutral-50 p-2 rounded text-primary">Computer Vision</span>
                      <span className="text-xs bg-neutral-50 p-2 rounded text-primary">NLP</span>
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
          <Button
            size="lg"
            onClick={() => scrollToSection('algorithms')}
            className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl handwritten-button"
            data-testid="button-learn-algorithms"
          >
            <GraduationCap className="w-5 h-5 mr-3" />
            Learn Algorithms
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => scrollToSection('projects')}
            className="px-8 py-4 bg-white text-primary font-semibold rounded-xl border-2 border-primary hover:bg-primary hover:text-white transition-all duration-200 shadow-lg hover:shadow-xl"
            data-testid="button-view-projects"
          >
            <Code className="w-5 h-5 mr-3" />
            View Projects
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="text-3xl font-bold text-primary mb-2">
              {algorithms.length}+
            </div>
            <div className="text-neutral-600">Algorithm Topics</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="text-3xl font-bold text-accent mb-2">
              {projects.length}
            </div>
            <div className="text-neutral-600">Projects</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="text-3xl font-bold text-primary mb-2">100+</div>
            <div className="text-neutral-600">Learning Resources</div>
          </div>
        </div>
      </div>
    </section>
  );
}
