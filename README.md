# 📱 ClassConnect Mobile

**ClassConnect Mobile** is the mobile frontend of the ClassConnect educational platform, built with React Native and Expo (TypeScript). This app provides students and teachers with a seamless mobile experience to manage their academic interactions, access resources, submit assignments, and receive feedback in real time.

---

## 📑 Table of Contents

- [🌐 Tech Stack](#-tech-stack)
- [🚀 Getting Started](#-getting-started)
- [📁 Project Structure](#-project-structure)
- [🧪 Testing & Quality](#-testing--quality)
- [📦 Environment Variables](#-environment-variables)
- [🔐 Security](#-security)
- [✅ Implemented User Stories](#-implemented-user-stories)
- [🧠 Authors](#-authors)
- [📄 License](#-license)
- [📌 Note](#-note)

---

## 🌐 Tech Stack

**Frontend:**

- React Native (Expo - TypeScript)
- Firebase Authentication
- Firebase Storage (for profile pictures and resources)
- React Navigation
- React Query / Axios (for backend integration)
- Firebase Realtime DB / FCM (for notifications)

**Backend Services (external):**

- Nest.js microservices
- PostgreSQL & MongoDB databases

**Microservices connected:**

- `users` – authentication, profile, roles
- `education` – courses, assignments, exams, feedback
- `communication` – chat and push/email notifications
- `gateway` – routes frontend requests to microservices

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/<your-org>/classconnect-mobile.git
cd classconnect-mobile
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the app in Expo Go

```bash
npx expo start
```

> **Note**: Use Expo Go on your mobile device to scan the QR code.

---

## 📁 Project Structure

```bash
classconnect-mobile/
├── assets/               # Images, icons, fonts
├── components/           # Reusable components
├── screens/              # Application screens (Login, Home, etc.)
├── navigation/           # React Navigation configs
├── constants/            # Colors, spacing, fonts
├── hooks/                # Custom hooks
├── services/             # Firebase, API integrations
├── context/              # React contexts (Auth, Theme, etc.)
├── utils/                # Helper functions
├── types/                # TypeScript interfaces & types
├── App.tsx               # Entry point
└── app.json              # Expo configuration
```

---

## 🧪 Testing & Quality

- Type-checking with TypeScript
- ESLint + Prettier for code quality
- Jest (planned for logic testing)
- Expo Go or dev build testing for auth flows (Google login, etc.)

---

## 📦 Environment Variables

Store them in a `.env` file (use `dotenv` or Expo `extra` config):

```env
FIREBASE_API_KEY=...
FIREBASE_AUTH_DOMAIN=...
FIREBASE_PROJECT_ID=...
FIREBASE_STORAGE_BUCKET=...
FIREBASE_MESSAGING_SENDER_ID=...
FIREBASE_APP_ID=...
```

---

## 🔐 Security

- **Authentication**: Firebase Auth (email/password + federated providers)
- **Authorization**: Based on roles from backend microservices
- **Storage rules**: Firebase Storage configured to allow only authenticated uploads
- **Sensitive data**: Managed via environment variables, not committed

---

## ✅ Implemented User Stories (Frontend Mobile)

### 🔐 Authentication & Users

-

### 👤 Profile Management

-

### 📚 Course Management

-

### 📝 Assignments & Exams

-

### 💬 Communication & Notifications

-

### 📊 Metrics & Analysis

-

---

## 🧠 Authors

Made with ❤️ by Marcos, Manuel, Sol, Martín, and Lorenzo\
For the Software Engineering II course – 2025 (UBA)

---

## 📄 License

This project is licensed under the MIT License. See the LICENSE file for details.

---

## 📌 Note

This is a university project developed for academic purposes. Some features like AI-based feedback generation and plagiarism detection are under active development or optional in the scope of the project.

For diagrams and additional technical documentation, refer to the ClassConnect Architecture repository.

