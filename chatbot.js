// chatbot.js - Hopvan AI Assistant (Fix for Groq Proxy)

const styles = `
    /* --- LAUNCHER BUTTON --- */
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
    
    .bot-avatar-wrapper { position: relative; width: 42px; height: 42px; flex-shrink: 0; }
    .bot-avatar {
        width: 100%; height: 100%; background: white; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 4px 10px rgba(0,0,0,0.1);
    }
    .bot-avatar img {
        width: 100%; height: 100%; object-fit: cover;
        border-radius: 50%; border: 2px solid white; box-sizing: border-box;
    }
    .online-dot {
        position: absolute; bottom: -1px; right: -1px;
        width: 11px; height: 11px;
        background: #4ade80; border: 2px solid white; border-radius: 50%; z-index: 2;
    }

    #chat-close-btn {
        width: 32px; height: 32px; 
        border-radius: 50%; border: 1px solid rgba(255,255,255,0.3);
        background: rgba(255,255,255,0.15); 
        color: white; cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        transition: all 0.3s ease; backdrop-filter: blur(4px);
    }
    #chat-close-btn:hover { background: rgba(255,255,255,0.4); transform: rotate(90deg) scale(1.1); }

    /* Messages Area */
    .chat-messages {
        flex: 1; padding: 20px; overflow-y: auto;
        background: #fafafa;
        display: flex; flex-direction: column; gap: 15px;
    }
    .chat-messages::-webkit-scrollbar { width: 5px; }
    .chat-messages::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }

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
    
    .msg-img-preview {
        max-width: 100%; border-radius: 12px; margin-top: 5px; border: 2px solid rgba(255,255,255,0.5);
    }

    /* Input Area & File Upload */
    .chat-input-area {
        padding: 10px 15px 15px; background: white; 
        border-top: 1px solid #f0f0f0;
        display: flex; flex-direction: column; gap: 8px;
    }
    
    #file-preview-bar {
        display: none; align-items: center; gap: 8px;
        padding: 8px 12px; background: #fff7ed; border-radius: 12px;
        font-size: 0.85rem; color: #ea580c; border: 1px solid #ffedd5;
    }
    #remove-file-btn { margin-left: auto; cursor: pointer; color: #ef4444; font-weight: bold; }

    .input-row { display: flex; gap: 8px; align-items: center; }

    #chat-input {
        flex: 1; border: 2px solid #f3f4f6; background: #f9fafb;
        padding: 12px 18px; border-radius: 25px; outline: none;
        font-family: inherit; font-size: 0.95rem; transition: 0.3s;
    }
    #chat-input:focus { border-color: #FF8F50; background: white; box-shadow: 0 0 0 4px rgba(255, 143, 80, 0.1); }
    
    .action-btn {
        width: 42px; height: 42px; border-radius: 50%; border: none;
        font-size: 16px; cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        transition: 0.3s;
    }
    
    #chat-upload-btn { background: #f3f4f6; color: #6b7280; }
    #chat-upload-btn:hover { background: #e5e7eb; color: #374151; }

    #chat-send-btn {
        background: linear-gradient(135deg, #FF8F50, #FF5E62);
        color: white; box-shadow: 0 5px 15px rgba(255, 94, 98, 0.3);
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
                    <div class="bot-avatar-wrapper">
                        <div class="bot-avatar">
                            <img src="../LOGO.WEBP" alt="Hopvan Bot Avatar">
                        </div>
                        <div class="online-dot"></div>
                    </div>
                    <div>
                        <h3 class="font-bold text-lg m-0 leading-tight">HopVan AI</h3>
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
                    Mình là trợ lý AI. Bạn cần giúp gì về Văn học không?
                </div>
            </div>
            
            <div class="chat-input-area">
                <div id="file-preview-bar">
                    <i class="fas fa-file-alt"></i>
                    <span id="file-name-display" class="truncate" style="max-width: 200px;">tài liệu.docx</span>
                    <i class="fas fa-times" id="remove-file-btn" title="Xóa file"></i>
                </div>
                <div class="input-row">
                    <input type="file" id="chat-file-input" hidden accept=".txt, .js, .html, .css, .json, .docx">
                    <button id="chat-upload-btn" class="action-btn" title="Gửi file (Code/Text)"><i class="fas fa-paperclip"></i></button>
                    <input type="text" id="chat-input" placeholder="Nhập câu hỏi..." autocomplete="off">
                    <button id="chat-send-btn" class="action-btn"><i class="fas fa-paper-plane"></i></button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(chatContainer);

    // Elements
    const launcher = document.getElementById('hopvan-chat-launcher');
    const windowEl = document.getElementById('hopvan-chat-window');
    const closeBtn = document.getElementById('chat-close-btn');
    const sendBtn = document.getElementById('chat-send-btn');
    const uploadBtn = document.getElementById('chat-upload-btn');
    const fileInput = document.getElementById('chat-file-input');
    const filePreview = document.getElementById('file-preview-bar');
    const fileNameDisplay = document.getElementById('file-name-display');
    const removeFileBtn = document.getElementById('remove-file-btn');
    const inputEl = document.getElementById('chat-input');
    const messagesEl = document.getElementById('chat-messages');
    const iconEl = document.getElementById('launcher-icon');

    let currentFile = null;

    // Toggle Chat
    function toggleChat() {
        const isActive = windowEl.classList.contains('active');
        if (isActive) {
            windowEl.classList.remove('active');
            iconEl.className = 'fas fa-comment-dots';
        } else {
            windowEl.classList.add('active');
            iconEl.className = 'fas fa-times';
            setTimeout(() => inputEl.focus(), 300);
        }
    }

    launcher.addEventListener('click', toggleChat);
    closeBtn.addEventListener('click', toggleChat);

    uploadBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            currentFile = e.target.files[0];
            fileNameDisplay.textContent = currentFile.name;
            filePreview.style.display = 'flex';
            inputEl.focus();
        }
    });

    removeFileBtn.addEventListener('click', () => {
        currentFile = null;
        fileInput.value = '';
        filePreview.style.display = 'none';
    });

    const readTextFile = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsText(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    };

    // --- LOGIC GỬI TIN NHẮN (FIXED) ---
    async function sendMessage() {
        const text = inputEl.value.trim();
        if (!text && !currentFile) return;

        let userHtml = text;
        let contentToSend = text;

        if (currentFile) {
            userHtml += `<br><small>📎 <em>${currentFile.name}</em></small>`;
            try {
                // Đọc nội dung file text
                const fileContent = await readTextFile(currentFile);
                contentToSend += `\n\n[Nội dung file đính kèm ${currentFile.name}]:\n${fileContent}`;
            } catch(e) {
                console.warn("Không đọc được file");
            }
        }
        
        appendMessage(userHtml, 'user');
        
        inputEl.value = '';
        const fileToSend = currentFile;
        currentFile = null;
        fileInput.value = '';
        filePreview.style.display = 'none';

        const loadingId = showLoading();

        try {
            // CẤU TRÚC PROMPT ĐẶC BIỆT ĐỂ "LỪA" PROXY (VÌ PROXY BẮT BUỘC TRẢ JSON)
            const systemPrompt = `
            BẠN LÀ: Trợ lý AI của Hopvan (Gia sư văn học).
            NHIỆM VỤ: Trả lời câu hỏi của người dùng một cách thân thiện, ngắn gọn, dễ hiểu.
            
            ⚠️ QUAN TRỌNG: 
            Do hệ thống yêu cầu output JSON, bạn BẮT BUỘC phải trả lời theo định dạng JSON sau:
            { "reply": "Nội dung câu trả lời của bạn viết ở đây (dùng markdown nếu cần)" }
            `;

            const res = await fetch('/.netlify/functions/gemini-proxy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    systemPrompt: systemPrompt,  // Gửi riêng systemPrompt
                    messages: contentToSend      // Gửi nội dung user (Text + File Content)
                })
            });

            if(!res.ok) throw new Error("SERVER_ERROR");

            const data = await res.json();
            removeLoading(loadingId);

            if (data.choices && data.choices.length > 0) {
                let rawText = data.choices[0].message.content;
                
                // Parse JSON từ phản hồi của AI
                try {
                    rawText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
                    const jsonRes = JSON.parse(rawText);
                    
                    // Chỉ lấy phần 'reply' để hiển thị
                    let reply = jsonRes.reply || "AI không trả lời đúng định dạng.";
                    
                    // Format Markdown cơ bản sang HTML
                    reply = reply.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
                    
                    appendMessage(reply, 'bot');
                } catch(e) {
                    // Fallback nếu AI lỡ quên format JSON (hiện text thô)
                    appendMessage(rawText, 'bot');
                }
            } else {
                appendMessage("AI đang bận, thử lại sau nhé!", 'bot');
            }

        } catch (error) {
            console.error(error);
            removeLoading(loadingId);
            appendMessage("Lỗi kết nối. Vui lòng thử lại!", 'bot');
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