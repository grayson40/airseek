FROM node:18
WORKDIR /app

# Setup workspace
COPY package*.json ./
COPY turbo.json ./
COPY .env ./
RUN npm install

# Install TypeScript globally
RUN npm install -g typescript

# Copy service files
COPY apps/services ./apps/services
WORKDIR /app/apps/services

# Install service dependencies before building
RUN npm install

# Now build
RUN npm run build

CMD ["npm", "run", "start"]