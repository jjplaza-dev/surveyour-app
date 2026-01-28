import React, { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

const SurveyPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Refs
  const containerRef = useRef(null);
  const cardRef = useRef(null);
  const optionsRef = useRef(null);

  // Data State
  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(true);

  // Interaction State
  const [currentStep, setCurrentStep] = useState(0); // Which question are we on?
  const [userSelections, setUserSelections] = useState({}); // Stores: { 0: 1, 1: 3 } -> { QuestionIndex: OptionIndex }
  const [submitting, setSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // --- 1. FETCH SURVEY DATA ---
  useEffect(() => {
    const fetchSurvey = async () => {
      // Assuming the unique_url follows /survey/:id
      const path = `/survey/${id}`;
      
      const { data, error } = await supabase
        .from('surveys')
        .select('*')
        .eq('unique_url', path)
        .single();

      if (error) {
        console.error('Error fetching survey:', error);
      } else {
        setSurvey(data);
      }
      setLoading(false);
    };

    fetchSurvey();
  }, [id]);

  // --- 2. ANIMATIONS (Transition between steps) ---
  const animateStepChange = (direction = 'next', callback) => {
    const tl = gsap.timeline({
        onComplete: () => {
            callback(); // Actually change the state (Q1 -> Q2)
            
            // Animate In New Question
            gsap.fromTo(cardRef.current, 
                { x: direction === 'next' ? 50 : -50, opacity: 0 },
                { x: 0, opacity: 1, duration: 0.4, ease: 'power2.out' }
            );
            
            // Stagger the options
            if(optionsRef.current) {
                gsap.fromTo(optionsRef.current.children,
                    { x: -20, opacity: 0 },
                    { x: 0, opacity: 1, stagger: 0.05, duration: 0.3, delay: 0.1 }
                );
            }
        }
    });

    // Animate Out Old Question
    tl.to(cardRef.current, { 
        x: direction === 'next' ? -50 : 50, 
        opacity: 0, 
        duration: 0.3, 
        ease: 'power2.in' 
    });
  };

  // Initial Entrance Animation
  useGSAP(() => {
    // Only run if not loading, survey exists, and not completed yet
    if(loading || !survey || isCompleted || !cardRef.current) return;

    // Use .to() because we set initial state in style={{}}
    gsap.to(cardRef.current, { 
        y: 0, 
        opacity: 1, 
        duration: 0.8, 
        ease: 'power4.out' 
    });

  }, { scope: containerRef, dependencies: [loading, survey, isCompleted] });


  // --- 3. HANDLERS ---
  
  const handleSelect = (choiceIndex) => {
    // Save selection locally
    setUserSelections(prev => ({
        ...prev,
        [currentStep]: choiceIndex
    }));
  };

  const handleNext = () => {
    if (userSelections[currentStep] === undefined) return; 

    if (currentStep < survey.questions.length - 1) {
        animateStepChange('next', () => setCurrentStep(prev => prev + 1));
    } else {
        handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
        animateStepChange('prev', () => setCurrentStep(prev => prev - 1));
    }
  };

  // --- 4. THE CRITICAL UPDATE LOGIC ---
  const handleSubmit = async () => {
    setSubmitting(true);
    
    try {
        // A. Fetch fresh data first (Concurrency Safety)
        const { data: freshSurvey, error: fetchError } = await supabase
            .from('surveys')
            .select('answers')
            .eq('id', survey.id)
            .single();

        if (fetchError) throw fetchError;

        // B. Clone the complex JSON structure
        const updatedAnswers = [...freshSurvey.answers];

        // C. Apply User Selections
        Object.entries(userSelections).forEach(([qIndexStr, choiceIndex]) => {
            const qIndex = parseInt(qIndexStr);
            
            // Check if valid indices
            if (updatedAnswers[qIndex] && updatedAnswers[qIndex][choiceIndex]) {
                const currentVotes = updatedAnswers[qIndex][choiceIndex].votes || 0;
                updatedAnswers[qIndex][choiceIndex].votes = currentVotes + 1;
            }
        });

        // D. Write back to Supabase
        const { error: updateError } = await supabase
            .from('surveys')
            .update({ answers: updatedAnswers })
            .eq('id', survey.id);

        if (updateError) throw updateError;

        // E. Success Handling
        setSubmitting(false);
        
        if (survey.is_public) {
            // Animate out before navigating
            gsap.to(cardRef.current, { 
                y: -50, opacity: 0, duration: 0.4, ease: 'power2.in',
                onComplete: () => navigate(survey.results_url)
            });
        } else {
            setIsCompleted(true);
        }

    } catch (error) {
        console.error("Submission error", error);
        alert("Failed to submit survey. Please try again.");
        setSubmitting(false);
    }
  };

  // --- RENDER STATES ---

  if (loading) return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
    </div>
  );

  if (!survey) return (
    <div className="min-h-screen bg-base-200 flex flex-col items-center justify-center text-center">
        <h1 className="text-6xl font-black text-base-content opacity-20 mb-4">404</h1>
        <p className="text-xl font-bold opacity-50">Survey not found.</p>
        <Link to="/" className="btn btn-outline mt-4">Go Home</Link>
    </div>
  );

  // Thank You Screen (For private surveys)
  if (isCompleted) return (
    <div className="min-h-screen bg-base-200 flex flex-col items-center justify-center p-4">
        <div className="card w-full max-w-lg bg-base-100 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-2 border-base-content rounded-[2rem] animate-in zoom-in duration-300">
            <div className="card-body text-center items-center p-12">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-3xl font-black mb-2">Thanks!</h2>
                <p className="opacity-60 mb-6 font-medium">Your answers have been recorded.</p>
                
                <div className="flex flex-col gap-3 w-full">
                    <Link to="/" className="btn btn-primary btn-block border-2 font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                        Create a Survey
                    </Link>
                    <Link to="/" className="btn btn-ghost btn-block">
                        Go Home
                    </Link>
                </div>
            </div>
        </div>
    </div>
  );

  // Helper variables
  const currentQ = survey.questions[currentStep]; // { question: "Text", options: [] }
  const currentOptions = currentQ.options; 
  const currentSelection = userSelections[currentStep];
  const progress = ((currentStep + 1) / survey.questions.length) * 100;

  return (
    <div ref={containerRef} className="min-h-screen bg-base-200 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        
        {/* --- STATIC BACKGROUND DECORATION (No Blobs, Lofi Style) --- */}
        <div className="absolute top-20 right-20 w-16 h-16 border-4 border-base-content opacity-10 rotate-12"></div>
        <div className="absolute bottom-20 left-20 w-8 h-8 bg-primary opacity-20 rounded-full"></div>
        <div className="absolute top-10 left-10 w-24 h-24 border-2 border-dashed border-base-content opacity-10 rounded-full"></div>

        {/* --- MAIN CARD --- */}
        {/* FIX: Inline style hides it initially to prevent flicker. GSAP animates it in. */}
        <div 
            ref={cardRef} 
            className="card w-full max-w-lg bg-base-100 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-2 border-base-content rounded-[2rem] relative z-10 overflow-hidden"
            style={{ opacity: 0, transform: 'translateY(100px)' }} 
        >
            
            {/* Progress Bar (Attached to top) */}
            <div className="w-full h-3 bg-base-200 border-b-2 border-base-content">
                <div 
                    className="h-full bg-primary transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                ></div>
            </div>

            <div className="card-body p-8 sm:p-10">
                
                {/* Header info */}
                <div className="flex justify-between items-center mb-6">
                   <span className="badge badge-neutral font-mono font-bold tracking-widest uppercase rounded-md border-2 border-base-100">
                        {survey.title}
                   </span>
                   <span className="font-mono font-black text-xs opacity-40">
                        STEP {currentStep + 1} / {survey.questions.length}
                   </span>
                </div>

                {/* Question Title */}
                <h1 className="text-3xl font-black text-base-content leading-tight mb-8 min-h-[80px]">
                    {currentQ.question}
                </h1>

                {/* Options */}
                <div ref={optionsRef} className="flex flex-col gap-4 mb-8">
                    {currentOptions.map((opt, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleSelect(idx)}
                            className={`
                                group relative w-full text-left p-4 rounded-xl border-2 transition-all duration-200
                                ${currentSelection === idx 
                                    ? 'bg-primary text-primary-content border-base-content translate-x-1 -translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' 
                                    : 'bg-base-100 hover:bg-base-200 border-base-content hover:-translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]'}
                            `}
                        >
                            <div className="flex items-center justify-between font-bold text-lg">
                                <span>{opt}</span>
                                <div className={`
                                    w-6 h-6 border-2 border-base-content flex items-center justify-center bg-base-100
                                    ${currentSelection === idx ? 'bg-base-content' : ''}
                                `}>
                                    {currentSelection === idx && <span className="text-base-100 text-xs">✓</span>}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between items-center pt-6 border-t-2 border-base-200">
                    
                    <button 
                        onClick={handleBack}
                        disabled={currentStep === 0}
                        className="btn btn-ghost btn-sm font-bold opacity-50 hover:opacity-100 disabled:opacity-0 transition-opacity"
                    >
                        ← Back
                    </button>

                    <button 
                        onClick={handleNext}
                        disabled={currentSelection === undefined || submitting}
                        className={`
                            btn btn-wide font-black border-2 border-base-content rounded-xl text-lg normal-case
                            ${currentSelection !== undefined 
                                ? 'btn-neutral shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all' 
                                : 'btn-disabled opacity-50 bg-base-200'}
                        `}
                    >
                        {submitting ? 'Sending...' : (currentStep === survey.questions.length - 1 ? 'Finish & Submit' : 'Next Question →')}
                    </button>

                </div>

            </div>
        </div>

        <div className="mt-8 text-xs font-mono font-bold opacity-30 uppercase tracking-widest">
            Surveyour • v1.0
        </div>

    </div>
  )
}

export default SurveyPage