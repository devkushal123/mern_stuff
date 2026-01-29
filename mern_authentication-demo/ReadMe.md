This guide explains **step by step**, with **simple language**, how to build a full-stack app using **Node.js, Express, MongoDB, React**, including:

1. JWT Authentication
2. Role-based Authorization
3. Real-time Chat with Socket.IO (single & group + offline notifications)
4. Dynamic Scroll Pagination in React
5. Highcharts with React (API-driven)

Everything is written so a **beginner can understand**.

---

## 0. Tech Stack

### Backend

* Node.js
* Express.js
* MongoDB + Mongoose
* JWT
* bcryptjs
* Socket.IO

### Frontend

* React.js
* Axios
* Socket.IO Client
* Highcharts

---

## 1. Backend Setup (Node.js + MongoDB)

### 1.1 Create Project

```bash
mkdir backend
cd backend
npm init -y
```

### 1.2 Install Dependencies

```bash
npm install express mongoose jsonwebtoken bcryptjs cors dotenv socket.io
npm install nodemon --save-dev
```

### 1.3 Folder Structure

```
backend/
│── server.js
│── .env
│── config/
│   └── db.js
│── models/
│   ├── User.js
│   └── Message.js
│── middleware/
│   ├── authMiddleware.js
│   └── roleMiddleware.js
│── socket/
│   └── socket.js
│── controllers/
│   ├── authController.js
│   ├── userController.js
│   └── chatController.js
│
│── routes/
│   ├── authRoutes.js
│   ├── userRoutes.js
│   └── chatRoutes.js

```

---

## 2. MongoDB Connection

### config/db.js

```js
const mongoose = require('mongoose');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB Connected');
};

module.exports = connectDB;
```

### .env

```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/chatapp
JWT_SECRET=supersecretkey
```

---

## 3. Authentication (JWT)

### 3.1 User Model

### models/User.js

```js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: 'user' }
});

module.exports = mongoose.model('User', userSchema);
```

---

### 3.2 Password Encryption (bcrypt)

* **Password is encrypted before saving**
* **Never store plain password**

### routes/auth.js

```js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// REGISTER
router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role
  });

  res.json(user);
});

// LOGIN
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ msg: 'User not found' });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ msg: 'Wrong password' });

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );

  res.json({ token });
});

module.exports = router;
```

---

### 3.3 Where JWT is Stored?

* Frontend stores token in **localStorage**
* Sent in **Authorization Header**

```
Authorization: Bearer <TOKEN>
```

---

## 4. Authorization (Role-Based)

### middleware/authMiddleware.js

```js
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ msg: 'No token' });

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = decoded;
  next();
};
```

### middleware/roleMiddleware.js

```js
module.exports = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ msg: 'Access denied' });
    }
    next();
  };
};
```

### Example Protected Route

```js
router.get('/admin', authMiddleware, roleMiddleware('admin'), (req, res) => {
  res.json('Admin Access');
});
```

Roles example:

* admin
* moderator
* user

---

## 5. Socket.IO Chat System (End-to-End)

### 5.1 Message Model

```js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: String,
  receiver: String,
  message: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', messageSchema);
```

---

### 5.2 Socket Management (IMPORTANT)

### socket/socket.js

```js
const Message = require('../models/Message');

let onlineUsers = {};

module.exports = (io) => {
  io.on('connection', (socket) => {
    socket.on('join', (userId) => {
      onlineUsers[userId] = socket.id;
    });

    socket.on('sendMessage', async (data) => {
      await Message.create(data);

      const receiverSocket = onlineUsers[data.receiver];
      if (receiverSocket) {
        io.to(receiverSocket).emit('receiveMessage', data);
      }
    });

    socket.on('disconnect', () => {
      for (let user in onlineUsers) {
        if (onlineUsers[user] === socket.id) {
          delete onlineUsers[user];
        }
      }
    });
  });
};
```

### Offline Notification Logic

* Message saved to DB
* If user offline → no socket
* When user logs in → fetch unread messages

---

## 6. server.js

```js
const express = require('express');
const http = require('http');
const cors = require('cors');
const connectDB = require('./config/db');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server, { cors: { origin: '*' } });

connectDB();

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));

require('./socket/socket')(io);

server.listen(5000, () => console.log('Server running'));
```

