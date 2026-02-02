// chatbot.js - Hopvan AI Assistant (Icon cũ + Nút tắt đẹp)

const styles = `
    /* --- LAUNCHER BUTTON (Nút mở chat) --- */
    #hopvan-chat-launcher {
        position: fixed; bottom: 30px; right: 30px;
        width: 65px; height: 65px;
        background: linear-gradient(135deg, #FF8F50, #FF5E62);
        border-radius: 50%;
        box-shadow: 0 10px 30px rgba(255, 94, 98, 0.5);
        cursor: pointer; z-index: 9999;
        display: flex; align-items: center; justify-content: center;
        transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    #hopvan-chat-launcher:hover { transform: scale(1.1); box-shadow: 0 15px 40px rgba(255, 94, 98, 0.6); }
    #hopvan-chat-launcher i { font-size: 28px; color: white; transition: 0.3s; }
    
    /* Hiệu ứng sóng nhẹ */
    #hopvan-chat-launcher::before {
        content: ''; position: absolute; inset: -5px; border-radius: 50%;
        border: 2px solid rgba(255, 143, 80, 0.5);
        opacity: 0; animation: pulseWave 2s infinite; z-index: -1;
    }
    @keyframes pulseWave { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(1.5); opacity: 0; } }

    /* --- CHAT WINDOW --- */
    #hopvan-chat-window {
        position: fixed; bottom: 110px; right: 30px;
        width: 380px; height: 600px; max-height: 80vh;
        background: #ffffff;
        border-radius: 24px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05);
        display: flex; flex-direction: column;
        overflow: hidden; z-index: 9999;
        opacity: 0; transform: translateY(20px) scale(0.9); pointer-events: none;
        transition: all 0.4s cubic-bezier(0.19, 1, 0.22, 1);
        font-family: 'Plus Jakarta Sans', sans-serif;
    }
    #hopvan-chat-window.active { opacity: 1; transform: translateY(0) scale(1); pointer-events: all; }

    /* Header */
    .chat-header {
        background: linear-gradient(135deg, #FF8F50, #FF5E62);
        padding: 15px 20px; color: white;
        display: flex; align-items: center; justify-content: space-between;
        box-shadow: 0 5px 20px rgba(255, 94, 98, 0.2);
        z-index: 10;
    }
    .bot-info { display: flex; align-items: center; gap: 12px; }
    .bot-avatar {
        width: 40px; height: 40px; background: white; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-size: 20px; color: #FF5E62;
        box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        position: relative;
    }
    .online-dot {
        position: absolute; bottom: 0; right: 0; width: 10px; height: 10px;
        background: #4ade80; border: 2px solid white; border-radius: 50%;
    }

    /* NÚT TẮT ĐƯỢC CHỈNH SỬA (ĐẸP HƠN) */
    #chat-close-btn {
        width: 32px; height: 32px; 
        border-radius: 50%; border: 1px solid rgba(255,255,255,0.3);
        background: rgba(255,255,255,0.15); 
        color: white; cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        transition: all 0.3s ease;
        backdrop-filter: blur(4px);
    }
    #chat-close-btn:hover { 
        background: rgba(255,255,255,0.4); 
        transform: rotate(90deg) scale(1.1); /* Xoay khi hover */
    }

    /* Messages Area */
    .chat-messages {
        flex: 1; padding: 20px; overflow-y: auto;
        background: #fafafa;
        display: flex; flex-direction: column; gap: 15px;
    }
    .chat-messages::-webkit-scrollbar { width: 5px; }
    .chat-messages::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }

    /* Bong bóng tin nhắn */
    .msg { 
        max-width: 85%; padding: 12px 16px; border-radius: 18px; 
        font-size: 0.95rem; line-height: 1.5; word-wrap: break-word; 
        position: relative; box-shadow: 0 2px 5px rgba(0,0,0,0.05);
        animation: msgAppear 0.3s ease-out forwards;
    }
    @keyframes msgAppear { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    .msg-user { 
        background: linear-gradient(135deg, #FF8F50, #FF5E62); 
        color: white; align-self: flex-end; border-bottom-right-radius: 4px; 
    }
    .msg-bot { 
        background: white; color: #374151; 
        align-self: flex-start; border-bottom-left-radius: 4px;
        border: 1px solid #f3f4f6;
    }
    .msg-bot strong { font-weight: 700; color: #c2410c; }
    .msg-bot ul { padding-left: 20px; list-style-type: disc; margin: 5px 0; }

    /* Input Area */
    .chat-input-area {
        padding: 15px 20px; background: white; 
        border-top: 1px solid #f0f0f0;
        display: flex; gap: 12px; align-items: center;
    }
    #chat-input {
        flex: 1; border: 2px solid #f3f4f6; background: #f9fafb;
        padding: 12px 18px; border-radius: 25px; outline: none;
        font-family: inherit; font-size: 0.95rem; transition: 0.3s;
    }
    #chat-input:focus { border-color: #FF8F50; background: white; box-shadow: 0 0 0 4px rgba(255, 143, 80, 0.1); }
    
    #chat-send-btn {
        width: 45px; height: 45px; border-radius: 50%; border: none;
        background: linear-gradient(135deg, #FF8F50, #FF5E62);
        color: white; font-size: 18px; cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        transition: 0.3s; box-shadow: 0 5px 15px rgba(255, 94, 98, 0.3);
    }
    #chat-send-btn:hover { transform: scale(1.1) rotate(10deg); }

    /* Typing Dots */
    .typing-indicator { display: flex; gap: 5px; padding: 12px 16px; background: white; border-radius: 18px; width: fit-content; border: 1px solid #f0f0f0; align-self: flex-start; }
    .dot { width: 8px; height: 8px; background: #cbd5e1; border-radius: 50%; animation: bounceDot 1.4s infinite ease-in-out; }
    .dot:nth-child(1) { animation-delay: -0.32s; }
    .dot:nth-child(2) { animation-delay: -0.16s; }
    @keyframes bounceDot { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }

    @media (max-width: 480px) {
        #hopvan-chat-window { width: 92%; right: 4%; bottom: 100px; height: 65vh; }
    }
`;

