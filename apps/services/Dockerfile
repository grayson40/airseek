FROM node:18
WORKDIR /app

# Copy root package files for monorepo
COPY package*.json ./
COPY turbo.json ./

# Copy the services package files
COPY apps/services/package*.json ./apps/services/

# Install dependencies
RUN npm install

# Copy service files
COPY apps/services ./apps/services

# Set working directory to services app
WORKDIR /app/apps/services
RUN npm run build

CMD ["npm", "run", "serve"]