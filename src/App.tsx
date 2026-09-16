import { BrowserRouter, Route, Routes } from 'react-router-dom'
import AppNav from './app/AppNav'
import UpdateToast from './app/UpdateToast'
import HomePage from './features/home/HomePage'
import RoutineListPage from './features/routines/RoutineListPage'
import RoutineFormPage from './features/routines/RoutineFormPage'
import ExerciseListPage from './features/exercises/ExerciseListPage'
import ExerciseFormPage from './features/exercises/ExerciseFormPage'
import ExerciseDetailPage from './features/exercises/ExerciseDetailPage'
import HistoryPage from './features/history/HistoryPage'
import HistoryEditPage from './features/history/HistoryEditPage'
import RecordSessionPage from './features/session/RecordSessionPage'
import ActiveSessionPage from './features/session/ActiveSessionPage'
import SettingsPage from './features/settings/SettingsPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/routines" element={<RoutineListPage />} />
        <Route path="/routines/new" element={<RoutineFormPage />} />
        <Route path="/routines/:id/edit" element={<RoutineFormPage />} />
        <Route path="/exercises" element={<ExerciseListPage />} />
        <Route path="/exercises/new" element={<ExerciseFormPage />} />
        <Route path="/exercises/:id" element={<ExerciseDetailPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/history/:id/edit" element={<HistoryEditPage />} />
        <Route path="/session" element={<RecordSessionPage />} />
        <Route path="/session/active" element={<ActiveSessionPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
      <AppNav />
      <UpdateToast />
    </BrowserRouter>
  )
}

export default App
