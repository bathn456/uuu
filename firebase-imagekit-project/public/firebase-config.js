// Firebase Configuration
// ÖNEMLI: Bu dosyaya Firebase Console'dan aldığınız GERÇEK config bilgilerini ekleyin!
// Aşağıdaki değerler sadece örnek - kendi değerlerinizle değiştirin

const firebaseConfig = {
    // Firebase Console > Project Settings > General > Your apps > Config
    apiKey: "AIzaSyBxxxxx-BURAYA-GERÇEK-API-KEY-GELECEK-xxxxxxxxxx",
    authDomain: "your-project-id.firebaseapp.com",  // your-project-id'yi değiştirin
    projectId: "your-project-id",                    // Firebase'de oluşturduğunuz proje ID'si
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "123456789012",               // Firebase'den alacağınız gerçek ID
    appId: "1:123456789012:web:abcdef1234567890"     // Firebase'den alacağınız gerçek App ID
};

// ImageKit Configuration  
const imagekitConfig = {
    publicKey: "public_xxxxxxxxxxxxxxxxxxxxxxxx",    // ImageKit dashboard'dan alın
    urlEndpoint: "https://ik.imagekit.io/your-id",   // ImageKit dashboard'dan URL endpoint
    authenticationEndpoint: "https://your-region-your-project.cloudfunctions.net/imagekitAuth"  // Deploy sonrası Firebase Functions URL'i
};

// Export configs
window.firebaseConfig = firebaseConfig;
window.imagekitConfig = imagekitConfig;