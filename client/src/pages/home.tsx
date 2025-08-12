import { Header } from '@/components/header';
import { HeroSection } from '@/components/hero-section';
import { AlgorithmsSection } from '@/components/algorithms-section';
import { ProjectsSection } from '@/components/projects-section';
import { FilesSection } from '@/components/files-section';

export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <Header />
      <main>
        <HeroSection />
        <AlgorithmsSection />
        <ProjectsSection />
        <FilesSection />
      </main>
      
      <footer className="bg-white border-t border-neutral-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-neutral-500">
            © 2024 Deep Learning with Batuhan Yılmaz. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
