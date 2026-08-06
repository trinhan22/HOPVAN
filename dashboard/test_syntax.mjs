        import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
        import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
        import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

        const firebaseConfig = { 
            apiKey: "AIzaSyAJ9C2biYeiLPmhakzLZ4mEqfO9_VgPSZE", 
            authDomain: "hopvan-9a648.firebaseapp.com", 
            projectId: "hopvan-9a648", 
            storageBucket: "hopvan-9a648.appspot.com", 
            messagingSenderId: "429347196227", 
            appId: "1:429347196227:web:917b8d019f0efd0f7833f6", 
            measurementId: "G-1BG8PSRG0R" 
        };
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const db = getFirestore(app);

        window.showPopup = (title, message, type = 'info') => {
            const modal = document.getElementById('generic-popup');
            const box = modal.querySelector('.modal-box');
            const icon = document.getElementById('popup-icon');
            box.classList.remove('popup-error', 'popup-warning', 'popup-info');
            document.getElementById('popup-title').innerText = title;
            document.getElementById('popup-message').innerText = message;
            if (type === 'error') { box.classList.add('popup-error'); icon.innerHTML = '<i class="fas fa-exclamation-circle"></i>'; } 
            else if (type === 'warning') { box.classList.add('popup-warning'); icon.innerHTML = '<i class="fas fa-exclamation-triangle"></i>'; } 
            else { box.classList.add('popup-info'); icon.innerHTML = '<i class="fas fa-info-circle"></i>'; }
            modal.style.display = 'flex';
        };
        window.closePopup = () => document.getElementById('generic-popup').style.display = 'none';

        let diagnosticData = { userLevel: "", mcAnswers: {}, essay: "" };
        let diagTimerInterval;
        let diagTimeLeft = 2700; // 45 phút
        let isTakingTest = false;

        onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const docRef = doc(db, "users_progress", user.uid);
                    const docSnap = await getDoc(docRef);
                    
                    if (docSnap.exists() && docSnap.data().diagnosticDone === true) {
                        if (window !== window.parent && typeof window.parent.closeDiagnosticOverlay === 'function') {
                            window.parent.closeDiagnosticOverlay();
                        } else {
                            window.location.href = "index.html"; 
                        }
                        return;
                    } 
                    
                    document.getElementById('main-wrapper').style.display = 'flex';
                    
                } catch (error) {
                    console.error("Lỗi kiểm tra DB:", error);
                    document.getElementById('main-wrapper').style.display = 'flex';
                }
            } else {
                if (window !== window.parent) {
                    window.parent.location.href = "../log.html";
                } else {
                    window.location.href = "../log.html";
                }
            }
        });

        if (localStorage.getItem('theme') === 'dark') {
            document.documentElement.classList.add('dark');
        }

        const mcqData = [
            { q: "Yếu tố nào quyết định chiều sâu tư tưởng của một truyện ngắn hiện đại?", opts: ["Số lượng nhân vật", "Cách xây dựng tình huống truyện", "Độ dài văn bản", "Ngôn ngữ kể chuyện đơn giản"], ans: 1 },
            { q: "Trong thơ trữ tình hiện đại, “cái tôi trữ tình” thường có đặc điểm:", opts: ["Hoàn toàn khách quan", "Gắn với cảm xúc cá nhân và ý thức cá thể", "Không có tính biểu cảm", "Chỉ phản ánh hiện thực bên ngoài"], ans: 1 },
            { q: "Nhận định nào đúng về giọng điệu trong văn học?", opts: ["Không ảnh hưởng đến nội dung tác phẩm", "Là yếu tố phụ", "Góp phần thể hiện thái độ, tư tưởng của tác giả", "Chỉ xuất hiện trong thơ"], ans: 2 },
            { q: "Trong văn bản nghị luận, yếu tố nào giữ vai trò trung tâm?", opts: ["Cảm xúc", "Nhân vật", "Luận điểm", "Hình ảnh"], ans: 2 },
            { q: "Một truyện ngắn có tình huống độc đáo thường:", opts: ["Làm tăng tính kịch tính và chiều sâu nội dung", "Làm câu chuyện dài hơn, tăng chiều sâu", "Tăng tính hấp dẫn, tăng số lượng nhân vật", "Nghệ thuật truyện được khắc hoạ đặc sắc hơn"], ans: 0 },
            { q: "Trong kịch, xung đột có vai trò:", opts: ["Bộc lộ mối quan hệ và nội tâm nhân vật", "Tạo sự hài hước, hấp dẫn người đọc", "Thúc đẩy hành động và phát triển cốt truyện", "Không cần thiết, đôi khi gây tranh cãi"], ans: 2 },
            { q: "Điểm khác biệt cơ bản giữa thơ và truyện là:", opts: ["Thơ không có ngôn ngữ", "Truyện không có cảm xúc", "Thơ thiên về biểu cảm, truyện thiên về tự sự", "Giống nhau, chỉ khác về hình thức"], ans: 2 },
            { q: "Văn học:", opts: ["Chỉ phản ánh hiện thực", "Vừa phản ánh vừa sáng tạo hiện thực", "Không liên quan đời sống", "Chỉ để giải trí"], ans: 1 },
            { q: "Biện pháp tu từ: “Những cánh buồm no gió như mang theo khát vọng của con người”:", opts: ["Ẩn dụ + nhân hóa", "So sánh + ẩn dụ", "Hoán dụ", "Điệp ngữ"], ans: 1 },
            { q: "Câu có hàm ý nói mỉa:", opts: ["Trời mưa thế này làm sao chúng ta có thể đi đến đó.", "Bạn giỏi thật, có thể chỉ cho mình được không.", "Trời mới vừa kịp tối, cậu đến vậy là còn sớm.", "Tôi đọc sách làm tôi nhớ về kí ức tuổi thơ."], ans: 2 },
            { q: "Trong câu: “Không chỉ học tốt mà còn phải sống đẹp”, quan hệ từ thể hiện:", opts: ["Nguyên nhân", "Tương phản", "Bổ sung", "Điều kiện"], ans: 2 },
            { q: "Từ “đầu” trong “đầu làng”, “đầu năm”, “đầu tóc” thuộc hiện tượng:", opts: ["Đồng âm", "Đa nghĩa", "Trái nghĩa", "Đồng nghĩa"], ans: 1 },
            { q: "Câu nào sau đây mắc lỗi logic?", opts: ["Anh ấy vừa học giỏi vừa chăm chỉ", "Trời mưa nên đường trơn", "Tuy nghèo nhưng anh ấy rất giàu lòng nhân ái", "Vì trời mưa nên tôi mang áo mưa và trời lạnh"], ans: 3 },
            { q: "Phương thức biểu đạt chính của câu sau: “Tuổi trẻ là hành trình không ngừng khám phá và vượt qua chính mình”", opts: ["Tự sự", "Miêu tả", "Nghị luận", "Biểu cảm"], ans: 2 },
            { q: "Vai trò chi tiết nghệ thuật trong tác phẩm văn học là:", opts: ["Cung cấp dẫn chứng", "Giúp lời văn thêm sinh động", "Thể hiện chủ đề của tác phẩm", "Làm người đọc liên tưởng"], ans: 2 },
            { q: "Nhận định nào đúng về hình tượng văn học?", opts: ["Là bản sao của hiện thực", "Là sự tái hiện sáng tạo hiện thực qua lăng kính nghệ thuật", "Không có yếu tố tưởng tượng", "Không liên quan đến người đọc"], ans: 1 },
            { q: "“Giọng điệu trữ tình sâu lắng” thường phù hợp với nội dung:", opts: ["Châm biếm gay gắt", "Kể chuyện phiêu lưu", "Bộc lộ cảm xúc nội tâm", "Miêu tả khoa học"], ans: 2 },
            { q: "Biện pháp “tương phản” có tác dụng chủ yếu là:", opts: ["Làm giảm ý nghĩa", "Nhấn mạnh sự khác biệt, làm nổi bật vấn đề", "Làm câu văn dài hơn", "Gây khó hiểu"], ans: 1 },
            { q: "Khi phân tích một tác phẩm, yếu tố nào cần được ưu tiên?", opts: ["Kể lại nội dung sự kiện", "Phân tích nghệ thuật và nội dung gắn kết", "Liệt kê các biện pháp nghệ thuật được sử dụng", "Phân tích đặc điểm nhân vật"], ans: 1 },
            { q: "Một bài văn nghị luận hay cần đảm bảo:", opts: ["Cần thể hiện cảm xúc", "Dẫn chứng hấp dẫn, thực tế", "Kết hợp lí lẽ, dẫn chứng và diễn đạt thuyết phục", "Chia nhiều khía cạnh"], ans: 2 },
            { q: "Xác định biện pháp tu từ được sử dụng trong hai câu thơ: “Ôi con sóng nhớ bờ/ Ngày đêm không ngủ được” (Xuân Quỳnh)", opts: ["So sánh", "Nhân hóa", "Ẩn dụ", "Hoán dụ"], ans: 1 },
            { q: "Xác định biện pháp tu từ được sử dụng trong hai câu thơ: “Dữ dội và dịu êm/ Ồn ào và lặng lẽ” (Xuân Quỳnh)", opts: ["Điệp ngữ", "Tương phản", "Nhân hóa", "Hoán dụ"], ans: 1 },
            { q: "Xác định chủ thể trữ tình được thể hiện trong câu thơ: “Khi ta lớn lên Đất Nước đã có rồi”", opts: ["Trực tiếp – cái tôi cá nhân", "Trực tiếp - cái ta cộng đồng", "Người kể truyện", "Nhân vật lịch sử"], ans: 1 },
            { q: "Xác định nhân vật trữ tình thể hiện trong các câu thơ: “Quê hương anh nước mặn đồng chua/ Làng tôi nghèo đất cày lên sỏi đá/ Tôi với anh đôi người xa lạ/ Tự phương trời chẳng hẹn quen nhau/.../ Súng bên súng, đầu sát bên đầu/ Đêm rét chung chăn thành đôi tri kỉ", opts: ["Người lính", "Ngôi thứ nhất", "Cá nhân", "Tập thể"], ans: 0 },
            { q: "“Những ngôi sao thức ngoài kia / Chẳng bằng mẹ đã thức vì chúng con” Biện pháp tu từ chính là:", opts: ["So sánh", "Ẩn dụ", "Hoán dụ", "Điệp"], ans: 0 },
            { q: "“Tây Tiến đoàn binh không mọc tóc / Quân xanh màu lá dữ oai hùm” Hiệu quả của bút pháp được sử dụng là:", opts: ["Tả thực đơn thuần", "Lãng mạn hóa kết hợp hiện thực", "Châm biếm", "Tả cảnh"], ans: 1 },
            { q: "“Mình về mình có nhớ ta/ Mười lăm năm ấy thiết tha mặn nồng” Hình thức đối đáp “mình – ta” gợi lên:", opts: ["Quan hệ xa lạ", "Quan hệ hành chính", "Quan hệ gắn bó, nghĩa tình", "Quan hệ đối lập"], ans: 2 },
            { q: "“Ai đã đặt tên cho dòng sông?” Câu hỏi này thuộc kiểu:", opts: ["Câu hỏi thông tin", "Câu hỏi tu từ", "Câu cầu khiến", "Câu phủ định"], ans: 1 },
            { q: "Dữ liệu trong văn bản thông tin được chia thành:", opts: ["Sơ cấp và cao cấp", "Sơ cấp và thứ cấp", "Cơ bản và nâng cao", "Cơ bản và cao cấp"], ans: 1 },
            { q: "Khi phân tích một nhân vật văn học, ta có thể dựa theo các đặc điểm:", opts: ["Hành động, ngôi kể", "Ngoại hình, xuất thân, tính cách", "Cốt truyện, bối cảnh", "Nghệ thuật, sự kiện"], ans: 1 }
        ];

        const mcqContainer = document.getElementById('mcq-container');
        const mcqGrid = document.getElementById('mcq-grid');
        mcqData.forEach((q, i) => {
            let optsHtml = q.opts.map((opt, oi) => `
                <label class="opt-label" id="lbl-${i}-${oi}">
                    <input type="radio" name="q${i}" class="hidden" onchange="selectMcq(${i}, ${oi})">
                    <span class="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center text-[10px] font-bold">${String.fromCharCode(65 + oi)}</span>
                    <span>${opt}</span>
                </label>
            `).join('');
            mcqContainer.innerHTML += `<div class="q-card" id="q-${i}"><span class="q-num">Câu ${i+1}</span><div class="q-content">${q.q}</div><div class="mt-3">${optsHtml}</div></div>`;
            
            // Render grid button
            if (mcqGrid) {
                mcqGrid.innerHTML += `<button id="grid-q-${i}" class="w-10 h-10 rounded-lg bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center font-bold text-sm text-gray-600 dark:text-gray-300 hover:bg-orange-50 hover:border-orange-300 transition-colors shadow-sm" onclick="scrollToQuestion('q-${i}')">${i+1}</button>`;
            }
        });

        window.selectOption = function(element, levelStr) {
            document.querySelectorAll('.option-card').forEach(el => el.classList.remove('selected'));
            element.classList.add('selected');
            diagnosticData.userLevel = levelStr;
            document.getElementById('btn-next-1').disabled = false;
        }

        window.selectMcq = function(qIndex, optIndex) {
            diagnosticData.mcAnswers[qIndex] = optIndex;
            document.querySelectorAll(`#lbl-${qIndex}-0, #lbl-${qIndex}-1, #lbl-${qIndex}-2, #lbl-${qIndex}-3`).forEach(el => el.classList.remove('selected'));
            document.getElementById(`lbl-${qIndex}-${optIndex}`).classList.add('selected');
            
            // Update grid button style
            const gridBtn = document.getElementById(`grid-q-${qIndex}`);
            if (gridBtn) {
                gridBtn.classList.remove('bg-gray-50', 'dark:bg-gray-800', 'border-gray-200', 'dark:border-gray-700', 'text-gray-600', 'dark:text-gray-300');
                gridBtn.classList.add('bg-orange-100', 'dark:bg-orange-900/30', 'border-orange-500', 'text-orange-600', 'dark:text-orange-400');
            }
        }

        const essayInput = document.getElementById('diagnostic-essay');
        essayInput.addEventListener('input', function() {
            const words = this.value.trim() === "" ? 0 : this.value.trim().split(/\s+/).length;
            document.getElementById('word-count').innerText = `${words} từ`;
            
            // Update essay grid button style
            const tlBtn = document.getElementById('grid-essay');
            if (tlBtn) {
                if (words > 0) {
                    tlBtn.classList.remove('bg-gray-50', 'dark:bg-gray-800', 'border-gray-200', 'dark:border-gray-700', 'text-gray-600', 'dark:text-gray-300');
                    tlBtn.classList.add('bg-orange-100', 'dark:bg-orange-900/30', 'border-orange-500', 'text-orange-600', 'dark:text-orange-400');
                } else {
                    tlBtn.classList.remove('bg-orange-100', 'dark:bg-orange-900/30', 'border-orange-500', 'text-orange-600', 'dark:text-orange-400');
                    tlBtn.classList.add('bg-gray-50', 'dark:bg-gray-800', 'border-gray-200', 'dark:border-gray-700', 'text-gray-600', 'dark:text-gray-300');
                }
            }
        });

        window.scrollToQuestion = function(id) {
            toggleQuestionMenu();
            const el = document.getElementById(id);
            const container = document.getElementById('quiz-list-container');
            if (el && container) {
                container.scrollTo({
                    top: el.offsetTop - 20,
                    behavior: 'smooth'
                });
                
                // Highlight momentarily
                el.classList.add('ring-2', 'ring-orange-400', 'ring-offset-2', 'transition-all');
                setTimeout(() => {
                    el.classList.remove('ring-2', 'ring-orange-400', 'ring-offset-2');
                }, 1500);
            }
        }
        
        window.toggleQuestionMenu = function() {
            const modal = document.getElementById('question-menu-modal');
            if (modal) {
                modal.style.display = (modal.style.display === 'flex') ? 'none' : 'flex';
            }
        }

        window.goToStep = function(step) {
            document.querySelectorAll('.step-container').forEach(el => el.classList.remove('active'));
            document.getElementById('step-' + step).classList.add('active');
        }

        window.startTest = function() {
            goToStep(2);
            if (!isTakingTest) {
                isTakingTest = true;
                startDiagTimer();
            }
        }

        function startDiagTimer() {
            clearInterval(diagTimerInterval);
            diagTimeLeft = 2700; // 45 phút
            const timerEl = document.getElementById('diag-timer');
            
            diagTimerInterval = setInterval(() => {
                if (diagTimeLeft <= 0) {
                    clearInterval(diagTimerInterval);
                    showPopup("Hết giờ", "⏳ Đã hết 45 phút làm bài! Hệ thống tự động nộp bài.", "warning");
                    submitDiagnosticTest();
                } else {
                    diagTimeLeft--;
                    const m = Math.floor(diagTimeLeft / 60).toString().padStart(2, '0');
                    const s = (diagTimeLeft % 60).toString().padStart(2, '0');
                    timerEl.innerText = `${m}:${s}`;
                    
                    if (diagTimeLeft < 300) {
                        timerEl.parentElement.classList.remove('bg-gray-800');
                        timerEl.parentElement.classList.add('bg-red-600', 'animate-pulse');
                        timerEl.previousElementSibling.classList.remove('text-orange-400');
                        timerEl.previousElementSibling.classList.add('text-white');
                    }
                }
            }, 1000);
        }

        document.addEventListener("visibilitychange", () => {
            if (document.hidden && isTakingTest) {
                isTakingTest = false;
                clearInterval(diagTimerInterval);
                showPopup("CẢNH BÁO GIAN LẬN", "Bạn đã chuyển tab hoặc thu nhỏ trình duyệt trong lúc làm bài thi.\n\nBài thi của bạn đã bị HỦY BỎ kết quả!", "error");
                setTimeout(() => {
                    if (window !== window.parent) {
                        window.parent.location.href = "index.html";
                    } else {
                        window.location.href = "index.html"; 
                    }
                }, 3000);
            }
        });

        // --- HÀM LẤY API KEY TỪ FIRESTORE ĐỂ LUÂN PHIÊN (ROTATION) ---
        async function getRandomGroqKey() {
            try {
                const url = `https://firestore.googleapis.com/v1/projects/hopvan-9a648/databases/(default)/documents/system_settings/api_keys?t=${Date.now()}`;
                const response = await fetch(url);
                const data = await response.json();
                
                if (data.error) {
                    console.error("Firebase REST Error:", data.error.message);
                    if (data.error.code === 403) throw new Error("Chưa cấp quyền Đọc (read) cho bảng api_keys trong Firestore Rules.");
                    return null;
                }

                const keysArray = data?.fields?.groq_keys?.arrayValue?.values;
                if (keysArray && keysArray.length > 0) {
                    const keys = keysArray.map(k => k.stringValue).filter(Boolean);
                    if (keys.length > 0) {
                        return keys[Math.floor(Math.random() * keys.length)];
                    }
                }
                return null;
            } catch (error) {
                console.error("Lỗi khi lấy Groq API Key:", error);
                throw error;
            }
        }

        window.submitDiagnosticTest = async function(force = false) {
            const answeredCount = Object.keys(diagnosticData.mcAnswers).length;
            if (answeredCount < 30 && !force) {
                const modal = document.getElementById('confirm-popup');
                document.getElementById('confirm-title').innerText = "Cảnh Báo Nộp Bài";
                document.getElementById('confirm-message').innerText = `Bạn mới làm ${answeredCount}/30 câu trắc nghiệm. Việc nộp bài sớm có thể ảnh hưởng đến kết quả đánh giá năng lực của bạn. Bạn có chắc chắn muốn nộp bài?`;
                document.getElementById('confirm-btn-yes').onclick = () => {
                    modal.style.display = 'none';
                    submitDiagnosticTest(true);
                };
                modal.style.display = 'flex';
                return;
            }

            diagnosticData.essay = essayInput.value.trim();
            if (diagnosticData.essay.split(/\s+/).filter(x => x).length < 20) {
                showPopup("Bài Quá Ngắn", "Phần tự luận quá ngắn! Hãy viết ít nhất 20 từ để AI có thể đánh giá tư duy nhé.", "warning");
                return;
            }

            isTakingTest = false;
            clearInterval(diagTimerInterval);

            goToStep(3);
            const bar = document.getElementById('ai-progress-bar');
            const status = document.getElementById('ai-status-text');
            
            bar.style.width = '20%'; status.innerText = "Đang chấm 30 câu trắc nghiệm...";

            let mcCorrect = 0;
            mcqData.forEach((q, i) => { if (diagnosticData.mcAnswers[i] === q.ans) mcCorrect++; });
            const mcScore = (mcCorrect * 0.25); 

            setTimeout(() => { bar.style.width = '50%'; status.innerText = "AI đang đọc và chấm điểm bài luận..."; }, 1000);

            try {
                let systemPrompt = `Bạn là Giám khảo chấm thi môn Ngữ Văn của nền tảng HopVan.
                [DỮ LIỆU BÀI LÀM]
                - Học sinh tự nhận định: ${diagnosticData.userLevel}
                - Điểm Trắc nghiệm: ${mcScore}/7.5 điểm.
                - Bài làm tự luận của học sinh: "${diagnosticData.essay}"

                [HƯỚNG DẪN CHẤM TỰ LUẬN - TỔNG 2.5 ĐIỂM]
                Hãy chấm bài tự luận thật khắt khe dựa trên barem sau:
                - 0,25 điểm: Xác định đúng vấn đề nghị luận.
                - 1,5 điểm: Lập luận (giải thích – phân tích – dẫn chứng).
                - 0,5 điểm: Diễn đạt, liên kết, logic.
                - 0,25 điểm: Sáng tạo (góc nhìn riêng, lập luận sắc sảo).

                [NHIỆM VỤ CỦA BẠN]
                1. Chấm điểm bài Tự luận (Thang 2.5đ) theo đúng barem trên.
                2. Tính TỔNG ĐIỂM = Điểm Trắc nghiệm (${mcScore}) + Điểm Tự luận.
                3. Đưa ra nhận xét (ưu điểm, nhược điểm) và tạo 3 chặng lộ trình học.
                
                [QUY TẮC JSON - BẮT BUỘC]
                Không dùng Markdown. Trả về đúng JSON:
                {
                    "total_score": "[Tổng điểm / 10]",
                    "mc_score": "${mcScore}/7.5",
                    "essay_score": "[Điểm tự luận / 2.5]",
                    "level_title": "[VD: Mất gốc / Khá / Giỏi]",
                    "strengths": ["[Ưu điểm dựa theo barem]"],
                    "weaknesses": ["[Lỗi sai dựa theo barem]"],
                    "syllabus": [
                        { "phase": "Chặng 1 - Lấp lỗ hổng", "title": "[Tên bài]", "desc": "[Mô tả]" },
                        { "phase": "Chặng 2 - Rèn kĩ năng", "title": "[Tên bài]", "desc": "[Mô tả]" },
                        { "phase": "Chặng 3 - Thực chiến", "title": "[Tên bài]", "desc": "[Mô tả]" }
                    ]
                }`;

                systemPrompt += "\n\n[LƯU Ý KỸ THUẬT QUAN TRỌNG]: Bắt buộc trả về kết quả dưới định dạng JSON hợp lệ.";

                // 1. LẤY API KEY ĐỘNG TỪ FIREBASE
                const apiKey = await getRandomGroqKey();
                if (!apiKey) {
                    throw new Error("Hệ thống chưa được cấu hình API Key. Vui lòng liên hệ Admin.");
                }

                // 2. GỌI TRỰC TIẾP API GROQ
                const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST',
                    headers: { 
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json' 
                    },
                    body: JSON.stringify({ 
                        model: "llama-3.3-70b-versatile",
                        messages: [
                            { role: "system", content: systemPrompt },
                            { role: "user", content: `Bắt đầu chấm bài` }
                        ],
                        temperature: 0.3,
                        max_tokens: 3000, 
                        response_format: { type: "json_object" } 
                    })
                });

                if (!res.ok) {
                    const errData = await res.json();
                    console.error("Groq Error:", errData);
                    if (res.status === 429) throw new Error("Hệ thống đang quá tải request, vui lòng thử lại sau giây lát.");
                    if (res.status === 401) throw new Error("API Key không hợp lệ hoặc đã bị khóa.");
                    throw new Error("Lỗi kết nối máy chủ AI.");
                }

                const data = await res.json();
                if (!data.choices || !data.choices[0] || !data.choices[0].message) throw new Error("NO_CONTENT");
                
                bar.style.width = '80%'; status.innerText = "Đang tổng hợp Báo cáo Lộ trình...";

                let rawText = data.choices[0].message.content;
                rawText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
                const firstBrace = rawText.indexOf('{');
                const lastBrace = rawText.lastIndexOf('}');
                if (firstBrace !== -1 && lastBrace !== -1) rawText = rawText.substring(firstBrace, lastBrace + 1);
                rawText = rawText.replace(/[\u0000-\u0019]+/g,"");

                const result = JSON.parse(rawText);

                if (auth.currentUser) {
                    try {
                        const uid = auth.currentUser.uid;
                        
                        let rawTotal = parseFloat(result.total_score);
                        if (isNaN(rawTotal)) {
                            const match = String(result.total_score).match(/[\d\.]+/);
                            rawTotal = match ? parseFloat(match[0]) : 0;
                        }
                        
                        let competenceLevel = 1;
                        let competenceTag = "Khởi đầu";
                        
                        if (rawTotal >= 9.0) {
                            competenceLevel = 5;
                            competenceTag = "Nâng cao";
                        } else if (rawTotal >= 7.0) {
                            competenceLevel = 4;
                            competenceTag = "Ứng dụng";
                        } else if (rawTotal >= 5.0) {
                            competenceLevel = 3;
                            competenceTag = "Củng cố";
                        } else if (rawTotal >= 2.0) {
                            competenceLevel = 2;
                            competenceTag = "Xây nền";
                        }

                        await setDoc(doc(db, "users_progress", uid), { 
                            diagnosticDone: true,
                            competenceLevel: competenceLevel,
                            competenceTag: competenceTag,
                            startingScore: rawTotal
                        }, { merge: true });

                        await setDoc(doc(db, "diagnostic_results", uid), {
                            total_score: rawTotal,
                            level_title: result.level_title,
                            competenceLevel: competenceLevel,
                            timestamp: new Date()
                        }, { merge: true });

                    } catch(dbError) {
                        console.error("Lỗi cấp quyền Firestore khi lưu kết quả bài test:", dbError);
                    }
                }

                bar.style.width = '100%'; status.innerText = "Hoàn tất!";
                renderResult(result);
                setTimeout(() => { goToStep(4); }, 600);

            } catch (error) {
                console.error("Lỗi AI sinh mã:", error);
                let msg = "Lỗi máy chủ AI. Vui lòng bấm Nộp lại bài!";
                if (error.message.includes("Hệ thống đang quá tải") || error.message.includes("API Key")) msg = error.message;
                if (error.name === "SyntaxError" || error.message === "NO_CONTENT") msg = "Dữ liệu AI trả về bị lỗi cấu trúc. Vui lòng bấm nộp lại!";
                showPopup("Lỗi AI", msg, "error");
                goToStep(2);
            }
        }

        function renderResult(result) {
            const container = document.getElementById('result-content');
            
            const renderList = (arr, icon, color) => {
                if (!arr || arr.length === 0 || arr[0].trim() === "" || arr[0].toLowerCase().includes("không có")) {
                    return `<li class="flex items-start gap-2 mb-2 p-3 bg-red-50 rounded-lg border border-red-100">
                                <i class="fas fa-exclamation-triangle text-red-500 mt-1"></i> 
                                <span class="text-red-700 font-medium">Bài làm không đúng yêu cầu đề hoặc quá sơ sài, thiếu nghiêm túc để đánh giá chi tiết.</span>
                            </li>`;
                }
                return arr.map(i => `<li class="flex items-start gap-2 mb-2"><i class="${icon} ${color} mt-1"></i> <span class="text-gray-600 font-medium">${i}</span></li>`).join('');
            };

            const renderTimeline = (arr) => {
                if (!arr || !arr.length) return '';
                
                let itemsHtml = arr.map((item, idx) => `
                <div class="relative">
                    <div class="absolute -left-[33px] top-5 w-4 h-4 rounded-full bg-white border-[3px] border-orange-400 z-10 dark:bg-gray-900 dark:border-orange-500"></div>
                    <div class="bg-gray-50/50 border border-gray-100 shadow-sm rounded-2xl p-5 hover:shadow-md transition duration-300 dark:bg-gray-800 dark:border-gray-700">
                        <span class="inline-block bg-orange-100 text-orange-600 text-[10px] font-black uppercase px-3 py-1 rounded-md mb-2 tracking-wide dark:bg-orange-900/30 dark:text-orange-400">${item.phase}</span>
                        <h5 class="font-bold text-gray-800 text-lg mb-1 dark:text-gray-100">${item.title}</h5>
                        <p class="text-gray-500 text-sm leading-relaxed dark:text-gray-400">${item.desc}</p>
                    </div>
                </div>`).join('');

                return `
                <div class="relative pl-6 border-l-2 border-orange-200 ml-3 space-y-6 dark:border-orange-900/50 py-2">
                    ${itemsHtml}
                </div>
                `;
            };

            let displayScore = parseFloat(result.total_score);
            if (isNaN(displayScore)) {
                const match = String(result.total_score).match(/[\d\.]+/);
                displayScore = match ? parseFloat(match[0]) : 0;
            }

            container.innerHTML = `
                <div class="text-center border-b pb-6 border-gray-100 dark:border-gray-700">
                    <div class="score-circle">${displayScore}<span>/10</span></div>
                    <h2 class="text-2xl font-black text-orange-500 mb-1">Xếp loại: ${result.level_title}</h2>
                    <div class="flex justify-center gap-4 mt-3">
                        <span class="bg-blue-50 text-blue-700 font-bold px-3 py-1 rounded-lg text-sm">Trắc nghiệm: ${result.mc_score}</span>
                        <span class="bg-purple-50 text-purple-700 font-bold px-3 py-1 rounded-lg text-sm">Tự luận: ${result.essay_score}</span>
                    </div>
                </div>

                <div class="diagnosis-grid">
                    <div class="diag-box good"><h4 class="text-green-700 font-bold mb-3"><i class="fas fa-check-circle text-green-500"></i> Ưu điểm</h4>
                    <ul>${renderList(result.strengths, 'fas fa-check', 'text-green-500')}</ul></div>
                    
                    <div class="diag-box bad"><h4 class="text-red-700 font-bold mb-3"><i class="fas fa-times-circle text-red-500"></i> Cần khắc phục</h4>
                    <ul>${renderList(result.weaknesses, 'fas fa-times', 'text-red-500')}</ul></div>
                </div>

                <div class="mt-6">
                    <h3 class="text-lg font-black text-gray-800 dark:text-white mb-4"><i class="fas fa-map-marked-alt text-orange-500"></i> Lộ trình học đề xuất</h3>
                    ${renderTimeline(result.syllabus)}
                </div>

                <div class="mt-8 text-center flex justify-center">
                    <button onclick="if(window!==window.parent){window.parent.closeDiagnosticOverlay();}else{window.location.href='index.html';}" 
                            class="bg-gradient-to-r from-orange-400 to-red-500 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition duration-300 flex items-center gap-2">
                        Vào học ngay <i class="fas fa-arrow-right"></i>
                    </button>
                </div>
            `;
        }