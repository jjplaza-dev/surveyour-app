import React, { useState, useRef, useEffect } from 'react'
import { supabase } from '../supabaseClient'; 
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

const PollMaker = ({ onBack }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // Refs
  const containerRef = useRef(null);
  const formRef = useRef(null);
  const choicesRef = useRef(null);

  // Form State
  const [question, setQuestion] = useState('');
  const [choices, setChoices] = useState(['', '']);
  const [isPublic, setIsPublic] = useState(true); // NEW: State for visibility

  // --- GSAP ANIMATIONS ---

  useGSAP(() => {
    // Entrance Animation
    gsap.from('.poll-card', { 
      scale: 0.95, 
      y: 50, 
      opacity: 0, 
      ease: 'power4.out', 
      duration: 0.8 
    });
    
    gsap.from('.form-element', { 
      x: -20, 
      opacity: 0, 
      stagger: 0.08, 
      duration: 0.5, 
      delay: 0.2 
    });
  }, { scope: containerRef });

  // Animate New Choice Entry
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (choicesRef.current && choices.length > 2) {
      const lastChoice = choicesRef.current.lastElementChild;
      if (lastChoice) {
        gsap.fromTo(lastChoice, 
          { height: 0, opacity: 0, x: -20, marginBottom: 0 },
          { height: 'auto', opacity: 1, x: 0, marginBottom: '0.75rem', duration: 0.3, ease: 'back.out(1.5)' }
        );
      }
    }
  }, [choices.length]);

  // Hover Effects
  const onHoverBtn = ({ currentTarget }) => {
    gsap.to(currentTarget, { 
        x: -2, y: -2, 
        boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)', 
        duration: 0.2, ease: 'power2.out' 
    });
  };
  const onLeaveBtn = ({ currentTarget }) => {
    gsap.to(currentTarget, { 
        x: 0, y: 0, 
        boxShadow: '0px 0px 0px 0px rgba(0,0,0,0)', 
        duration: 0.2, ease: 'power2.out' 
    });
  };

  // --- LOGIC ---

  const addChoice = () => setChoices([...choices, '']);
  
  const handleChoiceChange = (index, value) => {
    const newChoices = [...choices];
    newChoices[index] = value;
    setChoices(newChoices);
  };

  const removeChoice = (index) => {
    if (choices.length > 2) {
      const newChoices = choices.filter((_, i) => i !== index);
      setChoices(newChoices);
    }
  };

  const generateSlug = () => Math.random().toString(36).substring(2, 10);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const validChoices = choices.filter(c => c.trim() !== '');
    if (!question.trim() || validChoices.length < 2) {
      alert("Please enter a question and at least 2 choices.");
      setLoading(false);
      return;
    }

    const formattedAnswers = validChoices.map(choice => ({ choice: choice, votes: 0 }));
    const uniqueId = generateSlug();
    const uniqueUrl = `/poll/${uniqueId}`;
    const resultsUrl = `/poll/${uniqueId}/results`;

    const { error } = await supabase.from('polls').insert([{
        question: question,
        answers: formattedAnswers,
        unique_url: uniqueUrl,
        results_url: resultsUrl,
        is_public: isPublic // NEW: Insert visibility preference
    }]);

    if (error) {
      console.error('Error creating poll:', error);
      alert('Failed to create poll');
      setLoading(false);
    } else {
      gsap.to('.poll-card', { 
        y: -50, opacity: 0, scale: 0.95, duration: 0.4, ease: 'power2.in',
        onComplete: () => navigate(resultsUrl)
      });
    }
  };

  return (
    <div ref={containerRef} className="w-full max-w-lg z-20">
      
      <div className="poll-card card w-full bg-base-100 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-2 border-base-content rounded-[1.5rem] relative overflow-visible">
        
        <button 
            onClick={onBack}
            className="absolute top-6 left-6 btn btn-circle btn-sm btn-ghost border-2 border-transparent hover:border-base-content hover:bg-transparent transition-all scale-200"
        >
            ←
        </button>

        <div className="card-body p-8 sm:p-10">
          <h2 className="text-center text-primary font-black text-2xl mb-2 tracking-tight uppercase">Instant Poll</h2>
          
          <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-6">
            
            {/* NEW: Public/Private Switch */}
            <div className="form-element flex justify-center items-center gap-4 bg-base-200/50 p-2 rounded-xl w-fit mx-auto border-2 border-transparent hover:border-base-200 transition-colors">
                <span className={`text-xs font-black uppercase tracking-widest ${!isPublic ? 'text-error' : 'opacity-30'}`}>Private</span>
                <input 
                    type="checkbox" 
                    className="toggle toggle-md toggle-success border-2 border-base-content hover:bg-base-100" 
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                />
                <span className={`text-xs font-black uppercase tracking-widest ${isPublic ? 'text-success' : 'opacity-30'}`}>Public</span>
            </div>

            {/* Question */}
            <div className="form-element form-control">
              <label className="label pl-1">
                <span className="label-text font-bold text-base-content/60 uppercase tracking-widest text-xs">The Question</span>
              </label>
              <textarea 
                placeholder="What's on your mind?" 
                className="textarea textarea-lg w-full bg-base-100 rounded-xl border-2 border-base-content focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:-translate-y-1 focus:-translate-x-1 transition-all duration-200 placeholder:text-base-content/30 text-xl font-bold leading-tight resize-none h-32 pt-4" 
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                required
              />
            </div>

            <div className="form-element divider before:bg-base-300 after:bg-base-300 text-xs font-mono text-base-content/40 my-0">OPTIONS</div>

            {/* Choices */}
            <div ref={choicesRef} className="flex flex-col">
              {choices.map((choice, index) => (
                <div key={index} className="form-element flex gap-3 mb-3 items-center group">
                  <div className="w-full relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-base-content/40 font-black text-xs font-mono pointer-events-none">
                        0{index + 1}
                    </div>
                    <input 
                      type="text" 
                      placeholder={`Choice ${index + 1}`}
                      className="input w-full pl-12 bg-base-100 rounded-xl border-2 border-base-content focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:-translate-y-1 focus:-translate-x-1 transition-all duration-200 font-bold" 
                      value={choice}
                      onChange={(e) => handleChoiceChange(index, e.target.value)}
                      required
                    />
                  </div>
                  {choices.length > 2 && (
                    <button 
                        type="button" 
                        onClick={() => removeChoice(index)} 
                        className="btn btn-square btn-outline border-2 border-base-content text-base-content/50 hover:bg-error hover:text-white hover:border-error rounded-xl"
                    >
                        ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Buttons */}
            <div className="form-element space-y-4 mt-2">
                <button 
                    type="button" 
                    onClick={addChoice}
                    className="btn btn-block bg-transparent border-2 border-dashed border-base-content/50 text-base-content/60 hover:border-solid hover:border-primary hover:text-primary rounded-xl normal-case h-12"
                >
                    + Add Another Option
                </button>

                <button 
                    type="submit" 
                    className={`submit-btn btn btn-primary btn-block btn-lg rounded-xl border-2 border-base-content font-black text-xl normal-case tracking-wide ${loading ? 'loading' : ''}`}
                    onMouseEnter={({ currentTarget }) => {
                        gsap.to(currentTarget, { x: -4, y: -4, boxShadow: '6px 6px 0px 0px rgba(0,0,0,1)', duration: 0.2 });
                    }}
                    onMouseLeave={({ currentTarget }) => {
                        gsap.to(currentTarget, { x: 0, y: 0, boxShadow: '0px 0px 0px 0px rgba(0,0,0,0)', duration: 0.2 });
                    }}
                    disabled={loading}
                >
                    {loading ? 'Cooking...' : 'Launch Poll 🚀'}
                </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  )
}

export default PollMaker