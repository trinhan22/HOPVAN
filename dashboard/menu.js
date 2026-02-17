import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- PHẦN 1: CSS GIAO DIỆN (ĐẸP & XỊN) ---
const menuStyles = `
<style>

    :root {
        --sb-w: 280px;
        --sb-primary: #FF8F50;
        --sb-gradient: linear-gradient(135deg, #FF8F50, #FF5E62);
        --sb-glass: rgba(255, 255, 255, 0.85);
        --sb-border: 1px solid rgba(255, 255, 255, 0.6);
        --sb-shadow: 10px 0 40px rgba(0,0,0,0.03);
    }

    .sidebar-comp {
        width: var(--sb-w); height: 100vh;
        background: var(--sb-glass); backdrop-filter: blur(25px); -webkit-backdrop-filter: blur(25px);
        border-right: var(--sb-border); box-shadow: var(--sb-shadow);
        display: flex; flex-direction: column; padding: 0; /* Để logo-link tự quản lý padding */
        position: fixed; top: 0; left: 0; z-index: 9999;
        font-family: 'Plus Jakarta Sans', sans-serif;
        transition: transform 0.3s ease;
    }

    /* --- LOGO CHUYỂN HÓA (ĐÃ FIX KÍCH THƯỚC & VỊ TRÍ) --- */
    .sb-logo-link {
        padding: 35px 35px 30px; /* Vị trí logo thoáng đãng */
        display: flex; 
        align-items: center; 
        gap: 10px; 
        text-decoration: none;
        transition: all 0.3s ease;
    }

    /* Hộp trắng chứa icon */
    .logo-card-box {
        width: 52px; 
        height: 52px;
        background: white;
        border-radius: 15px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 10px 25px rgba(255, 143, 80, 0.15);
        border: 1px solid rgba(255, 143, 80, 0.1);
        transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    .logo-card-box img {
        width: 42px; 
        height: 42px;
        object-fit: contain;
    }

    /* Chữ HOPVAN mặc định là Gradient */
    .sb-logo-link h1 {
        font-size: 1.5rem;
        font-weight: 900;
        line-height: 1;
        margin: 0;
        background: var(--sb-gradient);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        transition: all 0.3s ease;
        letter-spacing: -0.5px;
    }

    /* KHI HOVER: Chữ đổi sang màu CAM chuẩn */
    .sb-logo-link:hover h1 {
        background: none; /* Tắt gradient */
        -webkit-text-fill-color: #FF8F50; /* Hiện màu Cam chuẩn */
        color: #FF8F50;
        transition: all 0.3s ease;
    }

    .sb-logo-link:hover {
        opacity: 0.9;
    }

    .sb-logo-link:hover .logo-card-box {
        transform: scale(1.05); /* Phóng to nhẹ */
        box-shadow: 0 15px 35px rgba(255, 143, 80, 0.25); /* Bóng đổ nổi bật hơn */
        border-color: rgba(255, 143, 80, 0.3);
    }

    /* Các phần menu list giữ nguyên từ code trước của bạn... */
    .sb-list { list-style: none; padding: 0 15px; margin: 0; flex: 1; display: flex; flex-direction: column; gap: 8px; }
    .sb-link {
        display: flex; align-items: center; gap: 16px; padding: 14px 18px;
        border-radius: 16px; color: #64748b; font-weight: 700; font-size: 0.95rem;
        text-decoration: none; transition: all 0.2s;
    }
    .sb-link:hover { background: #fff7ed; color: var(--sb-primary); transform: translateX(5px); }
    .sb-link.active { background: var(--sb-gradient); color: white !important; box-shadow: 0 8px 20px rgba(255, 94, 98, 0.25); }

    .sb-footer { padding: 20px; border-top: 1px solid rgba(0,0,0,0.05); display: flex; flex-direction: column; gap: 12px; }
    .menu-btn { width: 100%; padding: 12px; border-radius: 14px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; font-size: 0.9rem; transition: 0.2s; border: none; font-family: inherit; }
    .btn-feedback { background: white; border: 1.5px solid #fed7aa; color: #f97316; }
    .btn-logout { background: #fef2f2; color: #ef4444; }
    
    /* Modal Overlay */
    .menu-modal-overlay {
        position: fixed; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(5px);
        z-index: 20000; display: none; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s;
    }
    .menu-modal-overlay.show { display: flex; opacity: 1; }

    .menu-card {
        background: white; width: 90%; max-width: 400px; padding: 30px;
        border-radius: 24px; box-shadow: 0 20px 50px rgba(0,0,0,0.15);
        transform: scale(0.95); transition: transform 0.2s; text-align: center;
    }
    .menu-modal-overlay.show .menu-card { transform: scale(1); }

    .menu-icon { width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; margin: 0 auto 15px; }
    .menu-input { width: 100%; padding: 14px; border: 2px solid #f1f5f9; border-radius: 14px; margin-bottom: 20px; outline: none; resize: none; background: #f8fafc; }
    .menu-input:focus { border-color: var(--sb-primary); background: white; }

    .menu-actions { display: flex; gap: 10px; }
    .btn-m-cancel { flex: 1; padding: 12px; border-radius: 12px; font-weight: 700; background: #f1f5f9; color: #64748b; cursor: pointer; border: none; }
    .btn-m-confirm { flex: 1; padding: 12px; border-radius: 12px; font-weight: 700; background: var(--sb-gradient); color: white; cursor: pointer; border: none; box-shadow: 0 4px 15px rgba(255, 94, 98, 0.2); }
    .btn-m-confirm:disabled { opacity: 0.7; cursor: wait; }

    @media (max-width: 1024px) {
        .sidebar-comp { transform: translateX(-100%); }
        .sidebar-comp.open { transform: translateX(0); }
    }
</style>
`;

