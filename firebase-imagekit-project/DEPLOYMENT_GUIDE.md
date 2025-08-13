# Firebase + ImageKit Deployment Kılavuzu

Bu kılavuz, Firebase Hosting + ImageKit Storage entegrasyonlu foto yükleme projenizi deploy etmeniz için gereken tüm adımları içerir.

## 🚀 Hızlı Deployment

### 1. Firebase Proje Kurulumu

```bash
# Firebase CLI kurulumu (global)
npm install -g firebase-tools

# Firebase'e login
firebase login

# Mevcut dizinde Firebase projesini başlat
firebase init
```

**Firebase Init Seçenekleri:**
- ✅ **Functions** (Cloud Functions for Firebase)
- ✅ **Hosting** (Firebase Hosting) 
- ❌ Firestore, Storage vs. (Bu projede gerekli değil)

### 2. Environment Variables Ayarlama

**Firebase Functions için secrets:**
```bash
# ImageKit Private Key (EN ÖNEMLİ - GİZLİ!)
firebase functions:secrets:set IMAGEKIT_PRIVATE_KEY

# Diğer environment variables
firebase functions:config:set imagekit.public_key="your_public_key"
firebase functions:config:set imagekit.url_endpoint="https://ik.imagekit.io/your_id"
```

### 3. Config Dosyalarını Güncelleme

**public/firebase-config.js - GERÇEKLE DEĞİŞTİRİN:**
```javascript
// PLACEHOLDER'LARI DEĞİŞTİRİN:
const firebaseConfig = {
    apiKey: "AIzaSyBxxxxx-GERÇEK-API-KEY",           // Firebase'den kopyalayın
    authDomain: "your-project-id.firebaseapp.com",  // Proje ID'nizi yazın
    projectId: "your-actual-project-id",            // Firebase proje ID'si
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "123456789012",              // Firebase'den alın
    appId: "1:123456789012:web:abcdef1234567890"    // Firebase'den alın
};

const imagekitConfig = {
    publicKey: "public_xxxxxxxxxxxxxxxxxxxxxxxx",    // ImageKit public key
    urlEndpoint: "https://ik.imagekit.io/your-id",   // ImageKit URL endpoint  
    authenticationEndpoint: "https://your-region-your-project.cloudfunctions.net/imagekitAuth"  // Deploy sonrası
};
```

**.firebaserc:**
```json
{
  "projects": {
    "default": "your-actual-project-id"
  }
}
```

### 4. Firebase Authentication Kurulumu

**Firebase Console'da:**
1. **Authentication** → **Sign-in method**
2. **Email/Password** provider'ını aktif et  
3. **Users** → **Add user** ile admin kullanıcısı ekle
4. **ÖNEMLİ**: Admin email/password'u not alın (giriş için gerekli)
5. Örnek: admin@yourdomain.com / güçlüŞifre123!

### 5. Deploy Işlemleri

```bash
# Functions dependencies kurulumu
cd functions
npm install

# Functions build ve deploy
cd ..
firebase deploy --only functions

# Hosting deploy
firebase deploy --only hosting

# Ya da her şeyi birden
firebase deploy
```

## 🔐 Güvenlik Kontrolleri

### Firebase Security Rules
```javascript
// Hosting güvenliği firebase.json'da cache headers ile sağlanır
// Functions güvenliği JWT token verification ile sağlanır
```

### ImageKit Güvenlik
- ✅ Private Key sadece Firebase Functions'da
- ✅ Public Key frontend'de güvenli
- ✅ Authentication endpoint protected
- ✅ CORS yapılandırması aktif

## 📊 Free Tier Limitleri ve İzleme

### Firebase Limits (Spark Plan)
```
Hosting: 10 GB storage, 10 GB/month transfer
Functions: 125K invocations/month, 40K GB-seconds/month
Authentication: 50K/month
```

### ImageKit Limits (Free Plan)
```
Storage: 20 GB
Bandwidth: 20 GB/month
Transformations: 20,000/month
```

### İzleme Araçları
```bash
# Firebase console metrics
# ImageKit dashboard analytics
# Browser network tab

# Function logs
firebase functions:log

# Real-time monitoring
firebase functions:log --follow
```

## 🛠️ Production Optimizasyonları

### 1. Cache Strategy
```javascript
// firebase.json'da cache headers optimize edildi:
// Images: 1 year cache
// CSS/JS: 1 year cache  
// HTML: No cache (always fresh)
```

### 2. Image Optimization Pipeline
```javascript
// Client-side optimizations:
1. Canvas resize (max 1080px)
2. WebP conversion (with fallback)  
3. Quality optimization (85% JPG, 80% WebP)

// ImageKit CDN optimizations:
1. Auto format selection
2. Auto quality adjustment
3. Responsive images ready
```

### 3. Performance Monitoring
```bash
# Core Web Vitals tracking
# Firebase Performance Monitoring
# ImageKit Analytics Dashboard
```

## 🐛 Troubleshooting

### Yaygın Sorunlar

**1. Functions Deploy Hatası:**
```bash
# TypeScript build hatası
cd functions && npm run build

# Dependencies eksik  
cd functions && npm install

# Environment variables eksik
firebase functions:secrets:set IMAGEKIT_PRIVATE_KEY
```

**2. CORS Hatası:**
```javascript
// functions/src/index.ts'de CORS config kontrol et
const corsHandler = cors({
    origin: true, // Production'da specific domains kullan
    credentials: true
});
```

**3. Authentication Hatası:**
```javascript
// firebase-config.js'de authDomain kontrol et
authDomain: "your-project-id.firebaseapp.com"

// Console'da Email/Password provider aktif mi kontrol et
```

**4. ImageKit Upload Hatası:**
```javascript
// public/firebase-config.js'de endpoint kontrol et
authenticationEndpoint: "https://region-project.cloudfunctions.net/imagekitAuth"

// ImageKit console'da upload settings kontrol et
```

### Debug Komutları

```bash
# Local test
firebase emulators:start

# Function logs
firebase functions:log --filter="imagekitAuth"

# Hosting local serve
firebase serve

# Config verification
firebase functions:config:get
```

## 📈 Production Checklist

### Deploy Öncesi
- [ ] Firebase config güncellendi
- [ ] ImageKit config güncellendi  
- [ ] Environment variables set edildi
- [ ] Admin kullanıcısı eklendi
- [ ] Functions test edildi
- [ ] Hosting test edildi

### Deploy Sonrası
- [ ] Live site çalışıyor
- [ ] Admin login başarılı
- [ ] File upload başarılı
- [ ] Images CDN'den servis ediliyor
- [ ] Cache headers doğru
- [ ] Mobile responsive

### Monitoring Setup
- [ ] Firebase console alerts
- [ ] ImageKit quota monitoring  
- [ ] Error tracking aktif
- [ ] Performance monitoring

## 🎯 Next Steps

Deploy sonrası yapılacaklar:
1. **Custom Domain** bağlama (opsiyonel)
2. **SSL Certificate** otomatik aktif
3. **Analytics** integration
4. **Backup** stratejisi
5. **Scaling** planlaması

---

**🎉 Tebrikler!** Projeniz artık production'da çalışıyor ve kullanıma hazır!