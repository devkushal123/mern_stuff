
import { useEffect, useState } from 'react';
import { listItems, createItem, updateItem, deleteItem } from './api';

export default function App() {
  const [items, setItems] = useState([]);
  const [name, setName] = useState('');

  async function load() {
    const data = await listItems();
    setItems(data.items || []);
  }

  useEffect(() => { load(); }, []);

  async function handleAdd(e) {
    e.preventDefault();
    if (!name.trim()) return;
    await createItem({ name });
    setName('');
    await load();
  }

  async function toggle(id, completed) {
    await updateItem(id, { completed: !completed });
    await load();
  }

  async function remove(id) {
    await deleteItem(id);
    await load();
  }

  return (
    <main style={{ maxWidth: 640, margin: '2rem auto', fontFamily: 'system-ui' }}>
      <h1>MERN CRUD</h1>

      <form onSubmit={handleAdd} style={{ marginBottom: 16 }}>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Item name"
          style={{ padding: 8, width: '70%' }}
        />
        <button type="submit" style={{ padding: 8, marginLeft: 8 }}>Add</button>
      </form>

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {items.map(i => (
          <li key={i._id} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 8,
            borderBottom: '1px solid #eee'
          }}>
            <span>
              <input type="checkbox" checked={!!i.completed} onChange={() => toggle(i._id, i.completed)} />
              <strong style={{ marginLeft: 8 }}>{i.name}</strong>
            </span>
            <button onClick={() => remove(i._id)} style={{ color: 'white', background: '#e11', border: 0, padding: '6px 10px' }}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
