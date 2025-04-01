# AirSeek

AirSeek is a price comparison platform designed specifically for airsoft products. It aggregates prices from major retailers, enabling users to find the best deals effortlessly.

## Project Structure

The project is organized into the following directories:

- **/apps**: Contains all application code.
  - **/web**: The frontend application built with Next.js.
  - **/services**: Services responsible for scraping data for aggregation.

## Requirements

- Docker
- A Supabase account
- A PostHog account for analytics

## Quick Start

1. Clone the repository.
2. Copy `.env.example` to `.env`.
3. Update the environment variables in the `.env` file:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key

    NEXT_PUBLIC_POSTHOG_KEY=your_key
    NEXT_PUBLIC_POSTHOG_HOST=your_host
    ```

4. To run all services locally, use Docker Compose:

   ```bash
   docker-compose up --build
   ```

## Development

### Using Turbo (Recommended for Development)

This is the easiest way to run the application locally:

```bash
# Install dependencies
npm install

# Run both services and web app in development mode
npm run dev:local
```

This will start:
- Web app on http://localhost:3001
- API services on http://localhost:8001

### Using Docker

For production-like environment:

```bash
# Build containers
docker-compose build

# Run the application
docker-compose up -d
```

This will start:
- Web app on http://localhost:3001
- API services on http://localhost:8001

To view logs:
```bash
docker-compose logs -f
```

To stop:
```bash
docker-compose down
```

## Troubleshooting

### Port Issues

If you're experiencing port conflicts:
1. Make sure no other applications are using ports 3001 and 8001
2. Check the logs with `docker-compose logs -f` to see any errors
3. For Docker, ensure environment variables are correctly set in .env file

### API Connection Issues

If the web app can't connect to the services:
1. Ensure services are running (check the logs)
2. Verify SERVICES_API_URL is set correctly
3. For Docker, check that the services container is healthy

### Deployment Notes

For Linode or other cloud deployments:
1. Update NEXT_PUBLIC_URL to match your domain
2. Set up proper environment variables for production
3. Consider using a reverse proxy (like Nginx) for production use
