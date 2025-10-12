game.PlayScreen = me.ScreenObject.extend({
    // KHAI BÁO BIẾN
    questionsData: null, 
    currentQuestion: null, 

    init: function() {
        me.audio.play("theme", true);
        var vol = me.device.ua.indexOf("Firefox") !== -1 ? 0.3 : 0.5;
        me.audio.setVolume(vol);
        this._super(me.ScreenObject, 'init');
    },

    onResetEvent: function() {
        // TẢI DỮ LIỆU TẠI ĐÂY (Đã sửa lỗi tải quá sớm)
        this.questionsData = me.loader.getJSON('questions');
        if (!this.questionsData || this.questionsData.length === 0) {
            console.warn("Lỗi: Không thể tải hoặc file questions.json trống. Chức năng giáo dục bị vô hiệu hóa.");
        }
        
        me.game.reset();
        me.audio.stop("theme");
        if (!game.data.muted){
            me.audio.play("theme", true);
        }

        me.input.bindKey(me.input.KEY.SPACE, "fly", true);
        game.data.score = 0;
        game.data.steps = 0;
        game.data.start = false;
        game.data.newHiscore = false;

        me.game.world.addChild(new BackgroundLayer('bg', 1));

        this.ground1 = me.pool.pull('ground', 0, me.game.viewport.height - 96);
        this.ground2 = me.pool.pull('ground', me.game.viewport.width,
            me.game.viewport.height - 96);
        me.game.world.addChild(this.ground1, 11);
        me.game.world.addChild(this.ground2, 11);

        this.HUD = new game.HUD.Container();
        me.game.world.addChild(this.HUD, 11);

        this.bird = me.pool.pull("clumsy", 60, me.game.viewport.height/2 - 100);
        me.game.world.addChild(this.bird, 10);

        me.input.bindPointer(me.input.pointer.LEFT, me.input.KEY.SPACE);

        this.getReady = new me.Sprite(
            me.game.viewport.width/2,
            me.game.viewport.height/2,
            {image: 'getready'}
        );
        me.game.world.addChild(this.getReady, 11);

        var that = this;
        var fadeOut = new me.Tween(this.getReady).to({alpha: 0}, 2000)
            .easing(me.Tween.Easing.Linear.None)
            .onComplete(function() {
                game.data.start = true;
                me.game.world.addChild(new game.PipeGenerator(), 0);
                me.game.world.removeChild(that.getReady);
            }).start();
    },
    
    // =================================================================
    // HÀM ONGAMEOVER CHÍNH XÁC
    // =================================================================
    onGameOver: function() {
        // Kiểm tra an toàn: Nếu không có dữ liệu, Game Over bình thường
        if (!this.questionsData || this.questionsData.length === 0) {
            me.state.change(me.state.GAMEOVER); 
            return;
        }
        
        me.game.world.stop(); 
        
        // Chọn ngẫu nhiên một câu hỏi
        var randomIndex = Math.floor(Math.random() * this.questionsData.length);
        this.currentQuestion = this.questionsData[randomIndex];

        this.displayQuestionPopup(this.currentQuestion);
    },

    displayQuestionPopup: function(question) {
        var modal = document.getElementById('quiz-modal');
        var questionText = document.getElementById('question-text');
        var optionsContainer = document.getElementById('options-container');

        if (!modal || !questionText || !optionsContainer) {
            console.error("Lỗi HTML: Không tìm thấy ID popup. Kiểm tra lại index.html!");
            me.state.change(me.state.GAMEOVER); 
            return;
        }

        modal.style.display = 'block';
        questionText.innerText = question.question;
        optionsContainer.innerHTML = ''; 

        var that = this; 
        
        question.options.forEach(function(option, index) {
            var button = document.createElement('button');
            button.innerText = option;
            button.className = 'quiz-option-button'; 
            
            button.onclick = function() {
                that.handleAnswer(index, question);
            };
            
            optionsContainer.appendChild(button);
        });
    },

    handleAnswer: function(selectedIndex, question) {
        document.getElementById('quiz-modal').style.display = 'none';
        
        if (selectedIndex === question.answer_index) {
            alert("Chính xác! Bạn được Hồi sinh! \nGiải thích: " + question.explanation);
            
            me.game.world.play(); 
            me.state.change(me.state.PLAY); 
            
            var birdEntity = me.game.world.getChildByName("clumsy")[0];
            if (birdEntity) {
                birdEntity.pos.y = me.game.viewport.height / 2 - 100;
                birdEntity.body.vel.y = 0; 
            }
            
        } else {
            alert("Sai rồi! Đáp án đúng là: " + question.options[question.answer_index] + ".\n" + question.explanation);
            
            me.state.change(me.state.GAMEOVER); 
        }
    },
    // =================================================================

    onDestroyEvent: function() {
        me.audio.stopTrack('theme');
        this.HUD = null;
        this.bird = null;
        this.ground1 = null;
        this.ground2 = null;
        me.input.unbindKey(me.input.KEY.SPACE);
        me.input.unbindPointer(me.input.pointer.LEFT);
    }
});