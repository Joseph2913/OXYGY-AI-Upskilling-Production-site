import React, { useState, useEffect } from 'react';
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
import { EngagementModel } from './components/EngagementModel';
import { CaseStudiesSection, CaseStudiesPage } from './components/CaseStudies';
import { UserJourney } from './components/UserJourney';
import { AIToolsShowcase } from './components/AIToolsShowcase';

type Page = 'home' | 'ai-tools' | 'playground' | 'agent-builder' | 'workflow-designer' | 'product-architecture' | 'dashboard-design' | 'engagement-model' | 'case-studies' | 'user-journey' | 'dashboard';

function getPageFromHash(): Page {
  const hash = window.location.hash;
  // Ignore any stale auth tokens in hash
  if (hash.includes('access_token=') || hash.includes('error_description=')) {
    return 'home';
  }
  if (hash === '#ai-tools') return 'ai-tools';
  if (hash === '#playground') return 'playground';
  if (hash === '#agent-builder') return 'agent-builder';
  if (hash === '#workflow-designer') return 'workflow-designer';
  if (hash === '#product-architecture') return 'product-architecture';
  if (hash === '#dashboard-design') return 'dashboard-design';
  if (hash === '#engagement-model') return 'engagement-model';
  if (hash === '#case-studies') return 'case-studies';
  if (hash === '#user-journey') return 'user-journey';
  if (hash === '#dashboard') return 'dashboard';
  // Removed pages — redirect to dashboard
  if (hash === '#learning-pathway' || hash === '#course-resources' || hash === '#learn-level-1' || hash === '#learn-level-1-prompt' || hash === '#learn-level-1-pe' || hash === '#learn-level-1-context') return 'dashboard';
  return 'home';
}

export function MarketingSite() {
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

  return (
    <div className="min-h-screen bg-white font-sans text-navy-900 selection:bg-teal selection:text-white">
      <Navbar />
      <div style={{ height: 68 }} />
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
      {currentPage === 'ai-tools' && <AIToolsShowcase />}
      {currentPage === 'playground' && <PromptPlayground />}
      {currentPage === 'agent-builder' && <AgentBuilder />}
      {currentPage === 'workflow-designer' && <WorkflowDesigner />}
      {currentPage === 'product-architecture' && <ProductArchitecture />}
      {currentPage === 'dashboard-design' && <DashboardDesigner />}
      {currentPage === 'engagement-model' && <EngagementModel />}
      {currentPage === 'case-studies' && <CaseStudiesPage />}
      {currentPage === 'user-journey' && <UserJourney />}
      {/* Old dashboard route — redirect to new app dashboard */}
      {currentPage === 'dashboard' && (() => { window.location.href = '/app/dashboard'; return null; })()}
      {/* Footer bar on all non-home pages */}
      {currentPage !== 'home' && <FooterBar />}
    </div>
  );
}
