// netlify/functions/gemini-proxy.js
exports.handler = async (event) => {
    // 1. Chỉ cho phép phương thức POST
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

    const API_KEY = process.env.GEMINI_API_KEY; 
    
    // LỖI TẠI ĐÂY: Hiện tại chưa có bản gemini-2.5-flash. 
    // Bạn hãy dùng gemini-1.5-flash (ổn định nhất) hoặc gemini-2.0-flash (mới nhất).
    const MODEL_NAME = "gemini-1.5-flash"; 
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: event.body 
        });

        const data = await response.json();

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
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ error: "Lỗi kết nối AI: " + error.message }) 
        };
    }
};