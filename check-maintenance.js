import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// 1. Cấu hình Firebase của bạn
const firebaseConfig = { 
    apiKey: "AIzaSyAJ9C2biYeiLPmhakzLZ4mEqfO9_VgPSZE", 
    authDomain: "hopvan-9a648.firebaseapp.com", 
    projectId: "hopvan-9a648", 
    storageBucket: "hopvan-9a648.appspot.com", 
    messagingSenderId: "429347196227", 
    appId: "1:429347196227:web:917b8d019f0efd0f7833f6", 
    measurementId: "G-1BG8PSRG0R" 
};

// 2. Khởi tạo Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 3. Hàm tính toán đường dẫn tuyệt đối đến trang bảo trì
function getMaintenanceUrl() {
    // Lấy origin (ví dụ: https://hopvan.info.vn hoặc http://127.0.0.1:5500)
    const origin = window.location.origin;
    // Nối với tên file maintenance (Đảm bảo maintenance.html nằm ở thư mục gốc)
    return origin + "/maintenance.html";
}

// 4. Lắng nghe trạng thái bảo trì Realtime
onSnapshot(doc(db, "system_settings", "maintenance"), (docSnap) => {
    if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Lấy đường dẫn hiện tại của trang
        const currentUrl = window.location.href;
        const maintenanceUrl = getMaintenanceUrl();

        // NẾU BẬT BẢO TRÌ (isActive == true)
        if (data.isActive === true) {
            // Kiểm tra xem có ĐANG Ở trang maintenance hay chưa để tránh loop vô hạn
            if (!currentUrl.includes('maintenance.html')) {
                console.log("Hệ thống đang bảo trì, chuyển hướng...");
                window.location.replace(maintenanceUrl); 
            }
        } 
        // NẾU TẮT BẢO TRÌ (isActive == false)
        else {
            // Nếu người dùng đang bị kẹt ở trang maintenance, tự động cho họ về trang chủ
            if (currentUrl.includes('maintenance.html')) {
                console.log("Bảo trì đã xong, quay lại trang chủ...");
                window.location.replace(window.location.origin + "/"); 
            }
        }
    }
}, (error) => {
    console.error("Lỗi kiểm tra bảo trì:", error);
});