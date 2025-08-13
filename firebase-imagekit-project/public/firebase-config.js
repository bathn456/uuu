// Firebase Configuration
// ÖNEMLI: Bu dosyaya Firebase Console'dan aldığınız GERÇEK config bilgilerini ekleyin!
// Şu anda DEMO modu aktif - gerçek Firebase olmadan test edebilirsiniz

// DEMO MODE için geçici config (üretim için değiştirin)
const DEMO_MODE = true; // Gerçek Firebase kullanmak için false yapın

const firebaseConfig = DEMO_MODE ? {
    // DEMO mode - test için geçici değerler
    apiKey: "demo-api-key",
    authDomain: "demo-project.firebaseapp.com",
    projectId: "demo-project",
    storageBucket: "demo-project.appspot.com",
    messagingSenderId: "000000000000",
    appId: "1:000000000000:web:demo123456789"
} : {
    // ÜRETİM için Firebase Console'dan alacağınız GERÇEK değerler
    apiKey: "AIzaSyBxxxxx-BURAYA-GERÇEK-API-KEY-GELECEK-xxxxxxxxxx",
    authDomain: "your-project-id.firebaseapp.com",  // your-project-id'yi değiştirin
    projectId: "your-project-id",                    // Firebase'de oluşturduğunuz proje ID'si
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "123456789012",               // Firebase'den alacağınız gerçek ID
    appId: "1:123456789012:web:abcdef1234567890"     // Firebase'den alacağınız gerçek App ID
};

// ImageKit Configuration  
const imagekitConfig = {
    publicKey: DEMO_MODE ? "demo-public-key" : "public_xxxxxxxxxxxxxxxxxxxxxxxx",    // ImageKit dashboard'dan alın
    urlEndpoint: DEMO_MODE ? "https://demo.imagekit.io" : "https://ik.imagekit.io/your-id",   // ImageKit dashboard'dan URL endpoint
    authenticationEndpoint: DEMO_MODE ? "/demo-auth" : "https://your-region-your-project.cloudfunctions.net/imagekitAuth"  // Deploy sonrası Firebase Functions URL'i
};

// Export configs
window.firebaseConfig = firebaseConfig;
window.imagekitConfig = imagekitConfig;
window.DEMO_MODE = DEMO_MODE;