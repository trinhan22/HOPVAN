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
        background: rgba(0, 0, 0, 0.25); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
        display: flex; align-items: center; justify-content: center;
        opacity: 0; visibility: hidden; pointer-events: none; transition: opacity 0.3s ease, visibility 0.3s ease; padding: 20px;
    }
    html.dark .noti-detail-modal {
        background: rgba(11, 17, 32, 0.7);
    }
    .noti-detail-modal.show { opacity: 1; visibility: visible; pointer-events: auto; }
    
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

        <button class="header-icon-btn ml-1" id="btn-show-credits" title="Credits & Về Chúng Tôi">
            <i class="fas fa-info-circle"></i>
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

<!-- Modal Credits -->
<div id="credits-modal" class="noti-detail-modal" onclick="closeCreditsModal()">
    <div class="noti-detail-box" style="max-width: 650px; background: transparent; box-shadow: none;" onclick="event.stopPropagation()">
        
        <div class="bg-white dark:bg-slate-900 rounded-[28px] overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-gray-100 dark:border-slate-800">
            <!-- Header có nền Gradient -->
            <div class="relative overflow-hidden bg-gradient-to-br from-orange-50 to-orange-100 dark:from-slate-800 dark:to-slate-900 px-8 py-6 border-b border-orange-100 dark:border-slate-700">
                <div class="absolute -right-6 -top-6 opacity-10"><i class="fas fa-users text-[100px] text-orange-500"></i></div>
                <div class="flex justify-between items-center relative z-10">
                    <div class="flex items-center gap-3">
                        <button id="credits-back-btn" onclick="showCreditsOverview()" class="hidden w-8 h-8 rounded-full bg-white/60 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 text-orange-500 flex items-center justify-center transition-all shadow-sm mr-2">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <div>
                            <h3 id="credits-modal-title" class="font-black text-2xl text-orange-600 dark:text-orange-400 tracking-tight mb-0.5">Đội ngũ phát triển</h3>
                            <p id="credits-modal-subtitle" class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">HopVan Platform Team</p>
                        </div>
                    </div>
                    <button onclick="closeCreditsModal()" class="w-10 h-10 rounded-full bg-white/60 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 flex items-center justify-center transition-all shadow-sm">
                        <i class="fas fa-times text-lg"></i>
                    </button>
                </div>
            </div>
            
            <div style="overflow: hidden; position: relative;">
                <div id="credits-slider" style="display: flex; width: 200%; transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1);">
                    
                    <!-- TỜ 1: DANH SÁCH -->
                    <div style="width: 50%; padding: 30px; max-height: 70vh; overflow-y: auto;">
                        
                        <!-- NHÓM SÁNG LẬP -->
                        <div class="mb-8">
                            <div class="flex items-center gap-3 mb-5">
                                <div class="h-[2px] flex-1 bg-gray-100 dark:bg-slate-700"></div>
                                <span class="font-black text-gray-400 text-[11px] uppercase tracking-widest"><i class="fas fa-code text-orange-400 mr-2"></i>Nhóm Sáng Lập</span>
                                <div class="h-[2px] flex-1 bg-gray-100 dark:bg-slate-700"></div>
                            </div>
                            
                            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div onclick="showCreditDetail('trinhan')" class="cursor-pointer bg-gray-50 dark:bg-slate-800 rounded-2xl p-4 text-center transition-transform hover:-translate-y-1 hover:shadow-md border border-gray-100 dark:border-slate-700">
                                    <div class="relative w-20 h-20 mx-auto mb-3">
                                        <img src="../IMG/trinhan.png" onerror="this.src='../LOGO.WEBP'" class="w-full h-full rounded-full object-cover border-[3px] border-white dark:border-slate-700 shadow-sm">
                                        <div class="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-500 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center text-white text-[11px]" title="Developer"><i class="fas fa-laptop-code"></i></div>
                                    </div>
                                    <p class="font-black text-[15px] text-gray-900 dark:text-white mb-0.5">Trí Nhân</p>
                                    <p class="text-[10px] uppercase font-bold text-blue-500">Dev & Design</p>
                                </div>
                                <div onclick="showCreditDetail('cattuong')" class="cursor-pointer bg-gray-50 dark:bg-slate-800 rounded-2xl p-4 text-center transition-transform hover:-translate-y-1 hover:shadow-md border border-gray-100 dark:border-slate-700">
                                    <div class="relative w-20 h-20 mx-auto mb-3">
                                        <img src="../IMG/cattuong.png" onerror="this.src='../LOGO.WEBP'" class="w-full h-full rounded-full object-cover border-[3px] border-white dark:border-slate-700 shadow-sm">
                                        <div class="absolute -bottom-1 -right-1 w-7 h-7 bg-pink-500 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center text-white text-[11px]" title="Content"><i class="fas fa-pen-nib"></i></div>
                                    </div>
                                    <p class="font-black text-[15px] text-gray-900 dark:text-white mb-0.5">Cát Tường</p>
                                    <p class="text-[10px] uppercase font-bold text-pink-500">Content Dev</p>
                                </div>
                                <div onclick="showCreditDetail('dangkhoa')" class="cursor-pointer bg-gray-50 dark:bg-slate-800 rounded-2xl p-4 text-center transition-transform hover:-translate-y-1 hover:shadow-md border border-gray-100 dark:border-slate-700">
                                    <div class="relative w-20 h-20 mx-auto mb-3">
                                        <img src="../IMG/dangkhoa.png" onerror="this.src='../LOGO.WEBP'" class="w-full h-full rounded-full object-cover border-[3px] border-white dark:border-slate-700 shadow-sm">
                                        <div class="absolute -bottom-1 -right-1 w-7 h-7 bg-green-500 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center text-white text-[11px]" title="Content"><i class="fas fa-book-open"></i></div>
                                    </div>
                                    <p class="font-black text-[15px] text-gray-900 dark:text-white mb-0.5">Đăng Khoa</p>
                                    <p class="text-[10px] uppercase font-bold text-green-500">Content Dev</p>
                                </div>
                            </div>
                        </div>

                        <!-- GIÁO VIÊN HƯỚNG DẪN -->
                        <div class="mb-4">
                            <div class="flex items-center gap-3 mb-5">
                                <div class="h-[2px] flex-1 bg-gray-100 dark:bg-slate-700"></div>
                                <span class="font-black text-gray-400 text-[11px] uppercase tracking-widest"><i class="fas fa-chalkboard-teacher text-purple-400 mr-2"></i>Giáo Viên Cố Vấn</span>
                                <div class="h-[2px] flex-1 bg-gray-100 dark:bg-slate-700"></div>
                            </div>
                            
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div onclick="showCreditDetail('thaythien')" class="cursor-pointer flex items-center gap-4 bg-gray-50 dark:bg-slate-800 rounded-2xl p-4 border border-gray-100 dark:border-slate-700 transition-transform hover:-translate-y-1 hover:shadow-md">
                                    <img src="../IMG/minhthien.png" onerror="this.src='../LOGO.WEBP'" class="w-14 h-14 rounded-full object-cover border-2 border-white dark:border-slate-700 shadow-sm">
                                    <div>
                                        <p class="font-black text-sm text-gray-900 dark:text-white leading-tight mb-1">Trang Minh Thiên</p>
                                        <p class="text-[10px] uppercase font-bold text-purple-500">Cố vấn kỹ thuật</p>
                                    </div>
                                </div>
                                <div onclick="showCreditDetail('cobinh')" class="cursor-pointer flex items-center gap-4 bg-gray-50 dark:bg-slate-800 rounded-2xl p-4 border border-gray-100 dark:border-slate-700 transition-transform hover:-translate-y-1 hover:shadow-md">
                                    <img src="../IMG/thanhbinh.png" onerror="this.src='../LOGO.WEBP'" class="w-14 h-14 rounded-full object-cover border-2 border-white dark:border-slate-700 shadow-sm">
                                    <div>
                                        <p class="font-black text-sm text-gray-900 dark:text-white leading-tight mb-1">Mai Thị Thanh Bình</p>
                                        <p class="text-[10px] uppercase font-bold text-pink-500">Cố vấn học thuật</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- FOOTER -->
                        <div class="flex items-center justify-center gap-6 mt-5 pt-5 mb-4 border-t border-gray-100 dark:border-slate-800">
                            <img src="../LOGO.WEBP" alt="HopVan" class="h-8 opacity-70 hover:opacity-100 transition-opacity">
                            <div class="h-6 w-px bg-gray-200 dark:bg-slate-700"></div>
                            <img src="../fpt.png" alt="FPT High School" class="h-8 opacity-70 hover:opacity-100 transition-opacity">
                        </div>
                    </div>
                    
                    <!-- TỜ 2: CHI TIẾT -->
                    <div style="width: 50%; padding: 30px; max-height: 70vh; overflow-y: auto;">
                        <div class="flex flex-col items-center text-center pt-4">
                            <div class="relative w-28 h-28 mx-auto mb-5">
                                <img id="detail-avatar" src="" class="w-full h-full rounded-full object-cover border-4 border-orange-200 dark:border-slate-700 shadow-lg">
                                <div id="detail-badge" class="absolute -bottom-1 -right-1 w-9 h-9 rounded-full border-[3px] border-white dark:border-slate-900 flex items-center justify-center text-white text-sm shadow-md"></div>
                            </div>
                            
                            <h4 id="detail-name" class="font-black text-2xl text-gray-900 dark:text-white mb-1"></h4>
                            <p id="detail-role" class="text-[11px] uppercase font-bold text-orange-500 mb-1.5 tracking-widest"></p>
                            
                            <div id="detail-socials" class="flex items-center justify-center gap-2 mb-4"></div>
                            
                            <div class="bg-gray-50 dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 w-full text-left relative overflow-hidden">
                                <i class="fas fa-quote-right absolute -bottom-4 -right-2 text-[80px] text-gray-100 dark:text-slate-700 opacity-50 pointer-events-none"></i>
                                <h5 class="font-black text-gray-400 uppercase text-[11px] tracking-widest mb-3 border-b border-gray-200 dark:border-slate-600 pb-2 relative z-10"><i class="fas fa-info-circle mr-1 text-orange-400"></i> Giới thiệu chi tiết</h5>
                                <p id="detail-bio" class="text-sm leading-relaxed text-gray-600 dark:text-gray-300 relative z-10 font-medium"></p>
                            </div>
                        </div>
                    </div>
                    
                </div>
            </div>
        </div>
    </div>
