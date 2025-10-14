// File: netlify/functions/deepseek.js

// Netlify Functions cần 'node-fetch' nếu bạn dùng Node.js cũ hơn,
// nhưng trên Netlify hiện tại có thể dùng fetch() global.
// Để an toàn, chúng ta dùng cú pháp exports.handler.
// Nếu bạn gặp lỗi 'fetch is not defined', hãy thêm 'import fetch from "node-fetch";'
// và đảm bảo bạn đã chạy 'npm install node-fetch' trong dự án.

exports.handler = async (event, context) => {
    // 1. Cấu hình Headers (Netlify tự xử lý CORS tốt hơn, nhưng đây là cấu hình phản hồi)
    const headers = {
        'Access-Control-Allow-Origin': '*', // Cho phép mọi nguồn gọi (CORS)
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json'
    };
    
    // Xử lý Yêu cầu OPTIONS (CORS Preflight)
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }
    
    // 2. Chỉ chấp nhận phương thức POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    // 3. Đọc Key API từ Biến Môi Trường NETLIFY
    const OPENROUTER_KEY = process.env.OPENROUTER_KEY;

    if (!OPENROUTER_KEY) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Lỗi cấu hình Server: OPENROUTER_KEY chưa được đặt.' })
        };
    }

    try {
        // 4. Đọc dữ liệu từ frontend (Netlify Functions đọc body từ event)
        const body = JSON.parse(event.body || '{}');
        const { messages, model } = body;

        if (!messages || !model) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Thiếu dữ liệu bắt buộc (messages hoặc model).' })
            };
        }

        const API_URL = "https://openrouter.ai/api/v1/chat/completions";

        // 5. Gửi yêu cầu đến OpenRouter API
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                // Key API được chèn an toàn (trên backend Netlify)
                'Authorization': `Bearer ${OPENROUTER_KEY}`,
                'Content-Type': 'application/json',
                // Quan trọng: Thêm User-Agent/Referer theo yêu cầu của OpenRouter
                'User-Agent': 'Netlify-Deepseek-Proxy/1.0', 
            },
            body: JSON.stringify({
                model: model, 
                messages: messages 
            })
        });

        const data = await response.json();

        // 6. Kiểm tra lỗi và trả về phản hồi
        if (!response.ok) {
            return {
                statusCode: response.status,
                headers,
                body: JSON.stringify(data) // Chuyển tiếp lỗi từ OpenRouter
            };
        }

        // Trả về kết quả thành công cho frontend
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(data)
        };

    } catch (error) {
        console.error("Lỗi Function:", error.message);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: `Lỗi Server Nội bộ: ${error.message}` })
        };
    }
};