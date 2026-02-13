import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer id="footer">
      {/* CTA Band */}
      <div className="bg-teal relative overflow-hidden py-20 px-6">
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
            OXYGY's Center of Excellence is here to guide you.
          </p>
          <button className="bg-white text-teal hover:bg-teal-light font-bold py-4 px-10 rounded-full shadow-lg transition-transform hover:scale-105">
            Get in Touch
          </button>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="bg-navy-900 text-white py-12 px-6">
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
          
          <div className="flex gap-6 text-sm text-gray-300">
            <a href="#" className="hover:text-teal transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-teal transition-colors">Terms of Use</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
