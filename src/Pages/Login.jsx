import React, { useState } from 'react'
import { supabase } from '../supabaseClient'
import gsap from 'gsap'

const Login = () => {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) {
      alert(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="card w-full max-w-sm bg-base-100 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-2 border-base-content rounded-[2rem]">
      <div className="card-body items-center text-center p-8">
        <h2 className="text-2xl font-black mb-4">Login to Save</h2>
        <p className="text-sm font-bold opacity-60 mb-6">
          Track your surveys and see results anytime.
        </p>
        
        <button 
          onClick={handleLogin}
          disabled={loading}
          className="btn btn-neutral btn-wide border-2 border-base-content shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none transition-all rounded-xl"
        >
          {loading ? 'Connecting...' : (
            <div className="flex gap-2 items-center">
               <span>G</span> Continue with Google
            </div>
          )}
        </button>
      </div>
    </div>
  )
}

export default Login