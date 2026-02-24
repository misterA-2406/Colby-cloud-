/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CustomerApp from './pages/CustomerApp';
import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import { Toaster } from 'react-hot-toast';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<CustomerApp />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
      </Routes>
      <Toaster position="bottom-center" />
    </Router>
  );
}
