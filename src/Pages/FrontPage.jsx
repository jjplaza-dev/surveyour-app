import React, { useState, useRef } from 'react'
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

// Components
import PollMaker from '../Components/PollMaker';
import SurveyMaker from '../Components/SurveyMaker';

const FrontPage = () => {
  const containerRef = useRef(null);
  
  // State to track which tool is active: 'menu', 'poll', or 'survey'
  const [activeMode, setActiveMode] = useState('menu'); 

  // --- ANIMATIONS ---
  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'back.out(1.7)', duration: 0.8 } });

    // Header Animation
    tl.from('.main-title', { y: -50, opacity: 0, duration: 1 })
      .from('.subtitle', { y: -20, opacity: 0, duration: 0.6 }, "-=0.6");
      
    // If in menu mode, animate the cards in
    if (activeMode === 'menu') {
        tl.from('.menu-card', { 
            scale: 0.8, 
            y: 30, 
            opacity: 0, 
            stagger: 0.1, 
            ease: 'elastic.out(1, 0.8)' 
        }, "-=0.4");
    }

  }, { scope: containerRef, dependencies: [activeMode] }); 

  // --- HOVER EFFECTS (Lofi Style) ---
  const onHoverCard = ({ currentTarget }) => {
    // Move up-left and increase shadow to look like it's lifting
    gsap.to(currentTarget, { 
        x: -4, 
        y: -4, 
        boxShadow: '12px 12px 0px 0px rgba(0,0,0,1)', 
        duration: 0.2, 
        ease: 'power2.out' 
    });
  };
  
  const onLeaveCard = ({ currentTarget }) => {
    // Return to normal hard shadow
    gsap.to(currentTarget, { 
        x: 0, 
        y: 0, 
        boxShadow: '8px 8px 0px 0px rgba(0,0,0,1)', 
        duration: 0.2, 
        ease: 'power2.out' 
    });
  };

  const onClickCard = ({ currentTarget }, mode) => {
    // Press down effect
    gsap.to(currentTarget, {
        x: 4,
        y: 4,
        boxShadow: '0px 0px 0px 0px rgba(0,0,0,1)',
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        onComplete: () => setActiveMode(mode)
    });
  };

  return (
    <div ref={containerRef} className="min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden relative">
      <div className='w-full h-full absolute z-[-1] opacity-20' style={{backgroundImage:'url(public/pattern1-transparent.png)'}}></div>
      
      {/* --- LOFI DECORATIONS (No Blobs) --- */}
      <div className="absolute top-10 left-10 w-16 h-16 border-4 border-primary rounded-full opacity-20"></div>
      <div className="absolute top-20 right-20 w-8 h-8 bg-secondary rotate-45 opacity-20"></div>
      <div className="absolute bottom-10 left-20 w-24 h-4 bg-base-content opacity-10 rounded-full"></div>
      <div className="absolute bottom-20 right-10 w-12 h-12 border-4 border-base-content opacity-10"></div>

      {/* Main Header */}
      <div className="text-center mb-10 z-10">
        <h1 
            className="main-title text-6xl font-black text-primary tracking-tighter drop-shadow-sm cursor-pointer hover:text-primary-focus transition-colors" 
            onClick={() => setActiveMode('menu')}
        >
          Surveyour
        </h1>
        <p className="subtitle text-lg font-bold text-base-content/60 mt-2 font-mono uppercase tracking-widest">
          chill polls. real-time results.
        </p>
      </div>

      {/* --- CONDITIONAL CONTENT --- */}
      
      {/* 1. SELECTION MENU */}
      {activeMode === 'menu' && (
        <div className="flex flex-col sm:flex-row gap-8 z-10">
            
            {/* Poll Card */}
            <div 
                className="menu-card card w-72 bg-base-100 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-2 border-base-content rounded-[1.5rem] cursor-pointer"
                onClick={(e) => onClickCard(e, 'poll')}
                onMouseEnter={onHoverCard}
                onMouseLeave={onLeaveCard}
            >
                <div className="card-body items-center text-center p-8">
                    <div className="text-6xl mb-4 transform transition-transform group-hover:scale-110">📊</div>
                    <h2 className="card-title font-black text-2xl text-base-content uppercase tracking-tight">Quick Poll</h2>
                    <p className="text-sm font-bold opacity-60 mt-2">Single question.<br/>Instant link.<br/>Real-time updates.</p>
                    <div className="card-actions mt-6 w-full">
                        <button className="btn btn-primary btn-block border-2 border-base-content font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            Create
                        </button>
                    </div>
                </div>
            </div>

            {/* Survey Card */}
            <div 
                className="menu-card card w-72 bg-base-100 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-2 border-base-content rounded-[1.5rem] cursor-pointer"
                onClick={(e) => onClickCard(e, 'survey')}
                onMouseEnter={onHoverCard}
                onMouseLeave={onLeaveCard}
            >
                <div className="card-body items-center text-center p-8">
                    <div className="text-6xl mb-4 transform transition-transform group-hover:scale-110">📝</div>
                    <h2 className="card-title font-black text-2xl text-base-content uppercase tracking-tight">Full Survey</h2>
                    <p className="text-sm font-bold opacity-60 mt-2">Multiple questions.<br/>Logic flow.<br/>Detailed analysis.</p>
                    <div className="card-actions mt-6 w-full">
                        <button className="btn btn-secondary btn-block border-2 border-base-content font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            Create
                        </button>
                    </div>
                </div>
            </div>

        </div>
      )}

      {/* 2. POLL MAKER COMPONENT */}
      {activeMode === 'poll' && (
        <PollMaker onBack={() => setActiveMode('menu')} />
      )}

      {/* 3. SURVEY MAKER COMPONENT */}
      {activeMode === 'survey' && (
        <SurveyMaker onBack={() => setActiveMode('menu')} />
      )}

      <div className="absolute bottom-4 text-xs font-mono font-bold text-base-content/20 uppercase tracking-widest">
        powered by supabase
      </div>

    </div>
  )
}

export default FrontPage