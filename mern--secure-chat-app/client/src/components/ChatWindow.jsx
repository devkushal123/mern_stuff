import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import InfiniteScroll from 'react-infinite-scroll-component';
import api from '../api/axios';
import { getAccessToken } from '../api/axios';

export default function ChatWindow({ chat }) {
  const [messages, setMessages] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [text, setText] = useState('');
  const socketRef = useRef(null);

  const apiBase = process.env.REACT_APP_API;

  useEffect(() => { (async () => {
    const { data } = await api.get('/messages', { params: { chatId: chat._id, limit: 20 } });
    setMessages(data.items); setNextCursor(data.nextCursor); setHasMore(!!data.nextCursor);
  })(); }, [chat._id]);

  useEffect(() => {
    const socket = io(apiBase, { auth: { token: getAccessToken() } });
    socketRef.current = socket;
    socket.on('connect', () => { 
      socket.emit('joinChat', { chatId: chat._id }); 
    });
    socket.on('newMessage', (m) => { if (m.chatId === chat._id) setMessages(prev => [...prev, m]); });
    socket.on('notification', (n) => { /* Optional: show toast */ });
    return () => { socket.emit('leaveChat', { chatId: chat._id }); socket.disconnect(); };
  }, [chat._id, apiBase]);

  const fetchMore = async () => {
    if (!nextCursor) { 
      setHasMore(false); return; 
    }
    const { data } = await api.get('/messages', { params: { chatId: chat._id, limit: 20, cursor: nextCursor } });
    setMessages(prev => [...data.items, ...prev]); setNextCursor(data.nextCursor); setHasMore(!!data.nextCursor);
  };

  const sendMsg = async () => {
    if (!text.trim()) return;
    await api.post('/messages', { chatId: chat._id, content: text.trim() });
    setText('');
  };

  return (
    <div style={{ flex: 1, padding: 8, display:'flex', flexDirection:'column' }}>
      <h4>Chat: {chat._id}</h4>
      <div id="scrollableDiv" style={{ height: 400, overflow: 'auto', border: '1px solid #ddd', padding: 8 }}>
        <InfiniteScroll
          dataLength={messages.length}
          next={fetchMore}
          hasMore={hasMore}
          inverse={true}
          scrollableTarget="scrollableDiv"
          loader={<p>Loading...</p>}
          style={{ display: 'flex', flexDirection: 'column-reverse' }}
        >
          {messages.map((m, idx) => (
            <div key={idx} style={{ margin: '6px 0' }}>
              <b>{typeof m.sender === 'string' ? m.sender.slice(-4) : 'user'}:</b> {m.content}
              <div style={{fontSize:12, color:'#888'}}>{new Date(m.createdAt || Date.now()).toLocaleString()}</div>
            </div>
          ))}
        </InfiniteScroll>
      </div>
      <div style={{ display:'flex', gap: 8, marginTop: 8 }}>
        <input style={{ flex:1 }} value={text} onChange={(e)=>setText(e.target.value)} placeholder="Type message..."/>
        <button onClick={sendMsg}>Send</button>
      </div>
    </div>
  );
}
