import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import Login             from './pages/Login';
import Register          from './pages/Register';
import Dashboard         from './pages/Dashboard';
import ProviderList      from './pages/ProviderList';
import ProviderProfile   from './pages/ProviderProfile';
import PostJob           from './pages/PostJob';
import MyJobs            from './pages/MyJobs';
import AssignedJobs      from './pages/AssignedJobs';
import MyProfile         from './pages/MyProfile';
import AdminDashboard    from './pages/admin/AdminDashboard';
import ManageUsers       from './pages/admin/ManageUsers';
import ManageProviders   from './pages/admin/ManageProviders';
import AdminJobs         from './pages/admin/AdminJobs';
import ManageCategories  from './pages/admin/ManageCategories';
import ManageLocations   from './pages/admin/ManageLocations';

// ── Protected route ────────────────────────────────────────────
const Protected = ({ children, roles }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
};

// ── Root redirect ──────────────────────────────────────────────
const Root = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/"         element={<Root />} />
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* All authenticated users */}
          <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
          <Route path="/profile"   element={<Protected><MyProfile /></Protected>} />

          {/* Customer */}
          <Route path="/providers"     element={<Protected><ProviderList /></Protected>} />
          <Route path="/providers/:id" element={<Protected><ProviderProfile /></Protected>} />
          <Route path="/jobs/post"     element={<Protected roles={['customer']}><PostJob /></Protected>} />
          <Route path="/jobs/mine"     element={<Protected roles={['customer']}><MyJobs /></Protected>} />

          {/* Provider */}
          <Route path="/jobs/assigned" element={<Protected roles={['provider']}><AssignedJobs /></Protected>} />

          {/* Admin */}
          <Route path="/admin"              element={<Protected roles={['admin']}><AdminDashboard /></Protected>} />
          <Route path="/admin/users"        element={<Protected roles={['admin']}><ManageUsers /></Protected>} />
          <Route path="/admin/providers"    element={<Protected roles={['admin']}><ManageProviders /></Protected>} />
          <Route path="/admin/jobs"         element={<Protected roles={['admin']}><AdminJobs /></Protected>} />
          <Route path="/admin/categories"   element={<Protected roles={['admin']}><ManageCategories /></Protected>} />
          <Route path="/admin/locations"    element={<Protected roles={['admin']}><ManageLocations /></Protected>} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
