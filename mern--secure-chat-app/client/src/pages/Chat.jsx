import React, { useState } from 'react';
import ChatList from '../components/ChatList';
import ChatWindow from '../components/ChatWindow';

export default function ChatPage() {
  const [selected, setSelected] = useState(null);
  return (
    <div style={{ display:'flex', height: '80vh' }}>
      <ChatList onSelect={setSelected}/>
      {selected ? <ChatWindow chat={selected}/> : <div style={{padding:16}}>Select a chat</div>}
    </div>
  );
}