// 2. Logic JS
function initChatbot() {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);

    if (!document.querySelector('link[href*="font-awesome"]')) {
        const fa = document.createElement('link');
        fa.rel = 'stylesheet';
        fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
        document.head.appendChild(fa);
    }

    const chatContainer = document.createElement('div');
    chatContainer.innerHTML = `
        <div id="hopvan-chat-launcher" title="Hỏi gia sư Hopvan">
            <i class="fas fa-comment-dots" id="launcher-icon"></i>
        </div>

        <div id="hopvan-chat-window">
            <div class="chat-header">
                <div class="bot-info">
                    <div class="bot-avatar">
                        <i class="fas fa-graduation-cap"></i>
                        <div class="online-dot"></div>
                    </div>
                    <div>
                        <h3 class="font-bold text-lg m-0 leading-tight">Hopvan AI</h3>
                        <p class="text-xs opacity-90 m-0 font-medium">Gia sư văn học</p>
                    </div>
                </div>
                <button id="chat-close-btn" title="Đóng chat">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="chat-messages" id="chat-messages">
                <div class="msg msg-bot">
                    Chào bạn!<br>
                    Mình là <strong>Gia sư AI Hopvan</strong>. Bạn cần tìm dẫn chứng, sửa mở bài, hay phân tích tác phẩm nào không?
                </div>
            </div>
            
            <div class="chat-input-area">
                <input type="text" id="chat-input" placeholder="Nhập câu hỏi... (VD: Dẫn chứng về sự tử tế)" autocomplete="off">
                <button id="chat-send-btn"><i class="fas fa-paper-plane"></i></button>
            </div>
        </div>
    `;
    document.body.appendChild(chatContainer);

    const launcher = document.getElementById('hopvan-chat-launcher');
    const windowEl = document.getElementById('hopvan-chat-window');
    const closeBtn = document.getElementById('chat-close-btn');
    const sendBtn = document.getElementById('chat-send-btn');
    const inputEl = document.getElementById('chat-input');
    const messagesEl = document.getElementById('chat-messages');
    const iconEl = document.getElementById('launcher-icon');

    function toggleChat() {
        const isActive = windowEl.classList.contains('active');
        if (isActive) {
            windowEl.classList.remove('active');
            // Đổi lại icon cũ khi đóng
            iconEl.className = 'fas fa-comment-dots';
        } else {
            windowEl.classList.add('active');
            // Đổi thành icon đóng khi mở (tùy chọn, ở đây giữ icon cũ cũng được nhưng đổi X cho rõ)
            iconEl.className = 'fas fa-times';
            setTimeout(() => inputEl.focus(), 300);
        }
    }

    launcher.addEventListener('click', toggleChat);
    closeBtn.addEventListener('click', toggleChat);

    async function sendMessage() {
        const text = inputEl.value.trim();
        if (!text) return;

        appendMessage(text, 'user');
        inputEl.value = '';

        const loadingId = showLoading();

        try {
            const systemPrompt = `Bạn là Trợ lý AI của Hopvan - nền tảng học Văn thông minh. 
            Nhiệm vụ: Giải đáp thắc mắc về Ngữ Văn, tìm dẫn chứng NLXH, gợi ý viết bài.
            Phong cách: Thân thiện, dùng emoji, xưng "mình" và gọi "bạn". Trình bày dễ đọc, dùng các gạch đầu dòng.
            Câu hỏi: ${text}`;

            const response = await fetch('/.netlify/functions/gemini-proxy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    contents: [{ parts: [{ text: systemPrompt }] }] 
                })
            });

            const data = await response.json();
            removeLoading(loadingId);

            if (data.candidates && data.candidates.length > 0) {
                let reply = data.candidates[0].content.parts[0].text;
                reply = reply
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\n/g, '<br>')
                    .replace(/\* /g, '• ');
                appendMessage(reply, 'bot');
            } else {
                appendMessage("Oop! AI đang kẹt xe, bạn thử lại chút nữa nhé.", 'bot');
            }

        } catch (error) {
            removeLoading(loadingId);
            appendMessage("Lỗi kết nối rồi. Kiểm tra mạng giúp mình nha!", 'bot');
            console.error(error);
        }
    }

    function appendMessage(html, sender) {
        const div = document.createElement('div');
        div.className = `msg msg-${sender}`;
        div.innerHTML = html;
        messagesEl.appendChild(div);
        messagesEl.scrollTo({ top: messagesEl.scrollHeight, behavior: 'smooth' });
    }

    function showLoading() {
        const id = 'loading-' + Date.now();
        const div = document.createElement('div');
        div.id = id;
        div.className = 'typing-indicator';
        div.innerHTML = '<div class="dot"></div><div class="dot"></div><div class="dot"></div>';
        messagesEl.appendChild(div);
        messagesEl.scrollTo({ top: messagesEl.scrollHeight, behavior: 'smooth' });
        return id;
    }

    function removeLoading(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    sendBtn.addEventListener('click', sendMessage);
    inputEl.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
}

document.addEventListener('DOMContentLoaded', initChatbot);