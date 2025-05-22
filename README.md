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

### GitHub Actions CI/CD

The project includes a GitHub Actions workflow that automates testing, linting, and deployment:

1. **Test Job** (runs on every push and pull request):
   - Sets up Redis service container
   - Installs Node.js 20
   - Runs tests with Jest
   - Runs ESLint
   - Builds the application

2. **Docker Job** (runs only on pushes to main):
   - Builds multi-architecture Docker images (linux/amd64 + linux/arm64)
   - Pushes to DockerHub with both latest and commit-specific tags

To set up GitHub Actions:

1. Push your code to GitHub
2. Add these secrets to your repository:
   - `DOCKERHUB_USERNAME`: Your DockerHub username
   - `DOCKERHUB_TOKEN`: Your DockerHub access token

The workflow will automatically:
- Run tests and linting on every PR
- Build and push Docker images on pushes to main

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

### Testing Push Notifications

To test push notifications locally:

1. **Install Expo Go**:
   - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)
   - Android: [Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. **Get a Push Token**:
   ```javascript
   // In your Expo app
   import * as Notifications from 'expo-notifications';
   
   async function registerForPushNotifications() {
     const { status } = await Notifications.requestPermissionsAsync();
     if (status !== 'granted') {
       alert('Failed to get push token for push notification!');
       return;
     }
     
     const token = (await Notifications.getExpoPushTokenAsync()).data;
     console.log('Push token:', token);
     // Send this token to your server using the /api/devices endpoint
   }
   ```

3. **Register the Token**:
   ```bash
   curl -X POST http://localhost:3000/api/devices \
     -H "Content-Type: application/json" \
     -d '{
       "userId": "test-user",
       "pushToken": "ExponentPushToken[your-token-here]"
     }'
   ```

4. **Create a Test Event**:
   ```bash
   curl -X POST http://localhost:3000/api/events \
     -H "Content-Type: application/json" \
     -d '{
       "title": "Test Cooking Event",
       "eventTime": "2024-03-20T15:00:00Z",
       "userId": "test-user"
     }'
   ```

The notification will be sent 30 minutes before the event time (configurable via `REMINDER_LEAD_MINUTES`).

Note: For production use, you'll need to:
1. Create an Expo account
2. Generate an access token in your Expo dashboard
3. Add the token to your environment variables as `EXPO_ACCESS_TOKEN` 