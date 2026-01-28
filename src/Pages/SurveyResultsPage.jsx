import React, { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

const SurveyResultsPage = () => {
  const { id } = useParams();
  const containerRef = useRef(null);
  
  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);


  useEffect(() => {
    let channel;
    const fetchAndSubscribe = async () => {

      const path = `/survey/${id}/results`;
      
      const { data, error } = await supabase
        .from('surveys')
        .select('*')
        .eq('results_url', path)
        .single();

      if (error) {
        console.error('Error fetching results:', error);
      } else {
        setSurvey(data);
      }
      setLoading(false);

      if (data) {
        channel = supabase
          .channel('realtime-survey')
          .on('postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'surveys', filter: `id=eq.${data.id}` },
            (payload) => {
              setSurvey(payload.new);
              gsap.fromTo('.survey-result-card', { opacity: 0.8 }, { opacity: 1, duration: 0.3 });
            }
          )
          .subscribe();
      }
    };

    fetchAndSubscribe();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, [id]);

  useGSAP(() => {
    if (loading || !survey) return;
    
    gsap.from('.header-anim', { y: -20, opacity: 0, stagger: 0.1, duration: 0.8, ease: 'power3.out' });
    gsap.from('.survey-result-card', { 
        y: 50, opacity: 0, stagger: 0.15, duration: 0.8, ease: 'back.out(1.2)', delay: 0.2 
    });
  }, [loading]);

  const copyLink = () => {
    const url = `${window.location.origin}${survey.unique_url}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
    </div>
  );

  if (!survey) return <div className="text-center p-10 font-bold opacity-50">Survey Not Found</div>;

  return (
    <div ref={containerRef} className="min-h-screen p-4 sm:p-8 bg-base-200 relative overflow-x-hidden">
        
        {/* Decorative BG */}
        <div className="absolute top-20 right-10 w-32 h-32 border-4 border-primary/20 rounded-full blur-xl pointer-events-none"></div>

        <div className="w-full max-w-3xl mx-auto flex flex-col gap-8 pb-20">
                     
            <div className="text-center mb-4">
                <div className="header-anim badge badge-secondary badge-outline font-black tracking-widest mb-4 p-3 border-2 bg-base-100">
                    SURVEY RESULTS
                </div>
                <h1 className="header-anim text-4xl sm:text-5xl font-black text-base-content mb-2 leading-tight">
                    {survey.title}
                </h1>
        
                <button 
                    onClick={copyLink}
                    className="header-anim btn btn-sm btn-ghost gap-2 opacity-60 hover:opacity-100 mt-2 font-bold"
                >
                    {copied ? '✅ Link Copied' : '🔗 Share Survey Link'}
                </button>
            </div>

            {survey.questions.map((q, qIndex) => {
           
                const qAnswers = survey.answers[qIndex];
                const totalVotes = qAnswers.reduce((acc, cur) => acc + (cur.votes || 0), 0);

                return (
                    <div key={qIndex} className="survey-result-card card w-full bg-base-100 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-2 border-base-content rounded-2xl overflow-hidden">
                        <div className="card-body p-6 sm:p-8">
                            
                            <h2 className="text-lg font-bold opacity-50 font-mono mb-1 uppercase tracking-wider">
                                Question {qIndex + 1}
                            </h2>
                            <h3 className="text-2xl font-black mb-6">{q.question}</h3>

                            <div className="flex flex-col gap-4">
                                {qAnswers
                                    .sort((a, b) => (b.votes || 0) - (a.votes || 0)) // Sort by votes
                                    .map((ans, aIndex) => {
                                        const percent = totalVotes === 0 ? 0 : Math.round((ans.votes / totalVotes) * 100);
                                        const isWinner = aIndex === 0 && totalVotes > 0;

                                        return (
                                            <div key={aIndex} className="w-full">
                                                <div className="flex justify-between items-end mb-1 px-1">
                                                    <span className="font-bold flex items-center gap-2">
                                                        {isWinner && <span>👑</span>}
                                                        {ans.choice}
                                                    </span>
                                                    <span className="font-black">{percent}% <span className="text-xs opacity-40 font-mono font-normal">({ans.votes})</span></span>
                                                </div>
                                                <div className="h-4 w-full bg-base-200 border border-base-content/20 rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full ${isWinner ? 'bg-primary' : 'bg-base-content/40'} transition-all duration-1000`}
                                                        style={{ width: `${percent}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        )
                                    })
                                }
                            </div>
                            
                            <div className="text-right text-xs font-mono opacity-30 mt-2">
                                Total: {totalVotes}
                            </div>
                        </div>
                    </div>
                )
            })}

            <div className="text-center mt-8">
                <Link to="/" className="btn btn-outline border-2 font-bold hover:bg-base-content hover:text-base-100">
                    ← Back to Home
                </Link>
            </div>

        </div>
    </div>
  )
}

export default SurveyResultsPage