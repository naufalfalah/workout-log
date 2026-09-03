import { BrowserRouter, Route, Routes } from 'react-router-dom'
import AppNav from './app/AppNav'
import UpdateToast from './app/UpdateToast'
import HomePage from './features/home/HomePage'
import HistoryPage from './features/history/HistoryPage'
import RecordSessionPage from './features/session/RecordSessionPage'
import ActiveSessionPage from './features/session/ActiveSessionPage'
import SettingsPage from './features/settings/SettingsPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/history" element={<HistoryPage />} />
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
