import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LoginForm() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email:'', password:'' });
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault(); setErr('');
    try { 
      await login(form.email, form.password); 
    } 
    catch (e) { setErr(e.response?.data?.message || 'Login failed'); }
  };

  return (
    <form onSubmit={submit} style={{maxWidth:320}}>
      <h3>Login</h3>
      <input placeholder="Email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})}/>
      <input placeholder="Password" type="password" value={form.password} onChange={e=>setForm({...form, password:e.target.value})}/>
      <button type="submit">Login</button>
      {err && <p style={{color:'red'}}>{err}</p>}
    </form>
  );
}
