<!-- Topic covered -->


1. Authentication with JWT

- Access token (short‑lived) returned in JSON; stored in memory on the client.
- Refresh token (long‑lived) in httpOnly cookie (server sets it).
- Endpoints: /auth/register, /auth/login, /auth/refresh, /auth/logout.
- Passwords are bcrypt-hashed. JWTs are signed (not encrypted).



2. Authorization (roles)

- Roles array on User (['user'] default).
- Middleware requireRole('admin', 'moderator', ...).
- admin.routes.js shows examples:
    GET /admin/users (admin only)
    POST /admin/users/:id/roles (admin/moderator)


3. Chat with Socket.IO (1–1 & group) + Offline notifications
- Socket auth via access token: client passes auth: { token }.
- userId → Set<socketId> mapping (in-memory) for online fan-out.
- If recipient is offline, a Notification doc is stored.
- On next socket connection, the server emits undelivered notifications and marks them delivered.

4. Dynamic infinite scroll pagination (React)
- Backend: /messages uses cursor-based pagination (createdAt).
- Frontend: react-infinite-scroll-component with inverse scrolling (load older at top).


5. Highcharts -  supports many chart types (line, bar, pie, area, scatter, heatmap, etc.)
- Backend: /analytics/messages-per-day aggregates counts.
- Frontend: ChartExample.jsx fetches and plots as a line chart.

- Feature-rich – supports many chart types (line, bar, pie, area, scatter, heatmap, etc.)
- Interactive – zoom, tooltips, drill-down, dynamic updates
- Cross-platform – works in browsers, integrates with frameworks like React, Angular, Vue
- Customizable – themes, colors, animations, exporting option