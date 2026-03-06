import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { 
    getFirestore, collection, addDoc, serverTimestamp, 
    query, where, orderBy, getDocs // <--- Đã thêm các hàm còn thiếu này
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

    .sidebar-comp {
        width: var(--sb-w); height: 100vh;
        background: var(--sb-glass); backdrop-filter: blur(25px); -webkit-backdrop-filter: blur(25px);
        border-right: var(--sb-border); box-shadow: var(--sb-shadow);
        display: flex; flex-direction: column; padding: 0;
        position: fixed; top: 0; left: 0; z-index: 9999;
        font-family: 'Plus Jakarta Sans', sans-serif;
        transition: transform 0.3s ease;
    }

    /* LOGO */
    .sb-logo-link {
        padding: 35px 35px 30px; display: flex; align-items: center; gap: 10px; text-decoration: none; transition: all 0.3s ease;
    }
    .logo-card-box {
        width: 52px; height: 52px; background: white; border-radius: 15px;
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 10px 25px rgba(255, 143, 80, 0.15); border: 1px solid rgba(255, 143, 80, 0.1);
        transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .logo-card-box img { width: 42px; height: 42px; object-fit: contain; }
    .sb-logo-link h1 {
        font-size: 1.5rem; font-weight: 900; line-height: 1; margin: 0;
        background: var(--sb-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        transition: all 0.3s ease; letter-spacing: -0.5px;
    }
    .sb-logo-link:hover h1 { background: none; -webkit-text-fill-color: #FF8F50; color: #FF8F50; }
    .sb-logo-link:hover .logo-card-box { transform: scale(1.05); box-shadow: 0 15px 35px rgba(255, 143, 80, 0.25); }

    /* MENU LIST */
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

    /* MODAL OVERLAY */
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

    /* FEEDBACK TABS & LIST */
    .fb-tabs { display: flex; background: #f1f5f9; padding: 4px; border-radius: 12px; margin-bottom: 20px; }
    .fb-tab { flex: 1; padding: 10px; text-align: center; font-size: 0.85rem; font-weight: 700; color: #64748b; border-radius: 10px; cursor: pointer; transition: 0.2s; }
    .fb-tab.active { background: white; color: var(--sb-primary); box-shadow: 0 2px 5px rgba(0,0,0,0.05); }

    .fb-list { max-height: 300px; overflow-y: auto; text-align: left; display: flex; flex-direction: column; gap: 12px; padding-right: 5px; }
    .fb-list::-webkit-scrollbar { width: 5px; }
    .fb-list::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }

    .fb-item { background: #f8fafc; padding: 14px; border-radius: 16px; border: 1px solid #e2e8f0; position: relative; }
    .fb-date { font-size: 0.7rem; color: #94a3b8; font-weight: 600; margin-bottom: 4px; display: block;}
    .fb-content { font-size: 0.9rem; color: #334155; font-weight: 500; line-height: 1.5; }
    .status-badge { position: absolute; top: 12px; right: 12px; font-size: 0.65rem; font-weight: 800; padding: 2px 8px; border-radius: 20px; text-transform: uppercase; }
    .st-sent { background: #e2e8f0; color: #64748b; }
    .st-replied { background: #dcfce7; color: #16a34a; }

    /* ADMIN REPLY */
    .fb-reply-box { margin-top: 10px; padding: 12px; background: #fff7ed; border-left: 3px solid #f97316; border-radius: 8px; display: flex; gap: 8px; align-items: start; }
    .fb-reply-icon { color: #f97316; font-size: 1rem; margin-top: 2px; }
    .fb-reply-text { font-size: 0.85rem; color: #c2410c; }
    .fb-reply-title { font-weight: 800; font-size: 0.75rem; text-transform: uppercase; margin-bottom: 2px; display: block; }
    .fb-empty { text-align: center; padding: 30px 0; color: #cbd5e1; }
    .fb-empty i { font-size: 2rem; margin-bottom: 10px; display: block; }

    @media (max-width: 1024px) {
        .sidebar-comp { transform: translateX(-100%); }
        .sidebar-comp.open { transform: translateX(0); }
    }
</style>
`;

// --- PHẦN 2: HTML GIAO DIỆN ---
const menuHTML = `
<aside class="sidebar-comp" id="main-sidebar">
    <a href="../" class="sb-logo-link group">
        <div class="logo-card-box shadow-lg">
            <img src="../LOGO.WEBP" alt="HopVan Logo" class="drop-shadow-md">
        </div>
        <div><h1 class="block">HOPVAN</h1></div>
    </a>

    <nav class="sb-list" style="padding: 0 12px; gap: 4px;">
        <a href="../dashboard" class="sb-link" data-page="index" style="padding: 14px 18px;">
            <i class="fas fa-home w-5 text-center"></i> Tổng quan
        </a>

        <div class="px-4 mt-3.5 mb-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest opacity-80">Quản Lý Học Tập</div>
        <a href="classrooms.html" class="sb-link" data-page="classrooms" style="padding: 14px 18px;">
            <i class="fas fa-chalkboard-teacher w-5 text-center"></i> Lớp học của tôi
        </a>
        <a href="phongluyende.html" class="sb-link" data-page="phongluyende" style="padding: 14px 18px;">
            <i class="fas fa-pen-nib w-5 text-center"></i> Phòng luyện đề
        </a>

        <a href="nhatkyhoctap.html" class="sb-link" data-page="nhatkyhoctap" style="padding: 14px 18px;">
            <i class="fas fa-book-journal-whills w-5 text-center"></i> Nhật ký học tập
        </a>

        <div class="px-4 mt-3.5 mb-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest opacity-80">Khám Phá</div>
        <a href="bantinvanhoc.html" class="sb-link" data-page="bantinvanhoc" style="padding: 14px 18px;">
            <i class="fas fa-newspaper w-5 text-center"></i> Bản tin Văn học
        </a>

        <a href="congdong.html" class="sb-link" data-page="congdong" style="padding: 14px 18px;">
            <i class="fas fa-users w-5 text-center"></i> Cộng đồng
        </a>        

        <div class="px-4 mt-3.5 mb-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest opacity-80">Cá Nhân</div>
        <a href="account.html" class="sb-link" data-page="account" style="padding: 14px 18px;">
            <i class="fas fa-user-cog w-5 text-center"></i> Quản lý tài khoản
        </a>
    </nav>

    <div class="sb-footer" style="padding: 15px; gap: 8px;">
        <div class="grid grid-cols-2 gap-2">
            <button id="menu-btn-feedback" class="menu-btn btn-feedback" style="padding: 9px; font-size: 0.8rem;">
                <i class="far fa-comment-dots"></i> Góp ý
            </button>
            <button id="menu-btn-logout" class="menu-btn btn-logout" style="padding: 9px; font-size: 0.8rem;">
                <i class="fas fa-sign-out-alt"></i> Thoát
            </button>
        </div>

        <div style="margin-top: 8px; width: 100%; display: flex; justify-content: center;">
            <div style="
                display: inline-flex; align-items: center; gap: 8px; 
                padding: 6px 16px; border-radius: 999px; 
                background-color: rgba(249, 250, 251, 0.8); border: 1px solid #f3f4f6;
                backdrop-filter: blur(4px); cursor: default;
            " onmouseover="this.style.backgroundColor='#ffffff'" onmouseout="this.style.backgroundColor='rgba(249, 250, 251, 0.8)'">
                <span style="font-size: 9px; font-weight: 900; color: #9ca3af; text-transform: uppercase; letter-spacing: 1.2px;">HopVan Platform</span>
                <span style="width: 5px; height: 5px; border-radius: 50%; background-color: #22c55e;"></span>
                <span style="font-size: 10px; font-weight: 700; color: #f97316; font-family: monospace;">v1.1.0</span>
            </div>
        </div>
    </div>
</aside>

<div id="modal-feedback" class="menu-modal-overlay">
    <div class="menu-card" style="max-width: 480px;">
        <div class="menu-icon" style="background: #fff7ed; color: #f97316;"><i class="fas fa-paper-plane"></i></div>
        <h3 class="text-xl font-bold text-gray-800 mb-4">Hộp thư Góp ý</h3>

        <div class="fb-tabs">
            <div id="tab-fb-new" class="fb-tab active">Gửi góp ý mới</div>
            <div id="tab-fb-history" class="fb-tab">Lịch sử & Phản hồi</div>
        </div>

        <div id="view-fb-new">
            <p class="text-sm text-gray-500 mb-4">Chia sẻ ý kiến để Hopvan tốt hơn nhé!</p>
            <textarea id="fb-content" rows="4" class="menu-input" placeholder="Bạn muốn nhắn nhủ điều gì..."></textarea>
            <div class="menu-actions">
                <button class="btn-m-cancel" id="btn-cancel-fb">Đóng</button>
                <button class="btn-m-confirm" id="btn-submit-fb">Gửi đi</button>
            </div>
        </div>

        <div id="view-fb-history" style="display: none;">
            <div id="fb-history-list" class="fb-list">
                <div class="fb-empty"><i class="far fa-folder-open"></i> Chưa có góp ý nào</div>
            </div>
            <div class="menu-actions" style="margin-top: 20px;">
                <button class="btn-m-cancel" style="width: 100%;" id="btn-close-history">Đóng</button>
            </div>
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
        container.innerHTML = menuStyles + menuHTML;
        startMenuLogic(auth, db);
    } else {
        console.error("Thiếu div id='menu-placeholder'");
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
            viewNew.style.display = 'block'; viewHistory.style.display = 'none';
        } else {
            tabHistory.classList.add('active'); tabNew.classList.remove('active');
            viewNew.style.display = 'none'; viewHistory.style.display = 'block';
            loadFeedbackHistory();
        }
    };
    tabNew.onclick = () => switchFbTab('new');
    tabHistory.onclick = () => switchFbTab('history');

    // 3. HÀM TẢI LỊCH SỬ GÓP Ý (ĐÃ SỬA LỖI INDEX)
    async function loadFeedbackHistory() {
        if (!auth.currentUser) return;
        
        const listContainer = document.getElementById('fb-history-list');
        listContainer.innerHTML = '<div class="fb-empty"><i class="fas fa-circle-notch fa-spin"></i>Đang tải...</div>';

        try {
            // FIX LỖI: Chỉ dùng WHERE để lấy dữ liệu về trước
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

            // Xử lý dữ liệu và Sắp xếp (Sort) ngay tại đây
            let feedbacks = [];
            querySnapshot.forEach((doc) => {
                feedbacks.push({ id: doc.id, ...doc.data() });
            });

            // Sắp xếp: Mới nhất lên đầu (Dựa vào timestamp)
            feedbacks.sort((a, b) => {
                const timeA = a.timestamp ? a.timestamp.seconds : 0;
                const timeB = b.timestamp ? b.timestamp.seconds : 0;
                return timeB - timeA;
            });

            // Render ra giao diện
            let html = '';
            feedbacks.forEach((data) => {
                const date = data.timestamp ? new Date(data.timestamp.seconds * 1000).toLocaleDateString('vi-VN') : 'Vừa xong';
                
                // Kiểm tra xem Admin đã trả lời chưa
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
            // Hiển thị lỗi cụ thể để dễ debug hơn
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
            switchFbTab('history'); // Chuyển sang tab lịch sử để thấy kết quả
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
            await signOut(auth);
            window.location.href = "../";
        } catch (e) { console.error(e); }
    };

    // 6. Mobile Toggle
    window.toggleSidebarGlobal = () => {
        document.getElementById('main-sidebar').classList.toggle('open');
    };
}