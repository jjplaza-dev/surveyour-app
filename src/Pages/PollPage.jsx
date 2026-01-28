import React, { useEffect, useState, useRef, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

// --- 1. DEFINE MULTIPLE BLOB SHAPES ---
// These are 5 distinct "organic" blob shapes normalized for 200x200 viewbox
const BLOB_VARIANTS = [
  "M55.7,-43.7C67.3,-29.8,68.6,-6.9,64.5,16.3C60.5,39.6,51.2,63.3,34.6,71C17.9,78.7,-6,70.4,-26.4,59C-46.8,47.6,-63.6,33,-67.7,15.4C-71.7,-2.2,-63.1,-22.8,-49.7,-37.1C-36.3,-51.4,-18.1,-59.4,1.9,-61C22,-62.5,44,-57.6,55.7,-43.7Z",
  "M44.7,-51.2C56.6,-42.6,64.1,-28.3,67.3,-13.2C70.5,1.9,69.4,17.8,61.8,30.7C54.2,43.6,40.1,53.5,25.3,58.9C10.5,64.3,-5,65.2,-19.1,60.6C-33.2,56,-45.9,45.9,-54.6,33C-63.3,20.1,-68,4.4,-64.7,-9.6C-61.4,-23.6,-50.1,-35.9,-37.6,-44.3C-25.1,-52.7,-11.4,-57.2,3.3,-61.2C18,-65.1,32.7,-59.8,44.7,-51.2Z",
  "M48.1,-58.5C60.8,-48.9,68.6,-32.7,71.1,-16.1C73.6,0.5,70.8,17.5,61.9,31.5C53,45.5,38,56.5,21.9,62.2C5.8,67.9,-11.4,68.3,-26.7,62.3C-42,56.3,-55.4,43.9,-63.6,28.7C-71.8,13.5,-74.8,-4.5,-68.8,-19.7C-62.8,-34.9,-47.8,-47.3,-33.1,-56.1C-18.4,-64.9,-4,-70.1,10.6,-69.5C25.2,-68.9,35.4,-68.1,48.1,-58.5Z",
  "M37.9,-48.3C50.2,-39.9,61.9,-30.9,68.6,-18.5C75.3,-6.1,77,9.7,71.1,23.1C65.2,36.5,51.7,47.5,37.6,56.6C23.5,65.7,8.8,72.9,-5.3,73.6C-19.4,74.3,-32.9,68.5,-45.5,59.3C-58.1,50.1,-69.8,37.5,-73.9,23.1C-78,8.7,-74.5,-7.5,-65.8,-21.2C-57.1,-34.9,-43.2,-46.1,-29.6,-53.8C-16,-61.5,-2.7,-65.7,9.6,-64.8C21.9,-63.9,25.6,-56.7,37.9,-48.3Z",
  "M45.7,-54.3C58.6,-46.6,68,-33.1,70.5,-18.4C73,-3.7,68.6,12.2,60.1,25.4C51.6,38.6,39,49.1,25.3,55.4C11.6,61.7,-3.2,63.8,-17.6,60.3C-32,56.8,-46,47.7,-55.5,35.3C-65,22.9,-70.1,7.2,-66.9,-6.9C-63.7,-21,-52.3,-33.5,-40.4,-41.5C-28.5,-49.5,-16.1,-53,0.3,-53.3C16.7,-53.7,32.8,-62,45.7,-54.3Z"
];

// Colors for the blobs
const BLOB_COLORS = [
    "#FA4D56", "#570DF8", "#F000B8", "#37CDBE", 
    "#FFAE00", "#3ABFF8", "#000000", "#FFCCE1", 
    "#F2F1ED", "#CDE5D9", "#FA4D56", "#570DF8",
    "#F000B8", "#37CDBE", "#FFAE00", "#3ABFF8", 
    "#000000", "#FFCCE1", "#F2F1ED", "#CDE5D9"
];

const PollPage = () => {
  const { id } = useParams(); 
  const navigate = useNavigate();
  
  // Refs
  const containerRef = useRef(null);
  const optionsRef = useRef(null);
  const cardRef = useRef(null);

  // State
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null); 
  const [hasVoted, setHasVoted] = useState(false); 

  // --- 0. STATIC VISUALS CONFIGURATION ---
  
  // A. Random "Whitish" Gradient
  const bgGradient = useMemo(() => {
    const getWhitishPastel = () => {
        const h = Math.floor(Math.random() * 360);
        const s = Math.floor(Math.random() * 20 + 30); 
        const l = Math.floor(Math.random() * 8 + 90); 
        return `hsl(${h}, ${s}%, ${l}%)`;
    };

    const c1 = getWhitishPastel();
    const c2 = getWhitishPastel();
    const c3 = getWhitishPastel();
    
    return `linear-gradient(to top left, ${c1}, ${c2}, ${c3})`;
  }, []); 

  // B. Blob Initial Positions & PATHS (Memoized)
  const blobData = useMemo(() => {
    return BLOB_COLORS.map((color) => ({
        color,
        // Pick a random path from the variants array
        path: BLOB_VARIANTS[Math.floor(Math.random() * BLOB_VARIANTS.length)],
        top: Math.random() * 80,
        left: Math.random() * 100,
        scale: 0.8 + Math.random() * 0.6
    }));
  }, []);

  // --- 1. FETCH POLL DATA ---
  useEffect(() => {
    const fetchPoll = async () => {
      const path = `/poll/${id}`;
      const { data, error } = await supabase
        .from('polls')
        .select('*')
        .eq('unique_url', path)
        .single();

      if (error) console.error('Error fetching poll:', error);
      else setPoll(data);
      
      setLoading(false);
    };
    fetchPoll();
  }, [id]);

  // --- 2. BACKGROUND BLOB ANIMATION ---
  useGSAP(() => {
    const blobs = gsap.utils.toArray('.bg-blob');
    blobs.forEach((blob) => {
        gsap.to(blob, {
            x: "random(-100, 100)",       
            y: "random(-100, 100)",       
            rotation: "random(-180, 180)", 
            scale: "random(0.8, 1.4)",    
            duration: "random(10, 20)",   
            ease: "sine.inOut",           
            repeat: -1,                   
            yoyo: true                    
        });
    });
  }, { scope: containerRef }); 

  // --- 3. CARD ENTRANCE ANIMATION ---
  useGSAP(() => {
    if (loading || !poll || hasVoted || !cardRef.current) return;
    if (containerRef.current.dataset.animated) return;

    gsap.set('.poll-badge', { scale: 0, autoAlpha: 0 });
    gsap.set('.poll-question', { y: 20, autoAlpha: 0 });
    gsap.set('.option-card', { x: -20, autoAlpha: 0 });

    const tl = gsap.timeline({ 
        defaults: { ease: 'power4.out' },
        onComplete: () => { containerRef.current.dataset.animated = "true"; }
    });

    tl.to(cardRef.current, { 
        autoAlpha: 1, 
        y: 0, 
        duration: 0.5,
        ease: 'power2.out' 
    })
    .to('.poll-badge', { 
        scale: 1, 
        autoAlpha: 1, 
        ease: 'back.out(1.7)',
        duration: 0.6
    })
    .to('.poll-question', { 
        y: 0, 
        autoAlpha: 1, 
        duration: 0.6 
    }, "-=0.4")
    .to('.option-card', { 
        x: 0, 
        autoAlpha: 1, 
        stagger: 0.08, 
        duration: 0.6,
        clearProps: "transform" 
    }, "-=0.4");

  }, { scope: containerRef, dependencies: [poll, loading, hasVoted] });

  // --- 4. INTERACTION ---
  const handleSelect = (index) => {
    setSelectedOption(index);
    if (!optionsRef.current) return;

    const cards = optionsRef.current.children;
    gsap.to(cards, { opacity: 0.5, scale: 0.98, duration: 0.2 }); 
    gsap.to(cards[index], { opacity: 1, scale: 1.02, duration: 0.3, ease: 'back.out(2)' });
  };

  const handleSubmit = async () => {
    if (selectedOption === null) return;
    setSubmitting(true);

    try {
      const { data: freshPoll, error: fetchError } = await supabase
        .from('polls')
        .select('answers')
        .eq('id', poll.id) 
        .single();

      if (fetchError) throw fetchError;

      const updatedAnswers = [...freshPoll.answers];
      updatedAnswers[selectedOption].votes = (updatedAnswers[selectedOption].votes || 0) + 1;

      const { error: updateError } = await supabase
        .from('polls')
        .update({ answers: updatedAnswers })
        .eq('id', poll.id);

      if (updateError) throw updateError;

      if (poll.is_public) {
          gsap.to(cardRef.current, {
            y: -50, autoAlpha: 0, duration: 0.4, ease: 'power2.in',
            onComplete: () => navigate(poll.results_url)
          });
      } else {
          setHasVoted(true);
      }

    } catch (error) {
      console.error('Voting failed:', error);
      alert('Something went wrong submitting your vote!');
      setSubmitting(false);
    }
  };

  // --- RENDER ---
  const renderLoading = () => (
    <div className="min-h-screen flex items-center justify-center relative z-20">
        <span className="loading loading-spinner loading-lg text-black/20"></span>
    </div>
  );

  const render404 = () => (
    <div className="min-h-screen flex flex-col items-center justify-center text-center relative z-20 text-black/50">
        <h1 className="text-6xl font-black mb-4">404</h1>
        <p className="text-xl font-bold">Poll not found.</p>
    </div>
  );

  const renderThankYou = () => (
    <div className="card w-full max-w-lg bg-base-100 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-2 border-base-content animate-in zoom-in duration-300 z-10">
        <div className="card-body text-center items-center p-10">
            <div className="text-6xl mb-4">🙌</div>
            <h2 className="card-title text-3xl font-black mb-2">Vote Recorded!</h2>
            <div className="py-4 w-full">
                <p className="text-sm font-bold uppercase tracking-widest opacity-50 mb-2">You answered</p>
                <div className="p-4 bg-base-200 rounded-lg border-2 border-base-content font-bold text-xl">
                    {poll.answers[selectedOption].choice}
                </div>
            </div>
            <p className="text-base-content/70 font-medium">The creator has kept these results private.</p>
            <div className="card-actions mt-6">
                <Link to="/" className="btn btn-primary btn-outline btn-wide border-2 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all">
                    Create a Poll
                </Link>
            </div>
        </div>
    </div>
  );

  return (
    <div 
        ref={containerRef} 
        className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden transition-all duration-1000"
        style={{ background: bgGradient }} 
    >
        
        {/* --- DYNAMIC BACKGROUND BLOBS --- */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            {blobData.map((blob, i) => (
                <svg 
                    key={i}
                    viewBox="0 0 200 200" 
                    xmlns="http://www.w3.org/2000/svg"
                    className="bg-blob absolute w-[400px] h-[400px] opacity-40 blur-xl mix-blend-multiply"
                    style={{
                        top: `${blob.top}%`,
                        left: `${blob.left}%`,
                        fill: blob.color
                    }}
                >
                    {/* Use the random path assigned in useMemo */}
                    <path d={blob.path} transform="translate(100 100)" />
                </svg>
            ))}
        </div>

        {loading && renderLoading()}
        {!loading && !poll && render404()}

        {!loading && poll && (
            <div className="z-10 w-full flex justify-center">
                {hasVoted ? renderThankYou() : (
                    <div 
                        ref={cardRef}
                        className="poll-card card w-full max-w-lg bg-base-100/90 backdrop-blur-sm shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-2 border-base-content rounded-xl"
                        style={{ opacity: 0, visibility: 'hidden', transform: 'translateY(100px)' }}
                    > 
                        <div className="card-body p-8 sm:p-10">
                            
                            <div className="mb-8">
                                <div className="poll-badge invisible badge badge-primary badge-outline font-black tracking-widest mb-4 p-3 border-2 bg-base-100">
                                    SURVEYOUR POLL
                                </div>
                                <h1 className="poll-question invisible text-3xl sm:text-4xl font-black text-base-content leading-tight">
                                    {poll.question}
                                </h1>
                            </div>

                            <div ref={optionsRef} className="flex flex-col gap-3">
                                {Array.isArray(poll.answers) && poll.answers.length > 0 ? (
                                    poll.answers.map((answer, index) => (
                                        <button
                                            key={index}
                                            onClick={() => handleSelect(index)}
                                            className={`
                                                option-card invisible group relative w-full text-left p-5 rounded-lg transition-all border-2
                                                ${selectedOption === index 
                                                    ? 'bg-primary text-primary-content border-base-content translate-x-1 -translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' 
                                                    : 'bg-base-100 hover:bg-base-200 border-base-300 text-base-content hover:border-base-content'}
                                            `}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-lg font-bold">
                                                    {answer.choice || "Option"} 
                                                </span>
                                                <div className={`
                                                    w-6 h-6 border-2 border-base-content flex items-center justify-center bg-base-100
                                                    ${selectedOption === index ? 'bg-base-content border-base-content' : ''}
                                                `}>
                                                    {selectedOption === index && (
                                                        <span className="text-base-100 text-sm font-bold">✓</span>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    ))
                                ) : (
                                    <div className="text-center text-error font-bold p-4 border-2 border-dashed border-error rounded-lg">
                                        No options found.
                                    </div>
                                )}
                            </div>

                            <div className="mt-8">
                                <button
                                    onClick={handleSubmit}
                                    disabled={selectedOption === null || submitting}
                                    className={`
                                        poll-question invisible btn btn-lg w-full rounded-lg font-black text-xl normal-case tracking-wide border-2 border-base-content
                                        ${selectedOption !== null 
                                            ? 'btn-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none' 
                                            : 'btn-disabled opacity-50 bg-base-200'}
                                        ${submitting ? 'loading' : ''}
                                    `}
                                >
                                    {submitting ? 'VOTING...' : 'SUBMIT VOTE'}
                                </button>
                                
                                {selectedOption === null && (
                                    <p className="poll-question invisible text-center text-xs font-bold uppercase tracking-widest opacity-40 mt-4">
                                        Select an option above
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )}
        
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs font-mono font-bold opacity-30 uppercase tracking-widest z-10 text-black/20">
            Surveyour • v1.0
        </div>

    </div>
  )
}

export default PollPage