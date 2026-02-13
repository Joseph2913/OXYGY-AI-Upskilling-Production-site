import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { LevelJourney } from './components/LevelJourney';
import { Departments, LearningModel } from './components/Extras';
import { Footer } from './components/Footer';
import { PromptPlayground } from './components/PromptPlayground';
import { AgentBuilder } from './components/AgentBuilder';
import { WorkflowDesigner } from './components/WorkflowDesigner';
import { ProductArchitecture } from './components/ProductArchitecture';
import { DashboardDesigner } from './components/DashboardDesigner';

type Page = 'home' | 'playground' | 'agent-builder' | 'workflow-designer' | 'product-architecture' | 'dashboard-design';

function getPageFromHash(): Page {
  const hash = window.location.hash;
  if (hash === '#playground') return 'playground';
  if (hash === '#agent-builder') return 'agent-builder';
  if (hash === '#workflow-designer') return 'workflow-designer';
  if (hash === '#product-architecture') return 'product-architecture';
  if (hash === '#dashboard-design') return 'dashboard-design';
  return 'home';
}

function App() {
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
      {currentPage === 'home' && (
        <>
          <Hero />
          <LevelJourney />
          <Departments />
          <LearningModel />
          <Footer />
        </>
      )}
      {currentPage === 'playground' && <PromptPlayground />}
      {currentPage === 'agent-builder' && <AgentBuilder />}
      {currentPage === 'workflow-designer' && <WorkflowDesigner />}
      {currentPage === 'product-architecture' && <ProductArchitecture />}
      {currentPage === 'dashboard-design' && <DashboardDesigner />}
    </div>
  );
}

export default App;
