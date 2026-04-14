# 📋 Changelog — ReqtifyApi

Semua perubahan penting pada proyek ini didokumentasikan di file ini.

---

## [1.0.0] — 2026-04-14

### 🎉 Rilis Awal — Full Stack API Testing Tool

Rilis pertama dengan arsitektur full-stack lengkap: backend Node.js + Express + Prisma + MySQL, frontend modular SPA dengan premium dark theme.

---

### ✨ Fitur Baru

#### 🔐 Authentication
- Sistem register & login dengan JWT
- Token disimpan di `localStorage`, berlaku 7 hari
- **Session persistence** — user tidak logout saat refresh halaman
- Verifikasi token otomatis via `/api/auth/me` saat page load
- Cache user info di localStorage untuk loading instan
- Avatar user dengan inisial nama di topbar

#### 📁 Workspace Management
- CRUD workspace (Create, Read, Update, Delete)
- Auto-create "My Workspace" saat user pertama kali login
- Workspace selector dropdown di topbar dengan indikator role
- Simpan workspace aktif di localStorage

#### 👥 Workspace Collaboration (Multi-User)
- **Invite member by email** — cukup masukkan email user yang sudah terdaftar
- **Role management** — Owner, Editor, Viewer
- Owner bisa:
  - Invite member baru
  - Ubah role member (Editor ↔ Viewer)
  - Remove member dari workspace
  - Delete workspace
- Modal "Manage Members" dengan tabel user, avatar, dan role selector
- Tampilan role user di workspace dropdown

#### 📂 Collections
- Buat collection baru via modal (bukan `prompt()`)
- Support sub-folder (nested collection)
- **Rename collection** via modal — focus otomatis dan select text
- **Rename request** via modal terpisah
- Delete collection dengan konfirmasi
- Context menu (klik kanan):
  - Add Request
  - Add Folder
  - Rename
  - Delete
- Tree view dengan expand/collapse
- Lazy load detail collection + requests saat expand
- Search/filter collections di sidebar

#### 🚀 Request Builder
- Method selector: GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD
- URL bar dengan warna method dinamis
- **Parameters** — tabel key-value dengan checkbox enable/disable
- **Headers** — tabel key-value dengan checkbox enable/disable
- **Authorization** — No Auth, Bearer Token, Basic Auth
- **Body editor** — CodeMirror dengan syntax highlighting (JSON)
- **Environment variable substitution** — `{{variable}}` otomatis diganti
- Tombol Send dan Save

#### 📬 Response Viewer
- Status badge dengan warna (hijau = 2xx, kuning = 3xx, merah = 4xx/5xx)
- Response time (ms) dan size (bytes/KB/MB)
- Body viewer dengan CodeMirror (read-only, syntax highlighting)
- Response headers table
- Copy response ke clipboard
- Tab switching: Body / Headers

#### 📑 Tabbed Interface
- Browser-like tab bar
- Buka multiple request sekaligus
- **Close tab** — switch otomatis ke tab terdekat
- Unsaved indicator (dot) pada tab yang belum disimpan
- State preservation saat switch antar tab (URL, params, headers, body, response)
- Welcome screen saat tidak ada tab terbuka
- Tab name truncation untuk nama panjang

#### 🌐 Environment Variables
- CRUD environment (Create, Edit, Delete)
- Tabel key-value editor untuk variabel
- Environment selector dropdown di topbar
- Aktifkan/nonaktifkan environment
- Auto-substitusi `{{variable}}` di URL, headers, dan body
- Sidebar panel "Envs" untuk manage environments

#### 🕐 Request History
- Auto-save riwayat setiap request dikirim
- Grouped by tanggal
- Tampilan method + URL + status code
- Klik untuk restore ke tab baru
- Hapus satu entry atau clear semua
- Refresh otomatis setelah send request

#### 🔄 Proxy Server
- Kirim request via server proxy (bypass CORS)
- Support semua HTTP methods
- Forward headers dan body
- Kembalikan status, time, size, response data + headers

#### ⌨️ Keyboard Shortcuts
| Shortcut | Aksi |
|----------|------|
| `Ctrl + N` | Tab Request Baru |
| `Ctrl + Enter` | Kirim Request |
| `Ctrl + S` | Simpan Request |
| `Ctrl + W` | Tutup Tab |
| `Escape` | Tutup Modal / Menu |

#### 🎨 UI/UX
- Premium dark theme dengan CSS custom properties
- Glassmorphism modal backdrop
- Micro-animations dan smooth transitions
- Resizable panels (drag splitter antara request/response)
- Context menu (klik kanan) pada collections dan requests
- Toast notifications (success, error, info)
- Loading spinners
- Empty states dengan icon dan call-to-action
- Google Fonts: Inter + JetBrains Mono
- Responsive layout

---

### 🏗️ Arsitektur

#### Backend
| Layer | Teknologi |
|-------|-----------|
| Runtime | Node.js 18+ |
| Framework | Express 5 |
| Database | MySQL / MariaDB |
| ORM | Prisma 5 |
| Auth | JWT (jsonwebtoken) + bcrypt |
| HTTP Client | Axios (proxy) |

#### Frontend
| Komponen | Teknologi |
|----------|-----------|
| Structure | Vanilla HTML5 |
| Styling | Vanilla CSS3 (custom properties) |
| Logic | Vanilla JavaScript (modular IIFE) |
| Code Editor | CodeMirror 5 |

#### Modul Frontend
| File | Fungsi |
|------|--------|
| `api.js` | Service layer — semua HTTP call ke backend |
| `app.js` | Main controller, utilities, toast, shortcuts |
| `auth.js` | Login/register, session persistence |
| `workspace.js` | Workspace CRUD + member collaboration |
| `collections.js` | Collection tree, rename, context menu |
| `tabs.js` | Tab management, state preservation |
| `request.js` | Request builder, send, save |
| `response.js` | Response viewer, headers, copy |
| `environments.js` | Environment variables, substitution |
| `history.js` | Request history, restore |

---

### 📄 File yang Ditambah/Diubah

```
[NEW]  public/index.html           — Full restructure, 3-panel layout
[NEW]  public/css/style.css         — 1500+ line premium dark theme
[NEW]  public/js/api.js             — Centralized API client
[NEW]  public/js/app.js             — Main controller & utilities
[NEW]  public/js/auth.js            — Authentication module
[NEW]  public/js/workspace.js       — Workspace + collaboration
[NEW]  public/js/collections.js     — Collection tree & CRUD
[NEW]  public/js/tabs.js            — Tab management
[NEW]  public/js/request.js         — Request builder
[NEW]  public/js/response.js        — Response viewer
[NEW]  public/js/environments.js    — Environment variables
[NEW]  public/js/history.js         — Request history
[MOD]  src/utils/jwt.js             — JWT expiry 1d → 7d
[MOD]  src/controllers/AuthController.js — getMe returns full profile
[NEW]  .env.example                 — Template environment
[NEW]  README.md                    — Dokumentasi instalasi lengkap
[NEW]  CHANGELOG.md                 — File ini
```

---

<p align="center">⚡ <strong>ReqtifyApi</strong> — Lightweight & Powerful API Testing</p>
