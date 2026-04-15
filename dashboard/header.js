import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc, collection, query, orderBy, onSnapshot, limit } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const headerStyles = `
<style>
    /* Thanh Header "Pill" nổi lên giữa nội dung */
    .hopvan-floating-header {
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(25px);
        -webkit-backdrop-filter: blur(25px);
        border: 1px solid rgba(255, 255, 255, 1);
        box-shadow: 0 10px 40px rgba(255, 143, 80, 0.08);
        border-radius: 999px; 
        padding: 6px 10px 6px 25px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 30px;
        transition: all 0.3s ease;
        position: relative;
        z-index: 999;
    }

    html.dark .hopvan-floating-header {
        background: rgba(17, 24, 39, 0.85); 
        border-color: rgba(31, 41, 55, 1); 
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
    }

    /* Avatar Box */
    .header-avatar-box {
        width: 42px; height: 42px;
        border-radius: 50%;
        background: linear-gradient(135deg, #FF8F50, #FF5E62);
        display: flex; align-items: center; justify-content: center;
        color: white; font-weight: 900; font-size: 1.1rem;
        box-shadow: 0 4px 15px rgba(255, 143, 80, 0.4);
        overflow: hidden;
        border: 2px solid white;
        transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    html.dark .header-avatar-box { border-color: #1f2937; }
    .header-user-btn:hover .header-avatar-box { transform: scale(1.1) rotate(-5deg); }

    /* Nút Icon tiện ích (Thông báo, Darkmode) */
    .header-icon-btn {
        width: 40px; height: 40px;
        border-radius: 50%;
        background: #f8fafc; 
        color: #64748b; 
        display: flex; align-items: center; justify-content: center;
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        border: 1px solid #f1f5f9; outline: none; cursor: pointer;
        position: relative;
    }
    html.dark .header-icon-btn { background: #1f2937; color: #94a3b8; border-color: #374151; }
    .header-icon-btn:hover { background: #FF8F50; color: white; transform: translateY(-3px); box-shadow: 0 6px 15px rgba(255,143,80,0.3); border-color: #FF8F50; }
    html.dark .header-icon-btn:hover { background: #FF8F50; color: white; }

    /* Dropdown Thông báo Nhỏ */
    .noti-popup {
        position: absolute; right: 0; top: calc(100% + 15px);
        width: 380px; max-width: calc(100vw - 40px);
        background: #ffffff; 
        border-radius: 24px;
        box-shadow: 0 25px 60px rgba(0,0,0,0.15);
        border: 1px solid #e2e8f0;
        opacity: 0; visibility: hidden; transform: translateY(-15px) scale(0.95);
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        z-index: 99999 !important;
        transform-origin: top right;
        overflow: hidden;
    }
    .noti-popup.show { opacity: 1; visibility: visible; transform: translateY(0) scale(1); }
    html.dark .noti-popup { background: #111827; border-color: #374151; box-shadow: 0 25px 60px rgba(0,0,0,0.5); }
    
    .noti-header {
        background: #ffffff; padding: 16px 20px; border-bottom: 1px solid #f1f5f9;
        display: flex; justify-content: space-between; align-items: center;
    }
    html.dark .noti-header { background: #1f2937; border-bottom-color: #374151; }

    .noti-list { max-height: 400px; overflow-y: auto; padding: 12px; background: #fafafa; }
    html.dark .noti-list { background: #0B1120; }
    .noti-list::-webkit-scrollbar { width: 5px; }
    .noti-list::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
    html.dark .noti-list::-webkit-scrollbar-thumb { background: #475569; }

    .noti-item {
        background: #ffffff; padding: 14px; border-radius: 16px; margin-bottom: 8px;
        transition: 0.2s; border: 1px solid #f1f5f9; display: flex; gap: 14px; cursor: pointer;
        box-shadow: 0 2px 5px rgba(0,0,0,0.01);
    }
    .noti-item:hover { transform: translateX(4px); border-color: #FF8F50; box-shadow: 0 4px 12px rgba(255,143,80,0.1); }
    html.dark .noti-item { background: #1f2937; border-color: #374151; }
    .noti-item.unread { background: #fff7ed; border-color: #fed7aa; }
    html.dark .noti-item.unread { background: rgba(255, 143, 80, 0.1); border-color: rgba(255, 143, 80, 0.3); }

    .noti-icon { width: 40px; height: 40px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; flex-shrink: 0; }
    
    /* Ép màu chữ */
    .hopvan-text-dark { color: #2D3436 !important; }
    html.dark .hopvan-text-dark { color: #F8FAFC !important; }
    .hopvan-text-muted { color: #636E72 !important; }
    html.dark .hopvan-text-muted { color: #94A3B8 !important; }

    /* =========================================
       MODAL CHI TIẾT THÔNG BÁO (TÂN TRANG)
       ========================================= */
    .noti-detail-modal {
        position: fixed; inset: 0; z-index: 9999999; /* Đẩy max z-index để không bị menu đè */
        background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
        display: none; align-items: center; justify-content: center;
        opacity: 0; transition: opacity 0.3s ease; padding: 20px;
    }
    .noti-detail-modal.show { display: flex; opacity: 1; }
    
    .noti-detail-box {
        background: #ffffff; border-radius: 28px;
        width: 100%; max-width: 550px; max-height: 85vh;
        box-shadow: 0 25px 60px -12px rgba(0,0,0,0.3);
        transform: translateY(20px) scale(0.95);
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        display: flex; flex-direction: column; overflow: hidden;
    }
    .noti-detail-modal.show .noti-detail-box { transform: translateY(0) scale(1); }
    html.dark .noti-detail-box { background: #1e293b; border: 1px solid #334155; box-shadow: 0 25px 60px -12px rgba(0,0,0,0.6); }

    .noti-detail-header {
        padding: 24px 30px; border-bottom: 1px solid #f1f5f9;
        display: flex; justify-content: space-between; align-items: flex-start;
    }
    html.dark .noti-detail-header { border-color: #334155; }

    .noti-detail-body { padding: 30px; overflow-y: auto; flex-grow: 1; }
    .noti-detail-body p { white-space: pre-wrap; line-height: 1.7; font-size: 1.05rem; }
    
    .noti-detail-footer {
        padding: 16px 30px; background: #f8fafc; border-radius: 0 0 28px 28px;
        border-top: 1px solid #f1f5f9; text-align: right;
    }
    html.dark .noti-detail-footer { background: #0f172a; border-color: #334155; }
</style>
`;

