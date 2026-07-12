import { Routes, Route } from 'react-router-dom'
import { RequireAuth } from './auth/require-auth'
import { AppServicesProvider } from './app-context'
import { LoginScreen } from './screens/LoginScreen'
import { HomeScreen } from './screens/HomeScreen'
import { ChildListScreen } from './screens/ChildListScreen'
import { ChildProfileScreen } from './screens/ChildProfileScreen'
import { AssessChildRoute } from './screens/AssessChildRoute'
import { ReportsScreen } from './screens/ReportsScreen'
import { PaperReportScreen } from './screens/PaperReportScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { SettingsProgrammes } from './screens/settings/SettingsProgrammes'
import { SettingsAreas } from './screens/settings/SettingsAreas'
import { SettingsScale } from './screens/settings/SettingsScale'
import { SettingsFacilitators } from './screens/settings/SettingsFacilitators'
import { SettingsOffline } from './screens/settings/SettingsOffline'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/" element={<RequireAuth><AppServicesProvider><HomeScreen /></AppServicesProvider></RequireAuth>} />
      <Route path="/class/:classId" element={<RequireAuth><AppServicesProvider><ChildListScreen /></AppServicesProvider></RequireAuth>} />
      <Route path="/child/:childId" element={<RequireAuth><AppServicesProvider><ChildProfileScreen /></AppServicesProvider></RequireAuth>} />
      <Route path="/assess/:childId" element={<RequireAuth><AppServicesProvider><AssessChildRoute /></AppServicesProvider></RequireAuth>} />
      <Route path="/reports" element={<RequireAuth><AppServicesProvider><ReportsScreen /></AppServicesProvider></RequireAuth>} />
      <Route path="/report/print" element={<RequireAuth><AppServicesProvider><PaperReportScreen /></AppServicesProvider></RequireAuth>} />
      <Route path="/settings" element={<RequireAuth><AppServicesProvider><SettingsScreen /></AppServicesProvider></RequireAuth>} />
      <Route path="/settings/programmes" element={<RequireAuth><AppServicesProvider><SettingsProgrammes /></AppServicesProvider></RequireAuth>} />
      <Route path="/settings/areas" element={<RequireAuth><AppServicesProvider><SettingsAreas /></AppServicesProvider></RequireAuth>} />
      <Route path="/settings/scale" element={<RequireAuth><AppServicesProvider><SettingsScale /></AppServicesProvider></RequireAuth>} />
      <Route path="/settings/facilitators" element={<RequireAuth><AppServicesProvider><SettingsFacilitators /></AppServicesProvider></RequireAuth>} />
      <Route path="/settings/offline" element={<RequireAuth><AppServicesProvider><SettingsOffline /></AppServicesProvider></RequireAuth>} />
    </Routes>
  )
}
