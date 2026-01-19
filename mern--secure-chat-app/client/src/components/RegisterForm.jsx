import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function RegisterForm() {
  const { register } = useAuth();
  const [form, setForm] = useState({ name:'', email:'', password:'' });
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault(); setErr('');
    try { await register(form); } 
    catch (e) { setErr(e.response?.data?.message || 'Register failed'); }
  };

  return (
    <form onSubmit={submit} style={{maxWidth:320}}>
      <h3>Register</h3>
      <input placeholder="Name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})}/>
      <input placeholder="Email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})}/>
      <input placeholder="Password" type="password" value={form.password} onChange={e=>setForm({...form, password:e.target.value})}/>
      <button type="submit">Create account</button>
      {err && <p style={{color:'red'}}>{err}</p>}
    </form>
  );
}
