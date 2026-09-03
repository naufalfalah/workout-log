import { BrowserRouter, Route, Routes } from 'react-router-dom'
import AppNav from './app/AppNav'
import UpdateToast from './app/UpdateToast'
import HomePage from './features/home/HomePage'
import ActiveSessionPage from './features/session/ActiveSessionPage'
import RecordSessionPage from './features/session/RecordSessionPage'
import SettingsPage from './features/settings/SettingsPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/session" element={<ActiveSessionPage />} />
        <Route path="/session/active" element={<RecordSessionPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
      <AppNav />
      <UpdateToast />
    </BrowserRouter>
  )
}

export default App
