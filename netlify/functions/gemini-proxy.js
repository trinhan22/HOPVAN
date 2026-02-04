// netlify/functions/gemini-proxy.js
exports.handler = async (event) => {
    // 1. Xử lý yêu cầu OPTIONS (CORS Preflight)
    // Trình duyệt sẽ gửi yêu cầu này trước khi gửi POST thật để kiểm tra quyền truy cập
    if (event.httpMethod === "OPTIONS") {
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Methods": "POST, OPTIONS"
            },
            body: ""
        };
    }

    // 2. Lấy API KEY từ biến môi trường của Netlify
    const API_KEY = process.env.GEMINI_API_KEY; 
    
    // 3. Cấu hình Model (Sử dụng gemini-1.5-flash để tốc độ phản hồi nhanh nhất)
    const MODEL_NAME = "gemini-2.0-flash"; 
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;


    try {
        // 4. Gửi yêu cầu từ Server Netlify đến Google API
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: event.body 
        });

        const data = await response.json();

        // 5. Trả kết quả về cho trình duyệt kèm theo Headers cho phép truy cập
        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type"
            },
            body: JSON.stringify(data)
        };
    } catch (error) {
        console.error("Proxy Error:", error);
        return { 
            statusCode: 500, 
            headers: { 
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ error: "Lỗi kết nối AI: " + error.message }) 
        };
    }
};