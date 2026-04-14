# ⚡ ReqtifyApi

Aplikasi web self-hosted untuk testing API. Mendukung multi-user, workspace kolaborasi, dan UI premium dark theme.

![Node.js](https://img.shields.io/badge/Node.js-18+-green?logo=node.js)
![Express](https://img.shields.io/badge/Express-5.x-blue?logo=express)
![Prisma](https://img.shields.io/badge/Prisma-5.x-2D3748?logo=prisma)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white)

## ✨ Fitur

- **🔐 Multi-User Auth** — Register & Login dengan JWT
- **📁 Workspaces** — Kelola project terpisah, tambah member dengan role (owner/editor/viewer)
- **📂 Collections** — Folder hierarchy untuk organisasi request, support sub-folder
- **🚀 Request Builder** — Method selector (GET/POST/PUT/DELETE/PATCH/OPTIONS/HEAD), params, headers, authorization (Bearer/Basic), body editor dengan syntax highlighting
- **📬 Response Viewer** — Status badge, response time, size, body (pretty/raw), response headers
- **🌐 Environment Variables** — Buat variabel `{{base_url}}`, substitusi otomatis di URL/headers/body
- **🕐 History** — Auto-save riwayat request, grouped by tanggal
- **📑 Tabbed Interface** — Buka multiple request sekaligus seperti browser tabs
- **⌨️ Keyboard Shortcuts** — `Ctrl+Enter` Send, `Ctrl+S` Save, `Ctrl+N` New tab
- **🔄 Proxy Server** — Bypass CORS untuk testing API external
- **🎨 Premium Dark UI** — Glassmorphism, micro-animations, custom color theme

---

## 📋 Kebutuhan Sistem

| Software | Versi Minimum | Keterangan |
|----------|---------------|------------|
| [Node.js](https://nodejs.org/) | >= 18.x | Runtime JavaScript |
| [MySQL](https://www.mysql.com/) | >= 5.7 | Database (atau MariaDB) |
| [Git](https://git-scm.com/) | any | Version control |

---

## 🚀 Instalasi

### 1. Clone Repository

```bash
git clone https://github.com/your-username/apiflare.git
cd apiflare
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Konfigurasi Environment

Buat file `.env` di root project:

```env
# Koneksi database MySQL
DATABASE_URL="mysql://root:password@localhost:3306/db_apiflare"

# Secret key untuk JWT (ganti dengan random string yang kuat)
JWT_SECRET="ganti_dengan_secret_key_anda"

# Port server (default: 3000)
PORT=3000
```

> **⚠️ Penting:** Ganti `root:password` dengan username dan password MySQL Anda.

### 4. Buat Database

Buat database MySQL terlebih dahulu:

```sql
CREATE DATABASE db_apiflare;
```

Atau via command line:

```bash
mysql -u root -p -e "CREATE DATABASE db_apiflare;"
```

### 5. Migrasi Database

Sinkronkan schema ke database:

```bash
npx prisma db push
```

Tabel yang akan dibuat:

| Tabel | Fungsi |
|-------|--------|
| `User` | Data pengguna |
| `Workspace` | Workspace / project |
| `WorkspaceMember` | Member workspace + role |
| `Collection` | Koleksi request (nested folder) |
| `Request` | Saved API requests |
| `Environment` | Environment variables |
| `History` | Riwayat request |

### 6. Jalankan Server

**Development** (auto-reload saat kode berubah):

```bash
npm run dev
```

**Production**:

```bash
npm start
```

### 7. Akses Aplikasi

Buka browser dan akses:

```
http://localhost:3000
```

Pertama kali buka, Anda akan diminta **Register** untuk membuat akun. Setelah login, workspace default akan otomatis dibuat.

---

## 🐳 Docker (Opsional)

Jalankan dengan Docker Compose:

```bash
docker-compose up -d
```

Ini akan menjalankan:
- **ReqtifyApi** di port `3000`
- **MySQL** di port `3307`

---

## 📁 Struktur Project

```
apiflare/
├── prisma/
│   └── schema.prisma          # Database schema
├── public/                     # Frontend (Single Page Application)
│   ├── index.html             # Main HTML
│   ├── css/
│   │   └── style.css          # Dark theme styling
│   └── js/
│       ├── api.js             # API service layer
│       ├── app.js             # Main controller & utilities
│       ├── auth.js            # Modul autentikasi
│       ├── workspace.js       # Manajemen workspace
│       ├── collections.js     # Collection tree & CRUD
│       ├── tabs.js            # Manajemen tab request
│       ├── request.js         # Request builder
│       ├── response.js        # Response viewer
│       ├── environments.js    # Environment variables
│       └── history.js         # Riwayat request
├── src/
│   ├── controllers/           # Route handlers
│   ├── middlewares/            # Auth & error handling
│   ├── repositories/          # Database queries (Prisma)
│   ├── routes/                # Definisi API route
│   ├── services/              # Business logic
│   └── utils/                 # Helper functions
├── .env                       # Environment variables (tidak masuk git)
├── .gitignore
├── docker-compose.yml
├── Dockerfile
├── package.json
└── server.js                  # Entry point Express
```

---

## 🔌 API Endpoints

Semua endpoint membutuhkan header `Authorization: Bearer <token>` kecuali Auth.

### Authentication
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/auth/register` | Register user baru |
| POST | `/api/auth/login` | Login & dapatkan JWT token |

### Workspaces
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/workspaces` | List semua workspace |
| POST | `/api/workspaces` | Buat workspace baru |
| GET | `/api/workspaces/:id` | Detail workspace |
| PUT | `/api/workspaces/:id` | Update workspace |
| DELETE | `/api/workspaces/:id` | Hapus workspace |
| POST | `/api/workspaces/:id/members` | Tambah member |
| PUT | `/api/workspaces/:id/members` | Update role member |
| DELETE | `/api/workspaces/:id/members/:userId` | Hapus member |

### Collections
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/collections/workspace/:wsId` | List collections |
| POST | `/api/collections` | Buat collection/folder |
| GET | `/api/collections/:id` | Detail collection + requests |
| PUT | `/api/collections/:id` | Update collection |
| DELETE | `/api/collections/:id` | Hapus collection |

### Requests
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/requests` | Simpan request baru |
| GET | `/api/requests/:id` | Detail request |
| PUT | `/api/requests/:id` | Update request |
| DELETE | `/api/requests/:id` | Hapus request |

### Environments
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/environments/workspace/:wsId` | List environments |
| POST | `/api/environments` | Buat environment |
| GET | `/api/environments/:id` | Detail environment |
| PUT | `/api/environments/:id` | Update environment |
| DELETE | `/api/environments/:id` | Hapus environment |

### History
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/history?workspaceId=X` | List riwayat request |
| DELETE | `/api/history/:id` | Hapus satu riwayat |
| DELETE | `/api/history/clear/:wsId` | Hapus semua riwayat workspace |

### Proxy
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/proxy/send` | Kirim request via server proxy |

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Aksi |
|----------|------|
| `Ctrl + N` | Tab Request Baru |
| `Ctrl + Enter` | Kirim Request |
| `Ctrl + S` | Simpan Request |
| `Ctrl + W` | Tutup Tab |
| `Escape` | Tutup Modal / Menu |

---

## 🛠️ Troubleshooting

### Koneksi database gagal
Pastikan MySQL berjalan dan credentials di `.env` benar:
```bash
mysql -u root -p -e "SHOW DATABASES;"
```

### Port sudah dipakai
Ganti `PORT` di `.env`:
```env
PORT=3001
```

### Error Prisma Client
Regenerate Prisma client:
```bash
npx prisma generate
```

### Reset database (hapus semua data)
```bash
npx prisma db push --force-reset
```
> ⚠️ Peringatan: Perintah ini akan menghapus seluruh data di database!

---

## 📄 Lisensi

ISC

---

<p align="center">
  Built with ⚡ <strong>ReqtifyApi</strong>
</p>