// --- PHẦN 2: HTML GIAO DIỆN ---
const menuHTML = `

<aside class="sidebar-comp" id="main-sidebar">
    <a href="../index.html" class="sb-logo-link group">
        <div class="logo-card-box shadow-lg">
            <img src="../LOGO.WEBP" alt="HopVan Logo" class="drop-shadow-md">
        </div>
        <div>
            <h1 class="block">HOPVAN</h1>
        </div>
    </a>

    <nav class="sb-list">
        <a href="index.html" class="sb-link" data-page="index"><i class="fas fa-home"></i> Tổng quan</a>
        <a href="phongluyende.html" class="sb-link" data-page="phongluyende"><i class="fas fa-pen-nib"></i> Phòng luyện đề</a>
        <a href="bantinvanhoc.html" class="sb-link" data-page="bantinvanhoc"><i class="fas fa-newspaper"></i> Bản tin Văn học</a>
        <a href="congdong.html" class="sb-link" data-page="congdong"><i class="fas fa-users"></i> Cộng đồng</a>
        <a href="nhatkyhoctap.html" class="sb-link" data-page="nhatkyhoctap"><i class="fas fa-book-journal-whills"></i> Nhật ký học tập</a>
        <a href="account.html" class="sb-link" data-page="account"><i class="fas fa-user-cog"></i> Tài khoản</a>
    </nav>
    <div class="sb-footer">
        <button id="menu-btn-feedback" class="menu-btn btn-feedback"><i class="far fa-comment-dots"></i> Gửi góp ý</button>
        <button id="menu-btn-logout" class="menu-btn btn-logout"><i class="fas fa-sign-out-alt"></i> Đăng xuất</button>
    </div>
</aside>

<div id="modal-feedback" class="menu-modal-overlay">
    <div class="menu-card">
        <div class="menu-icon" style="background: #fff7ed; color: #f97316;"><i class="fas fa-paper-plane"></i></div>
        <h3 class="text-xl font-bold text-gray-800 mb-2">Góp ý hệ thống</h3>
        <p class="text-sm text-gray-500 mb-4">Chia sẻ để Hopvan tốt hơn nhé!</p>
        <textarea id="fb-content" rows="4" class="menu-input" placeholder="Bạn muốn nhắn nhủ điều gì..."></textarea>
        <div class="menu-actions">
            <button class="btn-m-cancel" id="btn-cancel-fb">Đóng</button>
            <button class="btn-m-confirm" id="btn-submit-fb">Gửi đi</button>
        </div>
    </div>
</div>

<div id="modal-logout" class="menu-modal-overlay">
    <div class="menu-card">
        <div class="menu-icon" style="background: #fef2f2; color: #ef4444;"><i class="fas fa-power-off"></i></div>
        <h3 class="text-xl font-bold text-gray-800 mb-2">Đăng xuất?</h3>
        <p class="text-sm text-gray-500 mb-6">Bạn có chắc chắn muốn rời đi không?</p>
        <div class="menu-actions">
            <button class="btn-m-cancel" id="btn-cancel-logout">Ở lại</button>
            <button class="btn-m-confirm" id="btn-confirm-logout" style="background: #ef4444;">Đăng xuất</button>
        </div>
    </div>
</div>
`;

