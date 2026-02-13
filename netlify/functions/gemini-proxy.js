// netlify/functions/groq-proxy.js (hoặc sửa đè lên gemini-proxy.js)

export default async (req, context) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const body = await req.json();
    const { messages, systemPrompt } = body;

    // Cấu trúc messages chuẩn cho Groq (giống OpenAI)
    const conversation = [
        { role: "system", content: systemPrompt },
        { role: "user", content: messages } // messages ở đây là bài làm của học sinh
    ];

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Netlify.env.get("GROQ_API_KEY")}`, // Đảm bảo đã set biến này trên Netlify
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile", // Mô hình Llama 3 mới nhất, cực thông minh và nhanh
        messages: conversation,
        temperature: 0.3, // Giảm độ sáng tạo để chấm điểm chính xác hơn
        max_tokens: 4096,
        response_format: { type: "json_object" } // Ép Groq trả về JSON chuẩn luôn (tính năng xịn của Groq)
      }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error?.message || "Groq API Error");
    }

    // Trả về đúng cấu trúc để Frontend xử lý
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};