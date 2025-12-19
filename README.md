# 🎁 mystrix - Gamified Shopping WebApp

A fun, gamified e-commerce experience where users spin wheels, open mystery boxes, and win amazing products!

## 📁 Project Structure (Monorepo)

```
mystery-scoop/
├── frontend/          # Next.js 15 + React 19 Frontend
│   ├── app/           # App Router pages
│   ├── components/    # React components
│   ├── lib/           # Utilities & stores
│   └── public/        # Static assets
├── backend/           # Express.js API Server
│   ├── src/
│   │   ├── models/    # Mongoose models
│   │   ├── routes/    # API routes
│   │   └── index.ts   # Server entry
│   └── package.json
└── package.json       # Root package.json (workspaces)
```

## ✨ Features

- **🎰 Wheel Spinning** - Spin to win 1-10 mystery boxes
- **📦 Mystery Boxes** - Tap to reveal hidden products with animations
- **🛒 Shopping Cart** - Add revealed products to cart
- **💳 Checkout** - Complete orders with address info
- **🔧 Admin Dashboard** - Manage products, orders, and inventory

## 🎮 Contest Types

| Contest | Price | Wheel Range | Products/Box |
|---------|-------|-------------|--------------|
| Starter Scoop | ₹100 | 1-5 boxes | 1 product |
| Super Scoop | ₹299 | 1-8 boxes | 1 product |
| Mega Scoop | ₹499 | 1-10 boxes | 1 products |

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** (App Router)
- **React 19**
- **TailwindCSS 3.4**
- **Framer Motion 11**
- **Zustand 5**
- **ESLint 9** (Flat Config)

### Backend
- **Express.js 4.21**
- **Mongoose 8**
- **TypeScript 5.7**
- **Helmet** (Security)
- **Rate Limiting**

## 🚀 Getting Started

### Prerequisites

- Node.js 18.17+ 
- MongoDB (local or Atlas)
- npm 9+

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/mystery-scoop.git
   cd mystery-scoop
   ```

2. **Install all dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Frontend (`frontend/.env.local`):
   ```
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

   Backend (`backend/.env`):
   ```
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/mystery_scoop
   FRONTEND_URL=http://localhost:3000
   ```

4. **Run both servers**
   ```bash
   npm run dev
   ```

   Or run separately:
   ```bash
   # Terminal 1 - Backend
   npm run dev:backend

   # Terminal 2 - Frontend
   npm run dev:frontend
   ```

5. **Open [http://localhost:3000](http://localhost:3000)**

## 📜 Available Scripts

### Root (Monorepo)

| Command | Description |
|---------|-------------|
| `npm run dev` | Run both frontend & backend |
| `npm run dev:frontend` | Run frontend only |
| `npm run dev:backend` | Run backend only |
| `npm run build` | Build both projects |
| `npm run start` | Start production servers |
| `npm run lint` | Lint all workspaces |
| `npm run clean` | Remove all node_modules |

### Frontend

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (port 3000) |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

### Backend

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Compile TypeScript |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## 🔌 API Endpoints

Base URL: `http://localhost:5000/api`

### Products

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/products` | List all products |
| POST | `/products` | Create product |
| GET | `/products/:id` | Get single product |
| PUT | `/products/:id` | Update product |
| DELETE | `/products/:id` | Delete product |
| POST | `/products/random` | Get random products |

### Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/orders` | List all orders |
| POST | `/orders` | Create order |
| GET | `/orders/:id` | Get single order |
| PUT | `/orders/:id` | Update order |
| PATCH | `/orders/:id` | Update status |
| DELETE | `/orders/:id` | Cancel order |

### Stats

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/stats` | Dashboard statistics |

## 🎨 Design System

### Color Palette (Kawaii Theme)

| Color | Hex | Usage |
|-------|-----|-------|
| Sakura | `#FFB6C1` | Primary pink |
| Lavender | `#E6E6FA` | Secondary purple |
| Mint | `#B2F5EA` | Accent teal |
| Peach | `#FFDAB9` | Warm accent |
| Sky | `#87CEEB` | Cool accent |

### Typography

- **Primary Font**: Quicksand
- **Secondary Font**: Nunito

## 📱 User Flow

1. **Home** → Choose contest (₹100/₹299/₹499)
2. **Contest Details** → Pay & start game
3. **Wheel Spin** → Win mystery boxes
4. **Box Reveal** → Tap boxes to reveal products
5. **Add to Cart** → Select your favorites
6. **Checkout** → Enter shipping info
7. **Order Confirmation** → 🎉

## 🔐 Admin Panel

Access at `/admin` to:
- View dashboard statistics
- Add/edit/delete products
- Manage orders and update status
- Track inventory

## 🚀 Deployment

### Frontend (Vercel)

1. Connect repo to Vercel
2. Set root directory to `frontend`
3. Add `NEXT_PUBLIC_API_URL` environment variable
4. Deploy!

### Backend (Railway/Render/Fly.io)

1. Set root directory to `backend`
2. Build command: `npm run build`
3. Start command: `npm run start`
4. Add environment variables

## 📦 Dependencies

All dependencies are set to stable versions compatible for 2+ years:

- **React 19** (RC) - Latest with improved features
- **Next.js 15** - App Router, Server Components
- **Express 4.21** - Battle-tested, maintained
- **Mongoose 8** - MongoDB ODM
- **ESLint 9** - New flat config format
- **TypeScript 5.7** - Latest stable

## 📄 License

MIT License - feel free to use for personal or commercial projects!

---

Made with 💖 by mystrix Team

🎁 Happy Scooping! ✨
