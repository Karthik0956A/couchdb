# Event & RSVP Manager

A full-stack web application for managing events and RSVPs, built with CouchDB, Express, Node.js, and React.

## Features

- **User Authentication**: Register and login with JWT-based authentication
- **Event Management**: Create, read, update, and delete events
- **RSVP System**: Users can RSVP to events and cancel their RSVPs
- **One-to-Many Relationships**: Events have multiple participants, properly indexed in CouchDB
- **Real-time Participant Tracking**: View all participants for each event
- **Event Filters**: View all events, your created events, or events you've RSVP'd to
- **Max Participant Limits**: Optional capacity limits for events

## Tech Stack

### Backend
- **Node.js** & **Express**: Server framework
- **CouchDB**: NoSQL database with views for efficient querying
- **Nano**: CouchDB client for Node.js
- **JWT**: JSON Web Tokens for authentication
- **bcryptjs**: Password hashing
- **express-validator**: Input validation

### Frontend
- **React**: UI framework
- **React Router**: Client-side routing
- **Axios**: HTTP client
- **Context API**: State management

## Prerequisites

- Node.js (v14 or higher)
- CouchDB (v3 or higher)
- npm or yarn

## Installation

### 1. Clone the repository

```bash
cd d:\projects\Couchdb
```

### 2. Set up CouchDB

1. Install CouchDB from [https://couchdb.apache.org/](https://couchdb.apache.org/)
2. Start CouchDB service
3. Access Fauxton (CouchDB admin interface) at `http://localhost:5984/_utils`
4. Create an admin user (default: admin/password)

### 3. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# CouchDB Configuration
COUCHDB_URL=http://localhost:5984
COUCHDB_USER=admin
COUCHDB_PASSWORD=password

# Database Names
DB_USERS=users
DB_EVENTS=events
DB_PARTICIPANTS=participants

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
```

**Important**: Change the `JWT_SECRET` to a strong, random string in production.

Start the backend server:

```bash
npm start
```

The server will run on `http://localhost:5000` and automatically create the required databases with views.

### 4. Frontend Setup

```bash
cd frontend
npm install
```

Start the frontend development server:

```bash
npm start
```

The React app will run on `http://localhost:3000`.

## Database Structure

### Collections (Databases)

#### users
- `_id`: Auto-generated
- `email`: String (unique)
- `password`: String (hashed)
- `name`: String
- `createdAt`: ISO Date String

**Views**:
- `by_email`: Index users by email address

#### events
- `_id`: Auto-generated
- `title`: String
- `description`: String
- `date`: ISO Date String
- `location`: String
- `maxParticipants`: Number (optional)
- `creatorId`: String (user ID)
- `creatorName`: String
- `createdAt`: ISO Date String
- `updatedAt`: ISO Date String

**Views**:
- `by_creator`: Index events by creator ID
- `by_date`: Index events by date

#### participants (RSVPs)
- `_id`: Auto-generated
- `eventId`: String (event ID)
- `userId`: String (user ID)
- `userName`: String
- `userEmail`: String
- `eventTitle`: String
- `eventDate`: ISO Date String
- `rsvpDate`: ISO Date String

**Views**:
- `by_event`: Index participants by event ID
- `by_user`: Index participants by user ID

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires auth)

### Events

- `GET /api/events` - Get all events (requires auth)
- `GET /api/events/:id` - Get single event (requires auth)
- `GET /api/events/creator/:userId` - Get events by creator (requires auth)
- `POST /api/events` - Create new event (requires auth)
- `PUT /api/events/:id` - Update event (requires auth, creator only)
- `DELETE /api/events/:id` - Delete event and all RSVPs (requires auth, creator only)

### Participants (RSVPs)

- `POST /api/participants` - RSVP to an event (requires auth)
- `GET /api/participants/event/:eventId` - Get all participants for an event (requires auth)
- `GET /api/participants/user/:userId` - Get all RSVPs for a user (requires auth)
- `GET /api/participants/my-rsvps` - Get current user's RSVPs (requires auth)
- `DELETE /api/participants/:id` - Cancel RSVP (requires auth)
- `DELETE /api/participants/event/:eventId/user/:userId` - Cancel RSVP by event and user (requires auth)

## Usage

1. **Register/Login**: Create an account or login to access the application
2. **Create Events**: Click "Create Event" to add a new event
3. **View Events**: Browse all events or filter by your events or RSVPs
4. **RSVP**: Click on any event and click "RSVP to Event"
5. **Manage Events**: Edit or delete events you created
6. **View Participants**: See who has RSVP'd to each event
7. **Cancel RSVP**: Remove your RSVP from events

## Project Structure

```
Couchdb/
├── backend/
│   ├── config/
│   │   └── db.js           # CouchDB connection and initialization
│   ├── middleware/
│   │   └── auth.js         # JWT authentication middleware
│   ├── routes/
│   │   ├── auth.js         # Authentication routes
│   │   ├── events.js       # Event CRUD routes
│   │   └── participants.js # RSVP routes
│   ├── .env                # Environment variables (create this)
│   ├── .env.example        # Example environment file
│   ├── package.json
│   └── server.js           # Express server setup
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   ├── Auth.css
    │   │   ├── CreateEvent.js
    │   │   ├── EventDetails.js
    │   │   ├── Events.css
    │   │   ├── EventsList.js
    │   │   ├── Login.js
    │   │   ├── Navbar.css
    │   │   ├── Navbar.js
    │   │   └── Register.js
    │   ├── api.js          # API service functions
    │   ├── App.js          # Main app component
    │   ├── AuthContext.js  # Authentication context
    │   ├── index.css
    │   └── index.js
    ├── package.json
    └── .gitignore
```

## Development

### Backend Development

```bash
cd backend
npm run dev  # Uses nodemon for auto-restart
```

### Frontend Development

```bash
cd frontend
npm start  # Hot reload enabled
```

## Security Considerations

- **Never commit `.env` files**: They contain sensitive credentials
- **Change JWT_SECRET**: Use a strong, random secret in production
- **HTTPS**: Use HTTPS in production
- **Password Policy**: Minimum 6 characters (increase for production)
- **Input Validation**: All inputs are validated using express-validator
- **SQL Injection**: Not applicable (NoSQL database)
- **Authentication**: JWT tokens with configurable expiration

## Troubleshooting

### CouchDB Connection Issues
- Verify CouchDB is running: `http://localhost:5984/_utils`
- Check credentials in `.env` file
- Ensure admin user is created in CouchDB

### Database Not Created
- Check server logs for initialization errors
- Verify CouchDB user has admin privileges
- Manually create databases in Fauxton if needed

### Frontend Can't Connect to Backend
- Verify backend is running on port 5000
- Check `proxy` setting in `frontend/package.json`
- Check browser console for CORS errors

### Authentication Issues
- Clear localStorage: `localStorage.clear()` in browser console
- Verify JWT_SECRET is set in `.env`
- Check token expiration time

## License

ISC

## Author

Built with ❤️ using CouchDB, Express, Node.js, and React
#   c o u c h d b  
 