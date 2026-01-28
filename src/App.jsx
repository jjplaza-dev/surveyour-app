import { useEffect, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { supabase } from "./supabaseClient";

// Components
import NavBar from "./Components/NavBar";

// Pages
import FrontPage from "./Pages/FrontPage";
import PollPage from "./Pages/PollPage";
import ResultsPage from "./Pages/ResultsPage";
import SurveyPage from "./Pages/SurveyPage";
import SurveyResultsPage from "./Pages/SurveyResultsPage"; // Ensure created
import ProfilePage from "./Pages/ProfilePage";

function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    // 1. Check active session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // 2. Listen for changes (login/logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <BrowserRouter>
      {/* Pass session to NavBar so we can show "Logout" or Avatar later */}
      <NavBar session={session} />
      
      <div className="pt-20 min-h-screen bg-base-200">
        <Routes>
          {/* Pass session to FrontPage so it knows if it should show Login or Maker */}
          <Route path="/" element={<FrontPage session={session} />} />
          
          <Route path="/poll/:id" element={<PollPage />} />
          <Route path="/poll/:id/results" element={<ResultsPage />} />
          
          <Route path="/survey/:id" element={<SurveyPage />} />
          <Route path="/survey/:id/results" element={<SurveyResultsPage />} />

          <Route path="/profile" element={<ProfilePage session={session} />} />

          <Route path="*" element={
              <div className="min-h-screen flex items-center justify-center text-3xl font-bold opacity-20">
                  404 - Lost in Space
              </div>
          } />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App