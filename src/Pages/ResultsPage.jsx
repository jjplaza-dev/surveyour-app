import React, { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

// Import the image directly so Vite bundles it correctly
// Make sure the file exists at this path!
import patternBg from '../../public/pattern1-transparent.png' 

const ResultsPage = () => {
  const { id } = useParams();
  const containerRef = useRef(null);
  
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [totalVotes, setTotalVotes] = useState(0);
  const [copied, setCopied] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState('');

  // --- 1. FETCH & SUBSCRIBE ---
  useEffect(() => {
    let channel;
    const fetchAndSubscribe = async () => {
      const path = `/poll/${id}/results`;
      
      const { data, error } = await supabase
        .from('polls')
        .select('*')
        .eq('results_url', path)
        .single();

      if (error) {
        console.error('Error fetching results:', error);
      } else {
        setPoll(data);
        calculateTotal(data.answers);
      }
      setLoading(false);

      if (data) {
        channel = supabase
          .channel('realtime-poll')
          .on('postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'polls', filter: `id=eq.${data.id}` },
            (payload) => {
              setPoll(payload.new);
              calculateTotal(payload.new.answers);
              // Flash animation on update
              gsap.fromTo('.vote-bar-fill', { opacity: 0.5 }, { opacity: 1, duration: 0.3 });
            }
          )
          .subscribe();
      }
    };
    fetchAndSubscribe();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, [id]);

  // --- 2. HELPERS ---
  const calculateTotal = (answers) => {
    const total = answers.reduce((acc, curr) => acc + (curr.votes || 0), 0);
    setTotalVotes(total);
  };

  useEffect(() => {
    if (!poll) return;
    const interval = setInterval(() => {
        const created = new Date(poll.created_at);
        const now = new Date();
        const diffInSeconds = Math.floor((now - created) / 1000);
        const mins = Math.floor(diffInSeconds / 60);
        const secs = diffInSeconds % 60;
        const hours = Math.floor(mins / 60);
        
        if (hours > 0) setTimeElapsed(`${hours}h ${mins % 60}m ago`);
        else if (mins > 0) setTimeElapsed(`${mins}m ${secs}s ago`);
        else setTimeElapsed(`${secs}s ago`);
    }, 1000);
    return () => clearInterval(interval);
  }, [poll]);

  // --- 3. ANIMATIONS ---
  useGSAP(() => {
    if (loading || !poll) return;
    const tl = gsap.timeline({ defaults: { ease: 'power4.out', duration: 0.8 } });

    tl.from('.main-card', { y: 100, opacity: 0 })
      .from('.header-element', { y: 20, opacity: 0, stagger: 0.1 }, "-=0.4")
      .from('.stat-box', { scale: 0.8, opacity: 0, stagger: 0.1, ease: 'back.out(1.5)' }, "-=0.4")
      .from('.result-row', { x: -20, opacity: 0, stagger: 0.05 }, "-=0.5");

  }, [loading]);

  // --- 4. COPY LINK ---
  const copyLink = () => {
    const url = `${window.location.origin}${poll.unique_url}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    
    // Hard button press effect
    gsap.to('.copy-btn', { 
        boxShadow: '0px 0px 0px 0px rgba(0,0,0,1)', 
        x: 4, y: 4, 
        duration: 0.1, 
        yoyo: true, 
        repeat: 1 
    });
  };

  if (loading) return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
    </div>
  );

  return (
    <div ref={containerRef} className="min-h-screen p-4 sm:p-8 relative overflow-hidden flex justify-center">
        
        {/* --- BACKGROUND PATTERN --- */}
        <div 
            className='absolute top-0 inset-0 z-[-1] pointer-events-none opacity-20' 
            style={{ 
                backgroundImage: `url(${patternBg})`,     
            }}
        ></div>

        {/* --- GEOMETRIC DECORATIONS (Lofi Style) --- */}
        <div className="absolute top-10 left-10 w-16 h-16 border-4 border-primary rounded-full opacity-20 z-0"></div>
        <div className="absolute bottom-10 right-10 w-12 h-12 bg-secondary opacity-20 rotate-45 z-0"></div>

        <div className="w-full max-w-3xl z-10 flex flex-col gap-6">
            
            {/* MAIN CARD CONTAINER */}
            <div className="main-card card w-full bg-base-100 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-2 border-base-content rounded-xl overflow-hidden">
                <div className="card-body p-6 sm:p-10">
                    
                    {/* Header Section */}
                    <div className="text-center mb-8 border-b-2 border-base-200 pb-6">
                        <div className="header-element badge badge-primary badge-outline font-black tracking-widest mb-3 p-3 border-2">
                            LIVE RESULTS
                        </div>
                        <h1 className="header-element text-3xl sm:text-5xl font-black text-base-content mb-3 leading-tight">
                            {poll.title}
                        </h1>
                        <h2 className="header-element text-xl text-base-content/60 font-bold">
                            {poll.question}
                        </h2>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
                        {/* Total Votes */}
                        <div className="stat-box bg-base-200 border-2 border-base-content rounded-lg p-4 text-center">
                            <div className="text-xs font-black uppercase tracking-widest opacity-50 mb-1">Votes</div>
                            <div className="text-3xl font-black text-primary">{totalVotes}</div>
                        </div>

                        {/* Time Active */}
                        <div className="stat-box bg-base-200 border-2 border-base-content rounded-lg p-4 text-center">
                            <div className="text-xs font-black uppercase tracking-widest opacity-50 mb-1">Active</div>
                            <div className="text-xl font-bold font-mono pt-1">{timeElapsed || 'Now'}</div>
                        </div>

                        {/* Share Button */}
                        <div className="stat-box col-span-2 sm:col-span-1">
                            <button 
                                onClick={copyLink}
                                className="copy-btn btn btn-block h-full bg-secondary text-secondary-content border-2 border-base-content shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all rounded-lg flex flex-col gap-0"
                            >
                                <span className="text-xl">{copied ? '✅' : '🔗'}</span>
                                <span className="text-[10px] font-black uppercase">{copied ? 'COPIED!' : 'SHARE'}</span>
                            </button>
                        </div>
                    </div>

                    {/* Results Bars */}
                    <div className="flex flex-col gap-5">
                        {poll.answers
                            .sort((a, b) => (b.votes || 0) - (a.votes || 0)) 
                            .map((answer, index) => {
                                const percentage = totalVotes === 0 ? 0 : Math.round(((answer.votes || 0) / totalVotes) * 100);
                                const isWinner = index === 0 && totalVotes > 0;
                                
                                return (
                                    <div key={index} className="result-row">
                                        {/* Label Row */}
                                        <div className="flex justify-between items-end mb-2 px-1">
                                            <span className="font-bold text-lg flex items-center gap-2">
                                                {isWinner && <span className="text-xl">👑</span>}
                                                {answer.choice}
                                            </span>
                                            <span className="font-black text-xl">{percentage}%</span>
                                        </div>
                                        
                                        {/* Bar Container */}
                                        <div className="h-6 w-full bg-base-200 border-2 border-base-content rounded-full overflow-hidden relative">
                                            {/* Filled Bar */}
                                            <div 
                                                className={`vote-bar-fill h-full border-r-2 border-base-content transition-all duration-1000 ease-out relative
                                                    ${isWinner ? 'bg-primary' : 'bg-base-300'}
                                                `}
                                                style={{ width: `${percentage}%` }}
                                            >
                                                {/* Striped Pattern Overlay (CSS Trick) */}
                                                <div 
                                                    className="absolute inset-0 opacity-20" 
                                                    style={{ backgroundImage: 'linear-gradient(45deg, #000 25%, transparent 25%, transparent 50%, #000 50%, #000 75%, transparent 75%, transparent)', backgroundSize: '10px 10px' }}
                                                ></div>
                                            </div>
                                        </div>
                                        
                                        <div className="text-right text-xs font-mono font-bold opacity-40 mt-1 px-1">
                                            {answer.votes || 0} votes
                                        </div>
                                    </div>
                                )
                        })}
                    </div>

                    {/* Footer Action */}
                    <div className="text-center mt-12 pt-6 border-t-2 border-base-200">
                        <Link to="/" className="btn btn-ghost btn-sm font-bold opacity-50 hover:opacity-100 uppercase tracking-widest">
                            ← Create New Poll
                        </Link>
                    </div>

                </div>
            </div>
        </div>
    </div>
  )
}

export default ResultsPage