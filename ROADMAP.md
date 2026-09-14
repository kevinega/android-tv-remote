# Product Roadmap: Android TV Remote

This document tracks the upcoming features, improvements, and long-term goals for the Android TV Remote Web App.

## 🏃 Upcoming Features (Next Up)

- [ ] **Paired Status in Scan List**
  - **Description**: Add a visual flag/badge (e.g., "✅ Paired") next to TVs in the mDNS scan list if their IP address already exists in our `certs.json`.
  - **Goal**: Allow users to know immediately which TVs they can connect to without a PIN prompt.

- [ ] **Expanded Action Buttons (Menu & Input)**
  - **Description**: Add dedicated physical buttons for "Menu" (Settings) and "Input" (Source/HDMI change).
  - **Goal**: Make the remote a complete replacement for the physical TV remote.

## 🎨 UI/UX Improvements

- [ ] **Design Polish & Animations**
  - **Description**: Further improve the "Glassmorphism" aesthetics. Add micro-animations (like a glowing effect on connection, smoother transitions between screens, and better layout scaling for tablets).
  - **Goal**: Achieve a premium, native-app feel within the browser.

## ⌨️ Advanced Controls

- [ ] **Toggleable Keyboard Input**
  - **Description**: Add a keyboard button that toggles a text input field on the phone. When the user types on their phone keyboard, the text is instantly injected into the TV's search/input fields using the IME text injection protocol (`sendText`).
  - **Goal**: End the nightmare of typing passwords and search queries using a D-Pad.

- [ ] **Quick App Launchers**
  - **Description**: Add dedicated launcher buttons with icons for popular apps (Netflix, YouTube, Prime Video, Spotify).
  - **Goal**: One-tap access to media apps using Android deep links (`sendAppLink`).

---

## 💡 Agent's Feasible Ideas

Here are a few highly feasible features we can add easily using our current architecture:

- [ ] **Multi-TV Support (Profiles)**
  - **Description**: Allow the user to save multiple paired TVs (e.g., "Living Room", "Bedroom") and switch between them using a simple dropdown at the top of the remote.
  - **Feasibility**: High. We already store multiple certs in `certs.json`, we just need a UI to manage them.

- [ ] **Live Power Status & Mute Toggle**
  - **Description**: The TV protocol actually sends real-time status updates. We can make the Power button glow when the TV is ON, and add a dedicated "Mute" button.
  - **Feasibility**: High. The library emits `powered` and `volume` events that we can pass to the frontend via WebSockets or Server-Sent Events (SSE).

- [ ] **Trackpad / Swipe Navigation Mode**
  - **Description**: Instead of just tapping D-Pad buttons, add a "Trackpad" mode where users can swipe up/down/left/right on an empty area on their phone screen to navigate.
  - **Feasibility**: Medium-High. We just need to capture touch events (swipe gestures) in JS and translate them to directional commands.

---

*Got more ideas? Feel free to open a Pull Request or Issue!*
