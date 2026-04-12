import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js"; // <-- THÊM AUTH VÀO ĐÂY

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
const auth = getAuth(app); // <-- KHỞI TẠO AUTH

// CÁC BIẾN CỜ ĐỂ XỬ LÝ ĐỘ TRỄ
let isAdmin = false;
let isMaintenanceActive = false;
let authResolved = false; // Cờ báo hiệu đã load xong Auth

// 3. Hàm tính toán đường dẫn tuyệt đối đến trang bảo trì
function getMaintenanceUrl() {
    const origin = window.location.origin;
    return origin + "/maintenance.html";
}

// 4. Kiểm tra tài khoản hiện tại (Chạy ngầm ngay khi mở web)
onAuthStateChanged(auth, (user) => {
    isAdmin = (user && user.email === "admin@hopvan.com"); // Trả về true nếu đúng email Admin
    authResolved = true; // Đánh dấu là đã check xong tài khoản
    checkRedirect(); // Gọi hàm xử lý chuyển hướng
});

// 5. Lắng nghe trạng thái bảo trì Realtime
onSnapshot(doc(db, "system_settings", "maintenance"), (docSnap) => {
    if (docSnap.exists()) {
        isMaintenanceActive = docSnap.data().isActive === true;
        checkRedirect(); // Gọi hàm xử lý chuyển hướng
    }
}, (error) => {
    console.error("Lỗi kiểm tra bảo trì:", error);
});

// 6. Hàm xử lý logic chuyển hướng (Chỉ chạy khi có đủ dữ liệu)
function checkRedirect() {
    // QUAN TRỌNG: Nếu chưa load xong Auth thì return, không làm gì cả để tránh đá nhầm Admin
    if (!authResolved) return; 

    const currentUrl = window.location.href;
    const maintenanceUrl = getMaintenanceUrl();
    const isCurrentlyOnMaintenancePage = currentUrl.includes('maintenance.html');

    // NẾU BẬT BẢO TRÌ
    if (isMaintenanceActive === true) {
        // Nếu KHÔNG PHẢI ADMIN và CHƯA Ở TRANG BẢO TRÌ -> Đá sang bảo trì
        if (!isAdmin && !isCurrentlyOnMaintenancePage) {
            console.log("Hệ thống đang bảo trì, chuyển hướng người dùng...");
            window.location.replace(maintenanceUrl); 
        }
    } 
    // NẾU TẮT BẢO TRÌ
    else {
        // Nếu ai đó (kể cả admin) đang bị kẹt ở trang bảo trì, tự động cho họ về trang chủ
        if (isCurrentlyOnMaintenancePage) {
            console.log("Bảo trì đã xong, quay lại trang chủ...");
            window.location.replace(window.location.origin + "/"); 
        }
    }
}