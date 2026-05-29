let studentName = "";
let answers = {};
let currentActiveScreen = "screen-welcome";

// 计时控制核心句柄
let countdownInterval = null;
let currentRemainingSeconds = 0;

// 统一管理音频对象引用
const audios = {
    volume: document.getElementById('audio-volume'),
    part1: document.getElementById('audio-part1'),
    part2: document.getElementById('audio-part2'),
    part4: document.getElementById('audio-part4')
};

// 页面切换核心驱动
function showScreen(screenId) {
    if (!screenId) return;
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) targetScreen.classList.add('active');
    currentActiveScreen = screenId;

    const mainContainer = document.getElementById('main-container');
    if (mainContainer) {
        if (screenId === 'screen-reading' || screenId === 'screen-writing') {
            mainContainer.classList.add('wide-mode');
        } else {
            mainContainer.classList.remove('wide-mode');
        }
    }
    
    // 自动管理顶部计时悬浮栏的显示与隐藏
    const timerBar = document.getElementById('top-timer-bar');
    if (timerBar) {
        if (['screen-welcome', 'screen-volume', 'screen-result'].includes(screenId)) {
            timerBar.style.display = 'none';
            clearInterval(countdownInterval);
        } else {
            timerBar.style.display = 'block';
        }
    }
}

