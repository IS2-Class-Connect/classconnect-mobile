# 📱 ClassConnect Mobile

**Mobile frontend for the ClassConnect application**, built with **React Native** and **Expo**.  
Designed for both **students and teachers**, this app enables the management of **classes, assignments, exams, messaging**, and **educational resources**.

ClassConnect integrates with multiple **microservices** and uses **Firebase** for authentication and persistent storage.

---

## 📚 Table of Contents

- [🚀 Features](#-features)
- [📦 Tech Stack](#-tech-stack)
- [🔧 Installation](#-installation)
- [🧪 Development](#-development)
- [📱 App Structure](#-app-structure)
- [🖼️ Screenshots](#-screenshots)
- [🤝 Contributing](#-contributing)
- [🛡 License](#-license)

---

## 🚀 Features

- 🔐 **Google & Email authentication** via Firebase
- 🧑‍🏫 **Role-based flows** for students and teachers
- 📅 **Class schedule & assignments**
- ✍️ **Exam and task submissions**
- 💬 **Messaging system**
- 📁 **Resource sharing**
- ☁️ **Cloud sync** and persistent sessions

---

## 📦 Tech Stack

- **React Native** with [Expo](https://expo.dev/)
- **TypeScript** for type safety
- **Firebase** (Auth, Firestore)
- **Expo Router** for navigation
- **AsyncStorage** for local persistence
- **ShadCN-style UI** with custom theming
- **Microservice backend** integration via REST

---

## 🔧 Installation

```bash
git clone https://github.com/your-org/classconnect-mobile.git
cd classconnect-mobile
npm install
```

---

## 🧪 Development

Start the project with:

```bash
npx expo start --tunnel
```

Scan the QR code with **Expo Go** on your phone.

> ⚠️ For Google Sign-In to work, use `--tunnel` and ensure your redirect URI is registered in Firebase.

---

## 📱 App Structure

```
.
├── app/                     # Screens and routing
├── components/ui/           # Shared UI components (buttons, forms, etc.)
├── constants/               # Fonts, colors, spacing
├── context/                 # Theme and Auth providers
├── firebase/                # Firebase setup and methods
├── hooks/                   # Custom hooks (e.g., useAuth)
├── assets/                  # Images and icons
```

---

## 🖼️ Screenshots

_Coming soon..._

---

## 🛡 License

MIT © [ClassConnect Team](https://github.com/your-org)