import {
  BrowserRouter,
  Route,
  Routes,
} from 'react-router-dom'
import AdminRoute from './components/AdminRoute'
import ProtectedRoute from './components/ProtectedRoute'
import MainLayout from './layouts/MainLayout'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Users from './pages/Users'
import Profile from './pages/Profile'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Dashboard />} />
            
            <Route path="/profile" element={<Profile />} />

            <Route element={<AdminRoute />}>
              <Route
                path="/users"
                element={<Users />}
              />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App