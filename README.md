# 🏥 MedShare — Smart Emergency Healthcare & Medicine Allocation Platform

> **MedShare** is a next-generation, role-based healthcare platform built for real-time medicine search, emergency allocation, smart hospital-pharmacy supply transfers, and AI-driven healthcare assistance.

---

## 🌟 Key Features

### 👤 Citizen Patient Portal (`/patient/*`)
- **Real-Time Medicine Search**: Instant availability lookup across nearby licensed pharmacies and hospital dispensaries.
- **Visual Image Search**: Upload pill images or prescription photos for AI-powered identification and instant inventory matching.
- **Smart Location & Interactive Map**: Interactive Leaflet maps with live navigation routes, distance calculations, and stock indicators.
- **Medicine Reservations**: Secure medicine reservations with QR code generation for quick counter pick-ups.
- **24/7 AI Healthcare Assistant**: Built-in Gemini AI Chatbot for dosage guidance, substitute suggestions, and emergency advice.

### 🏪 Pharmacy Portal (`/pharmacy/*`)
- **Inventory Management**: Real-time batch management, expiry tracking, stock alerts, and threshold notifications.
- **Reservation Processing**: Scan or verify patient QR codes to fulfill or manage reservations.
- **Direct Hospital Transfer Requests**: View and fulfill emergency medicine supply requests from neighboring hospitals.
- **Live Dispatch Tracker**: Monitor active dispatches and courier routes.

### 🏥 Hospital Hub (`/hospital/*`)
- **Emergency Broadcast Requests**: Broadcast urgent medicine requirements to surrounding pharmacies when critical inventory drops.
- **Inter-Hospital Transfers**: Request and coordinate inventory transfers with neighboring medical centers.
- **ICU & Ward Stock Monitoring**: Track emergency drug availability across hospital departments.

### 🛡️ Drug Control Admin Console (`/admin/*`)
- **Facility Verification**: Audit and approve/reject new pharmacy and hospital registration applications.
- **System-Wide Inventory Oversight**: National/Regional supply monitoring dashboard to combat artificial shortages.
- **Real-Time Operations Grid**: Security logs, system metrics, and active emergency request tracking.

---

## 🔐 Strict Role-Based Access Control (RBAC)

MedShare features strict JWT-backed authentication and isolated routing layouts:

| Role | Accessible Portal Route | Authorized Capabilities |
| :--- | :--- | :--- |
| `PATIENT` | `/patient/*` | Medicine search, reservations, maps, chatbot |
| `PHARMACY` | `/pharmacy/*` | Inventory control, reservation fulfillment, hospital transfer requests |
| `HOSPITAL` | `/hospital/*` | Emergency requests, inter-hospital transfers, inventory |
| `ADMIN` | `/admin/*` | Facility licensing, system audit, platform oversight |

*Unauthorized route access automatically redirects users to their designated role dashboard.*

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Leaflet / React-Leaflet
- **Backend**: Node.js, Express.js, JWT Authentication
- **Database**: MongoDB (via Mongoose / Native Driver)
- **AI Integration**: Google Gemini AI API (`@google/genai`)
- **Environment**: Cross-env configuration with `.env` shielding

---

## 📂 Project Structure

```
SIH project/
├── .env.example                # Template for environment variables (Safe for Git)
├── .gitignore                  # Prevents committing sensitive files (.env, node_modules)
├── server.js                   # Express.js REST API Backend server
├── index.html                  # HTML entry point
├── package.json                # Node dependencies and build scripts
├── src/
│   ├── App.tsx                 # Master App component with RBAC routing
│   ├── components/             # Reusable UI components & Console Layouts
│   │   ├── common/             # Navbar, Footer, ConsoleLayout, Protection
│   │   └── AI/                 # Floating AI Chatbot Assistant
│   ├── context/                # React AppContext (Auth, Search, Inventory, State)
│   ├── pages/                  # Page views grouped by role
│   │   ├── admin/              # Admin Dashboard pages
│   │   ├── hospital/           # Hospital Hub pages
│   │   ├── patient/            # Patient Search & Reservation pages
│   │   └── pharmacy/           # Pharmacy Inventory & Request pages
│   ├── services/               # Gemini AI & API service modules
│   └── types/                  # TypeScript interfaces & types
└── backend/                    # Additional microservice components
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18.x or higher)
- **npm** or **yarn**
- **MongoDB Community Server** (Running locally on `mongodb://127.0.0.1:27017` or MongoDB Atlas URI)

### 2. Environment Setup
Create a `.env` file in the project root directory (do **NOT** commit this file to GitHub):

```env
PORT=8080
MONGODB_URI=mongodb://127.0.0.1:27017/medshare_db
JWT_SECRET=your_jwt_secret_key
GEMINI_API_KEY=your_gemini_api_key
VITE_GEMINI_API_KEY=your_gemini_api_key
```

*(You can copy `.env.example` to `.env` as a reference).*

### 3. Installation
Install all project dependencies:

```bash
npm install
```

### 4. Running the Application

#### Start the Backend API Server:
```bash
node server.js
```
*Backend runs at `http://localhost:8080/api/`*

#### Start the Frontend Development Server (in a separate terminal):
```bash
npm run dev
```
*Frontend runs at `http://localhost:5173/`*

#### Production Build & Verification:
```bash
npm run build
```

---

## 🔒 Security & Git Notice

- **`.env` Ignored**: The `.env` file containing sensitive credentials (API keys, DB URIs, secrets) is explicitly listed in `.gitignore` and **will not be pushed to GitHub**.
- **No hardcoded secrets**: All API keys are loaded dynamically via environment variables (`process.env` / `import.meta.env`).

---

## 📜 License
Developed for Smart India Hackathon (SIH) — Healthcare & MedTech Domain.
