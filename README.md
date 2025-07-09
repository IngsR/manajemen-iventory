# 🧾 CRUD Manajemen Inventaris Barang

Aplikasi berbasis web untuk mengelola inventaris barang dengan fitur CRUD (Create, Read, Update, Delete). Proyek ini ditujukan untuk memudahkan pencatatan, pemantauan, dan pengelolaan stok serta kondisi barang di suatu organisasi atau perusahaan.

---

## 🧠 Ringkasan

| Komponen                         | Deskripsi                                                                                                                                                                        |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Masalah**                      | Banyak organisasi atau unit usaha kesulitan dalam mengelola inventaris barang secara efisien, terutama dalam memantau stok, pencatatan barang rusak, dan riwayat perubahan data. |
| **Solusi**                       | Aplikasi CRUD berbasis web untuk memudahkan input, pembaruan, dan penghapusan data barang serta memantau barang rusak secara sistematis.                                         |
| **Target Pengguna**              | Unit inventaris kantor, pengelola gudang, atau bisnis kecil hingga menengah yang membutuhkan sistem manajemen barang.                                                            |
| **Fitur Utama**                  | - CRUD data barang <br> - Manajemen barang rusak <br> - Otentikasi berbasis JWT (dengan cookie) <br> - Dashboard stok barang <br> - Pencarian & filter data                      |
| **Teknologi**                    | - Frontend: Next.js <br> - Backend/API: Next.js API Routes <br> - Database: PostgreSQL <br> - Auth: JSON Web Token (JWT) via Cookie                                              |
| **Keunggulan**                   | - Sederhana dan mudah diimplementasikan <br> - Terbuka untuk dikembangkan lebih lanjut <br> - Clean code dan modular                                                             |
| **Distribusi Nilai**             | Proyek ini bisa menjadi kerangka dasar untuk sistem inventaris skala kecil hingga menengah yang dapat dikembangkan secara fleksibel.                                             |
| **Metode Monetisasi** (opsional) | Open-source (gratis), namun dapat dikembangkan menjadi SaaS (Software as a Service) pada tahap lanjutan.                                                                         |
| **Metrik Keberhasilan**          | - Penerapan proyek di lingkungan nyata (kantor/gudang)                                                                                                                           |

---

## 🚀 Cara Menjalankan

### 1. Clone Repository

```bash
git clone https://github.com/username/nama-repo.git
cd nama-repo
```

### 2. Buat file .env

```bash
# .env.example
DATABASE_URL=postgresql://postgres:<your-password>@db:5432/postgres
JWT_SECRET=<your-jwt-secret>
```

### 3. Membuat Javascript Web Token(JWT)

```bash
# via OpenSSL
openssl rand -hex 64

# atau via Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Running Docker

### 2. Install Dependency

```bash
docker-compose up --build
```

## Running nodeJS

### 2. Install Dependency

```bash
npm install
# atau
yarn install
```

### 5. Install next

```bash
npm run build
```

### 4. Buat file .env

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/nama_database
```

### 5. Jalankan Aplikasi

```bash
npm start
```

---

<div align="center">
  <h1> 📺 USER INTERFACE</h1>
<h2 align="center"><strong>Form Login</strong></h2>

![MyDokumen UI](./Ui_Preview/FormLogin.png)

---

<h1 align="center"><strong>Admin User Interface</strong></h1>
<h2 align="center"><strong>Dashboard Admin</strong></h2>

![Dashboard Admin – Bagian 1](./Ui_Preview/dasboard_admin1.png)
![Dashboard Admin – Bagian 2](./Ui_Preview/dasboard-admin2.png)
![Dashboard Admin – Bagian 3](./Ui_Preview/dasboard-admin3.png)

<h2 align="center"><strong>Manajemen User</strong></h2>

![Dashboard Admin](./Ui_Preview/manajmen-user.png)

<h2 align="center"><strong>Aktifitas Log</strong></h2>

![Dashboard Admin](./Ui_Preview/log-aktifitas.png)

---

<h1 align="center"><strong>User Interface Karyawan</strong></h1>
<h2 align="center"><strong>Beranda User</strong></h2>

![Dashboard Admin](./Ui_Preview/Beranda-user.png)

<h2 align="center"><strong>Statistik Barang</strong></h2>

![Dashboard Admin](./Ui_Preview/statistik-user.png)
![Dashboard Admin](./Ui_Preview/statistik-user2.png)

<h2 align="center"><strong>Barang Cacat</strong></h2>

![Dashboard Admin](./Ui_Preview/brg-cacat.png)

---

## 📝 Lisensi

<div align="center">
  <a href="./LICENSE">
    <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT" />
  </a>
  
  Proyek ini dilisensikan di bawah lisensi **MIT**.  
  Lihat file [LICENSE](./LICENSE) untuk informasi selengkapnya.
</div>

## 👨‍💻 Author [IngsR](https://github.com/IngsR) Ikhwan Ramadhan-2025

## </div>