</div>
`;

// --- ĐƯA CÁC HÀM XỬ LÝ RA WINDOW ĐỂ HOẠT ĐỘNG ĐƯỢC KHI CLICK ---
window.currentNotifications = [];

const creditData = {
    'trinhan': {
        name: 'Nguyễn Trí Nhân', role: 'Visual & Web Developer',
        avatar: '../IMG/trinhan.png', fallback: '../LOGO.WEBP',
        badgeColor: 'bg-blue-500', icon: 'fa-laptop-code',
        bio: 'Học sinh K5A8 – Trường THPT FPT Cần Thơ, phụ trách thiết kế, lập trình và phát triển hệ thống cho website HOPVAN.',
        socials: { fb: 'https://www.facebook.com/tris.nhaan', email: 'mailto:nhanntfct30802@gmail.com', portfolio: 'https://trisnhaan.com' }
    },
    'cattuong': {
        name: 'Châu Ngọc Cát Tường', role: 'Content Developer',
        avatar: '../IMG/cattuong.png', fallback: '../LOGO.WEBP',
        badgeColor: 'bg-pink-500', icon: 'fa-pen-nib',
        bio: 'Học sinh K5A8 – Trường THPT FPT Cần Thơ, phụ trách nội dung, ý tưởng và truyền thông của HOPVAN.',
        socials: { fb: 'https://www.facebook.com/cat.tuong.708243', email: 'mailto:tuongcncfct30670@gmail.com' }
    },
    'dangkhoa': {
        name: 'Nguyễn Hoàng Đăng Khoa', role: 'Content Developer',
        avatar: '../IMG/dangkhoa.png', fallback: '../LOGO.WEBP',
        badgeColor: 'bg-green-500', icon: 'fa-book-open',
        bio: 'Học sinh K5A8 – Trường THPT FPT Cần Thơ, phụ trách nội dung và kiến thức Ngữ văn trên HOPVAN.',
        socials: { fb: 'https://www.facebook.com/ven.ste.351', email: 'mailto:khoanhdfct30731@gmail.com' }
    },
    'thaythien': {
        name: 'Thầy Trang Minh Thiên', role: 'Giáo Viên Cố Vấn Kỹ Thuật',
        avatar: '../IMG/minhthien.png', fallback: '../LOGO.WEBP',
        badgeColor: 'bg-purple-500', icon: 'fa-chalkboard-teacher',
        bio: 'Giáo viên Công nghệ & Robotics hiện đang công tác tại Trường THPT Nguyễn Việt Dũng và Trường THPT FPT Cần Thơ, đồng thời là người phụ trách kỹ thuật của dự án HOPVAN.',
        socials: { fb: 'https://www.facebook.com/thien.trangminh', email: 'mailto:' }
    },
    'cobinh': {
        name: 'Cô Mai Thị Thanh Bình', role: 'Giáo Viên Cố Vấn Học Thuật',
        avatar: '../IMG/thanhbinh.png', fallback: '../LOGO.WEBP',
        badgeColor: 'bg-pink-500', icon: 'fa-chalkboard-teacher',
        bio: 'Giáo viên bộ môn Ngữ văn – Trường THPT FPT Cần Thơ, đồng thời là người phụ trách học thuật của HOPVAN.',
        socials: { fb: 'https://www.facebook.com/thanhbinh.rain', email: 'mailto:' }
    }
};

window.showCreditDetail = (id) => {
    const data = creditData[id];
    if(!data) return;
    
    // Cập nhật giao diện trang 2
    const imgObj = document.getElementById('detail-avatar');
    imgObj.src = data.avatar;
    imgObj.onerror = () => { imgObj.src = data.fallback; };
    
    document.getElementById('detail-name').innerText = data.name;
    document.getElementById('detail-role').innerText = data.role;
    document.getElementById('detail-role').className = `text-[11px] uppercase font-bold mb-6 tracking-widest ${data.badgeColor.replace('bg-', 'text-')}`;
    document.getElementById('detail-bio').innerText = data.bio;
    
    document.getElementById('detail-badge').className = `absolute -bottom-1 -right-1 w-9 h-9 rounded-full border-[3px] border-white flex items-center justify-center text-white text-sm shadow-md ${data.badgeColor}`;
    document.getElementById('detail-badge').innerHTML = `<i class="fas ${data.icon}"></i>`;
    
    // Render Socials
    const socialsContainer = document.getElementById('detail-socials');
    socialsContainer.innerHTML = '';
    if(data.socials) {
        if(data.socials.fb) {
            socialsContainer.innerHTML += `<a href="${data.socials.fb}" target="_blank" class="w-8 h-8 text-xs rounded-full bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-all shadow-sm"><i class="fab fa-facebook-f"></i></a>`;
        }
        if(data.socials.email) {
            socialsContainer.innerHTML += `<a href="${data.socials.email}" class="w-8 h-8 text-xs rounded-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all shadow-sm"><i class="fas fa-envelope"></i></a>`;
        }
        if(data.socials.portfolio) {
            socialsContainer.innerHTML += `<a href="${data.socials.portfolio}" target="_blank" class="px-3 h-8 text-[11px] font-bold tracking-wide rounded-full bg-orange-50 text-orange-600 hover:bg-orange-500 hover:text-white flex items-center justify-center transition-all shadow-sm border border-orange-100"><i class="fas fa-globe mr-1.5"></i>Portfolio</a>`;
        }
    }
    
    // Trượt qua
    document.getElementById('credits-slider').style.transform = 'translateX(-50%)';
    
    // Đổi Header
    document.getElementById('credits-back-btn').classList.remove('hidden');
    document.getElementById('credits-modal-title').innerText = 'Chi tiết thành viên';
    document.getElementById('credits-modal-subtitle').innerText = 'Profile Info';
};

window.showCreditsOverview = () => {
    document.getElementById('credits-slider').style.transform = 'translateX(0)';
    document.getElementById('credits-back-btn').classList.add('hidden');
    document.getElementById('credits-modal-title').innerText = 'Đội ngũ phát triển';
    document.getElementById('credits-modal-subtitle').innerText = 'HopVan Platform Team';
};

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

window.closeCreditsModal = () => {
    document.getElementById('credits-modal').classList.remove('show');
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
    const btnCredits = document.getElementById('btn-show-credits');

    if (btnCredits) {
        btnCredits.addEventListener('click', () => {
            document.getElementById('credits-modal').classList.add('show');
        });
    }

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
                            document.getElementById('header-greeting').innerHTML = `<i class="fas fa-crown text-yellow-500 mr-1"></i> Xin Chào, ${rawName}`;
                            document.getElementById('header-user-role').innerText = 'Quản trị viên';
                            document.getElementById('header-user-role').style.color = '#FF8F50';
                        } else {
                            document.getElementById('header-greeting').innerHTML = `<i class="fas fa-book-open text-orange-400 mr-1"></i> Xin Chào, ${rawName}`;
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
                        
                        // Đồng bộ theme từ Firebase xuống LocalStorage và UI
                        if (uData.theme && uData.theme !== localStorage.getItem('theme')) {
                            localStorage.setItem('theme', uData.theme);
                            if (typeof window.applyTheme === 'function') window.applyTheme(uData.theme);
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

    // --- 3. LOGIC XỬ LÝ THEME (SÁNG / TỐI) ĐỒNG BỘ LOCALSTORAGE VÀ TAB ---
    window.applyTheme = function(theme, animate = false) {
        if (!theme) return;
        const isDark = theme === 'dark';
        
        const applyChanges = () => {
            if (isDark) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
            updateThemeUI();
            const loader = document.getElementById('global-loader');
            if(loader) loader.style.background = isDark ? '#0B1120' : '#FFF5EC';
            window.dispatchEvent(new CustomEvent('themeChanged', { detail: { isDark } }));
        };

        if (animate) {
            const overlay = document.createElement('div');
            Object.assign(overlay.style, {
                position: 'fixed', inset: '0', zIndex: '999999',
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                backgroundColor: isDark ? '#0B1120' : '#FFF5EC',
                opacity: '0', pointerEvents: 'none',
                transition: 'opacity 0.4s ease'
            });
            
            const icon = document.createElement('i');
            icon.className = isDark ? 'fas fa-moon' : 'fas fa-sun';
            Object.assign(icon.style, {
                fontSize: '8rem', color: isDark ? '#F8FAFC' : '#FF8F50',
                transform: 'scale(0.2) translateY(50px)', opacity: '0',
                transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                textShadow: isDark ? '0 0 40px rgba(248,250,252,0.4)' : '0 0 40px rgba(255,143,80,0.4)'
            });
            
            overlay.appendChild(icon);
            document.body.appendChild(overlay);
            
            requestAnimationFrame(() => {
                overlay.style.opacity = '1';
                icon.style.transform = 'scale(1) translateY(0)';
                icon.style.opacity = '1';
            });
            
            setTimeout(() => {
                applyChanges();
                setTimeout(() => {
                    overlay.style.opacity = '0';
                    icon.style.transform = 'scale(1.5) translateY(-50px)';
                    icon.style.opacity = '0';
                    setTimeout(() => overlay.remove(), 400); 
                }, 600); 
            }, 400); 
            
        } else {
            applyChanges();
        }
    };

    function updateThemeUI() {
        if (!iconTheme || !btnTheme) return;
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
        const isDarkNow = !document.documentElement.classList.contains('dark');
        const newTheme = isDarkNow ? 'dark' : 'light';
        
        localStorage.setItem('theme', newTheme);
        window.applyTheme(newTheme, true); // Kích hoạt hiệu ứng

        // Lưu Firebase
        try {
            const auth = getAuth();
            if (auth.currentUser) {
                const db = getFirestore();
                await updateDoc(doc(db, "users", auth.currentUser.uid), { theme: newTheme });
            }
        } catch (e) {}
    });

    // --- 3.5 CROSS-TAB SYNC LẮNG NGHE SỰ KIỆN STORAGE ---
    window.addEventListener('storage', (e) => {
        if (e.key === 'theme') {
            window.applyTheme(e.newValue);
        }
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