import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { 
    getFirestore, collection, addDoc, serverTimestamp, 
    query, where, orderBy, getDocs 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- PHẦN 1: CSS GIAO DIỆN ---
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

    /* OVERLAY CHO MOBILE */
    .sb-mobile-overlay {
        position: fixed; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(3px);
        z-index: 9998; opacity: 0; visibility: hidden; transition: all 0.3s ease;
    }
    .sb-mobile-overlay.show { opacity: 1; visibility: visible; }

    /* SIDEBAR CHÍNH */
    .sidebar-comp {
        width: var(--sb-w); height: 100vh;
        background: var(--sb-glass); backdrop-filter: blur(25px); -webkit-backdrop-filter: blur(25px);
        border-right: var(--sb-border); box-shadow: var(--sb-shadow);
        display: flex; flex-direction: column; padding: 0;
        position: fixed; top: 0; left: 0; z-index: 9999;
        font-family: 'Plus Jakarta Sans', sans-serif;
        transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        overflow: hidden;
    }

    /* HEADER SIDEBAR */
    .sb-header { display: flex; align-items: center; justify-content: space-between; padding: 30px 20px 25px 30px; transition: padding 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
    .sb-logo-link {
        padding: 0; display: flex; align-items: center; gap: 10px; text-decoration: none; transition: all 0.3s ease; flex: 1;
    }
    .logo-card-box {
        width: 48px; height: 48px; background: white; border-radius: 14px;
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 10px 25px rgba(255, 143, 80, 0.15); border: 1px solid rgba(255, 143, 80, 0.1);
        transition: all 0.4s ease; flex-shrink: 0;
    }
    .logo-card-box img { width: 38px; height: 38px; object-fit: contain; }
    .sb-logo-link h1 {
        font-size: 1.4rem; font-weight: 900; line-height: 1; margin: 0;
        background: var(--sb-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        transition: all 0.3s ease; letter-spacing: -0.5px;
    }
    .sb-logo-link:hover h1 { background: none; -webkit-text-fill-color: #FF8F50; color: #FF8F50; }
    .sb-logo-link:hover .logo-card-box { transform: scale(1.05); box-shadow: 0 15px 35px rgba(255, 143, 80, 0.25); }
    
    .sb-close-btn {
        background: #f1f5f9; border: none; color: #64748b; font-size: 1.1rem;
        width: 32px; height: 32px; border-radius: 10px; display: none; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s;
    }
    .sb-close-btn:hover { background: #e2e8f0; color: #334155; }
    
    /* SOFT COLLAPSE BUTTON */
    .sb-collapse-btn {
        width: 32px; height: 32px; border-radius: 50%;
        background: transparent; border: 1px solid rgba(255, 143, 80, 0.3);
        color: var(--sb-primary); display: flex; align-items: center; justify-content: center;
        cursor: pointer; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        z-index: 10000; font-size: 0.9rem;
    }
    .sb-collapse-btn:hover { background: #fff7ed; color: var(--sb-primary); transform: scale(1.1); }
    html.dark .sb-collapse-btn { color: var(--text-light); }
    html.dark .sb-collapse-btn:hover { background: rgba(255, 143, 80, 0.1); border-radius: 50%; color: var(--sb-primary); }

    /* COLLAPSED STATE */
    .sidebar-comp.collapsed {
        width: 100px !important;
    }
    /* Smooth transitions for text and logo hiding */
    .sb-logo-link {
        transition: opacity 0.3s ease, visibility 0.3s, max-width 0.3s ease, margin 0.3s ease, padding 0.3s ease;
        opacity: 1; visibility: visible; max-width: 250px; overflow: hidden;
    }
    .sb-section-title {
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        max-height: 20px; overflow: hidden;
    }
    .sb-link span, .menu-btn span, .sb-version-pill {
        transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), max-width 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        opacity: 1; max-width: 200px; transform: translateX(0); overflow: hidden; white-space: nowrap; display: inline-block;
    }
    .sb-link, .menu-btn {
        transition: gap 0.3s ease, padding 0.3s ease;
    }

    .sidebar-comp.collapsed {
        overflow: visible;
    }
    .sidebar-comp.collapsed .sb-logo-link {
        padding: 0; justify-content: center; width: 100%; margin: 0; opacity: 1; pointer-events: auto; gap: 0;
    }
    .sidebar-comp.collapsed .sb-logo-link div:last-child {
        display: none !important;
    }
    .sidebar-comp.collapsed .sb-section-title {
        display: none !important;
    }
    .sidebar-comp.collapsed .sb-link span,
    .sidebar-comp.collapsed .menu-btn span,
    .sidebar-comp.collapsed .sb-version-pill {
        opacity: 0 !important; position: absolute !important; pointer-events: none;
    }
    .sidebar-comp.collapsed .sb-list {
        gap: 12px;
    }
    .sidebar-comp.collapsed .sb-link,
    .sidebar-comp.collapsed .menu-btn {
        justify-content: center; padding: 10px 0; gap: 0 !important;
    }
    .sidebar-comp.collapsed .sb-link i {
        font-size: 1.3rem; width: 24px; text-align: center;
    }
    .sidebar-comp.collapsed .sb-collapse-btn {
        position: absolute; right: -16px; top: 54px; transform: translateY(-50%);
        margin: 0; background: white; border: 1px solid rgba(255,143,80,0.3);
        box-shadow: 0 4px 12px rgba(0,0,0,0.05); width: 32px; height: 32px; font-size: 0.9rem;
        display: flex; align-items: center; justify-content: center;
        flex: 0 0 auto; border-radius: 50%; color: var(--sb-primary); z-index: 100;
    }
    .sidebar-comp.collapsed .sb-collapse-btn:hover {
        background: #fff7ed; color: var(--sb-primary); transform: translateY(-50%) scale(1.1);
    }
    .sidebar-comp.collapsed .sb-header {
        position: relative; flex-direction: row; justify-content: center; align-items: center; 
        padding: 30px 0 25px 0; gap: 0;
    }
    .sidebar-comp.collapsed .sb-footer {
        padding: 15px 10px;
    }
    .sidebar-comp.collapsed .sb-footer .grid {
        grid-template-columns: 1fr;
        gap: 16px;
    }
    .sidebar-comp.collapsed .menu-btn {
        padding: 14px 0;
    }
    .sidebar-comp.collapsed .menu-btn i {
        font-size: 1.3rem; margin: 0;
    }

    /* GLOBAL LAYOUT TRANSITIONS FOR MAIN CONTENT AND HEADER */
    @media (min-width: 1025px) {
        .main-content, .header-comp, #menu-placeholder {
            transition: margin-left 0.4s cubic-bezier(0.16, 1, 0.3, 1), 
                        width 0.4s cubic-bezier(0.16, 1, 0.3, 1), 
                        left 0.4s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        
        /* GLOBAL CONTENT CENTERING TO MATCH INDEX.HTML */
        .main-content {
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .main-content > * {
            width: 100%;
            max-width: 1100px;
        }
        /* Except fixed/overlay elements */
        .main-content > style,
        .main-content > script,
        .main-content > #toast-container,
        .main-content > #fav-toast,
        .main-content > .custom-modal-overlay,
        .main-content > .background-blobs {
            max-width: none;
            width: auto;
        }
    }


    /* FEEDBACK TABS & LIST */
    .sb-list-container { flex: 1; overflow-y: auto; overflow-x: hidden; padding-bottom: 20px; }
    .sb-list-container::-webkit-scrollbar { width: 5px; }
    .sb-list-container::-webkit-scrollbar-thumb { background: rgba(255,143,80,0.3); border-radius: 10px; }
    .sb-list { list-style: none; padding: 0 15px; margin: 0; display: flex; flex-direction: column; gap: 4px; }
    
    .sb-section-title {
        font-size: 0.60rem; font-weight: 900; color: #94a3b8; text-transform: uppercase; 
        letter-spacing: 1px; margin: 15px 0 5px 15px; opacity: 0.8;
    }

    /* ĐÃ SỬA MÀU CHỮ VÀ ICON NHẸ NHÀNG HƠN Ở ĐÂY */
    .sb-link {
        display: flex; align-items: center; gap: 12px; 
        padding: 10px 16px; 
        border-radius: 14px; 
        color: #64748b; /* Màu nhạt hơn, trùng icon */
        font-weight: 610; /* Giảm độ đậm một chút để nhìn thanh thoát */
        font-size: 0.9rem;
        text-decoration: none; transition: all 0.2s;
    }
    .sb-link i { 
        font-size: 0.9rem; width: 20px; text-align: center; 
        color: #64748b; /* Trùng với màu chữ */
        transition: 0.2s;
    }
    
    .sb-link:hover { background: #fff7ed; color: var(--sb-primary); transform: translateX(5px); }
    .sb-link:hover i { color: var(--sb-primary); }
    
    .sb-link.active { background: var(--sb-gradient); color: white !important; box-shadow: 0 6px 15px rgba(255, 94, 98, 0.25); font-weight: 700; }
    .sb-link.active i { color: white; }

    /* FOOTER SIDEBAR */
    .sb-footer { padding: 15px; border-top: 1px solid rgba(0,0,0,0.05); display: flex; flex-direction: column; gap: 10px; flex-shrink: 0; background: rgba(255,255,255,0.5); }
    .menu-btn { width: 100%; padding: 10px; border-radius: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 0.85rem; transition: 0.2s; border: none; font-family: inherit; }
    .btn-feedback { background: white; border: 1.5px solid #fed7aa; color: #f97316; }
    .btn-feedback:hover { background: #fff7ed; }
    .btn-logout { background: #fef2f2; color: #ef4444; border: 1.5px solid transparent; }
    .btn-logout:hover { background: #ef4444; color: white; }

    .sb-version-pill {
        display: inline-flex; align-items: center; gap: 6px; 
        padding: 4px 12px; border-radius: 999px; 
        background-color: rgba(249, 250, 251, 0.8); border: 1px solid #f3f4f6;
        cursor: default; transition: 0.3s;
    }
    .sb-vp-text { font-size: 8px; font-weight: 900; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; }
    .sb-vp-version { font-size: 9px; font-weight: 700; color: #f97316; font-family: monospace; }

    /* MODAL OVERLAY CHUNG */
    .menu-modal-overlay {
        position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(5px);
        z-index: 20000; display: none; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s; padding: 20px;
    }
    .menu-modal-overlay.show { display: flex; opacity: 1; }
    .menu-card {
        background: white; width: 100%; max-width: 420px; padding: 25px;
        border-radius: 24px; box-shadow: 0 20px 50px rgba(0,0,0,0.15);
        transform: scale(0.95); transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275); text-align: center; max-height: 90vh; display: flex; flex-direction: column;
    }
    .menu-modal-overlay.show .menu-card { transform: scale(1); }
    .menu-icon { width: 56px; height: 56px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; margin: 0 auto 15px; flex-shrink: 0; }
    .menu-input { width: 100%; padding: 14px; border: 2px solid #e2e8f0; border-radius: 14px; margin-bottom: 20px; outline: none; resize: none; background: #f8fafc; font-family: inherit; font-size: 0.9rem; transition: 0.2s; }
    .menu-input:focus { border-color: var(--sb-primary); background: white; box-shadow: 0 0 0 3px rgba(255,143,80,0.1); }
    .menu-actions { display: flex; gap: 10px; flex-shrink: 0; }
    .btn-m-cancel { flex: 1; padding: 12px; border-radius: 12px; font-weight: 700; background: #f1f5f9; color: #64748b; cursor: pointer; border: none; font-size: 0.9rem; transition: 0.2s; }
    .btn-m-cancel:hover { background: #e2e8f0; }
    .btn-m-confirm { flex: 1; padding: 12px; border-radius: 12px; font-weight: 700; background: var(--sb-gradient); color: white; cursor: pointer; border: none; box-shadow: 0 4px 15px rgba(255, 94, 98, 0.2); font-size: 0.9rem; transition: 0.2s; }
    .btn-m-confirm:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(255, 94, 98, 0.3); }

    /* FEEDBACK TABS & LIST */
    .fb-tabs { display: flex; background: #f1f5f9; padding: 4px; border-radius: 12px; margin-bottom: 20px; flex-shrink: 0; }
    .fb-tab { flex: 1; padding: 10px; text-align: center; font-size: 0.85rem; font-weight: 700; color: #64748b; border-radius: 10px; cursor: pointer; transition: 0.2s; }
    .fb-tab.active { background: white; color: var(--sb-primary); box-shadow: 0 2px 5px rgba(0,0,0,0.05); }

    .fb-list { flex: 1; overflow-y: auto; text-align: left; display: flex; flex-direction: column; gap: 12px; padding-right: 5px; margin-bottom: 20px; }
    .fb-list::-webkit-scrollbar { width: 5px; }
    .fb-list::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }

    .fb-item { background: #f8fafc; padding: 14px; border-radius: 16px; border: 1px solid #e2e8f0; position: relative; }
    .fb-date { font-size: 0.7rem; color: #94a3b8; font-weight: 600; margin-bottom: 6px; display: block;}
    .fb-content { font-size: 0.9rem; color: #334155; font-weight: 600; line-height: 1.5; }
    .status-badge { position: absolute; top: 12px; right: 12px; font-size: 0.6rem; font-weight: 800; padding: 4px 8px; border-radius: 20px; text-transform: uppercase; }
    .st-sent { background: #e2e8f0; color: #64748b; }
    .st-replied { background: #dcfce7; color: #16a34a; }

    /* ADMIN REPLY */
    .fb-reply-box { margin-top: 12px; padding: 12px; background: #fff7ed; border-left: 3px solid #f97316; border-radius: 8px; display: flex; gap: 8px; align-items: start; }
    .fb-reply-icon { color: #f97316; font-size: 1rem; margin-top: 2px; }
    .fb-reply-text { font-size: 0.85rem; color: #c2410c; font-weight: 500; }
    .fb-reply-title { font-weight: 800; font-size: 0.7rem; text-transform: uppercase; margin-bottom: 4px; display: block; color: #ea580c; }
    .fb-empty { text-align: center; padding: 40px 0; color: #cbd5e1; font-weight: 600; font-size: 0.9rem; }
    .fb-empty i { font-size: 2.5rem; margin-bottom: 15px; display: block; opacity: 0.5; }

    /* DARK MODE */
    html.dark .sidebar-comp { background: #111827 !important; border-color: #1F2937 !important; }
    html.dark .sb-logo-link h1 { color: #f8fafc; }
    html.dark .logo-card-box { background: transparent !important; border-color: #334155 !important; }
    html.dark .sb-link { color: #94a3b8; }
    html.dark .sb-link i { color: #94a3b8; }
    html.dark .sb-link:hover { background: rgba(255,143,80,0.1); color: var(--sb-primary); }
    html.dark .sb-link:hover i { color: var(--sb-primary); }
    html.dark .sb-footer { border-color: #334155; background: transparent; }
    
    html.dark .btn-feedback { background: transparent; border-color: rgba(249, 115, 22, 0.5); }
    html.dark .btn-feedback:hover { background: rgba(249, 115, 22, 0.1); }
    html.dark .btn-logout { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
    html.dark .btn-logout:hover { background: #ef4444; color: white; }
    html.dark .sb-version-pill { background-color: rgba(31, 41, 55, 0.5); border-color: #374151; }
    html.dark .sb-vp-text { color: #6b7280; }

    /* MOBILE RESPONSIVE TWEAKS */
    @media (max-width: 1024px) {
        .sidebar-comp { transform: translateX(-100%); width: 280px !important; }
        .sidebar-comp.open { transform: translateX(0); }
        .sb-close-btn { display: flex; }
        .sb-collapse-btn { display: none !important; } /* Hide collapse button on mobile */
    }
</style>
`;

// --- PHẦN 2: HTML GIAO DIỆN ---
const menuHTML = `
<div class="sb-mobile-overlay" id="sb-mobile-overlay" onclick="toggleSidebarGlobal()"></div>

<aside class="sidebar-comp" id="main-sidebar">
    <div class="sb-header">
        <a href="../" class="sb-logo-link group">
            <div class="logo-card-box shadow-lg">
                <img src="../LOGO.WEBP" alt="HopVan Logo" class="drop-shadow-md">
            </div>
            <div><h1 class="block">HOPVAN</h1></div>
        </a>
        <button id="sb-collapse-btn" class="sb-collapse-btn hidden lg:flex" onclick="toggleSidebarCollapse()" title="Thu gọn/Mở rộng">
            <i class="fas fa-chevron-left transition-transform duration-300"></i>
        </button>
        <button id="sb-close-btn" class="sb-close-btn" onclick="toggleSidebarGlobal()">
            <i class="fas fa-times"></i>
        </button>
    </div>

    <div class="sb-list-container">
        <nav class="sb-list">
            <a href="../dashboard" class="sb-link" data-page="index" title="Tổng quan">
                <i class="fas fa-home"></i> <span>Tổng quan</span>
            </a>

            <div class="sb-section-title">Quản Lý Học Tập</div>
            
            <a href="lythuyet.html" class="sb-link" data-page="lythuyet" title="Kiến thức nền">
                <i class="fas fa-feather-alt"></i> <span>Kiến thức nền</span>
            </a>
            <a href="phongluyende.html" class="sb-link" data-page="phongluyende" title="Phòng luyện đề">
                <i class="fas fa-pen-nib"></i> <span>Phòng luyện đề</span>
            </a>
            <a href="nhatkyhoctap.html" class="sb-link" data-page="nhatkyhoctap" title="Nhật ký học tập">
                <i class="fas fa-book-journal-whills"></i> <span>Nhật ký học tập</span>
            </a>

            <div class="sb-section-title">Khám Phá</div>
            
            <a href="bantinvanhoc.html" class="sb-link" data-page="bantinvanhoc" title="Bản tin Văn học">
                <i class="fas fa-newspaper"></i> <span>Bản tin Văn học</span>
            </a>
            <a href="congdong.html" class="sb-link" data-page="congdong" title="Cộng đồng">
                <i class="fas fa-users"></i> <span>Cộng đồng</span>
            </a>        

            <div class="sb-section-title">Cá Nhân</div>
            
            <a href="account.html" class="sb-link" data-page="account" title="Quản lý tài khoản">
                <i class="fas fa-user-cog"></i> <span>Quản lý tài khoản</span>
            </a>
        </nav>
    </div>

    <div class="sb-footer">
        <div class="grid grid-cols-2 gap-2">
            <button id="menu-btn-feedback" class="menu-btn btn-feedback" title="Góp ý">
                <i class="far fa-comment-dots"></i> <span>Góp ý</span>
            </button>
            <button id="menu-btn-logout" class="menu-btn btn-logout" title="Đăng xuất">
                <i class="fas fa-sign-out-alt"></i> <span>Thoát</span>
            </button>
        </div>

        <div style="margin-top: 5px; width: 100%; display: flex; justify-content: center;">
            <div class="sb-version-pill">
                <span class="sb-vp-text">HopVan Platform</span>
                <span style="width: 4px; height: 4px; border-radius: 50%; background-color: #22c55e;"></span>
                <span class="sb-vp-version">v1.3.7</span>
            </div>
        </div>
    </div>
</aside>

<div id="modal-feedback" class="menu-modal-overlay">
    <div class="menu-card">
        <div class="menu-icon" style="background: #fff7ed; color: #f97316;"><i class="fas fa-paper-plane"></i></div>
        <h3 class="text-xl font-bold text-gray-800 mb-4">Hộp thư Góp ý</h3>

        <div class="fb-tabs">
            <div id="tab-fb-new" class="fb-tab active">Gửi góp ý mới</div>
            <div id="tab-fb-history" class="fb-tab">Lịch sử & Phản hồi</div>
        </div>

        <div id="view-fb-new" style="display: flex; flex-direction: column; flex: 1;">
            <p class="text-sm text-gray-500 mb-4">Chia sẻ ý kiến để Hopvan tốt hơn nhé!</p>
            <textarea id="fb-content" rows="4" class="menu-input" style="flex: 1;" placeholder="Bạn muốn nhắn nhủ điều gì..."></textarea>
            <div class="menu-actions">
                <button class="btn-m-cancel" id="btn-cancel-fb">Đóng</button>
                <button class="btn-m-confirm" id="btn-submit-fb">Gửi đi</button>
            </div>
        </div>

        <div id="view-fb-history" style="display: none; flex-direction: column; flex: 1; overflow: hidden;">
            <div id="fb-history-list" class="fb-list">
                <div class="fb-empty"><i class="far fa-folder-open"></i> Chưa có góp ý nào</div>
            </div>
            <div class="menu-actions">
                <button class="btn-m-cancel" style="width: 100%;" id="btn-close-history">Đóng</button>
            </div>
        </div>
    </div>
</div>

<div id="modal-logout" class="menu-modal-overlay">
    <div class="menu-card" style="max-width: 350px;">
        <div class="menu-icon" style="background: #fef2f2; color: #ef4444;"><i class="fas fa-power-off"></i></div>
        <h3 class="text-xl font-bold text-gray-800 mb-2">Đăng xuất?</h3>
        <p class="text-sm text-gray-500 mb-6">Bạn có chắc chắn muốn rời đi không?</p>
        <div class="menu-actions">
            <button class="btn-m-cancel" id="btn-cancel-logout">Ở lại</button>
            <button class="btn-m-confirm" id="btn-confirm-logout" style="background: #ef4444; box-shadow: 0 4px 15px rgba(239,68,68,0.2);">Đăng xuất</button>
        </div>
    </div>
</div>
`;

// --- PHẦN 3: LOGIC CHỨC NĂNG ---
export function initMenu(app) {
    const auth = getAuth(app);
    const db = getFirestore(app);
    // 1. CHÈN CSS & HTML VÀO CONTAINER
    const container = document.getElementById('menu-placeholder');

    if (container) {
        container.innerHTML = menuStyles + menuHTML;
        startMenuLogic(auth, db);
    } else {
        console.error("Thiếu div id='menu-placeholder'");
    }
}

function startMenuLogic(auth, db) {
    // Restore Collapse State Before Animations
    window.toggleSidebarCollapse = () => {
        const sidebar = document.getElementById('main-sidebar');
        if (!sidebar) return;
        const isCollapsed = sidebar.classList.toggle('collapsed');
        document.documentElement.classList.toggle('sidebar-collapsed', isCollapsed);
        localStorage.setItem('sidebarCollapsed', isCollapsed ? 'true' : 'false');
        
        requestAnimationFrame(() => {
            document.documentElement.style.setProperty('--sidebar-width', isCollapsed ? '100px' : '260px');
            document.documentElement.style.setProperty('--sb-w', isCollapsed ? '100px' : '280px');
        });
        
        // Handle icon rotation properly for bars-staggered
        const icon = document.querySelector('#sb-collapse-btn i');
        if (icon) {
            if (isCollapsed) {
                icon.style.transform = 'scaleX(-1)'; // Flips the staggered bars elegantly
            } else {
                icon.style.transform = 'scaleX(1)';
            }
        }
    };

    if (localStorage.getItem('sidebarCollapsed') === 'true') {
        const sb = document.getElementById('main-sidebar');
        if (sb) sb.classList.add('collapsed');
        document.documentElement.classList.add('sidebar-collapsed');
        
        document.documentElement.style.setProperty('--sidebar-width', '100px');
        document.documentElement.style.setProperty('--sb-w', '100px');
        
        // Update icon immediately without animation
        setTimeout(() => {
            const icon = document.querySelector('#sb-collapse-btn i');
            if (icon) icon.style.transform = 'scaleX(-1)';
        }, 50);
    }

    // 2. HIGHLIGHT MENU ITEM ĐANG CHỌN
    const path = window.location.pathname.toLowerCase();
    const links = document.querySelectorAll('.sb-link');
    links.forEach(link => {
        link.classList.remove('active');
        const page = link.getAttribute('data-page');
        
        if (path.includes(page) || (page === 'index' && (path.endsWith('/') || path.includes('index.html')))) {
            link.classList.add('active');
        }
        
        // Tự động đóng menu trên mobile khi click vào link
        link.addEventListener('click', () => {
            if (window.innerWidth <= 1024) {
                document.getElementById('main-sidebar').classList.remove('open');
                document.getElementById('sb-mobile-overlay').classList.remove('show');
            }
        });
    });

    // Đăng ký hàm Toggle cho Mobile ra global
    window.toggleSidebarGlobal = () => {
        const sb = document.getElementById('main-sidebar');
        const ov = document.getElementById('sb-mobile-overlay');
        if (sb && ov) {
            sb.classList.toggle('open');
            ov.classList.toggle('show');
        }
    };

    // 2. MODAL LOGIC
    const fbModal = document.getElementById('modal-feedback');
    const logoutModal = document.getElementById('modal-logout');
    const openModal = (m) => { m.style.display = 'flex'; setTimeout(()=>m.classList.add('show'), 10); };
    const closeModal = (m) => { m.classList.remove('show'); setTimeout(()=>m.style.display = 'none', 200); };

    document.getElementById('menu-btn-feedback').onclick = () => openModal(fbModal);
    document.getElementById('menu-btn-logout').onclick = () => openModal(logoutModal);
    document.getElementById('btn-cancel-fb').onclick = () => closeModal(fbModal);
    document.getElementById('btn-cancel-logout').onclick = () => closeModal(logoutModal);
    document.getElementById('btn-close-history').onclick = () => closeModal(fbModal);

    // --- LOGIC GÓP Ý NÂNG CAO ---
    const tabNew = document.getElementById('tab-fb-new');
    const tabHistory = document.getElementById('tab-fb-history');
    const viewNew = document.getElementById('view-fb-new');
    const viewHistory = document.getElementById('view-fb-history');
    const listContainer = document.getElementById('fb-history-list');

    const switchFbTab = (tab) => {
        if (tab === 'new') {
            tabNew.classList.add('active'); tabHistory.classList.remove('active');
            viewNew.style.display = 'flex'; viewHistory.style.display = 'none';
        } else {
            tabHistory.classList.add('active'); tabNew.classList.remove('active');
            viewNew.style.display = 'none'; viewHistory.style.display = 'flex';
            loadFeedbackHistory();
        }
    };
    tabNew.onclick = () => switchFbTab('new');
    tabHistory.onclick = () => switchFbTab('history');

    // 3. HÀM TẢI LỊCH SỬ GÓP Ý
    async function loadFeedbackHistory() {
        if (!auth.currentUser) return;
        
        listContainer.innerHTML = '<div class="fb-empty"><i class="fas fa-circle-notch fa-spin"></i>Đang tải...</div>';

        try {
            const q = query(
                collection(db, "feedbacks"),
                where("uid", "==", auth.currentUser.uid)
            );
            
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                listContainer.innerHTML = `
                    <div class="fb-empty">
                        <i class="far fa-comment-alt"></i>
                        Bạn chưa gửi góp ý nào.
                    </div>`;
                return;
            }

            let feedbacks = [];
            querySnapshot.forEach((doc) => {
                feedbacks.push({ id: doc.id, ...doc.data() });
            });

            // Sắp xếp: Mới nhất lên đầu
            feedbacks.sort((a, b) => {
                const timeA = a.timestamp ? a.timestamp.seconds : 0;
                const timeB = b.timestamp ? b.timestamp.seconds : 0;
                return timeB - timeA;
            });

            let html = '';
            feedbacks.forEach((data) => {
                const date = data.timestamp ? new Date(data.timestamp.seconds * 1000).toLocaleDateString('vi-VN') : 'Vừa xong';
                const hasReply = data.reply && data.reply.trim() !== "";
                
                const statusBadge = hasReply 
                    ? `<span class="status-badge st-replied">Đã trả lời</span>` 
                    : `<span class="status-badge st-sent">Đã gửi</span>`;

                const replyBox = hasReply ? `
                    <div class="fb-reply-box">
                        <i class="fas fa-reply fb-reply-icon"></i>
                        <div>
                            <span class="fb-reply-title">Admin phản hồi:</span>
                            <div class="fb-reply-text">${data.reply}</div>
                        </div>
                    </div>
                ` : '';

                html += `
                    <div class="fb-item">
                        ${statusBadge}
                        <span class="fb-date">${date}</span>
                        <div class="fb-content">${data.content}</div>
                        ${replyBox}
                    </div>
                `;
            });

            listContainer.innerHTML = html;

        } catch (e) {
            console.error("Lỗi tải lịch sử:", e);
            listContainer.innerHTML = `<div class="fb-empty" style="color:red; font-size: 0.8rem;">Lỗi: ${e.message}</div>`;
        }
    }

    // 4. GỬI GÓP Ý
    document.getElementById('btn-submit-fb').onclick = async () => {
        const btn = document.getElementById('btn-submit-fb');
        const input = document.getElementById('fb-content');
        const content = input.value.trim();

        if (!content) { alert("Bạn chưa nhập nội dung!"); return; }
        btn.innerText = "Đang gửi..."; btn.disabled = true;

        try {
            await addDoc(collection(db, "feedbacks"), {
                uid: auth.currentUser ? auth.currentUser.uid : "anonymous",
                email: auth.currentUser ? auth.currentUser.email : "unknown",
                content: content,
                page: window.location.pathname,
                timestamp: serverTimestamp(),
                reply: ""
            });
            input.value = "";
            switchFbTab('history'); 
        } catch (e) {
            console.error(e);
            alert("Lỗi kết nối. Vui lòng thử lại.");
        } finally {
            btn.innerText = "Gửi đi"; btn.disabled = false;
        }
    };

    // 5. ĐĂNG XUẤT
    document.getElementById('btn-confirm-logout').onclick = async () => {
        try {
            sessionStorage.removeItem('rankingPopupShown');
            await signOut(auth);
            window.location.href = "../";
        } catch (e) { console.error(e); }
    };
}