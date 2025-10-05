import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();

// Bật CORS hoàn toàn
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

const DEEPSEEK_API_KEY = "sk-9d4e18854f594c7e8f033540d3313613"; // <-- điền key Deepseek thật

app.post("/api/deepseek", async (req, res) => {
  console.log("Request từ client:", req.body); // log request từ HTML
  const { messages } = req.body;

  try {
    const response = await fetch("https://api.deepseek.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({ model: "deepseek-chat", messages })
    });

    const data = await response.json();
    console.log("Deepseek trả về:", data); // log phản hồi
    res.json(data);
  } catch (err) {
    console.error("Lỗi khi gọi Deepseek:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => console.log("Server chạy tại http://localhost:3000"));
