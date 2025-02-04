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
