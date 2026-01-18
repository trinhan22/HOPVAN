exports.handler = async (event) => {
    // 1. Lấy Key
    const API_KEY = process.env.GEMINI_API_KEY; 
    
    // 2. Tên Model (Bạn đang để 2.5-flash)
    // LƯU Ý: Nếu vẫn lỗi, hãy đổi thử thành 1.5-flash để test xem Key có chạy không.
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: event.body 
        });

        const data = await response.json();

        // NẾU GOOGLE TRẢ VỀ LỖI (Sai model, sai key...)
        if (data.error) {
            return {
                statusCode: 200, // Trả về 200 để Frontend đọc được nội dung lỗi
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
                body: JSON.stringify({ 
                    error_message_from_google: data.error.message,
                    status: data.error.status 
                })
            };
        }
        
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify(data)
        };
    } catch (error) {
        return { 
            statusCode: 500, 
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ error: error.message }) 
        };
    }
};