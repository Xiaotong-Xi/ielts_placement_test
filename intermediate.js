let studentName = "";
let answers = {};
let currentActiveScreen = "screen-welcome";

// 计时控制核心变量
let countdownInterval = null;
let currentRemainingSeconds = 0;

// 音频资源配置（已精简口语相关音轨）
const audios = {
    volume: document.getElementById('audio-volume'),
    part1: document.getElementById('audio-part1'),
    part2: document.getElementById('audio-part2'),
    part4: document.getElementById('audio-part4')
};

/**
 * 切换屏幕核心驱动
 * @param {string} screenId 
 */
function showScreen(screenId) {
    if (!screenId) return;
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) targetScreen.classList.add('active');
    currentActiveScreen = screenId;

    // 针对阅读和写作部分开启大宽屏模式
    const mainContainer = document.getElementById('main-container');
    if (mainContainer) {
        if (['screen-reading', 'screen-writing'].includes(screenId)) {
            mainContainer.classList.add('wide-mode');
        } else {
            mainContainer.classList.remove('wide-mode');
        }
    }
    
    // 控制顶部全局计时器状态条的显隐
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

/**
 * 倒计时定时器引擎
 * @param {number} durationSeconds 倒计时长（秒）
 * @param {string} labelText 阶段提示文字
 * @param {function} timeoutCallback 归零触发回调
 */
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

/**
 * 欢迎页姓名验证
 */
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
        audios.volume.play().catch(e => console.log("音频播放受限制: " + e));
    }
}

/**
 * 听力音频生命周期同步监视器
 */
function bindListeningAudioTimer(audioElement, partId, nextStepCallback) {
    if (!audioElement) return;
    const statusSpan = document.getElementById(`status-${partId}`);
    const pulseDot = document.getElementById(`dot-${partId}`);

    if (statusSpan) statusSpan.innerText = "音频正在准备播放...";

    audioElement.onplay = function() {
        if (statusSpan) statusSpan.innerText = "音频正在播放中... 请在下方作答";
        const timerClock = document.getElementById('timer-clock');
        if (timerClock) timerClock.innerText = "播放中";
    };

    audioElement.onended = function() {
        if (statusSpan) statusSpan.innerText = "音频已播放完毕！当前听力作答时间剩余：";
        if (pulseDot) pulseDot.classList.add('timer-countdown');

        // 听力结束后给予 60 秒单独的填表/检查缓冲作答时间
        startStageTimer(60, "听力答题时间剩余:", () => {
            alert("答题时间已到，系统已自动为您保存当前页答案并切入下一页面。");
            nextStepCallback(true); 
        });
    };
}

function startPart1() {
    if (audios.volume) audios.volume.pause();
    showScreen('screen-part1');
    bindListeningAudioTimer(audios.part1, 'part1', goToPart2);
    if (audios.part1) {
        audios.part1.currentTime = 0;
        audios.part1.play().catch(e => console.log(e));
    }
}

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

function goToReading(isTimeout = false) {
    if (!isTimeout && audios.part4 && !audios.part4.paused && !audios.part4.ended) {
        if(!confirm("音频尚未播完，确定要切换到下一页吗？")) return;
    }
    if (audios.part4) audios.part4.pause();
    showScreen('screen-reading');
    
    // 阅读部分 15 分钟倒计时（900秒）
    startStageTimer(900, "阅读部分剩余时间:", () => {
        alert("阅读测试时间已到！系统已自动为您保存当前答案并切换到写作部分。");
        goToWriting(true); 
    });
}

function goToWriting(isTimeout = false) {
    saveInputAnswers();
    showScreen('screen-writing');
    updateWordCount(); 

    // 写作部分 20 分钟倒计时（1200秒）
    startStageTimer(1200, "写作部分剩余时间:", () => {
        alert("写作测试时间已到！系统正在为您强行收卷并生成数据包...");
        submitTest(); 
    });
}

/**
 * 🛠️ 核心修改点：实时监控作文词数（不再控制 disabled 锁定，支持强制提交）
 */
