import React, { useState, useRef } from 'react'
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { BarChart3, ClipboardList } from 'lucide-react';

import PollMaker from '../Components/PollMaker';
import SurveyMaker from '../Components/SurveyMaker';
import Login from './Login';


const FrontPage = ({ session }) => {
  const containerRef = useRef(null);
  
  const [activeMode, setActiveMode] = useState('menu'); 

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'back.out(1.7)', duration: 0.8 } });

    tl.from('.main-title', { y: -50, opacity: 0, duration: 1 })
      .from('.subtitle', { y: -20, opacity: 0, duration: 0.6 }, "-=0.6");

    if (activeMode === 'menu') {
        tl.from('.menu-card', { 
            scale: 0.8, 
            y: 30, 
            opacity: 0, 
            stagger: 0.1, 
            ease: 'elastic.out(1, 0.8)' 
        }, "-=0.4")
        .from('.login-area', {
            opacity: 0,
            y: 20,
            duration: 0.5,
            ease: 'power2.out'
        }, "-=0.2");
    }

  }, { scope: containerRef, dependencies: [activeMode] }); 

  // --- HOVER EFFECTS (Lofi Style) ---
  const onHoverCard = ({ currentTarget }) => {
    gsap.to(currentTarget, { 
        x: -4, y: -4, 
        boxShadow: '10px 10px 0px 0px rgba(0,0,0,1)', 
        duration: 0.2, ease: 'power2.out' 
    });
  };
  
  const onLeaveCard = ({ currentTarget }) => {
    gsap.to(currentTarget, { 
        x: 0, y: 0, 
        boxShadow: '6px 6px 0px 0px rgba(0,0,0,1)', 
        duration: 0.2, ease: 'power2.out' 
    });
  };

  const onClickCard = ({ currentTarget }, mode) => {
    gsap.to(currentTarget, {
        x: 4, y: 4,
        boxShadow: '0px 0px 0px 0px rgba(0,0,0,1)', 
        duration: 0.1, yoyo: true, repeat: 1,
        onComplete: () => setActiveMode(mode)
    });
  };

  return (
    <div ref={containerRef} className="min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden relative">

      <div className='w-full h-full absolute z-[1] opacity-30 top-0 left-0 pointer-events-none' style={{backgroundImage:'url(/pattern1-transparent.png)'}}></div>
      
      <div className="absolute top-10 left-10 w-16 h-16 border-4 border-primary rounded-full opacity-20"></div>
      <div className="absolute top-20 right-20 w-8 h-8 bg-secondary rotate-45 opacity-20"></div>
      <div className="absolute bottom-10 left-20 w-24 h-4 bg-base-content opacity-10 rounded-full"></div>
      <div className="absolute bottom-20 right-10 w-12 h-12 border-4 border-base-content opacity-10"></div>

      <div className="text-center mb-8 z-10">
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

      {activeMode === 'menu' && (
        <div className="flex flex-col gap-10 items-center z-10 w-full max-w-4xl ">
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center w-full items-center">
            
                <div 
                    className="menu-card card w-64 bg-base-100 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] border-2 border-base-content rounded-[1.5rem] cursor-pointer"
                    onClick={(e) => onClickCard(e, 'poll')}
                    onMouseEnter={onHoverCard}
                    onMouseLeave={onLeaveCard}
                >
                    <div className="card-body items-center text-center p-6">
                        <div className="mb-3 p-3 bg-primary/10 rounded-full group-hover:scale-110 transition-transform duration-300 text-primary">
                            <BarChart3 size={40} strokeWidth={2.5} />
                        </div>
                        <h2 className="card-title font-black text-xl text-base-content uppercase tracking-tight">Quick Poll</h2>
                        <p className="text-xs font-bold opacity-60 mt-1 leading-relaxed">Single question.<br/>Instant link.</p>
                        <div className="card-actions mt-4 w-full">
                            <button className="btn btn-primary btn-sm btn-block border-2 border-base-content font-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                                Create
                            </button>
                        </div>
                    </div>
                </div>

                <div 
                    className="menu-card card w-64 bg-base-100 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] border-2 border-base-content rounded-[1.5rem] cursor-pointer"
                    onClick={(e) => onClickCard(e, 'survey')}
                    onMouseEnter={onHoverCard}
                    onMouseLeave={onLeaveCard}
                >
                    <div className="card-body items-center text-center p-6">
                        <div className="mb-3 p-3 bg-secondary/10 rounded-full group-hover:scale-110 transition-transform duration-300 text-secondary">
                            <ClipboardList size={40} strokeWidth={2.5} />
                        </div>
                        <h2 className="card-title font-black text-xl text-base-content uppercase tracking-tight">Full Survey</h2>
                        <p className="text-xs font-bold opacity-60 mt-1 leading-relaxed">Multi-question.<br/>Logic flow.</p>
                        <div className="card-actions mt-4 w-full">
                            <button className="btn btn-secondary btn-sm btn-block border-2 border-base-content font-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                                Create
                            </button>
                        </div>
                    </div>
                </div>

            </div>

            {!session && (
                <div className="login-area w-full max-w-sm border-t-2 border-base-content/10 pt-6">
                    <p className="text-center text-xs font-bold uppercase tracking-widest opacity-40 mb-4">Save your work</p>
                    <div className="scale-90 origin-top">
                        <Login />
                    </div>
                </div>
            )}

        </div>
      )}

      {activeMode === 'poll' && (
        <PollMaker onBack={() => setActiveMode('menu')} session={session}/>
      )}

      {activeMode === 'survey' && (
        <SurveyMaker onBack={() => setActiveMode('menu')} session={session}/>
      )}

    </div>
  )
}

export default FrontPage