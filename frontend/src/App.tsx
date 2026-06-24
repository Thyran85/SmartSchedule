import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ClassesPage from './pages/ClassesPage';
import TeachersPage from './pages/TeachersPage';
import RoomsPage from './pages/RoomsPage';
import SubjectsPage from './pages/SubjectsPage';
import SchedulePage from './pages/SchedulePage';
import ScheduleViewPage from './pages/ScheduleViewPage';
import ConstraintsPage from './pages/ConstraintsPage';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/classes" element={<ClassesPage />} />
        <Route path="/enseignants" element={<TeachersPage />} />
        <Route path="/salles" element={<RoomsPage />} />
        <Route path="/matieres" element={<SubjectsPage />} />
        <Route path="/edt" element={<SchedulePage />} />
        <Route path="/edt/:type/:id" element={<ScheduleViewPage />} />
        <Route path="/contraintes" element={<ConstraintsPage />} />
      </Routes>
    </Layout>
  );
}
