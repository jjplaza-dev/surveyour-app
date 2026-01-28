import React, { useState, useRef, useEffect } from 'react'
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

// Register Plugin
gsap.registerPlugin(ScrollToPlugin);

const SurveyMaker = ({ onBack, session }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);

  // --- STATE ---
  const [title, setTitle] = useState('');
  const [isPublic, setIsPublic] = useState(true); // NEW: Visibility State
  
  // Initial state: One empty question with two empty options
  const [questions, setQuestions] = useState([
    { id: 1, text: '', options: ['', ''] }
  ]);

  // --- ANIMATIONS ---
  useGSAP(() => {
    // Entrance: Slide up
    gsap.from('.survey-container', { 
      y: 100, opacity: 0, duration: 0.8, ease: 'power4.out' 
    });
    // Stagger items
    gsap.from('.anim-item', { 
        y: 20, opacity: 0, stagger: 0.1, duration: 0.5, delay: 0.2 
    });
  }, { scope: containerRef });

  const scrollToBottom = () => {
    setTimeout(() => {
        const element = containerRef.current;
        if(element) {
            gsap.to(window, { 
                scrollTo: { y: document.body.scrollHeight, autoKill: false }, 
                duration: 1, 
                ease: 'power2.out' 
            });
        }
    }, 100);
  };

  // --- HANDLERS ---
  const addQuestion = () => {
    const newId = questions.length > 0 ? Math.max(...questions.map(q => q.id)) + 1 : 1;
    setQuestions([...questions, { id: newId, text: '', options: ['', ''] }]);
    setTimeout(() => { gsap.from(`#q-card-${newId}`, { x: -50, opacity: 0, duration: 0.5, ease: 'back.out(1.5)' }); }, 10);
    scrollToBottom();
  };

  const removeQuestion = (id) => {
    if (questions.length <= 1) return; 
    gsap.to(`#q-card-${id}`, { 
        x: 50, opacity: 0, height: 0, marginBottom: 0, padding: 0, duration: 0.3, 
        onComplete: () => { setQuestions(questions.filter(q => q.id !== id)); }
    });
  };

  const updateQuestionText = (id, text) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, text } : q));
  };

  const addOption = (qId) => {
    setQuestions(questions.map(q => {
        if (q.id === qId) return { ...q, options: [...q.options, ''] };
        return q;
    }));
  };

  const updateOptionText = (qId, optIndex, text) => {
    setQuestions(questions.map(q => {
        if (q.id === qId) {
            const newOpts = [...q.options];
            newOpts[optIndex] = text;
            return { ...q, options: newOpts };
        }
        return q;
    }));
  };

  const removeOption = (qId, optIndex) => {
    setQuestions(questions.map(q => {
        if (q.id === qId && q.options.length > 2) {
            const newOpts = q.options.filter((_, i) => i !== optIndex);
            return { ...q, options: newOpts };
        }
        return q;
    }));
  };

  // --- SUBMISSION ---
  const generateSlug = () => Math.random().toString(36).substring(2, 10);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!title.trim()) { alert("Please enter a survey title."); setLoading(false); return; }
    
    for (let q of questions) {
        const validOpts = q.options.filter(o => o.trim() !== '');
        if (!q.text.trim() || validOpts.length < 2) {
            alert("Every question must have text and at least 2 choices.");
            setLoading(false);
            return;
        }
    }

    const finalQuestions = questions.map(q => ({
        question: q.text,
        options: q.options.filter(o => o.trim() !== '')
    }));

    const initialAnswers = finalQuestions.map(q => 
        q.options.map(opt => ({ choice: opt, votes: 0 }))
    );

    const uniqueId = generateSlug();
    const uniqueUrl = `/survey/${uniqueId}`;
    const resultsUrl = `/survey/${uniqueId}/results`;

    const { error } = await supabase.from('surveys').insert([{
        title: title,
        questions: finalQuestions, 
        answers: initialAnswers,   
        unique_url: uniqueUrl,
        results_url: resultsUrl,
        is_public: isPublic, // USE STATE
        owner_id: session?.user?.id
    }]);


    if (error) {
      console.error('Error creating survey:', error);
      alert('Failed to create survey');
      setLoading(false);
    } else {
      setTimeout(() => {
          gsap.to('.survey-container', { 
            y: -100, opacity: 0, duration: 0.5, ease: 'power3.in',
            onComplete: () => navigate(resultsUrl)
          });
      }, 1500);
    }
  };

  return (
    <div ref={containerRef} className="w-full max-w-2xl z-20 pb-20">
      
      <div className="survey-container flex flex-col gap-8">
        
        {/* --- HEADER CARD --- */}
        <div className="card w-full bg-base-100 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-2 border-base-content rounded-[2rem] relative overflow-hidden">
            
            {/* Back Button */}
            <button 
                onClick={onBack} 
                className="absolute top-6 left-6 btn btn-circle btn-sm btn-ghost border-2 border-transparent hover:border-base-content hover:bg-transparent transition-all z-10 scale-200"
            >
                ←
            </button>
            
            <div className="card-body p-8 pt-12 text-center">
                <h2 className="anim-item text-primary font-black text-3xl tracking-tight mb-6 uppercase">Survey Builder</h2>
                
                {/* Title Input */}
                <div className="anim-item form-control w-full mb-6">
                    <input 
                        type="text" 
                        placeholder="Survey Title..." 
                        className="input input-lg w-full text-center font-black bg-base-100 border-2 border-base-content focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:-translate-y-1 transition-all rounded-xl text-2xl placeholder:opacity-40"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </div>

                {/* NEW: Visibility Toggle Row */}
                <div className="anim-item flex justify-center w-full">
                    <div className="flex items-center gap-4 bg-base-200/60 px-6 py-3 rounded-xl border-2 border-transparent hover:border-base-content/20 transition-all cursor-pointer" onClick={() => setIsPublic(!isPublic)}>
                        <span className={`text-xs font-black uppercase tracking-widest transition-opacity duration-300 ${!isPublic ? 'text-error opacity-100' : 'opacity-30'}`}>Private</span>
                        
                        <input 
                            type="checkbox" 
                            className="toggle toggle-lg toggle-success border-2 border-base-content hover:bg-base-100" 
                            checked={isPublic}
                            onChange={(e) => setIsPublic(e.target.checked)}
                        />
                        
                        <span className={`text-xs font-black uppercase tracking-widest transition-opacity duration-300 ${isPublic ? 'text-success opacity-100' : 'opacity-30'}`}>Public</span>
                    </div>
                </div>

            </div>
        </div>

        {/* --- DYNAMIC QUESTION CARDS --- */}
        {questions.map((q, qIndex) => (
            <div id={`q-card-${q.id}`} key={q.id} className="anim-item card w-full bg-base-100 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] border-2 border-base-content rounded-[1.5rem] group hover:-translate-y-1 transition-transform duration-300">
                <div className="card-body p-6">
                    
                    {/* Top Row */}
                    <div className="flex justify-between items-center mb-4">
                        <span className="badge badge-neutral font-mono text-xs font-bold p-3 uppercase tracking-widest border border-base-100">Question {qIndex + 1}</span>
                        {questions.length > 1 && (
                            <button onClick={() => removeQuestion(q.id)} className="btn btn-xs btn-square btn-outline border-error text-error hover:bg-error hover:text-white transition-colors">✕</button>
                        )}
                    </div>

                    {/* Question Input */}
                    <div className="form-control w-full mb-6">
                        <input 
                            type="text" 
                            placeholder="What would you like to ask?" 
                            className="input w-full font-bold text-lg bg-base-100 border-2 border-base-content focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:-translate-y-1 transition-all rounded-xl px-4"
                            value={q.text}
                            onChange={(e) => updateQuestionText(q.id, e.target.value)}
                        />
                    </div>

                    {/* Options List */}
                    <div className="flex flex-col gap-3 pl-4 border-l-4 border-base-200">
                        {q.options.map((opt, optIndex) => (
                            <div key={optIndex} className="flex gap-3 items-center group/opt">
                                <div className="w-3 h-3 rounded-full border-2 border-base-content bg-base-100 shrink-0"></div>
                                <input 
                                    type="text" 
                                    placeholder={`Option ${optIndex + 1}`}
                                    className="input input-sm w-full font-medium bg-transparent border-b-2 border-base-200 focus:border-secondary focus:outline-none rounded-none px-2 transition-colors placeholder:text-base-content/30"
                                    value={opt}
                                    onChange={(e) => updateOptionText(q.id, optIndex, e.target.value)}
                                />
                                {q.options.length > 2 && (
                                    <button onClick={() => removeOption(q.id, optIndex)} className="btn btn-xs btn-square btn-ghost text-base-content/30 hover:text-error opacity-0 group-hover/opt:opacity-100 transition-opacity">-</button>
                                )}
                            </div>
                        ))}
                        
                        <button 
                            onClick={() => addOption(q.id)} 
                            className="btn btn-xs btn-ghost w-fit mt-2 text-secondary normal-case font-bold opacity-60 hover:opacity-100 hover:bg-transparent"
                        >
                            + Add Option
                        </button>
                    </div>

                </div>
            </div>
        ))}

        {/* --- BOTTOM CONTROLS --- */}
        <div className="anim-item flex flex-col sm:flex-row gap-4 mt-4">
            <button 
                onClick={addQuestion}
                className="btn btn-outline border-2 border-dashed border-base-content/40 hover:border-primary hover:text-primary btn-lg rounded-xl flex-1 hover:bg-transparent normal-case font-bold"
            >
                + Add Question
            </button>
            
            <button 
                onClick={handleSubmit}
                className={`btn btn-primary btn-lg rounded-xl flex-1 font-black border-2 border-base-content shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all ${loading ? 'loading' : ''}`}
                disabled={loading}
            >
                {loading ? 'Building...' : 'Launch Survey 🚀'}
            </button>
        </div>

      </div>
    </div>
  )
}

export default SurveyMaker