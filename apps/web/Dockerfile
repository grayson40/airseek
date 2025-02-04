FROM node:18-alpine
WORKDIR /app

# Copy root env
COPY .env ./
ENV SUPABASE_URL=${SUPABASE_URL}
ENV SUPABASE_KEY=${SUPABASE_KEY}

# Copy app files
COPY apps/web/package*.json ./
RUN npm install
COPY apps/web .

RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]