// 统一核心倒计时引擎
function startStageTimer(durationSeconds, labelText, timeoutCallback) {
    clearInterval(countdownInterval);
    currentRemainingSeconds = durationSeconds;
    
    const timerClock = document.getElementById('timer-clock');
    const statusText = document.getElementById('timer-status-text');
    
    if (statusText) statusText.innerText = labelText;
    
    function updateClockDisplay() {
        if (!timerClock) return;
        const mins = Math.floor(currentRemainingSeconds / 60);
        const secs = currentRemainingSeconds % 60;
        timerClock.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    updateClockDisplay();

    countdownInterval = setInterval(() => {
        currentRemainingSeconds--;
        if (currentRemainingSeconds <= 0) {
            clearInterval(countdownInterval);
            updateClockDisplay();
            if (timeoutCallback) timeoutCallback();
        } else {
            updateClockDisplay();
        }
    }, 1000);
}

// 姓名校验与入场
function validateAndNavigate() {
    const nameInput = document.getElementById('participant-name');
    const nameError = document.getElementById('name-error');
    if (!nameInput) return;

    studentName = nameInput.value.trim();
    if (studentName === "") {
        if (nameError) nameError.style.display = 'block';
        nameInput.focus();
        return;
    }
    if (nameError) nameError.style.display = 'none';

    showScreen('screen-volume');
    if (audios.volume) {
        audios.volume.currentTime = 0;
        audios.volume.play().catch(e => console.log("Audio play deferred: " + e));
    }
}

// 动态处理听力各个 Part 的音频播放监听与1分钟作答缓冲逻辑
function bindListeningAudioTimer(audioElement, partId, nextStepCallback) {
    if (!audioElement) return;

    const statusSpan = document.getElementById(`status-${partId}`);
    const pulseDot = document.getElementById(`dot-${partId}`);

    if (statusSpan) statusSpan.innerText = "音频正在准备播放...";

    // 音频正常播放时，显示提示（此时计时器显示“播放中”）
    audioElement.onplay = function() {
        if (statusSpan) statusSpan.innerText = "音频正在播放中... 请抓紧时间完成以下题目";
        const timerClock = document.getElementById('timer-clock');
        if (timerClock) timerClock.innerText = "播放中";
        const statusText = document.getElementById('timer-status-text');
        if (statusText) statusText.innerText = "听力音频正在运行";
    };

    // 当音频自然播放完毕，立刻启动 60 秒倒计时缓冲
    audioElement.onended = function() {
        if (statusSpan) statusSpan.innerText = "音频已播放完毕！当前部分剩余答题时间：";
        if (pulseDot) pulseDot.classList.add('timer-countdown');

        startStageTimer(60, "听力答题缓冲时间:", () => {
            alert("答题时间到，系统已自动为您保存并进入下一阶段。");
            nextStepCallback(true); // 传入 true 绕过强校验漏洞
        });
    };
}

// 听力 Part 1 启动
function startPart1() {
    if (audios.volume) audios.volume.pause();
    showScreen('screen-part1');
    bindListeningAudioTimer(audios.part1, 'part1', goToPart2);
    if (audios.part1) {
        audios.part1.currentTime = 0;
        audios.part1.play().catch(e => console.log(e));
    }
}

// 切换到听力 Part 2
function goToPart2(isTimeout = false) {
    if (!isTimeout && audios.part1 && !audios.part1.paused && !audios.part1.ended) {
        if(!confirm("音频尚未播完，确定要切换到下一页吗？")) return;
    }
    if (audios.part1) audios.part1.pause();
    
    showScreen('screen-part2');
    bindListeningAudioTimer(audios.part2, 'part2', goToPart4);
    if (audios.part2) {
        audios.part2.currentTime = 0;
        audios.part2.play().catch(e => console.log(e));
    }
}

// 切换到听力 Part 4
function goToPart4(isTimeout = false) {
    if (!isTimeout && audios.part2 && !audios.part2.paused && !audios.part2.ended) {
        if(!confirm("音频尚未播完，确定要切换到下一页吗？")) return;
    }
    if (audios.part2) audios.part2.pause();

    showScreen('screen-part4');
    bindListeningAudioTimer(audios.part4, 'part4', goToReading);
    if (audios.part4) {
        audios.part4.currentTime = 0;
        audios.part4.play().catch(e => console.log(e));
    }
}

// 进入阅读阶段：限时 15 分钟 (15 * 60 = 900秒)
function goToReading(isTimeout = false) {
    if (!isTimeout && audios.part4 && !audios.part4.paused && !audios.part4.ended) {
        if(!confirm("音频尚未播完，确定要切换到下一页吗？")) return;
    }
    if (audios.part4) audios.part4.pause();

    showScreen('screen-reading');
    
    // 15分钟限时倒计时，超时强制切到写作
    startStageTimer(900, "阅读部分剩余时间:", () => {
        alert("阅读测试时间已到！系统已自动为您保存当前答案并切换到写作部分。");
        goToWriting(true); 
    });
}

// 进入写作阶段：限时 20 分钟 (20 * 60 = 1200秒)
function goToWriting(isTimeout = false) {
    // 收集填空题和多选题的数据
    saveInputAnswers();
    
    showScreen('screen-writing');
    updateWordCount(); // 初始化字数与提交按钮状态

    // 20分钟限时倒计时，超时强制交卷
    startStageTimer(1200, "写作部分剩余时间:", () => {
        alert("写作测试时间到！系统正在为您强制提交并生成本地答题包...");
        const textarea = document.getElementById('writing-essay');
        if (textarea) textarea.disabled = true;
        submitTest(true); // 传入 true 绕过150词校验拦截
    });
}

// 动态监控写作字数限制并联动控制提交按钮
function updateWordCount() {
    const essayTextarea = document.getElementById('writing-essay');
    const wordCountVal = document.getElementById('word-count-val');
    const limitWarning = document.getElementById('writing-limit-warning');
    const submitBtn = document.getElementById('btn-submit-essay');
    
    if (!essayTextarea) return;

    const text = essayTextarea.value.trim();
    const words = text === "" ? [] : text.split(/\s+/);
    const count = words.length;

    if (wordCountVal) wordCountVal.innerText = count;
    answers['writing_essay'] = text;

    // 如果字数满 150 词，解除警告并激活按钮
    if (count >= 150) {
        if (limitWarning) limitWarning.style.display = 'none';
        if (submitBtn) submitBtn.disabled = false;
    } else {
        if (limitWarning) limitWarning.style.display = 'inline';
        if (submitBtn) submitBtn.disabled = true;
    }
}

// 定时收集填空类输入框的数据
function saveInputAnswers() {
    // 听力 Part 4 填空 (q31-q40)
    for (let i = 31; i <= 40; i++) {
        const el = document.getElementById(`q${i}`);
        if (el) answers[`q${i}`] = el.value.trim();
    }
    // 阅读 5-9 题填空 (r5-r9)
    for (let i = 5; i <= 9; i++) {
        const el = document.getElementById(`r${i}`);
        if (el) answers[`r${i}`] = el.value.trim();
    }
}

// 处理单选和多选的选项点击
document.querySelectorAll('.option-item').forEach(item => {
    item.addEventListener('click', function() {
        const block = this.closest('.question-block');
        if (!block) return;
        const qId = block.getAttribute('data-question');
        const qType = block.getAttribute('data-type');
        const itemValue = this.getAttribute('data-value');

        block.classList.remove('highlight-error');

        if (qType === 'single') {
            block.querySelectorAll('.option-item').forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            answers[qId] = itemValue;
        } else if (qType === 'multi') {
            const limit = parseInt(block.getAttribute('data-limit') || '2');
            if (!answers[qId]) answers[qId] = [];

            if (this.classList.contains('selected')) {
                this.classList.remove('selected');
                answers[qId] = answers[qId].filter(v => v !== itemValue);
            } else {
                if (answers[qId].length >= limit) {
                    alert(`本题最多只能选择 ${limit} 个选项！`);
                    return;
                }
                this.classList.add('selected');
                answers[qId].push(itemValue);
            }
        }
    });
});

// 最终完成并提交测试
function submitTest(forceSubmit = false) {
    clearInterval(countdownInterval);
    saveInputAnswers();

    // 如果不是超时强制提交，而是手动点击的，做最终阻断防御检查
    if (!forceSubmit) {
        const text = (answers['writing_essay'] || "").trim();
        const count = text === "" ? 0 : text.split(/\s+/).length;
        if (count < 150) {
            alert("您的作文尚未达到150词的底线要求，暂时无法手动提交，请继续补充！");
            return;
        }
    }

    showScreen('screen-result');
}

// 导出生成本地答题报告文本
function downloadDataFile() {
    let fileContent = `==================================================\n`;
    fileContent += `       IELTS PLACEMENT TEST REPORT (INTERMEDIATE) \n`;
    fileContent += `==================================================\n`;
    fileContent += `学生姓名 (Student Name) : ${studentName}\n`;
    fileContent += `提交时间 (Generated Time): ${new Date().toLocaleString()}\n`;
    fileContent += `--------------------------------------------------\n\n`;

    fileContent += `[LISTENING SECTION ANSWERS]\n`;
    fileContent += `Q11 : ${answers['q11'] || ''}\n`;
    fileContent += `Q12 : ${answers['q12'] || ''}\n`;
    fileContent += `Q13 : ${answers['q13'] || ''}\n`;
    fileContent += `Q14 : ${answers['q14'] || ''}\n`;
    fileContent += `Q15 : ${answers['q15'] || ''}\n`;
    fileContent += `Q16 : ${answers['q16'] || ''}\n`;
    fileContent += `Q17-18 : ${(answers['q17_18'] || []).join(', ')}\n`;
    fileContent += `Q19-20 : ${(answers['q19_20'] || []).join(', ')}\n`;
    for(let i=31; i<=40; i++) {
        fileContent += `Q${i} : ${answers['q'+i] || ''}\n`;
    }
    fileContent += `\n`;

    fileContent += `[READING SECTION ANSWERS]\n`;
    for(let i=1; i<=9; i++) {
        fileContent += `Q${i} : ${answers['r'+i] || ''}\n`;
    }
    fileContent += `Q10 : ${answers['r10'] || ''}\n`;
    fileContent += `\n`;

    fileContent += `[WRITING SECTION ESSAY]\n`;
    fileContent += `${answers['writing_essay'] || ''}\n\n`;
    fileContent += `==================================================\n`;
    fileContent += `                 END OF REPORT                    \n`;
    fileContent += `==================================================\n`;

    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `雅思测验定级报告_${studentName}.txt`;
    link.click();
}

// 初始化平稳唤醒
showScreen('screen-welcome');