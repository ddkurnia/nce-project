# 🏛️ Nusantara Commodity Exchange (NCE)

> **Digital Marketplace for Real Commodities**  
> Connecting Indonesian Producers to National & Global Buyers

---

## 🌐 Overview

NCE adalah platform digital marketplace yang menghubungkan produsen komoditas Indonesia dengan pembeli nasional dan global. Dibangun dengan arsitektur enterprise modern, dark fintech theme (Binance/Bloomberg style), full-stack JavaScript, dan sekarang tersedia sebagai **Android App** via Capacitor.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | HTML5, Tailwind CSS, Vanilla JavaScript ES6 Modules |
| **Mobile** | Capacitor 6 (Android) |
| **Backend** | Node.js, Express.js |
| **Database** | Firebase Firestore |
| **Authentication** | Firebase Auth |
| **Storage** | Cloudinary |
| **Push Notifications** | Firebase Cloud Messaging (FCM) |
| **Deployment** | GitHub Pages (Frontend), Railway (Backend API), Play Store (Android) |

---

## 📁 Project Structure

```
/frontend
│   ├── index.html              # Landing page
│   ├── commodities.html        # Commodity marketplace
│   ├── buy-requests.html       # Buy requests
│   ├── property.html           # Property exchange
│   ├── dashboard.html          # Dashboard
│   ├── profile.html            # Company profile
│   ├── capacitor.config.json   # Capacitor configuration
│   ├── android/                # Android native project (Capacitor)
│   └── assets/
│       ├── css/main.css        # Dark fintech theme + mobile styles
│       ├── images/             # App icons & splash screens
│       └── js/
│           ├── config/         # Firebase + Mobile config
│           ├── services/       # API + Notification + Device services
│           ├── modules/        # Page modules + Mobile module
│           ├── components/     # UI + Bottom Nav + Drawer + Loading
│           └── utils/          # Formatter, Validator, Helpers

/backend
│   ├── server.js               # Express server
│   ├── config/                 # Firebase, Cloudinary, Environment
│   ├── routes/                 # API routes
│   ├── controllers/            # Request handlers
│   ├── services/               # Business logic
│   ├── middleware/              # Auth, Role, Error, Upload
│   └── utils/                  # Logger, Response, Validator
```

---

## ✨ Features (v1)

1. **Dashboard** — Statistik pasar, grafik harga, recent activity
2. **Commodity Marketplace** — 8 komoditas (Pinang, Kelapa, Sawit, Kakao, Kopi, Karet, Sagu, Rumput Laut)
3. **Commodity Detail** — Harga, volume, lokasi, seller, verified badge
4. **Buy Request** — Buyer buat permintaan (komoditas, volume, target harga, lokasi)
5. **Bid & Offer** — Seller kirim penawaran, buyer accept/reject
6. **Verified Seller** — Badge: Verified Supplier, Verified Buyer, Verified Exporter
7. **Company Profile** — Nama perusahaan, NPWP, lokasi, komoditas, rating
8. **Property Exchange** — Rumah, Tanah, Ruko, Gudang
9. **WhatsApp Chat** — Floating button integrasi
10. **Admin Panel** — Kelola user, listing, buy request, verifikasi akun
11. **Android App** — Native mobile experience via Capacitor
12. **Push Notifications** — Firebase FCM ready
13. **Bottom Navigation** — Mobile-optimized navigation bar
14. **Mobile Drawer** — Slide-out menu with gesture support

---

## 🚀 Getting Started

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your Firebase & Cloudinary credentials
npm install
npm start
# Server runs on http://localhost:3001
```

### Frontend (Web)

```bash
cd frontend
# Serve with any static server
npx serve .
# Or deploy to GitHub Pages
```

### Android App (Capacitor)

#### Prerequisites
- Node.js 18+
- Android Studio (latest)
- Java JDK 17+
- Android SDK (API 34+)

#### Setup

```bash
cd frontend
npm install
```

#### Build & Run

```bash
# Sync web assets to Android project
npx cap sync android

# Open in Android Studio
npx cap open android
```

Then run the app from Android Studio on emulator or device.

---

## 📱 Android Build Guide

### Generate Debug APK

```bash
cd frontend/android
./gradlew assembleDebug
```

APK output: `frontend/android/app/build/outputs/apk/debug/app-debug.apk`

### Generate Release APK

1. **Create keystore** (one time only):
```bash
keytool -genkey -v -keystore nce-release.keystore -alias nce -keyalg RSA -keysize 2048 -validity 10000
```

2. **Configure signing** — Edit `frontend/android/app/build.gradle`:
```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file('../../nce-release.keystore')
            storePassword 'your-keystore-password'
            keyAlias 'nce'
            keyPassword 'your-key-password'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

3. **Build release APK**:
```bash
cd frontend/android
./gradlew assembleRelease
```

APK output: `frontend/android/app/build/outputs/apk/release/app-release.apk`

### Generate AAB (Android App Bundle)

```bash
cd frontend/android
./gradlew bundleRelease
```

AAB output: `frontend/android/app/build/outputs/bundle/release/app-release.aab`

### Upload ke Google Play Store

1. Buka [Google Play Console](https://play.google.com/console)
2. Buat aplikasi baru
3. Pilih **Production** → **Create new release**
4. Upload file `.aab` (app-release.aab)
5. Isi release notes
6. Submit untuk review

#### Play Store Requirements
- **AAB format** (wajib, bukan APK)
- **Target SDK 34+** (Android 14)
- **Content rating** questionnaire
- **Privacy policy** URL
- **App signing** oleh Google Play (recommended)

---

## 🎨 Design Theme

- **Style**: Dark fintech (Binance / Bloomberg Terminal)
- **Primary**: Dark Navy (#0a0e27)
- **Accent**: Emerald Green (#10b981), Cyan (#06b6d4)
- **Cards**: #111827 with hover glow effects
- **Responsive**: Mobile, Tablet, Desktop
- **Safe Area**: Notch & gesture bar support (Android)

---

## 📊 Database Collections

| Collection | Description |
|-----------|-------------|
| `users` | User profiles & auth data |
| `commodities` | Commodity listings |
| `buyRequests` | Buyer requests |
| `offers` | Seller offers |
| `properties` | Property listings |
| `transactions` | Transaction records |
| `verifications` | Verification requests |
| `notifications` | User notifications |

---

## 📜 License

MIT License — © 2026 Nusantara Commodity Exchange
