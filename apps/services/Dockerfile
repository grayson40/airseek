FROM node:18
WORKDIR /app

# Setup workspace
COPY package*.json ./
RUN npm install

# Copy service files and compile
COPY apps/services ./apps/services
WORKDIR /app/apps/services
RUN npm run build

CMD ["npm", "run", "serve"]