import { Routes, Route, Outlet, useNavigate } from 'react-router-dom';
import Nav from './components/Nav';
import StudiesList from './pages/StudiesList';
import NewStudy from './pages/NewStudy';
import StudyBuilder from './pages/StudyBuilder';
import StudyResults from './pages/StudyResults';
import ParticipantLanding from './pages/ParticipantLanding';
import ParticipantExercise from './pages/ParticipantExercise';
import ParticipantDone from './pages/ParticipantDone';
import { useTitle } from './hooks/useTitle';
import './styles/global.css';

function ResearcherLayout() {
  return (
    <>
      <Nav />
      <main>
        <Outlet />
      </main>
    </>
  );
}

function NotFound() {
  useTitle('Not Found');
  const navigate = useNavigate();
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      padding: 24,
      textAlign: 'center',
    }}>
      <p style={{ fontSize: 13, color: '#9ca3af', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>404</p>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827' }}>Page not found</h1>
      <p style={{ fontSize: 15, color: '#6b7280' }}>The page you're looking for doesn't exist.</p>
      <button
        onClick={() => navigate('/')}
        style={{
          marginTop: 8, padding: '9px 20px', fontSize: 14, fontWeight: 500,
          color: '#fff', background: '#111827', borderRadius: 7,
        }}
      >
        Go to dashboard
      </button>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<ResearcherLayout />}>
        <Route path="/" element={<StudiesList />} />
        <Route path="/studies/new" element={<NewStudy />} />
        <Route path="/studies/:id/edit" element={<StudyBuilder />} />
        <Route path="/studies/:id/results" element={<StudyResults />} />
      </Route>
      <Route path="/s/:token" element={<ParticipantLanding />} />
      <Route path="/s/:token/exercise" element={<ParticipantExercise />} />
      <Route path="/s/:token/done" element={<ParticipantDone />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
