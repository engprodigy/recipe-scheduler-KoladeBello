# Cooking Event Services

A monorepo containing microservices for managing cooking events.

## Services

### API Service
- Handles HTTP requests for events and devices
- Manages the main application database
- Exposes REST endpoints for CRUD operations

### Worker Service
- Processes background jobs and notifications
- Manages its own database for job tracking
- Handles push notifications to devices

### Shared Types
- Contains shared TypeScript interfaces
- Used for type-safe communication between services

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` files in both service directories with the following variables:
```
# API Service (.env)
API_DATABASE_NAME=api_cooking_events.db

# Worker Service (.env)
WORKER_DATABASE_NAME=worker_cooking_events.db
REDIS_URL=redis://localhost:6379
```

3. Start the services:
```bash
# Development mode
npm run dev:api
npm run dev:worker

# Production mode
npm run start:api
npm run start:worker
```

## Testing

The project includes comprehensive test suites for both the API and Worker services. To run the tests:

```bash
# Run all tests
npm test

# Run API service tests only
npm run test:api

# Run Worker service tests only
npm run test:worker
```

The test suites include:
- Unit tests for individual components
- Integration tests for API endpoints
- Queue service tests for background job processing

Each service has its own test configuration and setup files:
- `api-service/jest.config.js` - API service test configuration
- `worker-service/jest.config.js` - Worker service test configuration
- `api-service/src/test/setup.ts` - API service test setup
- `worker-service/src/test/setup.ts` - Worker service test setup

## Project Structure
```
CookingEventServices/
├── api-service/        # REST API service
│   └── src/
│       └── types/     # Shared TypeScript interfaces
└── worker-service/     # Background job processor
    └── src/
        └── types/     # Shared TypeScript interfaces
```

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

<!-- ### Local Development

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
``` -->

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

```