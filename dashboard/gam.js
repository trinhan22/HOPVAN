/**
 * HOPVAN GAMIFICATION - INTEGRATED VERSION
 * Design: Modern iOS Card (Clean & Vibrant)
 * Logic: 
 * - Kết nối chính xác với 9 phòng luyện thi.
 * - Nhận diện thể loại: Thơ, Kịch, Ký, Truyện, Fulltest...
 * - Daily Login: +4 Keys.
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc, increment, collection, query, where, getDocs, Timestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import confetti from 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/+esm';

// --- 1. CONFIG ---
const firebaseConfig = {
    apiKey: "AIzaSyAJ9C2biYeiLPmhakzLZ4mEqfO9_VgPSZE",
    authDomain: "hopvan-9a648.firebaseapp.com",
    projectId: "hopvan-9a648",
    storageBucket: "hopvan-9a648.appspot.com",
    messagingSenderId: "429347196227",
    appId: "1:429347196227:web:917b8d019f0efd0f7833f6",
    measurementId: "G-1BG8PSRG0R"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- 2. STYLES (MODERN iOS CARD) ---
const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap');

    :root {
        --hv-orange: #FF8F50;
        --hv-red: #FF5E62;
        --hv-gradient: linear-gradient(135deg, #FF8F50 0%, #FF5E62 100%);
        --hv-shadow: 0 12px 40px rgba(255, 94, 98, 0.25);
        --hv-card-shadow: 0 8px 24px rgba(149, 157, 165, 0.1);
        --text-primary: #1e293b;
        --text-secondary: #64748b;
        --bg-panel: #ffffff;
    }

    #hv-gam-root {
        font-family: 'Plus Jakarta Sans', sans-serif;
        position: fixed;
        bottom: 107px; right: 30px; z-index: 9990;
        display: flex; flex-direction: column; align-items: flex-end;
    }

    /* --- 1. TRIGGER BUTTON (Nút Mở) --- */
    #hv-gam-trigger {
        width: 65px; height: 65px;
        background: white;
        border-radius: 50px;
        box-shadow: var(--hv-shadow);
        cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        position: relative;
        border: 1px solid #fff0e6;
    }

    #hv-gam-trigger:hover { transform: scale(1.1); box-shadow: 0 15px 40px rgba(255, 94, 98, 0.35); }

    #hv-gam-trigger i { 
        font-size: 28px; 
        background: var(--hv-gradient); 
        -webkit-background-clip: text; -webkit-text-fill-color: transparent; 
        transition: 0.3s;
    }

    .hv-badge {
        position: absolute; top: -5px; right: -5px;
        background: #ef4444; color: white;
        font-size: 10px; font-weight: 800;
        padding: 4px 8px; border-radius: 10px;
        border: 2px solid white;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        display: none; animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    /* MAIN PANEL */
    #hv-gam-panel {
        position: absolute; bottom: 85px; right: 0; width: 360px;
        background: var(--bg-panel);
        border-radius: 30px;
        box-shadow: 0 30px 60px -12px rgba(50, 50, 93, 0.15), 0 18px 36px -18px rgba(0, 0, 0, 0.1);
        opacity: 0; transform: translateY(20px) scale(0.95);
        pointer-events: none; visibility: hidden;
        transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        overflow: hidden;
        border: 1px solid #f1f5f9;
    }
    #hv-gam-panel.open { opacity: 1; transform: translateY(0) scale(1); pointer-events: all; visibility: visible; }

    /* HEADER */
    .gam-header {
        background: var(--hv-gradient);
        padding: 25px 25px 60px; 
        color: white; border-radius: 0 0 40% 40% / 20px;
        position: relative;
    }
    .gh-top { display: flex; justify-content: space-between; align-items: center; }
    .gh-title { font-size: 1.2rem; font-weight: 800; display: flex; align-items: center; gap: 8px; }
    .gh-close { 
        background: rgba(255,255,255,0.2); width: 32px; height: 32px; 
        border-radius: 50%; display: flex; align-items: center; justify-content: center;
        cursor: pointer; transition: 0.2s; backdrop-filter: blur(5px);
    }
    .gh-close:hover { background: white; color: var(--hv-orange); transform: rotate(90deg); }

    /* STATS BOX */
    .gam-stats {
        display: flex; justify-content: space-between;
        background: white; width: 85%; margin: -45px auto 15px;
        padding: 15px 20px; border-radius: 20px;
        box-shadow: var(--hv-card-shadow);
        position: relative; z-index: 5;
    }
    .gs-col { text-align: center; flex: 1; }
    .gs-col:first-child { border-right: 1px solid #f1f5f9; }
    .gs-val { font-size: 1.5rem; font-weight: 800; color: var(--text-primary); display: block; line-height: 1; margin-bottom: 4px; }
    .gs-lbl { font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; }

    /* TABS */
    .gam-tabs {
        background: #f1f5f9; margin: 0 25px 15px; padding: 4px;
        border-radius: 16px; display: flex; position: relative;
    }
    .gt-btn {
        flex: 1; padding: 10px; border: none; background: transparent;
        font-size: 0.9rem; font-weight: 700; color: #94a3b8;
        cursor: pointer; z-index: 2; transition: 0.3s;
        border-radius: 12px;
    }
    .gt-btn.active { color: var(--hv-orange); background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }

    /* CONTENT */
    .gam-body { padding: 5px 25px 25px; min-height: 230px; }
    .g-view { display: none; animation: slideUp 0.3s ease; }
    .g-view.active { display: block; }

    /* DAILY VIEW */
    .daily-box { text-align: center; padding-top: 10px; }
    .fire-ring {
        width: 90px; height: 90px; margin: 0 auto 15px;
        background: #fff7ed; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        position: relative;
    }
    .fire-ring::before {
        content: ''; position: absolute; inset: -5px; border-radius: 50%;
        border: 2px dashed #ffedd5; animation: spin 10s linear infinite;
    }
    .big-fire {
        font-size: 3.5rem; 
        background: var(--hv-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        animation: float 3s ease-in-out infinite;
    }
    .daily-note { font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 20px; line-height: 1.5; }
    
    .btn-claim {
        width: 100%; padding: 16px; border: none; border-radius: 16px;
        background: var(--hv-gradient); color: white;
        font-weight: 800; font-size: 1rem; cursor: pointer;
        box-shadow: 0 10px 25px rgba(255, 94, 98, 0.3);
        transition: 0.2s; display: flex; align-items: center; justify-content: center; gap: 10px;
    }
    .btn-claim:hover:not(:disabled) { transform: translateY(-3px); box-shadow: 0 15px 35px rgba(255, 94, 98, 0.4); }
    .btn-claim:disabled { background: #cbd5e1; box-shadow: none; cursor: not-allowed; }

    /* QUEST VIEW */
    .q-card {
        background: white; border: 1px solid #f1f5f9;
        border-radius: 18px; padding: 14px; margin-bottom: 12px;
        display: flex; align-items: center; gap: 14px;
        transition: 0.2s;
    }
    .q-card:hover { border-color: #fdba74; transform: scale(1.02); box-shadow: 0 5px 15px rgba(255, 143, 80, 0.1); }
    .q-card.done { opacity: 0.6; background: #f8fafc; filter: grayscale(1); }
    
    .q-icon {
        width: 42px; height: 42px; background: #fff7ed; color: var(--hv-orange);
        border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem;
    }
    .q-content h4 { margin: 0 0 4px; font-size: 0.9rem; color: var(--text-primary); font-weight: 700; }
    .q-content p { margin: 0; font-size: 0.75rem; color: var(--text-secondary); }
    
    .q-status { margin-left: auto; text-align: right; }
    .tag-reward { 
        background: #fee2e2; color: var(--hv-red); 
        font-size: 0.75rem; font-weight: 800; padding: 4px 10px; border-radius: 20px; 
    }
    .icon-check { color: #10b981; font-size: 1.4rem; }

    .all-done-msg { text-align: center; padding: 30px 0; animation: slideUp 0.5s; }
    .all-done-msg i { font-size: 3.5rem; color: #f59e0b; margin-bottom: 15px; filter: drop-shadow(0 5px 15px rgba(245,158,11,0.2)); }

    /* ANIMATIONS */
    @keyframes spin { 100% { transform: rotate(360deg); } }
    @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes popIn { from { transform: scale(0); } to { transform: scale(1); } }
    .shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
    @keyframes shake { 10%, 90% { transform: translate3d(-1px, 0, 0); } 20%, 80% { transform: translate3d(2px, 0, 0); } 30%, 50%, 70% { transform: translate3d(-4px, 0, 0); } 40%, 60% { transform: translate3d(4px, 0, 0); } }
`;

// --- 3. LOGIC ---
class Gamification {
    constructor() {
        this.user = null;
        this.userData = { keys: 0, streak: 0, lastClaimDate: '' };
        this.progress = {};
        this.dailyQuests = [];

        // KHO 36 NHIỆM VỤ CHI TIẾT (Đã tối ưu cho 9 phòng luyện)
        this.questPool = [
            // 1. Khởi động (5)
            { id: 'w1', icon: 'fa-mug-hot', title: 'Khởi đầu nhẹ', desc: 'Làm 1 bài tập bất kỳ', target: 1, reward: 1, filter: a => true },
            { id: 'w2', icon: 'fa-bolt', title: 'Tăng tốc nhanh', desc: 'Làm 2 bài tập bất kỳ', target: 2, reward: 2, filter: a => true },
            { id: 'w3', icon: 'fa-sun', title: 'Chào ngày mới', desc: 'Làm 1 bài Đọc Hiểu', target: 1, reward: 2, filter: a => a.type === 'reading' },
            { id: 'w4', icon: 'fa-check', title: 'Thử tài nhanh', desc: 'Làm 1 đề Trắc Nghiệm', target: 1, reward: 2, filter: a => a.type === 'quiz' },
            { id: 'w5', icon: 'fa-pencil-alt', title: 'Cảm hứng viết', desc: 'Viết 1 đoạn NLXH', target: 1, reward: 3, filter: a => a.type === 'nlxh' },

            // 2. Trắc nghiệm & Đọc hiểu (6)
            { id: 'qz1', icon: 'fa-check-double', title: 'Vua Trắc Nghiệm I', desc: 'Làm 1 đề Trắc Nghiệm', target: 1, reward: 3, filter: a => a.type === 'quiz' },
            { id: 'qz2', icon: 'fa-brain', title: 'Siêu trí tuệ', desc: 'Làm 2 đề Trắc Nghiệm', target: 2, reward: 5, filter: a => a.type === 'quiz' },
            { id: 'qz3', icon: 'fa-stopwatch', title: 'Tốc độ ánh sáng', desc: 'Làm 3 đề Trắc Nghiệm', target: 3, reward: 8, filter: a => a.type === 'quiz' },
            { id: 'rd1', icon: 'fa-glasses', title: 'Đôi mắt tinh anh', desc: 'Làm 1 bài Đọc Hiểu', target: 1, reward: 2, filter: a => a.type === 'reading' },
            { id: 'rd2', icon: 'fa-book-open', title: 'Thấu hiểu văn bản', desc: 'Làm 2 bài Đọc Hiểu', target: 2, reward: 5, filter: a => a.type === 'reading' },
            { id: 'rd3', icon: 'fa-search', title: 'Tầm soát chữ', desc: 'Làm 3 bài Đọc Hiểu', target: 3, reward: 8, filter: a => a.type === 'reading' },

            // 3. Nghị luận xã hội (5)
            { id: 'sh1', icon: 'fa-users', title: 'Góc nhìn xã hội', desc: 'Viết 1 bài NLXH', target: 1, reward: 3, filter: a => a.type === 'nlxh' },
            { id: 'sh2', icon: 'fa-comments', title: 'Tiếng nói trẻ', desc: 'Viết 2 bài NLXH', target: 2, reward: 7, filter: a => a.type === 'nlxh' },
            { id: 'sh3', icon: 'fa-fingerprint', title: 'Bản sắc riêng', desc: 'Viết 1 bài NLXH sâu sắc', target: 1, reward: 4, filter: a => a.type === 'nlxh' },
            { id: 'sh4', icon: 'fa-gavel', title: 'Nhà hùng biện', desc: 'Viết 3 bài NLXH', target: 3, reward: 12, filter: a => a.type === 'nlxh' },
            { id: 'sh5', icon: 'fa-earth-asia', title: 'Trách nhiệm công dân', desc: 'Làm 1 đề NLXH đặc biệt', target: 1, reward: 4, filter: a => a.type === 'nlxh' },

            // 4. Nghị luận văn học theo thể loại (12)
            { id: 'th1', icon: 'fa-feather-alt', title: 'Hồn thơ I', desc: 'Làm 1 đề về Thơ', target: 1, reward: 4, filter: a => a.type === 'nlvh' && a.genre === 'Thơ' },
            { id: 'th2', icon: 'fa-music', title: 'Giai điệu cảm xúc', desc: 'Làm 2 đề về Thơ', target: 2, reward: 9, filter: a => a.type === 'nlvh' && a.genre === 'Thơ' },
            { id: 'th3', icon: 'fa-wind', title: 'Phiêu lãng chữ', desc: 'Làm 3 đề về Thơ', target: 3, reward: 15, filter: a => a.type === 'nlvh' && a.genre === 'Thơ' },
            
            { id: 'tr1', icon: 'fa-book', title: 'Thế giới truyện I', desc: 'Làm 1 đề về Truyện', target: 1, reward: 4, filter: a => a.type === 'nlvh' && a.genre === 'Truyện' },
            { id: 'tr2', icon: 'fa-user-tag', title: 'Nhân vật điển hình', desc: 'Làm 2 đề về Truyện', target: 2, reward: 9, filter: a => a.type === 'nlvh' && a.genre === 'Truyện' },
            { id: 'tr3', icon: 'fa-bookmark', title: 'Mạch kể truyện', desc: 'Làm 3 đề về Truyện', target: 3, reward: 15, filter: a => a.type === 'nlvh' && a.genre === 'Truyện' },

            { id: 'kc1', icon: 'fa-masks-theater', title: 'Sân khấu kịch I', desc: 'Làm 1 đề về Kịch', target: 1, reward: 4, filter: a => a.type === 'nlvh' && a.genre === 'Kịch' },
            { id: 'kc2', icon: 'fa-bolt', title: 'Xung đột kịch tính', desc: 'Làm 2 đề về Kịch', target: 2, reward: 10, filter: a => a.type === 'nlvh' && a.genre === 'Kịch' },

            { id: 'ki1', icon: 'fa-pen-fancy', title: 'Cái tôi Ký I', desc: 'Làm 1 đề về Ký', target: 1, reward: 4, filter: a => a.type === 'nlvh' && a.genre === 'Ký' },
            { id: 'ki2', icon: 'fa-map-marked-alt', title: 'Dấu chân lãng tử', desc: 'Làm 2 đề về Ký', target: 2, reward: 9, filter: a => a.type === 'nlvh' && a.genre === 'Ký' },
            
            { id: 'mix1', icon: 'fa-pen-nib', title: 'Nhà phê bình', desc: 'Viết 1 bài NLVH bất kỳ', target: 1, reward: 3, filter: a => a.type === 'nlvh' },
            { id: 'mix2', icon: 'fa-scroll', title: 'Cây bút vàng', desc: 'Viết 2 bài NLVH bất kỳ', target: 2, reward: 8, filter: a => a.type === 'nlvh' },

            // 5. Thử thách nâng cao (8)
            { id: 'ft1', icon: 'fa-layer-group', title: 'Chiến binh sĩ tử', desc: 'Làm 1 đề Tổng hợp', target: 1, reward: 10, filter: a => a.type === 'fulltest' },
            { id: 'ft2', icon: 'fa-dragon', title: 'Huyền thoại HopVan', desc: 'Làm 2 đề Tổng hợp', target: 2, reward: 25, filter: a => a.type === 'fulltest' },
            { id: 'rn1', icon: 'fa-dice', title: 'Nhân phẩm cao', desc: 'Làm 1 đề Ngẫu nhiên', target: 1, reward: 3, filter: a => a.type === 'essay' },
            { id: 'rn2', icon: 'fa-random', title: 'Vạn sự tùy duyên', desc: 'Làm 2 đề Ngẫu nhiên', target: 2, reward: 8, filter: a => a.type === 'essay' },
            { id: 'cb1', icon: 'fa-balance-scale', title: 'Văn võ song toàn', desc: '1 Đọc hiểu + 1 NLXH', target: 2, reward: 6, filter: a => a.type === 'reading' || a.type === 'nlxh' },
            { id: 'gr1', icon: 'fa-fire-alt', title: 'Cày cuốc chăm chỉ', desc: 'Hoàn thành 5 bài tập', target: 5, reward: 10, filter: a => true },
            { id: 'gr2', icon: 'fa-gem', title: 'Học bá toàn năng', desc: 'Hoàn thành 10 bài tập', target: 10, reward: 22, filter: a => true },
            { id: 'wr1', icon: 'fa-pencil-ruler', title: 'Đỉnh cao ngòi bút', desc: 'Viết 2 bài văn dài', target: 2, reward: 10, filter: a => a.type === 'nlxh' || a.type === 'nlvh' }
        ];

        this.init();
    }

    init() {
        const s = document.createElement("style"); s.innerHTML = styles; document.head.appendChild(s);
        this.render();
        
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                this.user = user;
                // --- FIX 0: Hiện Keys và Streak ngay lập tức ---
                await this.syncUserData();
                this.updateUIBasic();

                // Chạy ngầm việc check nhiệm vụ (không làm treo màn hình)
                this.selectQuests();
                await this.checkQuests();
                this.updateUIQuests();
                
                // Tự động mở popup nếu hôm nay chưa nhận thưởng ngày
                const today = new Date().toLocaleDateString('en-CA');
                if (this.userData.lastClaimDate !== today) {
                    setTimeout(() => {
                        const panel = document.getElementById('hv-gam-panel');
                        if (panel) {
                            document.getElementById('hv-gam-trigger').classList.add('shake');
                            panel.classList.add('open');
                        }
                    }, 1500);
                }
            } else { document.getElementById('hv-gam-root').style.display = 'none'; }
        });
    }

    // --- LOGIC TÁCH BIỆT: TẢI DATA USER ---
    async syncUserData() {
        const snap = await getDoc(doc(db, 'users', this.user.uid));
        if (snap.exists()) this.userData = { ...this.userData, ...snap.data() };
    }

    // --- LOGIC TÁCH BIỆT: TẢI DATA NHIỆM VỤ ---
    async checkQuests() {
        const start = new Date(); start.setHours(0,0,0,0);
        const q = query(collection(db, 'activities'), where('uid', '==', this.user.uid), where('timestamp', '>=', Timestamp.fromDate(start)));
        const snap = await getDocs(q);
        const acts = snap.docs.map(d => d.data());
        this.dailyQuests.forEach(q => { this.progress[q.id] = acts.filter(q.filter).length; });
    }

    // Cập nhật số liệu Keys/Streak (Chạy ngay)
    updateUIBasic() {
        document.getElementById('ui-streak').textContent = this.userData.streak || 0;
        document.getElementById('ui-keys').textContent = this.userData.keys || 0;
        
        const today = new Date().toLocaleDateString('en-CA');
        const btn = document.getElementById('btn-claim');
        const badge = document.querySelector('.hv-badge');
        const icon = document.querySelector('#hv-gam-trigger i');

        // --- FIX F5: Chặn nhận thưởng lặp lại dựa vào lastClaimDate ---
        if (this.userData.lastClaimDate === today) {
            btn.innerHTML = '<span><i class="fas fa-check"></i> ĐÃ NHẬN HÔM NAY</span>';
            btn.disabled = true;
            badge.style.display = 'none';
            icon.className = 'fas fa-trophy';
        } else {
            btn.innerHTML = '<i class="fas fa-gift"></i><span>NHẬN +4 KEYS</span>';
            btn.disabled = false;
            badge.style.display = 'block';
            icon.className = 'fas fa-gift';
        }
    }

    // Cập nhật danh sách nhiệm vụ (Chạy sau)
    updateUIQuests() {
        const list = document.getElementById('quest-list');
        const allDone = this.dailyQuests.every(q => (this.progress[q.id] || 0) >= q.target);
        
        if (allDone && this.dailyQuests.length > 0) {
            list.innerHTML = `<div class="all-done-msg"><i class="fas fa-medal"></i><h3 style="margin:0; color:#1e293b;">Xuất sắc!</h3><p style="color:#64748b; font-size:0.9rem;">Bạn đã hoàn thành tất cả nhiệm vụ.</p></div>`;
        } else {
            list.innerHTML = this.dailyQuests.map(q => {
                const cur = this.progress[q.id] || 0; const done = cur >= q.target;
                return `<div class="q-card ${done ? 'done' : ''}">
                    <div class="q-icon"><i class="fas ${q.icon}"></i></div>
                    <div class="q-content"><h4>${q.title}</h4><p>${q.desc} (${cur}/${q.target})</p></div>
                    <div class="q-status">${done ? '<i class="fas fa-check-circle icon-check"></i>' : `<span class="tag-reward">+${q.reward} Key</span>`}</div>
                </div>`;
            }).join('');
        }
    }

    selectQuests() {
        const today = new Date().toLocaleDateString('en-CA');
        const key = `hv_q_${this.user.uid}_${today}`;
        const saved = localStorage.getItem(key);
        if (saved) {
            const ids = JSON.parse(saved);
            this.dailyQuests = this.questPool.filter(q => ids.includes(q.id));
        } else {
            const shuffled = [...this.questPool].sort(() => 0.5 - Math.random());
            this.dailyQuests = shuffled.slice(0, 4);
            localStorage.setItem(key, JSON.stringify(this.dailyQuests.map(q => q.id)));
        }
    }

    async claim() {
        const btn = document.getElementById('btn-claim');
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ĐANG XỬ LÝ...';
        btn.disabled = true;

        try {
            const today = new Date().toLocaleDateString('en-CA');
            // Kiểm tra Fresh Data một lần nữa trước khi nộp
            const snap = await getDoc(doc(db, 'users', this.user.uid));
            if (snap.exists() && snap.data().lastClaimDate === today) {
                 this.userData.lastClaimDate = today;
                 this.updateUIBasic();
                 return;
            }

            await updateDoc(doc(db, 'users', this.user.uid), {
                keys: increment(4), lastClaimDate: today
            });
            this.userData.keys += 4; this.userData.lastClaimDate = today;
            this.updateUIBasic();
            confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#FF8F50', '#FF5E62', '#ffffff'] });
        } catch(e) { console.error(e); btn.innerText = "Lỗi!"; btn.disabled = false; }
    }

    render() {
        const div = document.createElement('div'); div.id = 'hv-gam-root';
        div.innerHTML = `
            <div id="hv-gam-panel">
                <div class="gam-header">
                    <div class="gh-top">
                        <div class="gh-title"><i class="fas fa-crown"></i> HopVan Rewards</div>
                        <div class="gh-close" onclick="document.getElementById('hv-gam-panel').classList.remove('open')"><i class="fas fa-times"></i></div>
                    </div>
                </div>
                <div class="gam-stats">
                    <div class="gs-col"><span class="gs-val" id="ui-streak"><i class="fas fa-spinner fa-spin"></i></span><span class="gs-lbl">Ngày Streak</span></div>
                    <div class="gs-col"><span class="gs-val" id="ui-keys" style="color:var(--hv-orange)"><i class="fas fa-spinner fa-spin"></i></span><span class="gs-lbl">Keys</span></div>
                </div>
                <div class="gam-tabs">
                    <button class="gt-btn active" onclick="window.hvSwitch('daily', this)">Điểm danh</button>
                    <button class="gt-btn" onclick="window.hvSwitch('quests', this)">Nhiệm vụ</button>
                </div>
                <div class="gam-body custom-scrollbar">
                    <div id="view-daily" class="g-view active">
                        <div class="daily-box">
                            <div class="fire-ring"><i class="fas fa-fire big-fire"></i></div>
                            <p class="daily-note">Duy trì ngọn lửa học tập mỗi ngày.<br><strong>Nhận ngay +4 Keys miễn phí!</strong></p>
                            <button id="btn-claim" class="btn-claim" disabled>Đang kiểm tra...</button>
                        </div>
                    </div>
                    <div id="view-quests" class="g-view"><div id="quest-list" style="text-align:center; padding:20px; color:#ccc;">Đang nạp nhiệm vụ...</div></div>
                </div>
            </div>
            <div id="hv-gam-trigger" onclick="document.getElementById('hv-gam-panel').classList.toggle('open')"><i class="fas fa-trophy"></i><div class="hv-badge">!</div></div>`;
        document.body.appendChild(div);

        window.hvSwitch = (tab, el) => {
            document.querySelectorAll('.gt-btn').forEach(b => b.classList.remove('active')); el.classList.add('active');
            document.querySelectorAll('.g-view').forEach(v => v.classList.remove('active'));
            document.getElementById(`view-${tab}`).classList.add('active');
        };
        document.getElementById('btn-claim').addEventListener('click', () => this.claim());
    }
}

new Gamification();