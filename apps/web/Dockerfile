FROM node:18-alpine
WORKDIR /app

# Copy app files
COPY apps/web/package*.json ./
RUN npm install
COPY apps/web .

RUN npm run build
ENV PORT=3000
EXPOSE $PORT
CMD ["npm", "start"]