import React, { useEffect, useState } from 'react';
import api from '../api/axios';

export default function ChatList({ onSelect }) {
  const [chats, setChats] = useState([]);
  useEffect(() => { (async () => {
    const { data } = await api.get('/chats'); setChats(data.chats);
  })(); }, []);

  return (
    <div style={{ borderRight: '1px solid #ddd', width: 280, padding: 8 }}>
      <h4>Chats</h4>
      {chats.map(c => (
        <div key={c._id} style={{cursor:'pointer', padding:'6px 4px'}} onClick={()=>onSelect(c)}>
          {c.isGroup ? (c.name || 'Group') : 'Direct Chat'} — {c._id}
        </div>
      ))}
    </div>
  );
}