const headerHTML = `
<div class="hopvan-floating-header">
    <div class="text-[11px] font-black text-gray-400 tracking-wider uppercase hidden sm:block">
        <span id="header-greeting" style="color: #FF8F50;">Đang kết nối...</span>
    </div>

    <div class="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-end">
        <div class="relative" id="noti-container">
            <button class="header-icon-btn" id="btn-toggle-noti" title="Thông báo">
                <i class="far fa-bell"></i>
                <span id="noti-badge" class="hidden absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            </button>

            <div class="noti-popup" id="noti-dropdown">
                <div class="noti-header">
                    <h4 class="font-black text-sm hopvan-text-dark tracking-wide">THÔNG BÁO</h4>
                    <button id="btn-read-all" class="text-[10px] font-bold text-orange-500 hover:text-orange-600 uppercase transition bg-orange-50 px-2 py-1 rounded-md">Đánh dấu đã đọc</button>
                </div>
                <div class="noti-list" id="noti-list-body">
                    <div class="text-center text-xs text-gray-400 py-10 font-bold"><i class="fas fa-spinner fa-spin text-xl mb-2 text-orange-400"></i><br>Đang tải...</div>
                </div>
            </div>
        </div>

        <button class="header-icon-btn" id="btn-toggle-theme" title="Đổi giao diện">
            <i class="far fa-moon" id="icon-theme"></i>
        </button>

        <div onclick="window.location.href='account.html'" class="header-user-btn flex items-center gap-3 pl-4 py-1 cursor-pointer group border-l border-gray-200 dark:border-gray-700 ml-1">
            <div class="text-right hidden md:block">
                <div class="text-sm font-black transition-colors hopvan-text-dark group-hover:text-orange-500" id="header-user-name">Đang tải...</div>
                <div class="text-[10px] font-bold uppercase mt-0.5 hopvan-text-muted" id="header-user-role">Học Viên</div>
            </div>
            <div class="header-avatar-box" id="header-user-avatar">
                <i class="fas fa-spinner fa-spin text-xs"></i>
            </div>
        </div>
    </div>
</div>
`;

