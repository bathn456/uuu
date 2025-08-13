# Firebase + ImageKit Foto Yükleme Projesi

Bu proje Replit üzerinde çalışan, Firebase Hosting + ImageKit Storage entegrasyonlu, tamamen ücretsiz planlar içinde kalacak şekilde tasarlanmış bir foto yükleme uygulamasıdır.

## ✨ Özellikler

- **🔐 Admin Kimlik Doğrulama**: Firebase Authentication ile güvenli admin girişi
- **🖼️ Akıllı Görsel Optimizasyonu**: Tarayıcı tarafında otomatik resize (max 1080px) ve WebP dönüşümü
- **☁️ CDN Optimizasyonu**: ImageKit üzerinden cache-control başlıklarıyla optimize edilmiş servis
- **🛡️ Güvenlik**: Private key'ler sadece backend'de, HTTPS zorunlu
- **📊 Limit Kontrolü**: Free tier kotalarını aşmayacak şekilde yapılandırılmış
- **⚡ Performans**: Modüler kod, async/await, minimal bağımlılık

## 🚀 Kurulum

### 1. Replit'te Çalıştırma

```bash
# Dependencies yüklenir (otomatik)
npm install

# Development server başlatılır
npm run dev
```

### 2. Firebase Yapılandırması

#### Firebase Console'da Proje Oluşturma:
1. [Firebase Console](https://console.firebase.google.com)'a git
2. "Add project" ile yeni proje oluştur
3. **Authentication** → **Sign-in method** → **Email/Password** aktif et
4. **Hosting** bölümünden hosting'i aktif et
5. **Functions** bölümünden Cloud Functions'ı aktif et

#### Admin Kullanıcısı Ekleme:
1. Authentication → Users → "Add user" 
2. Admin email/password ekle (örn: admin@yourdomain.com / güçlüŞifre123!)
3. Bu bilgileri not al (giriş için gerekli)
4. Bu email/password uygulamaya giriş için kullanılacak

#### Firebase Config Alma:
1. Project Settings → General → "Your apps" → Web app ekle
2. Config objesini kopyala (apiKey, projectId, authDomain vs.)
3. `public/firebase-config.js` dosyasındaki placeholder'ları gerçek değerlerle değiştir
4. ÖNEMLİ: Placeholder'ları değiştirmeyi unutmayın, yoksa uygulama çalışmaz

### 3. ImageKit Yapılandırması

#### ImageKit Account:
1. [ImageKit.io](https://imagekit.io) hesabı oluştur
2. Dashboard → Developer → API Keys:
   - **Public Key**: Frontend için
   - **Private Key**: Backend için (GİZLİ!)
   - **URL Endpoint**: CDN URL'i

#### Environment Variables (Replit Secrets):
```
IMAGEKIT_PRIVATE_KEY=your_private_key_here
IMAGEKIT_PUBLIC_KEY=your_public_key_here  
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id
FIREBASE_PROJECT_ID=your_project_id
```

### 4. Firebase Deployment

```bash
# Firebase CLI kurulumu
npm install -g firebase-tools

# Firebase'e login
firebase login

# Proje başlatma
firebase init

# Functions deploy
firebase deploy --only functions

# Hosting deploy  
firebase deploy --only hosting
```

## 📂 Proje Yapısı

```
firebase-imagekit-project/
├── public/                 # Frontend files
│   ├── index.html         # Ana sayfa
│   ├── styles.css         # Stil dosyası
│   ├── app.js            # Ana uygulama mantığı
│   ├── auth.js           # Firebase Authentication
│   ├── image-utils.js    # Görsel optimizasyon
│   └── firebase-config.js # Firebase yapılandırma
├── functions/             # Firebase Functions
│   ├── src/
│   │   ├── index.ts      # Ana function
│   │   └── imagekit-auth.ts # ImageKit auth endpoint
│   ├── package.json
│   └── tsconfig.json
├── firebase.json         # Firebase yapılandırma
└── README.md
```

## 🎯 Kullanım

1. **Admin Girişi**: Uygulamaya giriş yap (Firebase Authentication)
2. **Fotoğraf Seçimi**: "Choose File" ile fotoğraf seç
3. **Otomatik Optimizasyon**: Fotoğraf otomatik resize + WebP dönüşümü
4. **Yükleme**: "Upload" butonuna bas
5. **Sonuç**: Optimize edilmiş fotoğraf ImageKit CDN'de depolanır

## 📊 Free Tier Limitleri

### Firebase (Free Spark Plan):
- **Hosting**: 10 GB depolama, 10 GB/ay trafik
- **Functions**: 125K çağrı/ay
- **Authentication**: 50K/ay kullanıcı

### ImageKit (Free Plan):
- **Depolama**: 20 GB
- **Trafik**: 20 GB/ay  
- **Dönüşüm**: 20,000/ay

## ⚡ Optimizasyonlar

### Frontend Optimizasyonları:
- Canvas ile client-side resize (max 1080px)
- WebP formatına otomatik dönüşüm
- Progressive loading
- Gzip/Brotli sıkıştırma

### CDN Optimizasyonları:
- Cache-control: max-age=31536000 (1 yıl)
- ImageKit transformasyonları ile responsive görseller
- Lazy loading desteği

### Güvenlik:
- CORS yapılandırması
- Rate limiting
- Input validation
- Private key koruması

## 🔧 Geliştirme

```bash
# Local development
npm run dev

# Build için
npm run build

# Functions development
cd functions
npm run dev
```

## 🐛 Sorun Giderme

### Yaygın Sorunlar:

1. **Firebase Config Hatası**: `firebase-config.js` doğru yapılandırıldığından emin ol
2. **ImageKit Auth Hatası**: Environment variables doğru set edildi mi kontrol et
3. **CORS Hatası**: Firebase Functions'da CORS headers kontrol et
4. **Limit Aşımı**: Dashboard'lardan kullanım limitlerini kontrol et

### Debug Modları:
- Browser Console loglarını kontrol et
- Firebase Functions logs: `firebase functions:log`
- ImageKit Dashboard → Analytics

## 📈 Monitoring

Free tier limitlerini izlemek için:
- Firebase Console → Usage tab
- ImageKit Dashboard → Analytics
- Browser Network tab ile trafik kontrolü

## 🎉 Başarıyla Kuruldu!

Artık projen hazır! Admin olarak giriş yaparak fotoğraf yüklemeye başlayabilirsin.

## 🔄 Bonus: Otomatik Sıkıştırma

Projeye bonus özellik olarak yükleme öncesi otomatik dosya sıkıştırma ekledik:

- **Client-side resize**: Max 1080px genişlik
- **WebP dönüşümü**: JPG/PNG → WebP (tarayıcı desteği ile)
- **Kalite optimizasyonu**: 85% JPG, 80% WebP
- **Boyut azaltma**: Ortalama %60-80 dosya boyutu azalması

Bu optimizasyonlar sayesinde:
- ImageKit kotanız çok daha geç biter
- Yükleme hızları artar  
- CDN trafik maliyeti azalır
- Kullanıcı deneyimi iyileşir

## 📚 Ek Kaynaklar

- **[SETUP_CHECKLIST.md](SETUP_CHECKLIST.md)** - Adım adım kurulum rehberi ✨
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Detaylı deployment rehberi
- [Firebase Console](https://console.firebase.google.com) - Firebase yönetimi
- [ImageKit Dashboard](https://imagekit.io/dashboard) - ImageKit yönetimi
- [Firebase Pricing](https://firebase.google.com/pricing) - Firebase fiyatlandırma
- [ImageKit Pricing](https://imagekit.io/pricing) - ImageKit fiyatlandırma

## ⚡ Hızlı Başlangıç

1. **[SETUP_CHECKLIST.md](SETUP_CHECKLIST.md)** dosyasını takip et
2. Firebase ve ImageKit hesaplarını oluştur
3. Config dosyalarını güncelle
4. Deploy et ve kullanmaya başla!