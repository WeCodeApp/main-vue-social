# Social Media Application

A Vue 3 social media application with TypeScript, featuring authentication, posts, friends, and groups.

## Features

- **Authentication**: Login with Microsoft or Google accounts
- **Posts**: Create public or private posts, with comments and likes
- **Friends**: Send/accept friend requests, unfriend, and block users
- **Groups**: Create and join groups, post within groups, manage group members

## Tech Stack

- **Frontend**:
  - **Vue 3**: Frontend framework with Composition API
  - **TypeScript**: Type-safe JavaScript
  - **Pinia**: State management with persistence
  - **Vue Router**: Routing
  - **Axios**: HTTP client for API requests
  - **Vite**: Build tool
  - **CSS**: Styling

- **Backend**:
  - **Node.js**: JavaScript runtime
  - **Express**: Web framework
  - **MongoDB**: Database
  - **Passport.js**: Authentication middleware
  - **JWT**: Token-based authentication

## Project Setup

### Prerequisites

- npm or yarn
- Google and Microsoft OAuth credentials

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# Frontend environment variables
VITE_API_URL=http://localhost:8000
```

### Frontend Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173`.

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Start development server
npm run dev
```

The backend API will be available at `http://localhost:8000`.

## Build for Production

```bash
# Build frontend
npm run build

# Build backend
cd backend
npm run build
```

## Docker Deployment

The application can be deployed using Docker and Docker Compose.

### Prerequisites

- Docker
- Docker Compose

### Setup

1. Create a `.env` file in the root directory based on the `.env.example` file.

2. Build and start the containers:

```bash
docker-compose up -d
```

This will:
- Build the frontend and backend Docker images
- Start the containers in detached mode
- Make the frontend available at http://localhost
- Make the backend API available at http://localhost:8000

### Stopping the Application

```bash
docker-compose down
```

### Rebuilding After Changes

```bash
docker-compose up -d --build
```

## Project Structure

```
├── src/                  # Frontend source code
│   ├── assets/           # Global styles and assets
│   ├── components/       # Reusable components
│   │   ├── common/       # Common UI components
│   │   ├── post/         # Post-related components
│   │   ├── friend/       # Friend-related components
│   │   └── group/        # Group-related components
│   ├── composables/      # Reusable composition functions
│   ├── stores/           # Pinia stores
│   ├── views/            # Page components
│   ├── router/           # Vue Router configuration
│   ├── types/            # TypeScript type definitions
│   ├── main.ts           # Application entry point
│   └── App.vue           # Root component
│
├── backend/              # Backend source code
│   ├── controllers/      # Request handlers
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   ├── middleware/       # Custom middleware
│   ├── config/           # Configuration files
│   └── server.js         # Server entry point
```

## API Endpoints

### Authentication
- `POST /auth/google`: Google authentication
- `POST /auth/microsoft`: Microsoft authentication
- `POST /auth/refresh-token`: Refresh JWT token

### Users
- `GET /users`: Get all users
- `GET /users/:id`: Get user by ID
- `PUT /users/:id`: Update user profile

### Friends
- `GET /friends`: Get user's friends
- `GET /friends/requests`: Get friend requests
- `GET /friends/blocked`: Get blocked users
- `POST /friends/requests`: Send friend request
- `PUT /friends/requests/:id`: Respond to friend request
- `DELETE /friends/:id`: Unfriend user
- `POST /friends/blocked`: Block user
- `DELETE /friends/blocked/:id`: Unblock user

### Groups
- `GET /groups`: Get all groups
- `GET /groups/my`: Get user's groups
- `GET /groups/:id`: Get group by ID
- `GET /groups/:id/members`: Get group members
- `POST /groups`: Create group
- `PUT /groups/:id`: Update group
- `DELETE /groups/:id`: Delete group
- `POST /groups/:id/join`: Join group
- `POST /groups/:id/leave`: Leave group
- `POST /groups/:id/admins`: Make user admin
- `DELETE /groups/:id/admins/:userId`: Remove admin

### Posts
- `GET /posts`: Get posts
- `POST /posts`: Create post
- `PUT /posts/:id`: Update post
- `DELETE /posts/:id`: Delete post
- `POST /posts/:id/like`: Like post
- `DELETE /posts/:id/like`: Unlike post
- `GET /posts/:id/comments`: Get post comments
- `POST /posts/:id/comments`: Add comment

## Security Considerations

- All API requests are authenticated with JWT tokens
- Private posts are only visible to friends
- Group posts are only visible to group members
- Password hashing for local authentication
- CORS protection
- Rate limiting for API endpoints
- Input validation and sanitization

## License

MIT
