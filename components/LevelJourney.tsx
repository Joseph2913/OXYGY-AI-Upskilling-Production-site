import React, { useState } from 'react';
import { LEVELS } from '../data/content';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { cn } from '../utils/cn';

export const LevelJourney: React.FC = () => {
  const [expandedLevel, setExpandedLevel] = useState<number | null>(1);

  const handleNodeClick = (id: number) => {
    setExpandedLevel(id);
    const accordionElement = document.getElementById(`level-card-${id}`);
    if (accordionElement) {
      const yOffset = -120; // Offset for sticky nav
      const y = accordionElement.getBoundingClientRect().top + window.scrollY + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const toggleAccordion = (id: number) => {
    setExpandedLevel(expandedLevel === id ? null : id);
  };

  return (
    <section id="journey" className="pt-16 pb-12 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-navy-900 mb-4">
            The 5 Levels of AI Upskilling
          </h2>
          <p className="text-navy-700 max-w-3xl mx-auto text-lg">
            A progressive framework that builds AI capability step by step — from foundational awareness to fully personalized AI-powered applications.
          </p>
        </div>

        {/* Part 1: Overview - Sequential Stages Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8 md:p-10 mb-12 shadow-sm overflow-hidden w-full">
          <div className="flex flex-col md:flex-row items-stretch justify-between gap-4 md:gap-0 relative">
            
            {LEVELS.map((level, index) => {
              const isLast = index === LEVELS.length - 1;
              const isActive = expandedLevel === level.id;

              return (
                <React.Fragment key={level.id}>
                  {/* Stage Node */}
                  <div 
                    onClick={() => handleNodeClick(level.id)}
                    className={cn(
                      "flex flex-col items-center justify-center w-full p-6 rounded-xl transition-all duration-300 cursor-pointer group border-2 relative z-10",
                      isActive 
                        ? "bg-gray-50 transform scale-[1.02]" 
                        : "border-transparent hover:bg-gray-50"
                    )}
                    style={{ 
                      borderColor: isActive ? level.accentColor : 'transparent' 
                    }}
                  >
                    {/* Icon */}
                    <div className="mb-4 transition-colors duration-300">
                      <level.icon 
                        size={56} 
                        strokeWidth={1.2}
                        className={cn(
                          "transition-colors duration-300",
                        )}
                        style={{ color: isActive ? level.darkAccentColor : '#2D3748' }}
                      />
                    </div>
                    
                    {/* Level Number */}
                    <span 
                      style={{ color: level.darkAccentColor }}
                      className="text-[11px] font-bold uppercase tracking-widest mb-2"
                    >
                      Level {level.id}
                    </span>
                    
                    {/* Name */}
                    <h3 className="text-[15px] font-bold text-navy-900 text-center leading-tight mb-2">
                      {level.name}
                    </h3>
                    
                    {/* Tagline */}
                    <p className="text-[12px] text-gray-500 text-center leading-snug line-clamp-2">
                      {level.tagline}
                    </p>
                  </div>

                  {/* Arrow Connector */}
                  {!isLast && (
                    <div className="hidden md:flex items-center justify-center text-gray-400 px-2">
                      <ArrowRight size={16} strokeWidth={2} className="text-[#A0AEC0]" />
                    </div>
                  )}
                  {/* Mobile Arrow */}
                  {!isLast && (
                    <div className="md:hidden flex justify-center text-gray-400 my-2">
                      <ArrowRight size={16} className="rotate-90 text-[#A0AEC0]" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Part 2: Accordion - Rich Content */}
        <div className="w-full space-y-4">
          {LEVELS.map((level) => {
            const isExpanded = expandedLevel === level.id;
            
            // Text color logic for the number circle
            const numTextColor = level.id === 5 ? 'text-white' : 'text-navy-900';

            return (
              <div 
                id={`level-card-${level.id}`}
                key={level.id} 
                className={cn(
                  "border rounded-2xl transition-all duration-500 overflow-hidden bg-white",
                  isExpanded ? "shadow-md border-gray-300" : "border-gray-200 hover:border-gray-300"
                )}
              >
                {/* Main Clickable Header Area (Collapsed State) */}
                <button 
                  onClick={() => toggleAccordion(level.id)}
                  className="w-full text-left relative"
                >
                  {/* Left Accent Border on Expanded */}
                  <div 
                    className={cn(
                      "absolute top-0 bottom-0 left-0 w-1.5 transition-all duration-300",
                      isExpanded ? "opacity-100" : "opacity-0"
                    )}
                    style={{ backgroundColor: level.accentColor }}
                  />

                  <div className="p-6 md:p-8 flex items-start gap-6">
                    {/* Circle Number */}
                    <div 
                      className={cn(
                        "w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-lg font-bold shrink-0 mt-1 transition-transform duration-300",
                        numTextColor
                      )}
                      style={{ backgroundColor: level.accentColor }}
                    >
                      {level.id}
                    </div>

                    <div className="flex-grow grid grid-cols-1 gap-4">
                      {/* Top Row: Title & Chevron */}
                      <div className="flex items-start justify-between">
                        <div className="flex flex-col">
                           <h3 className="text-[20px] font-bold text-navy-900 leading-tight mb-1">
                            {level.name}
                          </h3>
                          <span 
                            className="text-sm font-medium"
                            style={{ color: level.darkAccentColor }}
                          >
                            {level.tagline}
                          </span>
                        </div>
                        
                        <div 
                          className="transition-transform duration-300"
                          style={{ 
                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                            color: isExpanded ? level.darkAccentColor : '#A0AEC0'
                          }}
                        >
                          <ChevronDown size={24} />
                        </div>
                      </div>

                      {/* Description (Collapsed) - Always visible in header for stability */}
                      <p className="text-[14px] text-navy-700 leading-relaxed max-w-3xl line-clamp-2">
                        {level.descriptionCollapsed}
                      </p>

                      {/* Tags Row */}
                      {!isExpanded && (
                        <div className="flex flex-wrap gap-2 mt-1">
                          {level.previewTags.map((tag, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center px-3 py-1 rounded-md text-[12px] font-medium transition-opacity duration-300"
                              style={{
                                backgroundColor: `${level.accentColor}20`,
                                color: '#2D3748'
                              }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </button>

                {/* Expanded Content Area */}
                <div 
                  className={cn(
                    "grid transition-all duration-500 ease-in-out",
                    isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  )}
                >
                  <div className="min-h-0 px-6 md:px-8 pb-6 pt-0 pl-[calc(1.5rem+40px+24px)] md:pl-[calc(2rem+48px+24px)]">

                    {/* Divider */}
                    <div className="h-px bg-gray-100 mb-4 w-full"></div>

                    {/* Core Topics List */}
                    <div className="mb-4">
                      <h4 className="text-[10px] font-[600] uppercase tracking-[1px] text-[#A0AEC0] mb-2">Core Topics</h4>
                      <div className="flex flex-wrap gap-2">
                        {level.topics.map((topic, i) => (
                          <span 
                            key={i}
                            className="inline-flex items-center px-3.5 py-1.5 rounded-md text-[13px] font-medium border border-transparent"
                            style={{ 
                              backgroundColor: `${level.accentColor}30`,
                              color: '#2D3748'
                            }}
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Metadata Grid (Audience & Tools) - Side by Side, Compact */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                      {/* Target Audience */}
                      <div>
                         <h4 className="text-[10px] font-[600] uppercase tracking-[1px] text-[#A0AEC0] mb-2">
                            Target Audience
                         </h4>
                         <div className="flex flex-wrap gap-2">
                            {level.targetAudience.map((aud, i) => (
                              <span 
                                key={i} 
                                className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium"
                                style={{ 
                                  backgroundColor: `${level.accentColor}20`,
                                  color: '#2D3748'
                                }}
                              >
                                {aud}
                              </span>
                            ))}
                         </div>
                      </div>

                      {/* Key Tools */}
                      <div>
                         <h4 className="text-[10px] font-[600] uppercase tracking-[1px] text-[#A0AEC0] mb-2">
                            Key Tools
                         </h4>
                         <div className="flex flex-wrap gap-2">
                            {level.keyTools.map((tool, i) => (
                              <span 
                                key={i} 
                                className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium bg-gray-50 border border-gray-200 text-gray-700"
                              >
                                {tool}
                              </span>
                            ))}
                         </div>
                      </div>
                    </div>

                    {/* Zone 1 — Featured Tool (primary CTA) */}
                    {(() => {
                      const toolSession = level.sessionTypes.find(s => s.type === 'tool');
                      if (!toolSession) return null;
                      return (
                        <a
                          href={level.artifactLink}
                          className="block rounded-xl p-5 mb-4 transition-all hover:-translate-y-0.5"
                          style={{
                            border: `2px solid ${level.darkAccentColor}`,
                            backgroundColor: `${level.accentColor}18`,
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-2xl mt-0.5">{toolSession.emoji}</span>
                            <div className="flex-grow min-w-0">
                              <span className="text-[16px] font-bold text-navy-900 leading-tight">{toolSession.title}</span>
                              <p className="text-[13px] text-[#4A5568] leading-snug mt-1 line-clamp-2">{toolSession.description}</p>
                              <p className="text-[13px] font-semibold mt-1.5" style={{ color: level.darkAccentColor }}>
                                Try the interactive tool <span className="inline-block ml-0.5">→</span>
                              </p>
                            </div>
                            <ArrowRight size={18} style={{ color: level.darkAccentColor }} className="shrink-0 mt-1" />
                          </div>
                        </a>
                      );
                    })()}

                    {/* Zone 2 — Workshop Sessions (secondary/informational) */}
                    {(() => {
                      const workshops = level.sessionTypes.filter(s => s.type === 'workshop');
                      if (workshops.length === 0) return null;
                      return (
                        <div className="mb-5">
                          <h4 className="text-[10px] font-[600] uppercase tracking-[1px] text-[#A0AEC0] mb-2">Collaborative Sessions</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {workshops.map((session, idx) => (
                              <div
                                key={idx}
                                className="p-3 flex items-start gap-2.5 rounded-[10px] bg-white"
                                style={{
                                  border: `1px solid ${level.accentColor}4D`,
                                }}
                              >
                                <span className="text-lg shrink-0 mt-0.5">{session.emoji}</span>
                                <div className="min-w-0">
                                  <span className="text-[12px] font-semibold text-navy-900 leading-tight">{session.title}</span>
                                  <p className="text-[11px] text-[#718096] leading-snug mt-0.5 line-clamp-2">{session.description}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
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