// HTML của Modal Bự được nhúng RIÊNG LẼ
const modalHTML = `
<div id="noti-detail-modal" class="noti-detail-modal">
    <div class="noti-detail-box">
        <div class="noti-detail-header">
            <div class="flex items-center gap-4">
                <div id="detail-icon" class="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm"></div>
                <div>
                    <h3 id="detail-title" class="font-black text-xl hopvan-text-dark leading-tight mb-1"></h3>
                    <span id="detail-time" class="text-xs font-bold text-gray-400 flex items-center gap-1"><i class="far fa-clock"></i> <span></span></span>
                </div>
            </div>
            <button onclick="closeNotiDetailModal()" class="w-10 h-10 rounded-full bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 flex items-center justify-center transition-colors dark:bg-gray-800 dark:hover:bg-red-900/30">
                <i class="fas fa-times text-lg"></i>
            </button>
        </div>
        <div class="noti-detail-body custom-scrollbar">
            <p id="detail-content" class="hopvan-text-muted"></p>
        </div>
        <div class="noti-detail-footer">
            <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest"><i class="fas fa-shield-alt mr-1 text-orange-300"></i> Hệ thống HopVan Platform</span>
        </div>
    </div>
</div>
`;

// --- ĐƯA CÁC HÀM XỬ LÝ RA WINDOW ĐỂ HOẠT ĐỘNG ĐƯỢC KHI CLICK ---
window.currentNotifications = [];

window.openNotiDetail = (idx, iconColorClass, iconClass) => {
    const data = window.currentNotifications[idx];
    if(!data) return;

    // Đổ Data vào Modal
    const iconBox = document.getElementById('detail-icon');
    iconBox.className = `w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm ${iconColorClass}`;
    iconBox.innerHTML = `<i class="fas ${iconClass}"></i>`;

    document.getElementById('detail-title').innerText = data.title;
    
    // Xử lý timestamp từ Firebase an toàn
    let timeStr = "Vừa xong";
    if (data.createdAt) {
        try {
            timeStr = data.createdAt.toDate().toLocaleString('vi-VN');
        } catch(e) {
            timeStr = "Gần đây";
        }
    }
    
    document.querySelector('#detail-time span').innerText = timeStr;
    document.getElementById('detail-content').innerText = data.body;

    // Ẩn dropdown nhỏ, Hiện Modal to
    document.getElementById('noti-dropdown').classList.remove('show');
    document.getElementById('noti-detail-modal').classList.add('show');
};

window.closeNotiDetailModal = () => {
    document.getElementById('noti-detail-modal').classList.remove('show');
};


