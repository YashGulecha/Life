# Mobile APK Compilation Guide (Non-Tech Friendly)

This guide explains how to convert the **Pulse Life OS** web app into a mobile application (`.apk` file) that you can manually install on your Android phone.

---

## How It Works (Concept)
We use a tool called **Capacitor**. Think of Capacitor as a native Android "shell" or a dedicated browser wrapper. It packages the React code we built (HTML, CSS, JS) and runs it locally on your phone while letting the app connect to your server at `https://life.yashgulecha.in/api`.

Since you are a non-technical user, you have two primary routes to get the APK. **Route 1 (GitHub Actions)** is highly recommended because it requires **zero installation** on your computer.

---

## Route 1: Automatic Build via GitHub (Easiest & Recommended)
If you host your code in a private or public GitHub repository, you can set up a "GitHub Action." Every time you update the code, GitHub's servers will automatically build the APK for you and provide a download link.

### Step 1: Add the GitHub Action file
Create a folder structure in your project: `.github/workflows/android.yml`.
Inside this file, paste a standard build script (we can create this file for you if you'd like).

### Step 2: Push to GitHub
Upload your code to GitHub.

### Step 3: Download the APK
1. Go to your repository on github.com.
2. Click on the **Actions** tab at the top.
3. Click on the latest run.
4. Under **Artifacts**, you will see a link to download your `app-debug.apk`.
5. Send this file to your phone and install it!

---

## Route 2: Local Build using Android Studio (If you want to build on your PC)
This route requires setting up software on your local computer.

### Step 1: Install prerequisites
On your PC/Mac, install:
1.  **Node.js** (Click next-next-finish on the installer).
2.  **Android Studio** (The official software to build Android apps).

### Step 2: Initialize Capacitor Android
In your project directory, open your terminal/command prompt and run:
```bash
# 1. Install project libraries
npm install

# 2. Build the React web files
npm run build

# 3. Add the native Android folder
npx cap add android
```

### Step 3: Generate the APK in Android Studio
1.  Open **Android Studio**.
2.  Click **Open Project** and select the `/home/ubuntu/docker/life/frontend/android` folder.
3.  Wait 2-3 minutes for Android Studio to index the files (you will see a loading bar at the bottom).
4.  In the top menu, go to: **Build** $\rightarrow$ **Build Bundle(s) / APK(s)** $\rightarrow$ **Build APK(s)**.
5.  Once done, a popup in the bottom-right will say "APK(s) generated successfully." Click **Locate**.
6.  Copy the `app-debug.apk` file to your phone.

---

## Installing the APK on your Android Phone
Since this app is not on the Google Play Store, Android will block it by default as an "Unknown Source." Here is how to install it:

1.  **Transfer the File**: Email the `.apk` file to yourself, send it via Telegram/WhatsApp, or upload it to Google Drive.
2.  **Open the File**: Tap on the `.apk` file on your phone.
3.  **Allow Installation**: A prompt will say "For your security, your phone is not allowed to install unknown apps from this source."
4.  Tap **Settings**, then toggle on **Allow from this source**.
5.  Go back and tap **Install**.
6.  Open **Pulse** and log in using your email and password!
