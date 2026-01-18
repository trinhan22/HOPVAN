exports.handler = async (event) => {
    const API_KEY = process.env.GEMINI_API_KEY; 
    
    // THAY ĐỔI: Sử dụng gemini-1.5-flash (Bản ổn định nhất hiện tại)
    // Nếu bạn muốn dùng 2.0, hãy thử: gemini-2.0-flash-exp
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: event.body 
        });

        const data = await response.json();

        if (data.error) {
            return {
                statusCode: 200,
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
                body: JSON.stringify({ error_message_from_google: data.error.message })
            };
        }
        
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify(data)
        };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};