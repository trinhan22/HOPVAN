<script type="module">
  // Import Firebase SDK
  import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
  import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } 
    from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

  // Dán config của bạn từ Firebase console vào đây
  const firebaseConfig = {
    apiKey: "AIzaSyAJ9C2biYeiLPmhakzLZ4mEqfO9_VgPSZE",
    authDomain: "hopvan.firebaseapp.com",  // ⚠️ thay bằng đúng domain Firebase
    projectId: "hopvan",                   // ⚠️ thay bằng đúng project ID
    storageBucket: "hopvan.appspot.com",
    messagingSenderId: "xxxxxxx",
    appId: "xxxxxxxx"
  };

  // Init Firebase
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);

  // Check login
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log("Đăng nhập thành công:", user.displayName);
      window.location.href = "/student/index.html"; 
    }
  });

  // Google login
  const googleBtn = document.getElementById("google-login-btn");
  googleBtn.addEventListener("click", async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      console.log("Login Google thành công!");
      window.location.href = "/student/index.html";
    } catch (err) {
      console.error("Google login error:", err);
      alert("Lỗi đăng nhập Google: " + err.message);
    }
  });
</script>
