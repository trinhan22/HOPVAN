(function () {
  // === CSS ===
  const style = document.createElement("style");
  style.textContent = `
    .back-to-top {
      position: fixed;
      bottom: 40px;
      right: 40px;
      background: #fca96a;
      border: none;
      border-radius: 8px;
      padding: 15px 20px;
      text-align: center;
      cursor: pointer;
      display: none;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
      transition: transform 0.2s ease, background 0.3s, opacity 0.3s;
      color: white;
      opacity: 0;
      z-index: 9999;
    }
    .back-to-top.show { display: block; opacity: 1; }
    .back-to-top:hover { transform: scale(1.1); background: #ff9d53ff; }
    .back-to-top span { display: block; font-size: 12px; color: white; }
    .back-to-top svg { width: 20px; height: 20px; display: block; margin: 0 auto; }
  `;
  document.head.appendChild(style);

  // === Tạo nút ===
  const btn = document.createElement("div");
  btn.className = "back-to-top";
  btn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="0 0 24 24" stroke="white">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
    </svg>
    <span>TOP</span>
  `;
  document.body.appendChild(btn);

  // === Hiện/ẩn nút khi cuộn ===
  window.addEventListener("scroll", () => {
    btn.classList.toggle("show", window.scrollY > 200);
  });

  // === Hàm scroll từ từ lên đầu ===
  function smoothScrollToTop() {
    const scrollStep = -window.scrollY / 20; // tốc độ
    const scrollInterval = setInterval(() => {
      if (window.scrollY !== 0) {
        window.scrollBy(0, scrollStep);
      } else {
        clearInterval(scrollInterval);
      }
    }, 20); // 15ms mỗi bước → mượt
  }

  // === Sự kiện click ===
  btn.addEventListener("click", () => {
    btn.style.transform = "scale(0.85)";
    setTimeout(() => (btn.style.transform = "scale(1)"), 150);
    smoothScrollToTop(); // dùng hiệu ứng custom
  });
})();
