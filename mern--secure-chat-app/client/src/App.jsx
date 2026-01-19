import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import ChatPage from './pages/Chat';

function Nav() {
  const { user, logout } = useAuth();
  return (
    <div style={{display:'flex', gap:8, padding:8, borderBottom:'1px solid #ddd'}}>
      <Link to="/">Home</Link>
      <Link to="/chat">Chat</Link>
      <span style={{flex:1}}/>
      {user ? (<>
        <span>{user.name} ({user.roles.join(',')})</span>
        <button onClick={logout}>Logout</button>
      </>) : (<>
        <Link to="/login">Login</Link>
        <Link to="/register">Register</Link>
      </>)}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Nav/>
        <div style={{ padding: 16 }}>
          <Routes>
            <Route path="/" element={<Home/>}/>
            <Route path="/chat" element={<ProtectedRoute><ChatPage/></ProtectedRoute>} />
            <Route path="/login" element={<LoginForm/>}/>
            <Route path="/register" element={<RegisterForm/>}/>
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
