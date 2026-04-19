import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, updateDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Cấu hình Firebase của bạn
const firebaseConfig = {
    apiKey: "AIzaSyAJ9C2biYeiLPmhakzLZ4mEqfO9_VgPSZE",
    authDomain: "hopvan-9a648.firebaseapp.com",
    projectId: "hopvan-9a648",
    storageBucket: "hopvan-9a648.appspot.com",
    messagingSenderId: "429347196227",
    appId: "1:429347196227:web:917b8d019f0efd0f7833f6",
    measurementId: "G-1BG8PSRG0R"
};

// Khởi tạo an toàn (Nếu file HTML đã gọi app rồi thì xài lại, chưa thì tạo mới)
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let presenceInterval = null;

onAuthStateChanged(auth, (user) => {
    if (user) {
        // Chỉ đếm học viên hoặc giáo viên, bỏ qua Admin để số liệu chính xác hơn
        if (user.email === 'admin@hopvan.com') return;

        const userRef = doc(db, "users", user.uid);
        
        // Hàm bắn tín hiệu có mặt
        const updatePresence = async () => {
            // Chỉ cập nhật nếu người dùng đang thực sự mở tab này để xem
            if (document.visibilityState === 'visible') {
                try {
                    await updateDoc(userRef, { lastActive: Date.now() });
                } catch (error) {
                    console.error("Lỗi Presence:", error);
                }
            }
        };

        // 1. Bắn tín hiệu ngay lập tức khi vừa vào trang
        updatePresence();

        // 2. Tự động bắn tín hiệu lặp lại mỗi 60 giây
        presenceInterval = setInterval(updatePresence, 60000);
        
        // 3. Bắn tín hiệu ngay khi người dùng chuyển từ tab khác về lại tab web của bạn
        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === 'visible') {
                updatePresence();
            }
        });

    } else {
        // Nếu người dùng đăng xuất, dọn dẹp bộ đếm
        if (presenceInterval) clearInterval(presenceInterval);
    }
});