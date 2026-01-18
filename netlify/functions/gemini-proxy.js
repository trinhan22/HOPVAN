// netlify/functions/gemini-proxy.js
exports.handler = async (event) => {
    const API_KEY = process.env.GEMINI_API_KEY; 
    
    // Đã sửa URL: Dùng v1beta với model gemini-1.5-flash
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: event.body 
        });

        const data = await response.json();

        // Trả về dữ liệu kèm theo header cho phép truy cập từ thư mục con
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
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};