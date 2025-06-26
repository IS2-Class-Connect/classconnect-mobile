# 📱 ClassConnect - Frontend

ClassConnect is a mobile educational app built with React Native + Expo. It is designed to help manage classes, assignments, and communication between students and teachers.

---

## 📑 Table of Contents

- [🛠 Technologies Used](#-technologies-used)
- [🔐 Authentication](#-authentication)
- [🧭 Navigation (expo-router)](#-navigation-expo-router)
- [📄 Key Screens (/screens)](#-key-screens-screens)
- [📂 Services (/services)](#-services-services)
- [🎨 Design System](#-design-system)
- [🧱 UI Components (/components/ui)](#-ui-components-componentsui)
- [🧠 Contexts](#-contexts)
- [📦 Firebase](#-firebase)
- [📂 .env Configuration](#-env-configuration)
- [⚙️ Expo Configuration](#-expo-configuration)
- [📦 Package Management](#-package-management)
- [📄 License](#-license)

---

## 🛠 Technologies Used

ClassConnect uses the following technologies and libraries:

- **React Native**: Framework for building mobile applications.
- **Expo**: Toolset to streamline development with React Native.
- **Firebase**: For authentication, file uploads, and future database integration.
- **Prisma**: For backend integration (Firestore or another future database).
- **React Navigation**: Navigation between screens, structured in tabs.
- **Axios**: For making HTTP requests.
- **React Query**: For handling asynchronous data.
- **Moti**: Animation library for React Native.
- **React Native Gifted Charts**: For displaying charts and graphs.
- **React Native Paper**: For material UI components.
- **Victory Native**: For creating charts and data visualizations.
- **Expo Secure Store**: For storing sensitive data securely.
- **Expo Local Authentication**: For biometric login.
- **Expo Notifications**: For handling notifications.
- **React Native Gesture Handler**: For better gesture support and performance.
- **React Native Reanimated**: For animations and transitions.
- **React Native Webview**: To display web content inside the app.

---

## 🔐 Authentication

- Firebase Authentication handles login and registration.
- Supports login via email/password and Google using expo-auth-session.
- Biometric Authentication is available on supported devices via `BiometricPromptScreen.tsx`.
- The `AuthContext` uses `onAuthStateChanged` to expose the current user and `isLoading` states globally.
- Post-login redirection happens through `StartupScreen.tsx`.

---

## 🧭 Navigation (expo-router)

The app is structured with tab navigation, organized into functional folders using expo-router:

```
app/
├── (auth)/                  → Authentication screens (login, biometric)
├── (courses)/               → Courses and modules management
├── (tabs)/                  → Main navigation with tabs
├── (users)/                 → User-related screens (profile, search)
├── index.tsx                → Main home tab
├── _layout.tsx              → Navigation configuration
```

---

## 📄 Key Screens (/screens)

**Authentication:**
- `LoginScreen.tsx`: Traditional login screen.
- `RegisterScreen.tsx`: Screen for new user registration.
- `BiometricPromptScreen.tsx`: Screen for biometric authentication.

**Courses & Modules:**
- `CoursesScreen.tsx`: Displays a list of courses.
- `ModulesScreen.tsx`: Displays modules under each course.
- `ModuleDetailScreen.tsx`: Detailed view of a specific module.

**Communication:**
- `ChatScreen.tsx`: A chat interface with Classy, an AI powered by Gemini for educational communication.

**User Management:**
- `ProfileScreen.tsx`: Displays and allows editing of the user's profile.
- `SearchUsersScreen.tsx`: Allows searching for other users.

**Activity Registration:**
- `ActivityRegisterScreen.tsx`: Allows registration of new activities.

**Startup:**
- `StartupScreen.tsx`: Determines the flow after login (e.g., loading user state).

**Others:**
- `FeedbackModal.tsx`: Modal for submitting feedback.
- `StudentsSubmissionsModal.tsx`: Modal for viewing student submissions.
- `AssessmentScreen.tsx`: Screen displaying the list of assessments.
- `AssessmentDetailScreen.tsx`: Detailed view of an assessment.
- `ExercisesScreen.tsx`: Displays exercises for an assessment.
- `CorrectionExerciseScreen.tsx`: Allows instructors to correct student submissions.
- `CourseStatsScreen.tsx`: Displays course statistics.

---

## 📂 Services (/services)

External logic modules to decouple the app’s business logic:

- `chatIA.ts`: Handles the integration of AI in chat for educational purposes.
- `coursesApi.ts`, `modulesMockApi.ts`: APIs for interacting with courses (either mock or real backend).
- `userApi.ts`, `notifications.ts`, `emailService.ts`, `gatewayClient.ts`: Future integrations and utilities.

---

## 🎨 Design System

Centralized in the `/constants` folder:

- `colors.ts`: Token definitions for background, surface, text, buttonPrimary, etc., supporting both light and dark themes.
- `fonts.ts`: Font sizes (xs to xxl), family (SpaceMono), and weights (regular, medium, bold).
- `spacing.ts`: Modular scale for spacing (xs: 4, ..., xl: 32).

---

## 🧱 UI Components (/components/ui)

Reusable UI components without any internal state logic:

- Alerts, Buttons, Cards, Fields, Forms.

---

## 🧠 Contexts

- `AuthContext.tsx`: Manages login/logout and user state.
- `ThemeContext.tsx`: Manages light/dark theme switching.
- `providers/index.tsx`: Combines and exposes the contexts globally.

---

## 📦 Firebase

The `/firebase` folder contains all Firebase logic:

- `auth.ts`: Handles login, registration, and logout with Firebase.
- `config.ts`: Initializes Firebase configuration.
- `upload.ts`: Handles file uploads to Firebase.
- `index.ts`: Centralizes Firebase exports for easy imports.

---

## 📂 .env Configuration

To set up Firebase and other configuration, create a `.env` file in the root of your project with the following:

```env
# Firebase config (from Firebase Console)
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
EXPO_PUBLIC_GATEWAY_URL=
EXPO_PUBLIC_GATEWAY_TOKEN=
```
Ensure to replace the values with your actual Firebase and Gateway credentials.

---

## ⚙️ Expo Configuration

ClassConnect uses Expo, which simplifies building and deploying React Native apps. The configuration for Expo is defined in the `app.json` file.

```json
{
  "expo": {
    "name": "ClassConnect",
    "slug": "classconnect-mobile",
    "version": "1.0.0",
    "sdkVersion": "53.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "classconnect",
    "userInterfaceStyle": "automatic",
    "jsEngine": "jsc",
    "plugins": [
      "expo-router",
      [
        "expo-splash-screen",
        {
          "image": "./assets/images/splash-icon.png",
          "resizeMode": "contain",
          "backgroundColor": "#ffffff"
        }
      ],
      "expo-secure-store",
      "expo-web-browser",
      "expo-video"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.classconnect.mobile",
      "infoPlist": {
        "ITSAppUsesNonExemptEncryption": false
      }
    },
    "android": {
      "package": "com.classconnect.mobile",
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "intentFilters": [
        {
          "action": "VIEW",
          "data": [
            {
              "scheme": "classconnect",
              "host": "auth-callback"
            }
          ],
          "category": [
            "BROWSABLE",
            "DEFAULT"
          ]
        }
      ],
      "permissions": [],
      "versionCode": 1
    },
    "web": {
      "favicon": "./assets/images/favicon.png",
      "output": "static"
    },
    "extra": {
      "eas": {
        "projectId": "8a4a7368-63c3-4bf8-91e1-9a9d4910eb6f"
      },
      "router": {
        "origin": false
      }
    },
    "owner": "classconnect"
  }
}
```

---

## 📦 Package Management

### Install Dependencies

```bash
npm install
```

### Running the App

To start the app in development mode:

```bash
expo start
```

Run on Android:

```bash
expo run:android
```

Run on iOS:

```bash
expo run:ios
```

Run for web:

```bash
expo start --web
```

### Common Scripts

Test:

```bash
jest --watchAll
```

Lint:

```bash
expo lint
```

### Dependencies Overview

Core libraries: expo, expo-router, expo-secure-store, firebase, react-navigation, axios, react-native-paper.

UI and Animation: moti, react-native-animatable, react-native-gifted-charts, victory-native.

Development: jest, metro, babel.

---

## 📄 License

This project is licensed under the MIT License.

