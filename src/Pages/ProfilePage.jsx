import React, { useEffect, useState, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { Link, useNavigate } from 'react-router-dom' 
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { BarChart3, Copy, ExternalLink, Calendar, Smile, LogOut } from 'lucide-react' 

const ProfilePage = ({ session }) => {
  const navigate = useNavigate(); 
  const containerRef = useRef(null);
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserSurveys = async () => {
      if (!session?.user) return;

      const { data, error } = await supabase
        .from('surveys')
        .select('*')
        .eq('owner_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) console.error('Error fetching surveys:', error);
      else setSurveys(data);
      
      setLoading(false);
    };

    fetchUserSurveys();
  }, [session]);

  // --- ANIMATIONS ---
  useGSAP(() => {
    if (loading) return;
    gsap.from('.profile-header', { y: -20, opacity: 0, duration: 0.6, ease: 'power2.out' });
    gsap.from('.survey-item', { 
        y: 20, opacity: 0, stagger: 0.1, duration: 0.5, ease: 'back.out(1.2)' 
    });
  }, { scope: containerRef, dependencies: [loading] });

  // --- ACTIONS ---

  // 1. Logout Handler
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Error logging out:', error);
    } else {
        navigate('/'); // Redirect to Home
    }
  };

  const getVoteCount = (answers) => {
    if (!answers) return 0;
    return answers.flat().reduce((acc, curr) => acc + (curr.votes || 0), 0);
  };

  const copyLink = (e, url) => {
    e.preventDefault();
    navigator.clipboard.writeText(`${window.location.origin}${url}`);
    
    gsap.fromTo(e.currentTarget, 
        { scale: 1.2, rotate: 10 }, 
        { scale: 1, rotate: 0, duration: 0.2 }
    );
  };

  if (!session) return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
        <div className="text-center">
            <h2 className="text-2xl font-black mb-4">Please Login</h2>
            <Link to="/" className="btn btn-primary btn-wide font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">Go Home</Link>
        </div>
    </div>
  );

  return (
    <div ref={containerRef} className="min-h-screen p-4 sm:p-8 pt-24 bg-base-200 relative overflow-hidden">
        
        {/* Background Decorations */}
        <div className="absolute top-20 right-20 w-32 h-32 border-4 border-base-content/10 rounded-full border-dashed animate-spin-slow"></div>
        
        <div className="max-w-5xl mx-auto">
            
            {/* Header */}
            <div className="profile-header flex flex-col sm:flex-row justify-between items-end mb-12 border-b-2 border-base-content/20 pb-6 gap-6">
                
                {/* Left: Info */}
                <div>
                    <h1 className="text-4xl font-black text-primary tracking-tight">MY DASHBOARD</h1>
                    <p className="text-base-content/60 font-bold font-mono mt-2">
                        Welcome back <Smile size={16} className="inline mb-1 mr-1 text-black" /> 
                    </p>
                    <div className="text-xs font-mono opacity-40 mt-1">{session.user.email}</div>
                </div>

                {/* Right: Controls */}
                <div className="flex items-center gap-4">
                    
                    {/* Logout Button */}
                    <button 
                        onClick={handleLogout}
                        className="btn btn-ghost btn-sm border-2 border-transparent hover:border-error hover:bg-error/10 text-error font-bold gap-2 transition-all"
                    >
                        <LogOut size={16} strokeWidth={3} />
                        <span className="hidden sm:inline">Sign Out</span>
                    </button>

                    {/* Stats Card */}
                    <div className="stats bg-base-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-base-content rounded-xl overflow-visible">
                        <div className="stat p-4">
                            <div className="stat-title text-xs font-black uppercase tracking-widest opacity-50">Total Surveys</div>
                            <div className="stat-value text-2xl font-black">{surveys.length}</div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex justify-center"><span className="loading loading-spinner loading-lg"></span></div>
            ) : surveys.length === 0 ? (
                <div className="text-center py-20 opacity-50 border-2 border-dashed border-base-content rounded-3xl">
                    <h2 className="text-2xl font-bold mb-4">No surveys yet.</h2>
                    <Link to="/" className="btn btn-outline">Create your first one</Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {surveys.map((survey) => (
                        <Link 
                            to={survey.results_url} 
                            key={survey.id} 
                            className="survey-item group card bg-base-100 shadow-sm hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-2 border-base-content rounded-2xl transition-all duration-200 hover:-translate-y-1"
                        >
                            <div className="card-body p-6">
                                {/* Top Badge Row */}
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`badge font-bold border-2 ${survey.is_public ? 'badge-success text-base-100' : 'badge-ghost opacity-50'}`}>
                                        {survey.is_public ? 'PUBLIC' : 'PRIVATE'}
                                    </div>
                                    <button 
                                        onClick={(e) => copyLink(e, survey.unique_url)}
                                        className="btn btn-xs btn-square btn-ghost hover:bg-base-200"
                                        title="Copy Link"
                                    >
                                        <Copy size={14} />
                                    </button>
                                </div>

                                {/* Title */}
                                <h2 className="card-title text-xl font-black mb-1 line-clamp-2 leading-tight">
                                    {survey.title}
                                </h2>
                                <p className="text-xs font-mono opacity-40 mb-6 flex items-center gap-1">
                                    <Calendar size={10} />
                                    {new Date(survey.created_at).toLocaleDateString()}
                                </p>

                                {/* Footer Stats */}
                                <div className="mt-auto flex justify-between items-center pt-4 border-t-2 border-base-100 group-hover:border-base-200 transition-colors">
                                    <div className="flex items-center gap-2 text-primary font-black">
                                        <BarChart3 size={18} />
                                        <span>{getVoteCount(survey.answers)} Votes</span>
                                    </div>
                                    <ExternalLink size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    </div>
  )
}

export default ProfilePage