/**
 * ===================================================================
 * AI CHATBOT LOGIC - SCRIPT.JS (Sử dụng Gemini API)
 * ===================================================================
 */

// -------------------------------------------------------------------
// 1. KHAI BÁO CÁC BIẾN DOM VÀ CẤU HÌNH CƠ BẢN
// -------------------------------------------------------------------

// Lấy các phần tử DOM
const chatOutput = document.querySelector("#chat-output");
const messageInput = document.querySelector(".message-input");
const chatForm = document.querySelector(".chat-form");
const sendButton = document.querySelector("#send-message");
const fileInput = document.querySelector("#file-input");
const fileUploadWrapper = document.querySelector(".file-upload-wrapper");
const fileCancelButton = document.querySelector("#file-cancel");
const historyPanel = document.querySelector("#history-panel");
const newChatButton = document.querySelector("#new-chat-button");

// Trạng thái ứng dụng
let isProcessing = false;
let chatHistory = [];
const systemInstruction = "Bạn là một trợ lý AI thông minh, nhiệt tình và thân thiện. Hãy phản hồi ngắn gọn, rõ ràng và sử dụng ngôn ngữ tiếng Việt.";

// Cấu hình API
const MODEL_NAME = "gemini-2.5-flash-preview-05-20";
const API_KEY = ""; // LƯU Ý: Để trống. Canvas sẽ tự động cung cấp API Key.
const API_BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;
const MAX_RETRIES = 5;

// Dữ liệu người dùng (tin nhắn và file đính kèm)
const userData = {
    message: null,
    file: {
        data: null,
        mime_type: null
    }
};

// -------------------------------------------------------------------
// 2. HÀM XỬ LÝ CHUỖI VÀ UI
// -------------------------------------------------------------------

/**
 * Hiệu ứng gõ chữ cho phản hồi của AI.
 * @param {HTMLElement} element - Phần tử DOM để hiển thị text.
 * @param {string} text - Nội dung phản hồi (Markdown).
 * @param {Function} callback - Hàm gọi sau khi hoàn tất.
 */
