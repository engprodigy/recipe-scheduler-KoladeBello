# Cooking Events Microservice

A Node.js + TypeScript microservice for scheduling cooking events with push notification support.

## Features

- Create, read, update, and delete cooking events
- Store push tokens for notifications
- SQLite database for data persistence
- Input validation using class-validator
- RESTful API endpoints
- Automated reminders using Redis + BullMQ
- Push notifications via Expo
- Multi-architecture Docker support (linux/amd64 + linux/arm64)

## Architecture

### Queue System (Redis + BullMQ)

We use Redis and BullMQ for our queue system because:
- Redis provides fast, reliable message storage and pub/sub capabilities
- BullMQ offers robust job scheduling with features like:
  - Delayed jobs
  - Job retries
  - Job prioritization
  - Job progress tracking
  - Job completion/failure events
- The combination allows for scalable, distributed processing of reminders

### Worker Process

The reminder worker runs as a separate process to:
- Handle push notifications independently from the main API
- Scale horizontally if needed
- Isolate failures in notification sending from the main application
- Provide better resource utilization

## API Endpoints

### Events

- `POST /api/events` - Create a new event
  - Body: `{ "title": string, "eventTime": string (ISO), "userId": string }`

- `GET /api/events?userId=string` - List events for a user

- `PATCH /api/events/:id` - Update an event
  - Body: `{ "title": string, "eventTime": string (ISO) }`

- `DELETE /api/events/:id` - Delete an event

### Devices

- `POST /api/devices` - Register a push token
  - Body: `{ "userId": string, "pushToken": string }`

## Setup

### Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables in `.env`:
   ```
   PORT=3000
   REDIS_URL=redis://localhost:6379
   REMINDER_LEAD_MINUTES=30
   EXPO_ACCESS_TOKEN=your_expo_access_token_here
   ```

3. Start Redis:
   ```bash
   # Using Docker
   docker run -d -p 6379:6379 redis
   ```

4. Build the project:
   ```bash
   npm run build
   ```

5. Start the API server:
   ```bash
   npm start
   ```

6. Start the worker in a separate terminal:
   ```bash
   npm run worker
   ```

For development with hot-reload:
```bash
# Terminal 1
npm run dev

# Terminal 2
npm run worker
```

### Docker Deployment

1. Set up environment variables:
   ```bash
   export EXPO_ACCESS_TOKEN=your_expo_access_token_here
   ```

2. Build and start the services:
   ```bash
   docker-compose up --build
   ```

   Or run in detached mode:
   ```bash
   docker-compose up -d --build
   ```

3. View logs:
   ```bash
   docker-compose logs -f
   ```

4. Stop services:
   ```bash
   docker-compose down
   ```

### Multi-architecture Build

To build for multiple architectures:

```bash
# Build for both architectures
docker buildx build --platform linux/amd64,linux/arm64 -t your-registry/cooking-events:latest .

# Push to registry
docker buildx build --platform linux/amd64,linux/arm64 -t your-registry/cooking-events:latest --push .
```

## Environment Variables

- `PORT` - Server port (default: 3000)
- `REDIS_URL` - Redis connection URL (default: redis://localhost:6379)
- `REMINDER_LEAD_MINUTES` - Minutes before event to send reminder (default: 30)
- `EXPO_ACCESS_TOKEN` - Expo push notification access token

## Database

The service uses SQLite with TypeORM. The database file will be created automatically at `cooking_events.db`.

## Push Notifications

The service uses Expo's push notification service to send reminders. When an event is created or updated:
1. A reminder job is scheduled in Redis
2. The worker process picks up the job at the appropriate time
3. Push notifications are sent to all registered devices for the user
4. If the Expo service is unavailable, notifications are logged for display in the app 