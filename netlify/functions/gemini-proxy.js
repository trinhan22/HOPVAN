// netlify/functions/gemini-proxy.js

export default async (req, context) => {
  // 1. Xử lý CORS (Cho phép mọi nguồn truy cập - Tiện cho việc test)
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const body = await req.json();
    // Lấy dữ liệu từ Frontend gửi lên
    const { messages, systemPrompt } = body; 

    // Kiểm tra dữ liệu đầu vào có đủ không
    if (!messages || !systemPrompt) {
        throw new Error("Missing 'messages' or 'systemPrompt' in request body");
    }

    // Cấu trúc messages chuẩn cho Groq/OpenAI
    const conversation = [
        { role: "system", content: systemPrompt },
        { role: "user", content: messages } 
    ];

    // Lấy API Key: Ưu tiên process.env cho Node.js, fallback sang Netlify.env nếu có
    const apiKey = process.env.GROQ_API_KEY || (typeof Netlify !== 'undefined' ? Netlify.env.get("GROQ_API_KEY") : "");

    if (!apiKey) {
        throw new Error("Missing GROQ_API_KEY in environment variables");
    }

    // Gọi Groq API
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile", // Model Llama 3.3 70B (Rất mạnh & Nhanh)
        messages: conversation,
        temperature: 0.3, // Giữ ở mức thấp để chấm điểm ổn định
        max_tokens: 4096, // Đủ dài cho bài sửa chi tiết
        response_format: { type: "json_object" } // Bắt buộc trả về JSON
      }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error?.message || "Groq API Error");
    }

    // Trả về kết quả cho Frontend
    return new Response(JSON.stringify(data), {
      headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*" // Thêm header CORS vào response
      },
    });

  } catch (error) {
    console.error("Proxy Error:", error); // Log lỗi ra console của Netlify để dễ debug
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
      },
    });
  }
};