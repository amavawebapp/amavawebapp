import { Routes, Route } from 'react-router-dom'
import { RequireAuth } from './auth/require-auth'
import { AppServicesProvider } from './app-context'
import { LoginScreen } from './screens/LoginScreen'
import { HomeScreen } from './screens/HomeScreen'
import { ChildListScreen } from './screens/ChildListScreen'
import { AssessChildRoute } from './screens/AssessChildRoute'
import { ReportsScreen } from './screens/ReportsScreen'
import { PaperReportScreen } from './screens/PaperReportScreen'
import { SettingsScreen } from './screens/SettingsScreen'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/" element={<RequireAuth><AppServicesProvider><HomeScreen /></AppServicesProvider></RequireAuth>} />
      <Route path="/class/:classId" element={<RequireAuth><AppServicesProvider><ChildListScreen /></AppServicesProvider></RequireAuth>} />
      <Route path="/assess/:childId" element={<RequireAuth><AppServicesProvider><AssessChildRoute /></AppServicesProvider></RequireAuth>} />
      <Route path="/reports" element={<RequireAuth><AppServicesProvider><ReportsScreen /></AppServicesProvider></RequireAuth>} />
      <Route path="/report/print" element={<RequireAuth><AppServicesProvider><PaperReportScreen /></AppServicesProvider></RequireAuth>} />
      <Route path="/settings" element={<RequireAuth><AppServicesProvider><SettingsScreen /></AppServicesProvider></RequireAuth>} />
    </Routes>
  )
}
