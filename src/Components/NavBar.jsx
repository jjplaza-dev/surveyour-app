import React from 'react'
import { Link } from 'react-router-dom'

const NavBar = () => {
  return (
    // Fixed Header: 
    // - h-20: Sets height
    // - border-b-2: Adds the "Lofi" bottom border
    // - bg-base-100: Uses theme background color (usually white)
    // - z-50: Keeps it above everything
    <nav className="fixed top-0 left-0 w-full h-20 z-50 bg-base-100 border-b-2 border-black/10">
      
      {/* Container: 
          - h-full: Fills the nav height
          - items-center: Vertically centers content
          - justify-center (default): Centers logo on mobile
          - lg:justify-start: Aligns logo left on desktop
      */}
      <div className="container mx-auto px-4 h-full flex items-center justify-center lg:justify-start">
        
        <Link 
            to="/" 
            className="flex items-center gap-3 hover:scale-105 transition-transform duration-200 group"
        >
          {/* Logo Image */}
          {/* Note: Files in 'public' are referenced from root '/'. 
              If the file is in 'src/assets', you would import it. */}
          <img 
            src="/surveyour-logo.png" 
            alt="Surveyour Logo" 
            className="h-10 w-10 object-contain"
          />
          
          {/* Logo Text */}
          <span className="text-2xl font-black tracking-tighter text-primary group-hover:text-primary-focus transition-colors">
            Surveyour
          </span>
        </Link>

      </div>
    </nav>
  )
}

export default NavBar