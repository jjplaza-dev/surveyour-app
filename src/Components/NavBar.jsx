import React from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { LogIn, User } from 'lucide-react'

const NavBar = ({ session }) => {

  // Direct login handler for the Navbar button
  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) alert(error.message);
  };

  return (
    <nav className="fixed top-0 left-0 w-full h-20 z-50 bg-base-100/90 backdrop-blur-md border-b-2 border-base-content/10 transition-all duration-300">
      
      <div className="container mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
        
        {/* --- LEFT: LOGO --- */}
        <Link 
            to="/" 
            className="group flex items-center gap-3 relative"
        >
          <div className="relative">
            <div className="relative bg-base-100 border-2 border-black rounded-lg p-1 z-10">
                <img 
                    src="/surveyour-logo.png" 
                    alt="Surveyour" 
                    className="h-8 w-8 object-contain"
                />
            </div>
          </div>
          <span className="text-2xl font-black tracking-tighter text-base-content relative hidden sm:block">
            Surveyour
          </span>
        </Link>

        {/* --- RIGHT: PROFILE TAB / LOGIN ACTION --- */}
        <div className="flex items-center">
            
            {session ? (
               /* STATE: LOGGED IN -> User Profile Tab */
               <Link 
                 to="/profile" 
                 className="group flex items-center gap-3 p-1 pr-4 rounded-full border-2 border-transparent hover:border-black hover:bg-cyan-50 transition-all duration-200"
               >
                  {/* Avatar Circle with Teal Pop */}
                  <div className="avatar placeholder">
                      <div className="bg-black text-white rounded-full w-10 h-10 border-2 border-black shadow-[3px_3px_0px_0px_#2dd4bf] transition-all flex justify-center items-center">
                          <span className="text-sm font-black">{session.user.email[0].toUpperCase()}</span>
                      </div>
                  </div>
                  
                  {/* Text Label */}
                  <div className="flex flex-col items-start leading-none">
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">My Space</span>
                      <span className="text-sm font-black text-base-content">Dashboard</span>
                  </div>
               </Link>
            ) : (
               /* STATE: LOGGED OUT -> Login Button */
               <button 
                 onClick={handleLogin}
                 className="group relative btn btn-sm h-11 px-6 rounded-full bg-black text-white border-2 border-transparent hover:bg-gray-900 hover:border-black transition-all"
               >
                  {/* Pink Pop Shadow for Login */}
                  <div className="absolute inset-0 rounded-full border-2 border-black shadow-[4px_4px_0px_0px_#f472b6] group-hover:shadow-[2px_2px_0px_0px_#f472b6] group-hover:translate-x-[1px] group-hover:translate-y-[1px] transition-all pointer-events-none"></div>
                  
                  <div className="relative flex items-center gap-2 z-10">
                      <LogIn size={16} strokeWidth={3} />
                      <span className="font-black tracking-wide">LOGIN</span>
                  </div>
               </button>
            )}

        </div>

      </div>
    </nav>
  )
}

export default NavBar