function updateWordCount() {
    const essayTextarea = document.getElementById('writing-essay');
    const wordCountVal = document.getElementById('word-count-val');
    const limitWarning = document.getElementById('writing-limit-warning');
    const submitBtn = document.getElementById('btn-submit-essay');
    
    if (!essayTextarea) return;

    const text = essayTextarea.value.trim();
    // 匹配多个空格做分割，精准计算纯英文词数
    const words = text === "" ? [] : text.split(/\s+/);
    const count = words.length;

    if (wordCountVal) wordCountVal.innerText = count;
    answers['writing_essay'] = text;

    // 确保提交按钮保持可用状态，仅更新界面文字样式提示
    if (submitBtn) {
        submitBtn.disabled = false; 
    }

    if (count >= 150) {
        if (limitWarning) {
            limitWarning.style.color = "#4cd964"; // 达标变为绿色
            limitWarning.innerText = "(字数已达标)";
        }
    } else {
        if (limitWarning) {
            limitWarning.style.color = "#ff3b30"; // 未达标显示红色
            limitWarning.innerText = `(未达150词，您也可以选择强行提交)`;
        }
    }
}

/**
 * 提取并缓存所有输入填空题的数据答案
 */
function saveInputAnswers() {
    // 听力 Part 4 (Q31 - Q40)
    for (let i = 31; i <= 40; i++) {
        const el = document.getElementById(`q${i}`);
        if (el) answers[`q${i}`] = el.value.trim();
    }
    // 阅读 填空题 (R5 - R9)
    for (let i = 5; i <= 9; i++) {
        const el = document.getElementById(`r${i}`);
        if (el) answers[`r${i}`] = el.value.trim();
    }
}

/**
 * 全局监听选择题点击事件高亮并捕获数据答案（支持单选与多选限制）
 */
document.querySelectorAll('.option-item').forEach(item => {
    item.addEventListener('click', function() {
        const block = this.closest('.question-block');
        if (!block) return;
        const qId = block.getAttribute('data-question');
        const qType = block.getAttribute('data-type');
        const itemValue = this.getAttribute('data-value');

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
                    alert(`最多只能选择 ${limit} 个选项！`);
                    return;
                }
                this.classList.add('selected');
                answers[qId].push(itemValue);
            }
        }
    });
});

/**
 * 核心：笔试总提交控制入口
 */
function submitTest() {
    // 1. 强制提取保存全部数据
    saveInputAnswers(); 
    
    // 2. 切换至带有跳转 speaking.html 的最终结果转场页面
    showScreen('screen-result');
    
    // 3. 自动并发弹窗下载本地数据纯文本 TXT 答题大报告
    downloadDataFile();
}

/**
 * 动态组装本地 TXT 笔试答题大报告数据流并驱动执行浏览器强制下载
 */
function downloadDataFile() {
    let fileContent = `==================================================\n`;
    fileContent += `       IELTS PLACEMENT TEST REPORT (WRITTEN PARTS) \n`;
    fileContent += `==================================================\n`;
    fileContent += `学生姓名 (Student Name) : ${studentName}\n`;
    fileContent += `生成时间 (Generated Time): ${new Date().toLocaleString()}\n`;
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
    link.download = `雅思测验笔试报告_${studentName}.txt`;
    link.click();
}

/**
 * =======================================================
 * 🛡️ 全局高强度独立防作弊反侦察反插件安全拦截引擎
 * =======================================================
 */

// 1. 全局拦截阻止鼠标右键菜单事件弹出
document.addEventListener('contextmenu', function (e) {
    e.preventDefault();
});

// 2. 全局拦截阻止文本复制行为（全面锁死考卷题目防止外泄或搜题）
document.addEventListener('copy', function (e) {
    e.preventDefault();
});

// 3. 全局拦截阻止剪切行为
document.addEventListener('cut', function (e) {
    e.preventDefault();
});

// 4. 精准打击：强制锁定并捕获作文输入区域的恶意外部文本粘贴动作
window.addEventListener('DOMContentLoaded', () => {
    const essayBox = document.getElementById('writing-essay');
    if (essayBox) {
        essayBox.addEventListener('paste', function (e) {
            e.preventDefault(); // 强行斩断粘贴操作
            alert("⚠️ 考试系统警告：检测到不合规粘贴动作！\n雅思写作部分必须纯手工敲击键盘作答，严禁从外部复制或使用AI工具抄袭文本！");
        });
    }
});

// 默认唤醒欢迎页
showScreen('screen-welcome');