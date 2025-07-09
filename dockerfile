# Gunakan Node.js versi LTS berbasis Alpine (ringan)
FROM node:18-alpine

# Direktori kerja di dalam container
WORKDIR /app

# Salin package config terlebih dahulu (agar cache build optimal)
COPY package*.json ./

# Install dependencies
RUN npm install

# Salin semua file project (termasuk src/, config, dll)
COPY . .

# Build aplikasi Next.js untuk production
RUN npm run build

# Expose port 3000 untuk diakses dari luar container
EXPOSE 3000

# Jalankan Next.js app dalam mode production
CMD ["npm", "start"]
