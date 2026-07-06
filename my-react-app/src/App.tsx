import { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import Layout from './components/Layout';

const Analytics = lazy(() => import('./pages/Analytics'));
const Chat = lazy(() => import('./pages/Chat'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Login = lazy(() => import('./pages/Login'));
const Meals = lazy(() => import('./pages/Meals'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Register = lazy(() => import('./pages/Register'));
const Settings = lazy(() => import('./pages/Settings'));
const Workouts = lazy(() => import('./pages/Workouts'));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="p-4">Loading...</div>}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/meals" element={<Meals />} />
            <Route path="/workouts" element={<Workouts />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
