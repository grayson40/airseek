FROM node:18-alpine
WORKDIR /app

# Copy root env
COPY .env ./

# Copy package.json files for whole workspace
COPY package*.json ./
COPY apps/web/package*.json ./apps/web/

# Install dependencies
RUN npm install

# Copy app files
COPY apps/web ./apps/web

# Set build environment variables
ENV NEXT_PUBLIC_URL=http://localhost:3001
ENV PORT=3001

# Build the app
WORKDIR /app/apps/web
RUN npm run build

# Expose the port
EXPOSE 3001

# Set runtime command
CMD ["npm", "start"]