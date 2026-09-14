# Android TV Remote (Web App)

A beautiful, glassmorphic web-based remote control for Android TV and Google TV devices. It uses the official Android TV Remote Service (v2) protocol with a secure PIN pairing handshake, avoiding the need for ADB or Developer Options.

## Architecture

This project consists of:
1. **Frontend**: A modern UI built with Vanilla HTML/CSS/JS. It runs in your browser and is responsive for mobile devices.
2. **Backend**: A tiny Node.js bridge server. Because browsers cannot natively open raw TCP/TLS sockets required by the Android TV Protocol v2, this server handles the secure connection to the TV and exposes a simple HTTP API for the frontend.

## Prerequisites

- Node.js (v18 or newer recommended)
- An Android TV / Google TV on the same local network (WiFi) as your computer.

## Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/kevinega/android-tv-remote.git
   cd android-tv-remote
   ```
2. Install the dependencies:
   ```bash
   npm install
   ```

## How to Use

1. **Start the backend server**:
   ```bash
   npm run dev
   # or `npm start` for production mode
   ```
   The server will start on port `3000`.

2. **Open the Remote Interface**:
   - On the same computer: Open `http://localhost:3000` in your web browser.
   - On your phone (Highly Recommended): Find your computer's local IP address (e.g., `192.168.1.5`) and navigate to `http://192.168.1.5:3000` on your phone's browser (Safari/Chrome). Using a mobile device will enable haptic feedback when pressing buttons!

3. **Pairing with your TV** (First time only):
   - Enter your TV's local IP address (e.g., `192.168.1.15`) into the app and click **Connect**.
   - Your TV will display a 6-digit PIN on the screen.
   - Enter this PIN into the web app and click **Pair**.
   - Once paired, the remote interface will load. The pairing certificate is saved locally in `certs.json`, so you won't need to enter a PIN again in the future.

## How to Contribute

Contributions, issues, and feature requests are welcome! Since this is an open-source project, your help in making it better is highly appreciated.

1. **Fork the Project**
2. **Create your Feature Branch**: `git checkout -b feature/AmazingFeature`
3. **Commit your Changes**: `git commit -m 'Add some AmazingFeature'`
4. **Push to the Branch**: `git push origin feature/AmazingFeature`
5. **Open a Pull Request**

### Ideas for Contributions
- Adding support for keyboard/text input injection.
- Adding specific app launch shortcuts (Netflix, YouTube, etc.).
- Improving the UI/UX for tablet layouts.
- Packaging the Node.js server into a standalone executable (e.g., using `pkg` or Electron).

## License

Distributed under the GNU General Public License v3.0 (GPLv3). See `LICENSE` for more information.
