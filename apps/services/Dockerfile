FROM node:18
WORKDIR /app

# Setup workspace
RUN npm install -g typescript
COPY package*.json ./
COPY turbo.json ./
COPY .env ./
RUN npm install

# Copy service files and compile
COPY apps/services ./apps/services
WORKDIR /app/apps/services
RUN npm run build

CMD ["npm", "run", "serve"]