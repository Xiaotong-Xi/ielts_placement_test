let studentName = "";
let answers = {};
let currentActiveScreen = "screen-welcome";

// 计时控制
let countdownInterval = null;
let currentRemainingSeconds = 0;

// 口语串联录音核心变量
let mediaRecorder = null;
let audioChunks = [];
let speakingAudioBlob = null; 

const audios = {
    volume: document.getElementById('audio-volume'),
    part1: document.getElementById('audio-part1'),
    part2: document.getElementById('audio-part2'),
    part4: document.getElementById('audio-part4'),
    speakQ1: document.getElementById('audio-speak-q1'),
    speakQ2: document.getElementById('audio-speak-q2'),
    speakQ3: document.getElementById('audio-speak-q3')
};

function showScreen(screenId) {
    if (!screenId) return;
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) targetScreen.classList.add('active');
    currentActiveScreen = screenId;

    const mainContainer = document.getElementById('main-container');
    if (mainContainer) {
        if (['screen-reading', 'screen-writing'].includes(screenId)) {
            mainContainer.classList.add('wide-mode');
        } else {
            mainContainer.classList.remove('wide-mode');
        }
    }
    
    const timerBar = document.getElementById('top-timer-bar');
    if (timerBar) {
        if (['screen-welcome', 'screen-volume', 'screen-speaking', 'screen-result'].includes(screenId)) {
            timerBar.style.display = 'none';
            clearInterval(countdownInterval);
        } else {
            timerBar.style.display = 'block';
        }
    }
}

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
        if (statusSpan) statusSpan.innerText = "音频已播放完毕！当前作答时间剩余：";
        if (pulseDot) pulseDot.classList.add('timer-countdown');

        startStageTimer(60, "听力答题剩余时间:", () => {
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
    
    startStageTimer(900, "阅读部分剩余时间:", () => {
        alert("阅读测试时间已到！系统已自动为您保存当前答案并切换到写作部分。");
        goToWriting(true); 
    });
}

function goToWriting(isTimeout = false) {
    saveInputAnswers();
    showScreen('screen-writing');
    updateWordCount(); 

    startStageTimer(1200, "写作部分剩余时间:", () => {
        alert("写作测试时间已到！系统正在为您强行跳转至口语模块...");
        goToSpeaking(true); 
    });
}

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

    if (count >= 150) {
        if (limitWarning) limitWarning.style.display = 'none';
        if (submitBtn) submitBtn.disabled = false;
    } else {
        if (limitWarning) limitWarning.style.display = 'inline';
        if (submitBtn) submitBtn.disabled = true;
    }
}

function saveInputAnswers() {
    for (let i = 31; i <= 40; i++) {
        const el = document.getElementById(`q${i}`);
        if (el) answers[`q${i}`] = el.value.trim();
    }
    for (let i = 5; i <= 9; i++) {
        const el = document.getElementById(`r${i}`);
        if (el) answers[`r${i}`] = el.value.trim();
    }
}

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
                    alert(`最多选择 ${limit} 个选项！`);
                    return;
                }
                this.classList.add('selected');
                answers[qId].push(itemValue);
            }
        }
    });
});

function goToSpeaking(isTimeout = false) {
    saveInputAnswers();
    showScreen('screen-speaking');
}

function initiateSpeakingChain() {
    document.getElementById('btn-start-speaking').disabled = true;
    document.getElementById('status-speaking-text').innerText = "正在请求麦克风设备权限...";

    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            audioChunks = [];
            mediaRecorder = new MediaRecorder(stream);
            
            mediaRecorder.ondataavailable = event => {
                if (event.data.size > 0) audioChunks.push(event.data);
            };

            mediaRecorder.onstop = () => {
                speakingAudioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                stream.getTracks().forEach(track => track.stop());
                executeFinalSubmission();
            };

            mediaRecorder.start(1000); 
            
            const micDot = document.getElementById('dot-speaking-mic');
            if(micDot) micDot.classList.add('recording-active');

            runSpeakingQuestionTrack(1);
        })
        .catch(err => {
            alert("呼叫麦克风失败！请确保使用HTTPS访问或localhost环境，并允许权限。错误原因: " + err);
            document.getElementById('btn-start-speaking').disabled = false;
            document.getElementById('status-speaking-text').innerText = "设备启动失败。";
        });
}

function runSpeakingQuestionTrack(questionIndex) {
    const stageTitle = document.getElementById('speaking-stage-title');
    const statusText = document.getElementById('status-speaking-text');

    if (questionIndex > 3) {
        statusText.innerText = "口语测试结束，正在打包录音中...";
        if (mediaRecorder && mediaRecorder.state !== "inactive") {
            mediaRecorder.stop(); 
        }
        return;
    }

    stageTitle.innerText = `Speaking - Question ${questionIndex} / 3`;
    statusText.innerText = "正在播放提问音频，请仔细聆听...";

    const currentAudio = audios[`speakQ${questionIndex}`];
    if (!currentAudio) {
        runSpeakingQuestionTrack(questionIndex + 1);
        return;
    }

    currentAudio.currentTime = 0;
    currentAudio.play().catch(e => console.log("音轨播放受限: " + e));

    currentAudio.onended = function() {
        let responseLimit = 20; 
        if(questionIndex === 3) responseLimit = 35; 

        let remaining = responseLimit;
        statusText.innerText = `🔴 正在录制您的回答！请开始说话（剩余 ${remaining} 秒）...`;

        let answerTimer = setInterval(() => {
            remaining--;
            if (remaining <= 0) {
                clearInterval(answerTimer);
                runSpeakingQuestionTrack(questionIndex + 1);
            } else {
                statusText.innerText = `🔴 正在录制您的回答！请开始说话（剩余 ${remaining} 秒）...`;
            }
        }, 1000);
    };
}

function executeFinalSubmission() {
    showScreen('screen-result');
    downloadDataFile();      
    downloadAudioFileManual(); 
}

function downloadAudioFileManual() {
    if (!speakingAudioBlob) {
        alert("录音数据未生成或为空！");
        return;
    }
    const audioURL = URL.createObjectURL(speakingAudioBlob);
    const link = document.createElement('a');
    link.href = audioURL;
    link.download = `雅思测验口语录音_${studentName}.wav`;
    link.click();
}

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

/**
 * =======================================================
 * 🛡️ 核心新增：全栈独立防作弊反侦察安全驱动引擎
 * =======================================================
 */

// 1. 全局拦截鼠标右键菜单
document.addEventListener('contextmenu', function (e) {
    e.preventDefault();
});

// 2. 全局拦截复制行为（防止题目被复制出去）
document.addEventListener('copy', function (e) {
    e.preventDefault();
});

// 3. 全局拦截剪切行为
document.addEventListener('cut', function (e) {
    e.preventDefault();
});

// 4. 精准打击：死锁作文文本框的粘贴行为
const essayBox = document.getElementById('writing-essay');
if (essayBox) {
    essayBox.addEventListener('paste', function (e) {
        e.preventDefault();
        alert("⚠️ 考试警告：检测到不合规粘贴动作！作文部分必须纯手工敲击键盘作答，禁止抄袭外部文本！");
    });
}

// 默认唤醒欢迎页
showScreen('screen-welcome');