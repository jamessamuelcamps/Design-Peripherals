import { Routes, Route } from 'react-router-dom';
import Nav from './components/Nav';
import StudiesList from './pages/StudiesList';
import NewStudy from './pages/NewStudy';
import StudyBuilder from './pages/StudyBuilder';
import StudyResults from './pages/StudyResults';
import './styles/global.css';

export default function App() {
  return (
    <>
      <Nav />
      <main>
        <Routes>
          <Route path="/" element={<StudiesList />} />
          <Route path="/studies/new" element={<NewStudy />} />
          <Route path="/studies/:id/edit" element={<StudyBuilder />} />
          <Route path="/studies/:id/results" element={<StudyResults />} />
        </Routes>
      </main>
    </>
  );
}
