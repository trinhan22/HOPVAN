module.exports = async (req, res) => {

    // --- BỔ SUNG ĐOẠN NÀY ĐỂ XỬ LÝ LỖI PREFLIGHT (CORS) ---
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*'); // Cho phép mọi domain truy cập
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    // -------------------------------------------------------------

    // 1. Chỉ chấp nhận phương thức POST từ frontend
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // 2. Đọc Key API từ Biến Môi Trường VERCEL (AN TOÀN!)
    const OPENROUTER_KEY = process.env.OPENROUTER_KEY;

    if (!OPENROUTER_KEY) {
        return res.status(500).json({ error: 'Lỗi cấu hình Server: OPENROUTER_KEY chưa được đặt.' });
    }

    try {
        // 3. Đọc dữ liệu từ frontend (index.html)
        const { messages, model } = req.body;

        if (!messages || !model) {
            return res.status(400).json({ error: 'Thiếu dữ liệu bắt buộc (messages hoặc model).' });
        }

        const API_URL = "https://openrouter.ai/api/v1/chat/completions";

        // 4. Gửi yêu cầu đến OpenRouter API
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                // Key API được chèn an toàn tại đây (trên backend Vercel)
                'Authorization': `Bearer ${OPENROUTER_KEY}`,
                'Content-Type': 'application/json',
                // Quan trọng: Sử dụng Referer/Title để tuân thủ quy tắc của OpenRouter
                'HTTP-Referer': req.headers['http-referer'] || 'https://hopvan-frontend.com',
                'X-Title': 'HopVan AI Chat Proxy'
            },
            body: JSON.stringify({
                model: model, // Tên model từ frontend
                messages: messages // Dữ liệu chat từ frontend
            })
        });

        const data = await response.json();

        // 5. Kiểm tra lỗi và trả về phản hồi
        if (!response.ok) {
            // Chuyển tiếp lỗi (ví dụ: lỗi Key, hết credit) từ OpenRouter về frontend
            return res.status(response.status).json(data);
        }

        // Trả về kết quả thành công cho frontend
        res.status(200).json(data);

    } catch (error) {
        console.error("Lỗi Proxy:", error.message);
        res.status(500).json({ error: `Lỗi Server Nội bộ: ${error.message}` });
    }
};