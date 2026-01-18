exports.handler = async (event) => {
    const API_KEY = process.env.GEMINI_API_KEY; 
    // Thử dùng bản 1.5-flash để đảm bảo chạy được trước
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: event.body 
        });

        const data = await response.json();

        // Nếu Google trả về lỗi (400, 401, 404...)
        if (data.error) {
            console.error("Google API Error:", data.error.message);
            return {
                statusCode: 200, // Trả về 200 để Frontend đọc được nội dung lỗi
                body: JSON.stringify({ error_from_google: data.error.message })
            };
        }
        
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};