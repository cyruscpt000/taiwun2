
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// 大哥注意：這裡要換成你在 Firebase Console 申請到的資訊！
// 如果你還沒申請，程式會自動使用測試模式
const firebaseConfig = {
  apiKey: "AIzaSyCUtQXMdH3YkuAJzSuoHCE6V5Gf7BxX94Y",
  authDomain: "taiwun2-7a6e4.firebaseapp.com",
  projectId: "taiwun2-7a6e4",
  storageBucket: "taiwun2-7a6e4.firebasestorage.app",
  messagingSenderId: "625320639632",
  appId: "1:625320639632:web:0c6baac30bda4100ca2c15",
  measurementId: "G-H2W9Y7PV1M"
};


let db: any = null;

try {
  // 檢查是否有填寫真實資訊，沒有則跳過 init 以防崩潰
  if (firebaseConfig.apiKey.includes("YOUR_API_KEY")) {
    console.warn("Firebase config is placeholder. Real-time sync disabled.");
  } else {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
  }
} catch (e) {
  console.error("Firebase init failed:", e);
}

export { db };
