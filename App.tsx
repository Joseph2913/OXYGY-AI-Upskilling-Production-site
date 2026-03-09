import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { LevelJourney } from './components/LevelJourney';
import { LearningModel } from './components/Extras';
import { PersonaCarousel } from './components/PersonaCarousel';
import { Footer, FooterBar } from './components/Footer';
import { PromptPlayground } from './components/PromptPlayground';
import { AgentBuilder } from './components/AgentBuilder';
import { WorkflowDesigner } from './components/WorkflowDesigner';
import { ProductArchitecture } from './components/ProductArchitecture';
import { DashboardDesigner } from './components/DashboardDesigner';
import { LearningPathway } from './components/LearningPathway';
import { EngagementModel } from './components/EngagementModel';
import { CaseStudiesSection, CaseStudiesPage } from './components/CaseStudies';
import { UserJourney } from './components/UserJourney';
import { Dashboard } from './components/dashboard/Dashboard';
import { AuthModal } from './components/AuthModal';
import CourseResources from './pages/learn/level-1-landing';
import Level1Page from './pages/learn/level-1-context-engineering';

type Page = 'home' | 'playground' | 'agent-builder' | 'workflow-designer' | 'product-architecture' | 'dashboard-design' | 'learning-pathway' | 'engagement-model' | 'case-studies' | 'user-journey' | 'dashboard' | 'course-resources' | 'learn-level-1-prompt';

function getPageFromHash(): Page {
  const hash = window.location.hash;
  // Ignore Supabase auth callback tokens in the hash
  if (hash.includes('access_token=') || hash.includes('refresh_token=') || hash.includes('error_description=')) {
    return 'home';
  }
  if (hash === '#playground') return 'playground';
  if (hash === '#agent-builder') return 'agent-builder';
  if (hash === '#workflow-designer') return 'workflow-designer';
  if (hash === '#product-architecture') return 'product-architecture';
  if (hash === '#dashboard-design') return 'dashboard-design';
  if (hash === '#learning-pathway') return 'learning-pathway';
  if (hash === '#engagement-model') return 'engagement-model';
  if (hash === '#case-studies') return 'case-studies';
  if (hash === '#user-journey') return 'user-journey';
  if (hash === '#dashboard') return 'dashboard';
  if (hash === '#course-resources' || hash === '#learn-level-1') return 'course-resources';
  if (hash === '#learn-level-1-prompt') return 'learn-level-1-prompt';
  return 'home';
}

const PROTECTED_PAGES = new Set<Page>(['learning-pathway', 'dashboard']);

function AppContent() {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>(getPageFromHash);

  useEffect(() => {
    const handleHashChange = () => {
      const page = getPageFromHash();
      setCurrentPage(page);
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const needsAuth = PROTECTED_PAGES.has(currentPage) && !user;

  return (
    <div className="min-h-screen bg-white font-sans text-navy-900 selection:bg-teal selection:text-white">
      <Navbar />
      {currentPage === 'home' && (
        <>
          <Hero />
          <LevelJourney />
          <PersonaCarousel />
          <LearningModel />
          <CaseStudiesSection />
          <Footer />
        </>
      )}
      {currentPage === 'playground' && <PromptPlayground />}
      {currentPage === 'agent-builder' && <AgentBuilder />}
      {currentPage === 'workflow-designer' && <WorkflowDesigner />}
      {currentPage === 'product-architecture' && <ProductArchitecture />}
      {currentPage === 'dashboard-design' && <DashboardDesigner />}
      {currentPage === 'learning-pathway' && (needsAuth ? <AuthModal /> : <LearningPathway />)}
      {currentPage === 'engagement-model' && <EngagementModel />}
      {currentPage === 'case-studies' && <CaseStudiesPage />}
      {currentPage === 'user-journey' && <UserJourney />}
      {currentPage === 'dashboard' && (needsAuth ? <AuthModal /> : <Dashboard />)}
      {currentPage === 'course-resources' && <CourseResources />}
      {currentPage === 'learn-level-1-prompt' && <Level1Page />}

      {/* Footer bar on all non-home pages */}
      {currentPage !== 'home' && <FooterBar />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