// --- PHẦN 3: LOGIC CHỨC NĂNG ---
export function initMenu(app) {
    const auth = getAuth(app);
    const db = getFirestore(app);
    const container = document.getElementById('menu-placeholder');

    if (container) {
        // Nạp HTML & CSS vào trang
        container.innerHTML = menuStyles + menuHTML;
        
        // Chạy Logic
        startMenuLogic(auth, db);
    } else {
        console.error("Thiếu div id='menu-placeholder' trong file HTML");
    }
}

function startMenuLogic(auth, db) {
    // 1. HIGHLIGHT MENU
    const currentPath = window.location.pathname.toLowerCase();
    const links = document.querySelectorAll('.sb-link');
    links.forEach(link => {
        link.classList.remove('active');
        const page = link.getAttribute('data-page');
        if (currentPath.includes(page) || (page === 'index' && (currentPath.endsWith('/') || currentPath.includes('index.html')))) {
            link.classList.add('active');
        }
    });

    // 2. MODAL LOGIC
    const fbModal = document.getElementById('modal-feedback');
    const logoutModal = document.getElementById('modal-logout');

    const openModal = (m) => { m.style.display = 'flex'; setTimeout(()=>m.classList.add('show'), 10); };
    const closeModal = (m) => { m.classList.remove('show'); setTimeout(()=>m.style.display = 'none', 200); };

    // Events mở modal
    document.getElementById('menu-btn-feedback').onclick = () => openModal(fbModal);
    document.getElementById('menu-btn-logout').onclick = () => openModal(logoutModal);

    // Events đóng modal
    document.getElementById('btn-cancel-fb').onclick = () => closeModal(fbModal);
    document.getElementById('btn-cancel-logout').onclick = () => closeModal(logoutModal);
    
    // 3. GỬI GÓP Ý (FIREBASE)
    document.getElementById('btn-submit-fb').onclick = async () => {
        const btn = document.getElementById('btn-submit-fb');
        const input = document.getElementById('fb-content');
        const content = input.value.trim();

        if (!content) { alert("Bạn chưa nhập nội dung!"); return; }

        btn.innerText = "Đang gửi...";
        btn.disabled = true;

        try {
            await addDoc(collection(db, "feedbacks"), {
                uid: auth.currentUser ? auth.currentUser.uid : "anonymous",
                email: auth.currentUser ? auth.currentUser.email : "unknown",
                content: content,
                page: window.location.pathname,
                timestamp: serverTimestamp()
            });
            alert("Gửi thành công! Cảm ơn bạn.");
            input.value = "";
            closeModal(fbModal);
        } catch (e) {
            console.error(e);
            alert("Lỗi kết nối. Vui lòng thử lại.");
        } finally {
            btn.innerText = "Gửi đi";
            btn.disabled = false;
        }
    };

    // 4. ĐĂNG XUẤT
    document.getElementById('btn-confirm-logout').onclick = async () => {
        try {
            await signOut(auth);
            window.location.href = "../index.html";
        } catch (e) { console.error(e); }
    };

    // 5. Mobile Toggle
    window.toggleSidebarGlobal = () => {
        document.getElementById('main-sidebar').classList.toggle('open');
    };
}