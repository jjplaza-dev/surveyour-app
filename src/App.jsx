import { useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { supabase } from "./supabaseClient"
import NavBar from "./Components/NavBar";
import FrontPage from "./Pages/FrontPage";
import PollPage from "./Pages/PollPage";
import ResultsPage from "./Pages/ResultsPage";
import SurveyPage from "./Pages/SurveyPage";
import SurveyResultsPage from "./Pages/SurveyResultsPage";

const ResultsPagePlaceholder = () => (
  <div className="min-h-screen flex items-center justify-center bg-base-200">
    <h1 className="text-2xl font-bold text-primary">Fetching Results...</h1>
  </div>
);

function App() {

  useEffect(() => {
    const testConnection = async () => {
      const { data, error } = await supabase.from('polls').select('*').limit(1);
      if (error) console.error('Supabase Error:', error);
      else console.log('Supabase Connected! Connection verified.');
    };
    testConnection();
  }, []);

  return (
    <BrowserRouter>
      <NavBar />

      <div className="pt-20 min-h-screen">
        <Routes>
          <Route path="/" element={<FrontPage />} />
          <Route path="/poll/:id" element={<PollPage />} />
          <Route path="/poll/:id/results" element={<ResultsPage />} />
          <Route path="/survey/:id" element={<SurveyPage />} />
          <Route path="/survey/:id/results" element={<SurveyResultsPage />} />
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