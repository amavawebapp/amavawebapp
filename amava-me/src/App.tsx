import { Routes, Route } from 'react-router-dom'
import { RequireAuth } from './auth/require-auth'
import { AppServicesProvider } from './app-context'
import { LoginScreen } from './screens/LoginScreen'
import { HomeScreen } from './screens/HomeScreen'
import { ChildListScreen } from './screens/ChildListScreen'
import { AssessChildRoute } from './screens/AssessChildRoute'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/" element={<RequireAuth><AppServicesProvider><HomeScreen /></AppServicesProvider></RequireAuth>} />
      <Route path="/class/:classId" element={<RequireAuth><AppServicesProvider><ChildListScreen /></AppServicesProvider></RequireAuth>} />
      <Route path="/assess/:childId" element={<RequireAuth><AppServicesProvider><AssessChildRoute /></AppServicesProvider></RequireAuth>} />
    </Routes>
  )
}
