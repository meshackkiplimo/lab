import { Routes, Route } from 'react-router-dom';
import Dashboard from './pages/dashboard';
import AvailableLaptops from './pages/available-laptop.jsx';
import Applications from './pages/application.jsx';
import MpesaPayment from './pages/mpesapayment';
import Login from './pages/login';
import Home from './pages/home';
import About from './pages/about';
import Services from './pages/services';
import Contact from './pages/contact';
import AddLaptop from './pages/addLaptop.jsx';
import ProtectedRoute from './components/protectedroute';
import Layout from './components/layout';
import NotFound from './pages/notfound';
import Clearance from './pages/clearance';
import ManageInventory from './pages/Manage-Inventory';
import UserStats from './pages/userStats.jsx';
import ForgotPassword from './pages/forgotPassword.jsx';
import AdminAvailableLaptops from './pages/admin-available.jsx';
import AdminLaptopManager from './pages/admin-available.jsx';



export default function App() {
  return (
    <Routes>
      {/* 🔓 Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/services" element={<Services />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* 🔐 Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={['admin', 'student']}>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/available-laptops"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <Layout>
              <AvailableLaptops />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/available-laptops"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Layout>
              <AdminLaptopManager />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/applications/:laptopId"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <Layout>
              <Applications />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/add-laptop"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Layout>
              <AddLaptop />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/mpesa-payment"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <Layout>
              <MpesaPayment />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/clearance"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <Layout>
              <Clearance />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/user-stats"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <Layout>
              <UserStats />
            </Layout>
          </ProtectedRoute>
        }
      />
       <Route
        path="/Manage-Inventory"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Layout>
              <ManageInventory />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/clearance"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <Layout>
              <Clearance />
            </Layout>
          </ProtectedRoute>
        }
      />
       

      {/* ❌ Catch-All */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
