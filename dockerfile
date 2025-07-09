# Stage 1: Build the Next.js application
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock) to leverage Docker cache
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --omit=dev --prefer-offline --no-progress --ignore-scripts

# Copy the rest of your application code
COPY . .

# Build the Next.js application
# If you have specific environment variables needed for the build, you might need to pass them here
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npm run build

# Stage 2: Run the Next.js application
FROM node:20-alpine AS runner

# Set working directory
WORKDIR /app

# Copy necessary files from the builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public
# If you have a production .env file to copy
COPY --from=builder /app/.env.production ./.env.production

# Expose the port your Next.js app runs on
EXPOSE 3000

# Set environment variables for production (if not already handled by .env.production)
# ENV NODE_ENV=production

# Command to run the application
CMD ["npm", "start"]