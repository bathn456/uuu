# 🧪 Test Kontrol Listesi

Bu dosya projenin güvenlik, işlevsellik ve performansını test etmek için kullanılır.

## 🚀 Hızlı Demo Test

### Demo Modunu Aktif Et
- [ ] `public/firebase-config.js` dosyasında `DEMO_MODE = true` olduğunu kontrol et
- [ ] Sayfayı aç - üstte sarı "DEMO MODU AKTIF" banner'ı görünüyor mu?

### Demo Giriş Testi
- [ ] Admin giriş formunda şu bilgileri kullan:
  - **Email**: `demo@test.com`
  - **Password**: `demo123`
- [ ] Giriş başarılı oldu mu?
- [ ] Upload section göründü mü?

### Fotoğraf Yükleme Testi
- [ ] Bir JPG/PNG fotoğraf seç (max 10MB)
- [ ] Önizleme göründü mü?
- [ ] "Optimize Edilecek" badge'i görünüyor mu?
- [ ] Upload butonuna tıkla
- [ ] Progress bar çalışıyor mu?
- [ ] Başarı mesajı geldi mi?
- [ ] Result URL oluştu mu?
- [ ] Fotoğraf görüntüleniyor mu?

## 🔐 Güvenlik Testleri

### 1. Private Key Sızıntısı Kontrolü
```bash
# Browser Developer Tools > Console'da çalıştır
console.log('Private key check:', window.IMAGEKIT_PRIVATE_KEY || 'NOT FOUND (GOOD!)');
```
- [ ] **Sonuç**: `undefined` veya `NOT FOUND (GOOD!)` olmalı

### 2. Config Exposure Kontrolü
```bash
# Browser Developer Tools > Console'da çalıştır  
console.log('Demo mode:', window.DEMO_MODE);
console.log('Config keys:', Object.keys(window.imagekitConfig));
```
- [ ] Demo mode `true` göstermeli
- [ ] Private key config'te olmamalı

### 3. Network Request Kontrolü
- [ ] Browser > Developer Tools > Network tab açık
- [ ] Fotoğraf yükle
- [ ] **Kontrol**: Hiçbir request'te private key görünmüyor mu?
- [ ] Demo mode'da gerçek ImageKit'e request atılıyor mu? (atılmamalı)

### 4. Authentication Bypass Testi
```bash
# Browser Developer Tools > Console'da çalıştır
window.getPhotoUploader().handleUpload();
```
- [ ] **Sonuç**: "Yükleme için giriş yapmanız gerekiyor" hatası almalısın

## ⚡ Performans Testleri

### 1. Image Optimization Kontrolü
- [ ] 2MB+ bir JPG fotoğraf seç
- [ ] Upload et
- [ ] **Kontrol**: Result'ta boyut küçülmüş mü?
- [ ] WebP formatına dönüştürüldü mü? (browser destek varsa)

### 2. Cache Headers (Production)
```bash
# Production deploy sonrası test et
curl -I https://your-site.firebaseapp.com/styles.css

# Beklenen sonuç:
# Cache-Control: public, max-age=31536000, immutable
```

### 3. Loading Performance
- [ ] Sayfa 3 saniyeden hızlı yükleniyor mu?
- [ ] Image preview anında görünüyor mu?
- [ ] Upload progress smooth çalışıyor mu?

## 🌐 Cross-Browser Testleri

### Chrome/Edge
- [ ] Login çalışıyor
- [ ] File upload çalışıyor
- [ ] WebP conversion çalışıyor

### Firefox
- [ ] Login çalışıyor
- [ ] File upload çalışıyor
- [ ] Fallback JPG conversion çalışıyor (WebP desteklenmiyorsa)

### Safari/Mobile
- [ ] Touch upload çalışıyor
- [ ] Responsive layout düzgün
- [ ] File input çalışıyor

## 🚨 Error Handling Testleri

### 1. Invalid File Test
- [ ] .txt dosyası yüklemeye çalış
- [ ] **Beklenen**: "Geçersiz dosya tipi" hatası

### 2. Large File Test  
- [ ] 15MB+ dosya yüklemeye çalış
- [ ] **Beklenen**: "Dosya boyutu 10MB'dan küçük olmalıdır" hatası

### 3. Network Simulation
- [ ] Browser > Developer Tools > Network > Slow 3G
- [ ] Upload test et
- [ ] **Kontrol**: Progress bar düzgün çalışıyor mu?

### 4. Wrong Credentials Test
- [ ] Demo mode'da yanlış email/password ile gir
- [ ] **Beklenen**: "Demo mode için kullanın: demo@test.com / demo123" hatası

## 🔧 Production Deployment Testleri

### Firebase Functions Test (Production)
```bash
# Functions deploy sonrası test
curl -X GET https://region-project.cloudfunctions.net/imagekitAuth \
  -H "Authorization: Bearer invalid-token"

# Beklenen: 401 Unauthorized
```

### CORS Test (Production)
```bash
# Farklı origin'dan test
curl -X OPTIONS https://region-project.cloudfunctions.net/imagekitAuth \
  -H "Origin: https://malicious-site.com"

# Beklenen: CORS error veya restricted response
```

### Rate Limiting Test (Production)
- [ ] 10 kez ardışık upload yap
- [ ] **Kontrol**: Rate limiting devreye giriyor mu?

## 📊 Free Tier Monitoring

### Firebase Usage
- [ ] Firebase Console > Usage tabını kontrol et
- [ ] Functions çağrı sayısı makul mü? (125K/month limit)
- [ ] Hosting trafik makul mü? (10GB/month limit)

### ImageKit Usage  
- [ ] ImageKit Dashboard > Analytics kontrol et
- [ ] Storage kullanımı? (20GB limit)
- [ ] Bandwidth kullanımı? (20GB/month limit)
- [ ] Transformation sayısı? (20K/month limit)

## ✅ Final Checklist

### Demo Mode Testleri
- [ ] ✅ Demo giriş çalışıyor (demo@test.com / demo123)
- [ ] ✅ File upload simülasyonu çalışıyor
- [ ] ✅ Image optimization çalışıyor
- [ ] ✅ Error handling çalışıyor
- [ ] ✅ Responsive design çalışıyor

### Security Testleri  
- [ ] ✅ Private key frontend'de görünmüyor
- [ ] ✅ Authentication bypass koruması var
- [ ] ✅ File type validation çalışıyor
- [ ] ✅ File size validation çalışıyor

### Performance Testleri
- [ ] ✅ Page load < 3 seconds
- [ ] ✅ Image optimization working
- [ ] ✅ Progress indicators working
- [ ] ✅ Mobile responsive

---

## 🆘 Sorun Giderme Notları

### Demo Mode Çalışmıyorsa:
1. `firebase-config.js`'te `DEMO_MODE = true` kontrol et
2. Browser cache temizle (Ctrl+F5)
3. Console error'ları kontrol et

### Upload Çalışmıyorsa:
1. Dosya tipi JPG/PNG/WebP mi kontrol et
2. Dosya boyutu < 10MB mi kontrol et  
3. Login yapıldı mı kontrol et
4. Network tab'te error'ları kontrol et

### Gerçek Production Test:
1. `DEMO_MODE = false` yap
2. Gerçek Firebase config ekle
3. Firebase Functions deploy et
4. ImageKit keys ekle
5. Production testlerini çalıştır

**Test tamamlandı! 🎉 Sorun varsa README.md veya SETUP_CHECKLIST.md kontrol et.**