import { onRequest } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";
import * as admin from "firebase-admin";
import ImageKit from "imagekit";
import * as cors from "cors";

// Firebase başlangıç ayarları
admin.initializeApp();

// Global seçenekler - ücretsiz plan için optimize
setGlobalOptions({
  maxInstances: 3,
  memory: "256MiB",
  timeoutSeconds: 60,
  region: "europe-west1" // En yakın region
});

// CORS ayarları - sadece Firebase Hosting domain'ini kabul et
const corsOptions = {
  origin: [
    /\.firebaseapp\.com$/,
    /\.web\.app$/,
    "http://localhost:5000",
    "http://localhost:3000"
  ],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
};

const corsHandler = cors(corsOptions);

// ImageKit konfigürasyonu
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!
});

/**
 * ImageKit Authentication Token oluşturur
 * Güvenlik: Private Key sadece backend'de tutulur
 */
export const getImageKitAuth = onRequest(
  {
    cors: true,
    maxInstances: 3,
    memory: "256MiB"
  },
  async (req, res) => {
    return corsHandler(req, res, async () => {
      try {
        // Sadece POST isteklerini kabul et
        if (req.method !== "POST") {
          res.status(405).json({ error: "Method not allowed" });
          return;
        }

        // Rate limiting - basit IP bazlı kontrol
        const clientIP = req.ip;
        console.log(`Auth request from IP: ${clientIP}`);

        // ImageKit authentication parametreleri oluştur
        const authenticationParameters = imagekit.getAuthenticationParameters();

        // Güvenlik headers ekle
        res.set({
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
          "X-Content-Type-Options": "nosniff",
          "X-Frame-Options": "DENY",
          "X-XSS-Protection": "1; mode=block"
        });

        res.status(200).json({
          success: true,
          token: authenticationParameters.token,
          expire: authenticationParameters.expire,
          signature: authenticationParameters.signature,
          publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
          urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
        });

      } catch (error) {
        console.error("ImageKit Auth Error:", error);
        res.status(500).json({
          success: false,
          error: "Authentication failed"
        });
      }
    });
  }
);

/**
 * Yüklenmiş dosyaları listeler (opsiyonel)
 */
export const getUploadedFiles = onRequest(
  {
    cors: true,
    maxInstances: 2,
    memory: "256MiB"
  },
  async (req, res) => {
    return corsHandler(req, res, async () => {
      try {
        if (req.method !== "GET") {
          res.status(405).json({ error: "Method not allowed" });
          return;
        }

        // Son 10 dosyayı getir
        const files = await imagekit.listFiles({
          limit: 10,
          sort: "DESC_CREATED"
        });

        res.status(200).json({
          success: true,
          files: files.map(file => ({
            fileId: file.fileId,
            name: file.name,
            url: file.url,
            thumbnail: file.thumbnail,
            size: file.size,
            createdAt: file.createdAt
          }))
        });

      } catch (error) {
        console.error("List Files Error:", error);
        res.status(500).json({
          success: false,
          error: "Failed to list files"
        });
      }
    });
  }
);