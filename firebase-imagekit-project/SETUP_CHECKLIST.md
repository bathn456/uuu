# 🚀 Kurulum Kontrol Listesi

Bu kontrol listesini adım adım takip ederek projenizi sorunsuz bir şekilde çalıştırabilirsiniz.

## ✅ Ön Gereksinimler

- [ ] **Node.js** kurulu (v16 veya üzeri)
- [ ] **npm** kurulu
- [ ] **Firebase hesabı** oluşturuldu
- [ ] **ImageKit hesabı** oluşturuldu

## 🔥 Firebase Kurulumu

### 1. Firebase Projesi Oluşturma
- [ ] [Firebase Console](https://console.firebase.google.com)'a git
- [ ] "Create a project" / "Proje oluştur" butonuna tıkla
- [ ] Proje adını gir (örn: "foto-yükleme-uygulamam")
- [ ] Google Analytics'i aktif et (isteğe bağlı)
- [ ] Projeyi oluştur

### 2. Authentication Ayarları
- [ ] Sol menüden **Authentication** seç
- [ ] **Get started** butonuna tıkla
- [ ] **Sign-in method** tabına git
- [ ] **Email/Password** seçeneğini aktif et
- [ ] **Save** butonuna tıkla

### 3. Admin Kullanıcısı Ekleme
- [ ] **Authentication > Users** tabına git
- [ ] **Add user** butonuna tıkla
- [ ] Admin email gir (örn: `admin@mydomain.com`)
- [ ] Güçlü bir şifre oluştur (örn: `MySecure123!`)
- [ ] **Add user** butonuna tıkla
- [ ] ✏️ **Bu bilgileri not al - giriş için gerekli!**

### 4. Web App Oluşturma
- [ ] **Project Settings** (⚙️ ikonu)
- [ ] **General** tab
- [ ] **Your apps** bölümünde **</>** (Web) ikonuna tıkla
- [ ] App nickname gir (örn: "foto-app")
- [ ] **Register app** butonuna tıkla
- [ ] Config objesini kopyala (sonraki adımda kullanılacak)

### 5. Hosting Aktif Etme
- [ ] Sol menüden **Hosting** seç
- [ ] **Get started** butonuna tıkla
- [ ] Kurulum adımlarını izle (şimdilik sadece aktif et)

### 6. Functions Aktif Etme
- [ ] Sol menüden **Functions** seç
- [ ] **Get started** butonuna tıkla
- [ ] Billing planını upgrade et (Blaze plan - ücretsiz kullanım dahil)

## 📷 ImageKit Kurulumu

### 1. Hesap Oluşturma
- [ ] [ImageKit.io](https://imagekit.io)'ya git
- [ ] **Sign up** ile hesap oluştur
- [ ] Email doğrulamasını tamamla

### 2. API Keys Alma
- [ ] Dashboard'a gir
- [ ] **Developer** menüsünden **API Keys** seç
- [ ] **Public Key**'i kopyala ve not al
- [ ] **Private Key**'i kopyala ve not al (GİZLİ!)
- [ ] **URL Endpoint**'i kopyala ve not al

## ⚙️ Config Dosyalarını Güncelleme

### 1. Firebase Config
- [ ] `firebase-imagekit-project/public/firebase-config.js` dosyasını aç
- [ ] Firebase Console'dan kopyaladığın config değerleri ile placeholder'ları değiştir:

```javascript
const firebaseConfig = {
    apiKey: "AIza...", // Firebase'den aldığın gerçek değer
    authDomain: "your-project-id.firebaseapp.com", // Proje ID'ni yaz
    projectId: "your-project-id", // Firebase proje ID'ni yaz
    // ... diğer değerleri de değiştir
};
```

### 2. ImageKit Config
- [ ] Aynı dosyada ImageKit config'i de güncelle:

```javascript
const imagekitConfig = {
    publicKey: "public_xxxx", // ImageKit public key'ini yaz
    urlEndpoint: "https://ik.imagekit.io/your_id", // ImageKit URL endpoint'ini yaz
    // authenticationEndpoint: Deploy sonrası güncellenecek
};
```

### 3. Firebase Project ID
- [ ] `.firebaserc` dosyasını aç
- [ ] `"your-firebase-project-id"`'yi gerçek proje ID'nle değiştir

## 🚀 Local Development

### 1. Dependencies Kurulumu
- [ ] Terminal'de proje klasörüne git
- [ ] `cd firebase-imagekit-project` komutunu çalıştır
- [ ] `cd functions && npm install` komutunu çalıştır

### 2. Firebase CLI Kurulumu
- [ ] `npm install -g firebase-tools` komutunu çalıştır
- [ ] `firebase login` komutunu çalıştır
- [ ] Browser'da Firebase hesabınla giriş yap

### 3. Firebase Projesi Bağlama
- [ ] Proje klasöründe `firebase use your-project-id` komutunu çalıştır
- [ ] `firebase init` ile projeyi başlat (mevcut dosyaları overwrite etme)

### 4. Environment Variables
- [ ] `firebase functions:secrets:set IMAGEKIT_PRIVATE_KEY` komutunu çalıştır
- [ ] ImageKit private key'ini gir

### 5. Local Test
- [ ] `firebase emulators:start` komutunu çalıştır
- [ ] `http://localhost:5000` adresini aç
- [ ] Admin bilgileriyle giriş yapabilmelisin

## 🌐 Production Deploy

### 1. Functions Deploy
- [ ] `firebase deploy --only functions` komutunu çalıştır
- [ ] Deploy tamamlandığında functions URL'ini not al

### 2. Config Güncelleme
- [ ] `public/firebase-config.js`'te `authenticationEndpoint`'i gerçek functions URL ile güncelle

### 3. Hosting Deploy
- [ ] `firebase deploy --only hosting` komutunu çalıştır
- [ ] Deploy URL'ini not al

## 🧪 Test Checklist

### Functionality Tests
- [ ] Site açılıyor
- [ ] Admin giriş formu görünüyor
- [ ] Admin bilgileriyle giriş yapılıyor
- [ ] File input çalışıyor
- [ ] Fotoğraf önizlemesi gösteriliyor
- [ ] Upload butonu aktif oluyor
- [ ] Fotoğraf başarıyla yükleniyor
- [ ] Result URL çalışıyor
- [ ] CDN'den fotoğraf servis ediliyor

### Performance Tests
- [ ] Sayfa hızlı yükleniyor
- [ ] Fotoğraf optimizasyonu çalışıyor (boyut küçülüyor)
- [ ] WebP dönüşümü çalışıyor
- [ ] Cache headers doğru

## 🆘 Sorun Giderme

### Config Sorunları
- **Firebase başlamıyor**: Config değerlerini kontrol et
- **Authentication çalışmıyor**: Email/Password provider aktif mi kontrol et
- **Functions erişilmiyor**: Deploy başarılı mı ve URL doğru mu kontrol et

### ImageKit Sorunları
- **Upload başarısız**: Private key doğru set edildi mi kontrol et
- **Auth hatası**: Functions logs'ları kontrol et: `firebase functions:log`
- **CORS hatası**: Functions'ta CORS config'i kontrol et

### Debug Komutları
```bash
# Functions logs
firebase functions:log

# Local emulator
firebase emulators:start

# Config kontrol
firebase functions:config:get

# Project kontrol
firebase projects:list
```

## 🎉 Tebrikler!

Tüm adımları tamamladıysan projen artık çalışır durumda! 

- ✅ Admin girişi yapabilirsin
- ✅ Fotoğraf yükleyebilirsin  
- ✅ CDN'den optimize fotoğraf servis ediliyor
- ✅ Free tier limitlerde kalıyorsun

---

**Sorun mu yaşıyorsun?** README.md ve DEPLOYMENT_GUIDE.md dosyalarını kontrol et veya GitHub Issues'a yaz.