---

## 7. Frontend Setup (React)

### 7.1 Create App

```bash
npx create-react-app frontend
cd frontend
npm install axios socket.io-client highcharts highcharts-react-official
npm install react-router-dom jwt-decode
```


---

frontend/
├── public/
│   └── index.html
├── src/
│   ├── api/
│   ├── auth/
│   ├── pages/
│   ├── components/
│   ├── socket/
│   ├── charts/
│   ├── App.jsx
│   ├── index.js
│   └── index.css
├── package.json


## 8. Dynamic Scroll Pagination (React)

### Concept

* Load data page by page
* When scroll reaches bottom → fetch next page

### Example

```js
const [page, setPage] = useState(1);

useEffect(() => {
  fetchData(page);
}, [page]);

const handleScroll = () => {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
    setPage(prev => prev + 1);
  }
};

useEffect(() => {
  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
}, []);
```

---

## 9. Socket.IO Client (React)

```js
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');

socket.emit('join', userId);

socket.on('receiveMessage', (msg) => {
  console.log(msg);
});
```

---

## 10. Highcharts with React

### API Example

```js
axios.get('/api/stats').then(res => setData(res.data));
```

### Chart

```js
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

const options = {
  title: { text: 'User Activity' },
  series: [{ data: data }]
};

<HighchartsReact highcharts={Highcharts} options={options} />
```

---

## 11. Final Notes

✔ JWT → stored in frontend
✔ Password → bcrypt encrypted
✔ Role-based authorization
✔ Socket.IO → real-time + offline handling
✔ Pagination → scroll-based
✔ Charts → Highcharts

---

If you want:

* GitHub-ready version
* MySQL version
* Redux integration
* Advanced chat (groups, seen, typing)

Just tell me 👍


docker compose up --build

<!------------------------------------- role---------------------------- -->
Admin can request global|team|self
Manager can request team|self
User can request self only


- charts type----
  line, spline, area, areaspline, column, bar, pie, scatter, gauge, arearange, areasplinerange and columnrange.

- most common used charts Types: Bar Charts, Line Graphs, and Pie Charts 

<!-- - Donut chart--- -->
A donut chart is created by adding multiple pie series to the chart, setting the size and innerSize of each series to create concentric rings.


<!-- Heatmap--- -->
- A heat map is a graphical representation of data where the individual values contained in a matrix are represented as colors.

- A heatmap is a grid-based chart where color intensity represents the amount of activity in each cell.
- For your chat app dashboard:
  X‑axis = Hours of the day (0–23)
  Y‑axis = Days of the week (Mon–Sun)
  Each cell’s color = Number of messages in that day+hour slot

  This lets you see when users are most active at a glance.

💼 Practical Uses in Your Chat App
  - Identify peak hours
    See the darkest cells—those are your busiest times. 
    Plan resources (servers, support staff) accordingly.

  - Team scheduling
    If this is for internal teams, align shifts with high-activity times.

  - Behavior patterns
    Find consistent trends, e.g., heavy usage on weekdays 10:00–13:00; low on weekends.
  - Anomaly detection
    Unexpected spikes/drops might indicate issues (downtime) or successful campaigns.
  - Personal vs Global view
    Personal (normal user): Show their own activity (sent or received) by hour/day.
    Global/Team (manager/admin): Show aggregated activity across all users/team.

<!-- refernce for highcharts -->
https://www.highcharts.com/docs/chart-and-series-types/heatmap

<!-- set up dummy data (seed) for your MERN chat project -  -->
  Authentication: 1 admin, 2 managers, 4 normal users
  Chat: 400 realistic messages over the last 30 days with isDelivered and isRead flags
  Dashboard stats: global and per-user stats for expressive charts (area-spline, bar, pie/donut)
  Heatmap points: Mon–Sun × 0–23h activity grid


<!-- After seeding — quick checks -->
- Users collection: 7 docs (1 admin, 2 managers, 4 users)
- Messages collection: 400 docs with isDelivered / isRead and createdAt across the last 30 days
- No messages involve the admin
- Dashboard charts:
    - Area-spline trend uses createdAt
    - Donut/Pie uses read vs unread counts
    - Bar (top senders) should be non-zero
    - Heatmap (Mon–Sun × 0–23h) should show distribution