export function initHeader(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // 1. Chèn CSS
    document.head.insertAdjacentHTML('beforeend', headerStyles);
    
    // 2. Chèn Header
    container.innerHTML = headerHTML;
    
    // 3. Chèn Modal ra ngoài thẻ <body> để thoát khỏi Stacking Context (Chống Menu đè)
    if (!document.getElementById('noti-detail-modal')) {
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    // --- ELEMENTS ---
    const btnTheme = document.getElementById('btn-toggle-theme');
    const iconTheme = document.getElementById('icon-theme');
    const btnNoti = document.getElementById('btn-toggle-noti');
    const notiDropdown = document.getElementById('noti-dropdown');
    const notiContainer = document.getElementById('noti-container');
    const notiListBody = document.getElementById('noti-list-body');
    const notiBadge = document.getElementById('noti-badge');
    const btnReadAll = document.getElementById('btn-read-all');

    // --- 1. FIREBASE LẤY THÔNG TIN USER (AVATAR & TÊN THẬT) ---
    try {
        const auth = getAuth();
        const db = getFirestore();

        onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Lắng nghe dữ liệu user từ Firestore
                const userRef = doc(db, "users", user.uid);
                
                onSnapshot(userRef, (docSnap) => {
                    if (docSnap.exists()) {
                        const uData = docSnap.data();
                        const rawName = uData.name || user.displayName || user.email.split('@')[0];
                        
                        document.getElementById('header-user-name').innerText = rawName;
                        
                        // Lời chào theo vai trò
                        if (uData.role === 'admin' || user.email === 'admin@hopvan.com') {
                            document.getElementById('header-greeting').innerHTML = `<i class="fas fa-crown text-yellow-500 mr-1"></i> Chào ${rawName}`;
                            document.getElementById('header-user-role').innerText = 'Quản trị viên';
                            document.getElementById('header-user-role').style.color = '#FF8F50';
                        } else {
                            document.getElementById('header-greeting').innerHTML = `<i class="fas fa-book-open text-orange-400 mr-1"></i> Chào ${rawName}`;
                            document.getElementById('header-user-role').innerText = 'Học Viên';
                        }

                        // Xử lý Avatar thực tế
                        const finalAvatar = uData.customAvatar || uData.photoURL || user.photoURL;
                        const avatarBox = document.getElementById('header-user-avatar');

                        if (finalAvatar) {
                            avatarBox.innerHTML = `<img src="${finalAvatar}" class="w-full h-full object-cover">`;
                            avatarBox.style.background = 'transparent';
                        } else {
                            avatarBox.innerHTML = rawName.charAt(0).toUpperCase();
                            avatarBox.style.background = 'linear-gradient(135deg, #FF8F50, #FF5E62)';
                        }
                    }
                });

                // --- 2. FIREBASE LẤY THÔNG BÁO ---
                loadNotifications(db, user.uid);

            } else {
                document.getElementById('header-user-name').innerText = "Khách";
                document.getElementById('header-user-avatar').innerHTML = '<i class="fas fa-user text-sm"></i>';
            }
        });

    } catch (e) {
        console.warn("Lỗi khởi tạo Auth Header:", e);
    }

    // --- 3. LOGIC XỬ LÝ THEME (SÁNG / TỐI) ĐỒNG BỘ LOCALSTORAGE ---
    function updateThemeUI() {
        const isDark = document.documentElement.classList.contains('dark');
        if (isDark) {
            iconTheme.className = "fas fa-sun"; // Hiện mặt trời
            btnTheme.style.color = "#fbbf24"; // Vàng
        } else {
            iconTheme.className = "far fa-moon"; // Mặt trăng
            btnTheme.style.color = "#64748b"; // Xám
        }
    }
    
    updateThemeUI();

    btnTheme.addEventListener('click', async () => {
        const htmlEl = document.documentElement;
        htmlEl.classList.toggle('dark');
        const isDarkNow = htmlEl.classList.contains('dark');
        
        localStorage.setItem('theme', isDarkNow ? 'dark' : 'light');
        updateThemeUI();

        // Đổi màu nền loading
        const loader = document.getElementById('global-loader');
        if(loader) loader.style.background = isDarkNow ? '#0B1120' : '#FFF5EC';

        // Lưu Firebase
        try {
            const auth = getAuth();
            if (auth.currentUser) {
                const db = getFirestore();
                await updateDoc(doc(db, "users", auth.currentUser.uid), { theme: isDarkNow ? 'dark' : 'light' });
            }
        } catch (e) {}
    });

    // --- 4. LOGIC DROPDOWN THÔNG BÁO ---
    btnNoti.addEventListener('click', (e) => {
        notiDropdown.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
        if (!notiContainer.contains(e.target)) {
            notiDropdown.classList.remove('show');
        }
    });

    // Hàm load Notification (GOM CẢ CHUNG & RIÊNG) từ Firebase
    function loadNotifications(db, uid) {
        const globalQ = query(collection(db, "system_notifications"), orderBy("createdAt", "desc"), limit(10));
        const personalQ = query(collection(db, "users", uid, "notifications"), orderBy("createdAt", "desc"), limit(10));
        
        let globalNotis = [];
        let personalNotis = [];

        // Hàm gộp và render
        const mergeAndRender = () => {
            // Gom 2 mảng lại với nhau
            let allNotis = [...globalNotis, ...personalNotis];

            // Sắp xếp lại theo thời gian mới nhất (desc)
            allNotis.sort((a, b) => {
                const timeA = a.createdAt ? a.createdAt.toMillis() : 0;
                const timeB = b.createdAt ? b.createdAt.toMillis() : 0;
                return timeB - timeA;
            });

            // Chỉ lấy 10 cái mới nhất để khỏi nặng giao diện
            allNotis = allNotis.slice(0, 10);

            if (allNotis.length === 0) {
                notiListBody.innerHTML = `
                    <div class="text-center text-xs text-gray-400 py-12 flex flex-col items-center justify-center">
                        <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3 dark:bg-gray-800">
                            <i class="far fa-bell-slash text-2xl text-gray-300 dark:text-gray-500"></i>
                        </div>
                        <span class="font-bold text-gray-500">Chưa có thông báo nào</span>
                        <span class="text-[10px] mt-1">Khi có tin mới, nó sẽ hiện ở đây!</span>
                    </div>`;
                notiBadge.classList.add('hidden');
                return;
            }

            renderNotiList(allNotis);
        };

        // Lắng nghe Thông báo chung
        onSnapshot(globalQ, (snap) => {
            globalNotis = [];
            snap.forEach(doc => globalNotis.push({ id: doc.id, path: 'system_notifications', ...doc.data() }));
            mergeAndRender();
        });

        // Lắng nghe Thông báo cá nhân
        onSnapshot(personalQ, (snap) => {
            personalNotis = [];
            snap.forEach(doc => personalNotis.push({ id: doc.id, path: `users/${uid}/notifications`, ...doc.data() }));
            mergeAndRender();
        });
    }

    function renderNotiList(notis) {
        let hasUnread = false;
        
        // Update dữ liệu Global để truyền vào Modal Bự
        window.currentNotifications = notis;

        notiListBody.innerHTML = notis.map((n, idx) => {
            if (!n.isRead) hasUnread = true;
            
            // Xử lý Type ra class
            let iconClass = 'fa-bell';
            let iconColorClass = 'bg-blue-100 text-blue-500';
            
            if (n.type === 'system') { iconClass = 'fa-cog'; iconColorClass = 'bg-gray-200 text-gray-600'; }
            if (n.type === 'reward') { iconClass = 'fa-gift'; iconColorClass = 'bg-yellow-100 text-yellow-600'; }
            if (n.type === 'welcome') { iconClass = 'fa-hand-sparkles'; iconColorClass = 'bg-orange-100 text-orange-500'; }
            
            // Đánh dấu trực quan nếu là tin cá nhân
            const isPersonal = n.path.startsWith('users');
            const personalBadge = isPersonal ? `<i class="fas fa-user-circle text-blue-400 mr-1" title="Thông báo cá nhân"></i>` : '';

            // Format ngày giờ an toàn
            let timeStr = "Mới";
            if(n.createdAt && n.createdAt.toDate) {
                try {
                    const d = n.createdAt.toDate();
                    timeStr = `${d.getDate()}/${d.getMonth()+1}`;
                } catch(e){}
            }

            return `
            <div class="noti-item ${n.isRead ? '' : 'unread'}" onclick="openNotiDetail(${idx}, '${iconColorClass}', '${iconClass}')">
                <div class="noti-icon ${iconColorClass}"><i class="fas ${iconClass}"></i></div>
                <div class="flex-1 min-w-0">
                    <div class="flex justify-between items-start mb-1">
                        <h5 class="text-xs font-black hopvan-text-dark truncate mr-2">${personalBadge}${n.title}</h5>
                        <span class="text-[9px] font-bold text-gray-400 whitespace-nowrap">${timeStr}</span>
                    </div>
                    <p class="text-xs hopvan-text-muted font-medium leading-relaxed line-clamp-2">${n.body}</p>
                </div>
            </div>
            `;
        }).join('');

        if (hasUnread) notiBadge.classList.remove('hidden');
        else notiBadge.classList.add('hidden');
    }

    // Đánh dấu đã đọc
    btnReadAll.addEventListener('click', () => {
        const items = document.querySelectorAll('.noti-item.unread');
        items.forEach(el => el.classList.remove('unread'));
        notiBadge.classList.add('hidden');
    });
}