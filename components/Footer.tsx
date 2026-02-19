import React from 'react';
import { Mail, Linkedin } from 'lucide-react';

/** Full homepage footer: CTA band + bottom bar */
export const Footer: React.FC = () => {
  return (
    <footer id="footer">
      {/* CTA Band */}
      <div className="bg-teal relative overflow-hidden py-14 px-6">
        {/* Subtle Watermark Pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
           <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
             <pattern id="arrow-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
               <path d="M50 0 L100 50 L50 100 L0 50 Z" fill="currentColor" className="text-teal-dark"/>
             </pattern>
             <rect x="0" y="0" width="100%" height="100%" fill="url(#arrow-pattern)" />
           </svg>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">
            Ready to Take the Next Step?
          </h2>
          <p className="text-teal-bg text-lg mb-10 max-w-2xl mx-auto">
            Whether you are starting your journey or looking to scale your AI capabilities,
            OXYGY's AI Centre of Excellence is here to guide you.
          </p>
          <a
            href="mailto:uk@oxygyconsulting.com"
            className="inline-block bg-white text-teal hover:bg-teal-light font-bold py-4 px-10 rounded-full shadow-lg transition-transform hover:scale-105"
            style={{ textDecoration: 'none' }}
          >
            Get in Touch
          </a>
        </div>
      </div>

      {/* Bottom Bar */}
      <FooterBar />
    </footer>
  );
};

/** Slim footer bar with logo, social icons, and copyright — appears on every page */
export const FooterBar: React.FC = () => (
  <div className="bg-navy-900 text-white py-10 px-6">
    <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
      <div className="flex items-center gap-2">
        <img
          src="/logos/oxygy-logo-darkgray-teal.png"
          alt="OXYGY"
          style={{ height: '30px', width: 'auto', filter: 'brightness(0) invert(1)' }}
        />
      </div>

      <div className="text-gray-400 text-sm">
        &copy; {new Date().getFullYear()} OXYGY. All rights reserved.
      </div>

      {/* Social / Contact icons */}
      <div className="flex items-center gap-4">
        <a
          href="https://www.linkedin.com/company/oxygy/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-600 text-gray-300 hover:bg-[#0A66C2] hover:border-[#0A66C2] hover:text-white transition-colors"
          title="Follow us on LinkedIn"
        >
          <Linkedin size={18} />
        </a>
        <a
          href="mailto:uk@oxygyconsulting.com"
          className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-600 text-gray-300 hover:bg-[#38B2AC] hover:border-[#38B2AC] hover:text-white transition-colors"
          title="Contact Us"
        >
          <Mail size={18} />
        </a>
      </div>
    </div>
  </div>
);
