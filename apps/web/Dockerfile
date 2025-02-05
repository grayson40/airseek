FROM node:18-alpine
WORKDIR /app

# First copy root package files for monorepo
COPY package*.json ./
COPY turbo.json ./

# Copy the web app package files
COPY apps/web/package*.json ./apps/web/

# Install dependencies
RUN npm install

# Copy the web app source
COPY apps/web ./apps/web

# Set working directory to web app
WORKDIR /app/apps/web

RUN npm run build
ENV PORT=3000
EXPOSE $PORT
CMD ["npm", "start"]