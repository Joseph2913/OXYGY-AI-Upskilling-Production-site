import React, { useState } from 'react';
import { DEPARTMENTS } from '../data/content';
import { Users, Target, Megaphone, Settings, ArrowRight, ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '../utils/cn';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

const IconMap: Record<string, React.ElementType> = {
  Users: Users,
  Target: Target,
  Megaphone: Megaphone,
  Settings: Settings
};

export const Departments: React.FC = () => {
  return (
    <section id="case-studies" className="py-24 bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-[36px] font-bold text-navy-900 mb-5 relative inline-block">
            What This Looks Like for{' '}
            <span className="relative inline-block">
              Your Team
              <span className="absolute left-0 bottom-0 w-full h-[4px] bg-teal opacity-80 rounded-full"></span>
            </span>
          </h2>
          <p className="text-[16px] text-navy-700 font-normal leading-relaxed max-w-[640px] mx-auto">
            AI upskilling isn't one-size-fits-all. Every department has different workflows, challenges, and opportunities. Here's how the five-level framework applies to yours.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {DEPARTMENTS.map((dept) => {
            const Icon = IconMap[dept.iconName] || Users;
            return (
              <div 
                key={dept.id} 
                className="group relative bg-white border border-slate-200 rounded-xl overflow-hidden hover:-translate-y-1 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all duration-200 cursor-pointer flex flex-col h-full"
              >
                {/* Top Color Band */}
                <div className="h-[6px] w-full" style={{ backgroundColor: dept.accentColor }}></div>

                <div className="p-6 flex flex-col flex-grow">
                  {/* Icon */}
                  <div className="mb-4 text-navy-800">
                    <Icon size={40} strokeWidth={1.5} />
                  </div>

                  {/* Title - Forced 2-line height for consistency */}
                  <div className="min-h-[3.5rem] flex items-center mb-4">
                    <h3 className="text-[18px] font-bold text-navy-900 leading-tight">
                      {dept.name}
                    </h3>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-slate-100 w-full mb-4"></div>

                  {/* Use Cases - Short Key Phrases as Chips */}
                  <div className="flex flex-col gap-2 mb-6 flex-grow">
                    {dept.useCases.map((useCase, idx) => (
                      <div 
                        key={idx} 
                        className="px-3 py-2 rounded-md text-[13px] font-medium text-navy-800 flex items-center"
                        style={{ backgroundColor: `${dept.accentColor}33` /* ~20% opacity */ }}
                      >
                         {useCase}
                      </div>
                    ))}
                  </div>

                  {/* CTA - Button Style */}
                  <div className="mt-auto pt-2">
                     <a
                       href="#learning-pathway"
                       className="w-full py-2.5 rounded-full border border-gray-200 text-sm font-semibold text-navy-900 flex items-center justify-center gap-2 group-hover:border-transparent group-hover:text-navy-900 transition-all duration-300 no-underline"
                       style={{
                         backgroundColor: 'transparent',
                         textDecoration: 'none',
                       }}
                       onMouseEnter={(e) => {
                         e.currentTarget.style.backgroundColor = dept.accentColor;
                         e.currentTarget.style.borderColor = dept.accentColor;
                       }}
                       onMouseLeave={(e) => {
                         e.currentTarget.style.backgroundColor = 'transparent';
                         e.currentTarget.style.borderColor = '#E2E8F0';
                       }}
                     >
                       Learn More <ArrowRight size={14} />
                     </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export const LearningModel: React.FC = () => {
  const { ref, isIntersecting } = useIntersectionObserver({ threshold: 0.2, triggerOnce: true });
  const [activePanel, setActivePanel] = useState(0);

  const panels = [
    {
      id: 0,
      percent: "70%",
      label: "Learning by Doing",
      emoji: "⚡",
      color: "#38B2AC", // teal
      description: (
        <>
          The real transformation happens when teams apply AI to their <strong style={{color: "#38B2AC"}}>actual work</strong>. Building <strong style={{color: "#38B2AC"}}>real tools</strong>, running <strong style={{color: "#38B2AC"}}>real workflows</strong>, and solving <strong style={{color: "#38B2AC"}}>real problems</strong>.
        </>
      ),
      phrases: [
        "Apply AI tools to live projects and daily tasks",
        "Run innovation sprints that produce deployable solutions",
        "Build internal tools your team will actually use",
        "Create proposals for AI projects that scale across the organization",
        "Experiment, iterate, and refine in real working environments",
        "Develop AI solutions as part of cross-functional cohorts"
      ]
    },
    {
      id: 1,
      percent: "20%",
      label: "Collaborative Sessions",
      emoji: "🤝",
      color: "#1E3A5F", // deep navy
      description: (
        <>
          Instructor-led workshops and <strong style={{color: "#1E3A5F"}}>team-based sessions</strong> where structured guidance meets <strong style={{color: "#1E3A5F"}}>collective problem-solving</strong>.
        </>
      ),
      phrases: [
        "Instructor-led workshops with hands-on exercises",
        "Team-based sandbox builds with live feedback",
        "Peer review sessions and best-practice sharing",
        "Cohort-based challenges that build week over week",
        "Architecture reviews and design critiques",
        "Group problem-solving with real business scenarios"
      ]
    },
    {
      id: 2,
      percent: "10%",
      label: "Self-Paced Study",
      emoji: "📚",
      color: "#A0AEC0", // medium gray
      description: (
        <>
          The <strong style={{color: "#A0AEC0"}}>foundational layer</strong> — curated resources that individuals work through on their <strong style={{color: "#A0AEC0"}}>own schedule</strong> to build confidence.
        </>
      ),
      phrases: [
        "Microlearning videos and concept explainers",
        "Curated reading lists and AI tool guides",
        "Interactive quizzes and self-assessments",
        "Prompt libraries and template collections",
        "Recorded walkthroughs and case studies",
        "On-demand resources available anytime, anywhere"
      ]
    }
  ];

  return (
    <section ref={ref} className="pt-12 pb-12 bg-[#F7FAFC] border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Title & Intro */}
        <div className="text-center mb-12">
          <h2 className="text-[36px] font-bold text-navy-900 mb-5 relative inline-block">
            How the Learning{' '}
            <span className="relative inline-block">
              Actually
              <span className="absolute left-0 bottom-[2px] w-full h-[3px] bg-teal opacity-100 rounded-full"></span>
            </span>{' '}
            Happens
          </h2>
          <p className="text-[16px] text-navy-700 font-normal leading-[1.7] max-w-[660px] mx-auto mt-5 mb-12">
            We follow the 70/20/10 learning model — because real AI capability isn't built in a classroom. It's built by doing, collaborating, and applying AI to real work.
          </p>
        </div>
        
        {/* Interactive Weighted Bar */}
        <div className="w-full max-w-[1100px] mx-auto h-[56px] rounded-xl overflow-hidden flex mb-10 text-white shadow-sm bg-gray-100 cursor-pointer">
          {panels.map((panel, idx) => (
            <div 
              key={idx}
              onClick={() => setActivePanel(idx)}
              className="h-full flex items-center justify-center transition-all duration-300 ease-out origin-left relative hover:brightness-110"
              style={{ 
                width: isIntersecting ? panel.percent : '0%', 
                backgroundColor: panel.color,
                opacity: isIntersecting ? 1 : 0,
                transitionDelay: `${idx * 300}ms`,
                boxShadow: activePanel === idx ? 'inset 0 -4px 0 rgba(0,0,0,0.2)' : 'none'
              }}
            >
               <div className="flex flex-col md:flex-row items-center gap-1 md:gap-3 whitespace-nowrap overflow-hidden px-2 pointer-events-none select-none">
                 <span className="text-[16px] md:text-[20px] font-bold">{panel.percent}</span>
                 {parseInt(panel.percent) >= 20 && (
                   <span className="text-[10px] md:text-[12px] font-medium opacity-90 hidden sm:inline-block">— {panel.label}</span>
                 )}
               </div>
            </div>
          ))}
        </div>

        {/* Accordion Panels Container */}
        <div className="flex flex-col md:flex-row w-full max-w-[1100px] mx-auto gap-4 md:gap-4 md:h-[450px]">
          {panels.map((panel, idx) => {
            const isActive = activePanel === idx;
            
            return (
              <div 
                key={idx}
                onClick={() => setActivePanel(idx)}
                className={cn(
                  "relative rounded-xl overflow-hidden transition-all duration-500 ease-in-out flex flex-col",
                  isActive 
                    ? `border-2 bg-white shadow-md md:flex-[7]` // Expanded styles
                    : `border border-gray-200 bg-white hover:bg-slate-50 cursor-pointer md:flex-[1.5]` // Collapsed styles
                )}
                style={{ 
                  borderColor: isActive ? panel.color : undefined
                }}
              >
                {/* Expanded State Content (Visible when Active) */}
                <div 
                  className={cn(
                    "absolute inset-0 p-8 flex flex-col md:flex-row gap-8 transition-opacity duration-500 delay-100",
                    isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                  )}
                >
                  {/* Top Accent for Expanded */}
                  <div className="absolute top-0 left-0 right-0 h-[4px]" style={{ backgroundColor: panel.color }}></div>

                  {/* Left Column (Desktop) */}
                  <div className="w-full md:w-[40%] flex flex-col items-start gap-4 border-b md:border-b-0 md:border-r border-gray-100 pb-4 md:pb-0 md:pr-6">
                    <div className="flex items-center gap-3">
                      <span className="text-[48px] font-[800] leading-none" style={{ color: panel.color }}>
                        {panel.percent}
                      </span>
                      <span className="text-[32px]">
                        {panel.emoji}
                      </span>
                    </div>
                    
                    <h3 className="text-[24px] font-bold text-navy-900 leading-tight">
                      {panel.label}
                    </h3>
                    
                    <p className="text-[15px] text-navy-700 leading-relaxed">
                      {panel.description}
                    </p>
                  </div>

                  {/* Right Column (List) */}
                  <div className="w-full md:w-[60%] flex flex-col justify-center pl-2">
                    <ul className="space-y-3">
                      {panel.phrases.map((phrase, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <span 
                            className="w-[6px] h-[6px] rounded-full mt-2 shrink-0" 
                            style={{ backgroundColor: panel.color }}
                          ></span>
                          <span className="text-[14px] text-navy-700 leading-[1.6] font-normal">
                            {phrase}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Collapsed State Content (Desktop) */}
                <div 
                  className={cn(
                    "hidden md:flex flex-col items-center justify-center h-full p-4 text-center transition-opacity duration-300 absolute inset-0 z-0",
                    !isActive ? "opacity-100 delay-100" : "opacity-0"
                  )}
                >
                  <span className="text-[32px] font-[800] mb-1" style={{ color: panel.color }}>
                    {panel.percent}
                  </span>
                  <span className="text-[14px] font-semibold text-navy-900 rotate-0 whitespace-nowrap mb-4">
                    {panel.label.split(' ')[0]}
                  </span>
                  <span className="text-[24px] mb-4 opacity-80 grayscale group-hover:grayscale-0 transition-all">
                    {panel.emoji}
                  </span>
                   <ChevronRight 
                     size={20} 
                     className="text-gray-400 group-hover:text-current transition-colors"
                     style={{ color: !isActive ? undefined : panel.color }} 
                   />
                </div>

                {/* Mobile Header (Always visible on mobile) */}
                <div className={cn(
                  "md:hidden flex items-center justify-between p-6",
                  isActive ? "border-b border-gray-100" : ""
                )}>
                  <div className="flex items-center gap-3">
                    <span className="text-[24px] font-[800]" style={{ color: panel.color }}>
                      {panel.percent}
                    </span>
                    <span className="text-[16px] font-bold text-navy-900">
                      {panel.label}
                    </span>
                  </div>
                  <ChevronDown 
                    size={20} 
                    className={cn("text-gray-400 transition-transform duration-300", isActive ? "rotate-180" : "")} 
                  />
                </div>

                {/* Mobile Expanded Content Spacer */}
                <div className={cn(
                  "md:hidden transition-all duration-300 ease-in-out overflow-hidden",
                  isActive ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
                )}>
                   <div className="p-6 pt-0">
                      <div className="mb-4 text-[14px] text-navy-700 leading-relaxed">
                        {panel.description}
                      </div>
                      <ul className="space-y-3 pt-2">
                        {panel.phrases.map((phrase, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <span 
                              className="w-[6px] h-[6px] rounded-full mt-2 shrink-0" 
                              style={{ backgroundColor: panel.color }}
                            ></span>
                            <span className="text-[14px] text-navy-700 leading-[1.6] font-normal">
                              {phrase}
                            </span>
                          </li>
                        ))}
                      </ul>
                   </div>
                </div>

              </div>
            );
          })}
        </div>

        {/* CTA to Learning Journey */}
        <div className="text-center mt-14">
          <a
            href="#user-journey"
            className="inline-flex items-center gap-2 text-white font-semibold rounded-full transition-all duration-200 hover:-translate-y-0.5"
            style={{
              backgroundColor: '#38B2AC',
              padding: '14px 32px',
              fontSize: '15px',
              textDecoration: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2C9A94';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#38B2AC';
            }}
          >
            Explore Your Learning Journey
            <ArrowRight size={16} />
          </a>
        </div>

      </div>
    </section>
  );
};