function typeWriter(element, text, callback) {
    let i = 0;
    const cleanText = text.replace(/```/g, '\n```\n'); // Tách code block ra dòng riêng

    // Tạo một phần tử tạm thời để giữ nội dung đang gõ
    const tempContainer = document.createElement('div');
    tempContainer.className = 'prose prose-sm md:prose-base max-w-none';
    element.appendChild(tempContainer);

    // Xóa loader và thêm con trỏ nhấp nháy
    element.querySelector('.loading-dots')?.remove();

    function type() {
        if (i < cleanText.length && isProcessing) {
            // Thêm từng ký tự vào container
            tempContainer.innerHTML += cleanText.charAt(i);
            i++;

            // Chuyển đổi Markdown sau mỗi 50 ký tự hoặc khi gặp ký tự xuống dòng
            if (i % 50 === 0 || cleanText.charAt(i) === '\n') {
                tempContainer.innerHTML = marked.parse(tempContainer.innerText);
                // Đảm bảo cuộn xuống tin nhắn mới nhất
                chatOutput.scrollTop = chatOutput.scrollHeight;
            }
            
            setTimeout(type, 15); // Tốc độ gõ chữ
        } else {
            // Khi hoàn thành, chuyển đổi Markdown lần cuối
            tempContainer.innerHTML = marked.parse(cleanText);
            // Loại bỏ con trỏ nhấp nháy nếu có
            // Gỡ bỏ event listener nếu cần
            if (callback) callback();
        }
    }
    type();
}


/**
 * Tạo HTML cho một tin nhắn (người dùng hoặc AI).
 * @param {string} role - 'user' hoặc 'model'.
 * @param {Array} parts - Mảng các phần tử tin nhắn (text, inlineData).
 * @param {boolean} isNew - Là tin nhắn mới hay đang tải lại lịch sử.
 * @returns {string} HTML markup.
 */
function createMessageElement(role, parts, isNew = false) {
    const isUser = role === 'user';
    let content = '';
    
    parts.forEach(part => {
        if (part.text) {
            // Dùng innerText để tránh XSS, sau đó typeWriter sẽ dùng marked.parse
            content += part.text;
        }
        if (part.inlineData && part.inlineData.data) {
            const imgSrc = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            content += `<div class="mt-2"><img src="${imgSrc}" class="max-h-48 rounded-lg shadow-md border border-gray-200" alt="Ảnh đính kèm" onerror="this.style.display='none';"></div>`;
        }
    });

    const roleClass = isUser ? 'justify-end' : 'justify-start';
    const bubbleClass = isUser ? 'bg-primary-color text-white' : 'ai-message-bubble bg-white';
    const avatar = isUser 
        ? `<div class="w-8 h-8 rounded-full bg-primary-color flex items-center justify-center text-sm font-bold text-white shadow-md flex-shrink-0">Tôi</div>`
        : `<div class="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-sm font-bold text-white shadow-md flex-shrink-0">AI</div>`;

    const animation = isNew ? 'opacity-0 translate-y-2' : '';

    return `
        <div class="flex ${roleClass} mb-6 ${animation}" style="animation-fill-mode: forwards; ${isNew ? 'animation: fadeInUp 0.5s forwards;' : ''}">
            ${!isUser ? avatar : ''}
            <div class="max-w-[85%] mx-2">
                <div class="py-2 px-4 rounded-xl shadow-lg ${bubbleClass}">
                    ${isUser ? `<p class="whitespace-pre-wrap">${content}</p>` : `<div class="message-content">${content}</div>`}
                </div>
            </div>
            ${isUser ? avatar : ''}
        </div>
    `;
}

/**
 * Hiển thị tin nhắn người dùng và tạo placeholder cho AI.
 * @param {string} userMessage - Tin nhắn người dùng.
 * @param {string|null} base64Image - Base64 image data (nếu có).
 * @param {string|null} mimeType - Mime type của ảnh (nếu có).
 * @returns {HTMLElement} Placeholder tin nhắn AI.
 */
function appendUserMessage(userMessage, base64Image, mimeType) {
    // 1. Thêm tin nhắn Người dùng
    const userParts = [{ text: userMessage }];
    if (base64Image && mimeType) {
        userParts.push({ inlineData: { mimeType: mimeType, data: base64Image } });
    }
    chatOutput.innerHTML += createMessageElement('user', userParts, true);
    
    // 2. Thêm Placeholder của AI (Loading)
    const aiPlaceholderHTML = createMessageElement('model', [{ text: '<div class="loading-dots flex space-x-1 text-gray-500"><div class="dot w-2 h-2 bg-primary-color rounded-full animate-bounce"></div><div class="dot w-2 h-2 bg-primary-color rounded-full animate-bounce" style="animation-delay: 0.2s;"></div><div class="dot w-2 h-2 bg-primary-color rounded-full animate-bounce" style="animation-delay: 0.4s;"></div></div>' }]);
    chatOutput.innerHTML += aiPlaceholderHTML;
    
    chatOutput.scrollTop = chatOutput.scrollHeight;

    // Trả về phần tử nội dung của tin nhắn AI mới nhất (là .message-content cuối cùng)
    const allMessages = chatOutput.querySelectorAll('.message-content');
    return allMessages[allMessages.length - 1];
}

/**
 * Reset trạng thái UI sau khi xử lý.
 */
function resetUI() {
    isProcessing = false;
    sendButton.disabled = false;
    sendButton.innerHTML = `<i data-lucide="send" class="h-5 w-5 mr-2"></i> <span>Gửi Yêu Cầu</span>`;
    lucide.createIcons();
    messageInput.value = '';
    
    // Reset file data
    resetFileInput();

    // Loại bỏ mọi loading dot đang chạy
    chatOutput.querySelectorAll('.loading-dots').forEach(el => el.remove());
}

/**
 * Reset trạng thái file input.
 */
function resetFileInput() {
    fileInput.value = "";
    fileUploadWrapper.classList.remove("file-uploaded");
    fileUploadWrapper.querySelector("img").src = "#";
    userData.file = { data: null, mime_type: null };
}

// -------------------------------------------------------------------
// 3. XỬ LÝ API VÀ CƠ CHẾ BACKOFF
// -------------------------------------------------------------------

/**
 * Gọi API Gemini với cơ chế Exponential Backoff.
 * @param {object} payload - Nội dung payload cho API.
 * @returns {Promise<object>} - Dữ liệu phản hồi từ API.
 */
async function callGeminiAPI(payload) {
    let lastError = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000; // 1s, 2s, 4s, 8s... + jitter
        
        try {
            const response = await fetch(API_BASE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const data = await response.json();
                return data;
            } 
            
            // Xử lý các lỗi cần retry (429 - Rate Limit, 500/503 - Server Errors)
            if (response.status === 429 || response.status >= 500) {
                lastError = new Error(`Server Error: ${response.status}. Retrying in ${Math.round(delay/1000)}s...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                // Các lỗi không cần retry (400, 401, 403, 404)
                const errorData = await response.json();
                throw new Error(`API Error ${response.status}: ${errorData.error.message || response.statusText}`);
            }
        } catch (error) {
            lastError = error;
            // Nếu là lỗi fetch (mất mạng) hoặc lỗi parse, retry
            if (error.message.includes('Failed to fetch') || error.message.includes('JSON')) {
                 await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                // Lỗi không mong muốn khác (vd: lỗi 40x), thoát loop
                throw lastError;
            }
        }
    }

    // Nếu thoát khỏi loop mà vẫn có lỗi, throw ra lỗi cuối cùng
    throw lastError;
}


// -------------------------------------------------------------------
// 4. XỬ LÝ GỬI TIN NHẮN CHÍNH
// -------------------------------------------------------------------

/**
 * Xử lý sự kiện khi người dùng gửi tin nhắn.
 * @param {Event} e - Sự kiện Form Submit.
 */
async function handleOutgoingMessage(e) {
    e.preventDefault();

    if (isProcessing) return;

    const message = messageInput.value.trim();
    const { data: base64Image, mime_type: mimeType } = userData.file;

    if (!message && !base64Image) {
        Swal.fire({
            icon: 'warning',
            title: 'Chú ý',
            text: 'Vui lòng nhập tin nhắn hoặc đính kèm ảnh!',
            confirmButtonText: 'OK',
            confirmButtonColor: '#fca96a'
        });
        return;
    }

    // 1. Cập nhật UI và trạng thái
    isProcessing = true;
    sendButton.disabled = true;
    sendButton.innerHTML = `<i data-lucide="loader-2" class="h-5 w-5 mr-2 animate-spin"></i> <span>Đang xử lý...</span>`;
    lucide.createIcons();

    const aiOutputElement = appendUserMessage(message, base64Image, mimeType);

    // 2. Tạo Payload cho API
    const userParts = [{ text: message }];
    if (base64Image && mimeType) {
        userParts.push({ 
            inlineData: {
                mimeType: mimeType, 
                data: base64Image 
            }
        });
    }

    // Thêm tin nhắn người dùng vào lịch sử
    chatHistory.push({ role: "user", parts: userParts });

    const payload = {
        contents: chatHistory,
        systemInstruction: {
            parts: [{ text: systemInstruction }]
        },
        config: {
            // Cấu hình bổ sung nếu cần (ví dụ: nhiệt độ, max_output_tokens)
        }
    };

    // 3. Gọi API
    try {
        const data = await callGeminiAPI(payload);
        
        const candidate = data.candidates?.[0];

        if (!candidate || !candidate.content?.parts?.[0]?.text) {
             throw new Error("Phản hồi từ AI không hợp lệ hoặc trống.");
        }

        const aiResponseText = candidate.content.parts[0].text;
        
        // Thêm phản hồi của AI vào lịch sử
        chatHistory.push({ role: "model", parts: [{ text: aiResponseText }] });

        // Hiệu ứng gõ chữ
        typeWriter(aiOutputElement, aiResponseText, () => {
            resetUI();
            chatOutput.scrollTop = chatOutput.scrollHeight;
        });

    } catch (error) {
        console.error("Lỗi Gemini API:", error);
        
        // Hiển thị lỗi ngay tại vị trí của AI placeholder
        aiOutputElement.innerHTML = `
            <div class="p-3 text-red-700 bg-red-100 rounded-lg shadow-inner">
                <p class="font-bold">❌ Lỗi Phản Hồi:</p>
                <p>${error.message}</p>
            </div>
        `;
        
        // Loại bỏ tin nhắn người dùng khỏi lịch sử nếu lỗi nghiêm trọng
        chatHistory.pop(); 
        
        resetUI();
    }
}


// -------------------------------------------------------------------
// 5. CÁC LISTENER SỰ KIỆN
// -------------------------------------------------------------------

/**
 * Listener cho sự kiện thay đổi file input (Chọn ảnh).
 */
fileInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validImageTypes.includes(file.type)) {
        await Swal.fire({
            icon: 'error',
            title: 'Lỗi',
            text: 'Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WEBP)',
            confirmButtonText: 'OK',
            confirmButtonColor: '#fca96a'
        });
        resetFileInput();
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        fileUploadWrapper.querySelector("img").src = e.target.result;
        fileUploadWrapper.classList.add("file-uploaded");
        
        // Lấy base64 data, bỏ phần header (data:image/png;base64,)
        const base64String = e.target.result.split(",")[1];
        userData.file = {
            data: base64String,
            mime_type: file.type
        };

        // Focus lại vào input để người dùng nhập prompt
        messageInput.focus();
    };
    reader.readAsDataURL(file);
});


/**
 * Listener cho nút Hủy file đính kèm.
 */
fileCancelButton.addEventListener("click", () => resetFileInput());


/**
 * Listener cho Form Submit (Gửi tin nhắn).
 */
chatForm.addEventListener("submit", (e) => handleOutgoingMessage(e));


/**
 * Listener cho phím Enter trong textarea.
 */
messageInput.addEventListener("keydown", (e) => {
    // Gửi tin nhắn khi nhấn Enter (không phải Shift + Enter)
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleOutgoingMessage(e);
    }
});


/**
 * Listener cho nút Bắt đầu chat mới.
 */
newChatButton.addEventListener("click", () => {
    Swal.fire({
        title: 'Bắt đầu cuộc trò chuyện mới?',
        text: "Lịch sử trò chuyện hiện tại sẽ bị xóa.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#fca96a',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Đồng ý',
        cancelButtonText: 'Hủy'
    }).then((result) => {
        if (result.isConfirmed) {
            chatHistory = [];
            chatOutput.innerHTML = '';
            // Tải lại tin nhắn chào mừng
            loadInitialMessage(); 
            resetUI();
            messageInput.focus();
            Swal.fire({
                icon: 'success',
                title: 'Đã tạo cuộc trò chuyện mới!',
                showConfirmButton: false,
                timer: 1500
            });
        }
    })
});

// -------------------------------------------------------------------
// 6. KHỞI TẠO VÀ CHẠY APP
// -------------------------------------------------------------------

/**
 * Hiển thị tin nhắn chào mừng ban đầu.
 */
function loadInitialMessage() {
    const welcomeText = "Chào bạn! Tôi là trợ lý AI. Tôi có thể giúp bạn phân tích hình ảnh, trả lời câu hỏi, tóm tắt nội dung và nhiều hơn nữa. Hãy bắt đầu bằng cách nhập câu hỏi hoặc đính kèm một bức ảnh nhé!";
    const initialMessage = {
        role: "model",
        parts: [{ text: welcomeText }]
    };
    // Thêm vào lịch sử (để AI biết mình là ai)
    chatHistory.push(initialMessage); 
    
    chatOutput.innerHTML = createMessageElement('model', initialMessage.parts);
    
    // Convert Markdown lần đầu
    chatOutput.querySelector('.message-content').innerHTML = marked.parse(welcomeText);
}

/**
 * Khởi tạo ứng dụng khi DOM đã sẵn sàng.
 */
document.addEventListener("DOMContentLoaded", () => {
    loadInitialMessage();
    // Khởi tạo icons của Lucide
    lucide.createIcons();
    messageInput.focus();
});
