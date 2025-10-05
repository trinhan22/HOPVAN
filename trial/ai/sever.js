import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const API_KEY = "sk-7732d4d8f0db42a2a99ae0ddcfd67055"; // key của cậu (nhớ thay nếu tạo mới)

app.post("/chat", async (req, res) => {
  try {
    const { prompt } = req.body;
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "Bạn là gia sư Văn học Việt Nam. Hãy sửa đoạn văn và nhận xét chi tiết, dễ hiểu." },
          { role: "user", content: prompt },
        ],
        max_tokens: 1024,
      }),
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi khi gọi API DeepSeek" });
  }
});

app.listen(3000, () => console.log("✅ Server đang chạy tại http://localhost:3000"));
