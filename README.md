# Redis Caching API Starter

## Project Description
A modular Express.js + Redis caching system with MongoDB fallback, reusable in real-world projects.

## Features
- Reusable Redis caching layer with TTL
- Modular file structure (utils, routes, schemas, models)
- Soft-delete support
- Regex-based search in Redis, fallback to MongoDB
- TTL set to 24 hours (86400 seconds)

## Technologies Used
- Node.js, TypeScript
- Express.js
- Redis Stack (via Docker)
- MongoDB 8.0

## Getting Started
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. Run Redis using Docker:
   ```bash
   docker run -d --name redis-stack -p 6379:6379 -p 8001:8001 redis/redis-stack:latest
   ```

3. Set up your `.env` file with MongoDB connection details.

4. Install dependencies and run the server:
   ```bash
   npm install
   npm run dev
   ```

## API Endpoints Overview
- `POST /restaurants` - Add a new restaurant
- `GET /restaurants/:id` - Get restaurant details by ID
- `PUT /restaurants/:id` - Update restaurant details
- `DELETE /restaurants/:id` - Soft-delete a restaurant
- `POST /restaurants/:id/reviews` - Add a review to a restaurant
- `GET /restaurants/search?query=...` - Search restaurants by name (Redis first, MongoDB fallback)

## Reusability Instructions
- Copy `redis-utils/cache.ts`, `redis-utils/keys.ts`, and `redis-utils/client.ts` into your new project.
- Use the `cacheHash()` function to set TTL-based hashes in Redis.
- Use `restaurantKeyById()` (or create custom key builders) for namespacing cache keys.
- You can replace MongoDB with any database as long as you return and cache the fallback data.
- TTL is configurable; default is 24 hours (86400 seconds).


