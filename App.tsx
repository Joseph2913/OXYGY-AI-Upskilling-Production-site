import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { LevelJourney } from './components/LevelJourney';
import { LearningModel } from './components/Extras';
import { PersonaCarousel } from './components/PersonaCarousel';
import { Footer } from './components/Footer';
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

type Page = 'home' | 'playground' | 'agent-builder' | 'workflow-designer' | 'product-architecture' | 'dashboard-design' | 'learning-pathway' | 'engagement-model' | 'case-studies' | 'user-journey' | 'dashboard';

function getPageFromHash(): Page {
  const hash = window.location.hash;
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
