// 数字分身聊天功能 - 支持多ID兼容
const chatMessages = document.getElementById('chatMessages') || document.getElementById('chatBox');
const userInput = document.getElementById('userInput') || document.getElementById('chatInput');
const sendButton = document.getElementById('sendButton');

// 发送消息函数
async function sendMessage() {
    const message = userInput.value.trim();
    if (message) {
        // 添加用户消息
        addMessage('user', message);
        userInput.value = '';
        
        try {
            // 调用 DeepSeek API 获取真实回复
            const response = await callDeepSeekAPI(message);
            addMessage('bot', response);
        } catch (error) {
            console.error('API Error:', error);
            addMessage('bot', '抱歉，我遇到了一些问题，请稍后再试。');
        }
    }
}

// DeepSeek API 调用函数 - 使用代理模式
async function callDeepSeekAPI(message) {
    const apiKey = 'sk-80fdb8dcd8514e7d9e76e67cf7397a49';
    
    // 尝试多种调用方式
    const callMethods = [
        // 方式1: 直接调用（适用于已部署到服务器的情况）
        () => fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: '你是一位 INFJ 温柔治愈人生导师，擅长心理陪伴、运势建议、情绪疏导、决策帮助。请用温暖、理解、支持的语气回应用户。' },
                    { role: 'user', content: message }
                ],
                temperature: 0.7,
                max_tokens: 1000,
                stream: false
            })
        }),
        
        // 方式2: 使用 CORS Anywhere 代理（适用于本地开发）
        () => fetch('https://corsproxy.io/?' + encodeURIComponent('https://api.deepseek.com/v1/chat/completions'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: '你是一位 INFJ 温柔治愈人生导师，擅长心理陪伴、运势建议、情绪疏导、决策帮助。请用温暖、理解、支持的语气回应用户。' },
                    { role: 'user', content: message }
                ],
                temperature: 0.7,
                max_tokens: 1000,
                stream: false
            })
        })
    ];
    
    for (const callMethod of callMethods) {
        try {
            console.log('尝试调用 DeepSeek API...');
            const response = await callMethod();
            
            if (response.ok) {
                const data = await response.json();
                console.log('API 调用成功!');
                return data.choices[0].message.content;
            }
            console.log('调用方式失败，尝试下一种...');
        } catch (error) {
            console.log('调用方式出错:', error.message);
            continue;
        }
    }
    
    // 所有方式都失败时，使用智能备选回复
    console.log('所有 API 调用方式失败，使用智能回复');
    return await fallbackResponse(message);
}

// 备选方案：使用 OpenRouter 或其他方式
async function fallbackResponse(message) {
    // 简单的智能回复，模拟 INFJ 风格
    const responses = [
        `亲爱的朋友，我理解你现在的心情。让我们一起来看看这个问题...\n\n关于"${message}"，我想给你一些温暖的建议：\n\n1. 先深呼吸，让自己静下来\n2. 倾听内心的声音\n3. 相信自己的直觉\n\n作为INFJ，我希望你能感受到这份陪伴。有什么想聊的，我都在。`,
        `你好，我感受到了你可能需要一些支持。关于"${message}"，让我来陪伴你一起思考这个问题。\n\n生活中总会有各种挑战，但请记住，每一步都是成长的机会。\n\n你愿意和我分享更多吗？`,
        `作为INFJ人生导师，我想告诉你：你并不孤单。关于"${message}"这个问题，我们可以一起来探索答案。\n\n建议你先找一个安静的时刻，问问自己内心真正想要的是什么。\n\n如果需要倾诉，我随时在这里倾听。`
    ];
    
    // 基于关键词的简单回复
    const msg = message.toLowerCase();
    
    if (msg.includes('运势') || msg.includes('运气') || msg.includes('今天')) {
        return `今日运势：今天你的能量场很特别！作为INFJ，我建议你：\n\n🌟 今天适合进行内心的探索\n🌟 直觉会特别准确\n🌟 与人为善，会有意外收获\n\n记得保持微笑，好运自然来！有什么具体想知道的吗？`;
    }
    
    if (msg.includes('难过') || msg.includes('伤心') || msg.includes('不开心') || msg.includes('情绪')) {
        return `我能感受到你的情绪，亲爱的朋友。难过是很正常的，让我抱抱你🤗\n\n作为INFJ，我想告诉你：\n\n1. 允许自己感受这些情绪\n2. 找个安静的地方好好照顾自己\n3. 如果想倾诉，我随时都在\n\n你愿意告诉我更多吗？`;
    }
    
    if (msg.includes('选择') || msg.includes('决策') || msg.includes('怎么办')) {
        return `面临选择时，INFJ的建议是：\n\n🤍 先静下心来，听听内心的声音\n🤍 想想什么对你来说是真正重要的\n🤍 不要急于做决定，可以先给自己一些时间\n\n关于"${message}"这个问题，你内心的倾向是什么呢？`;
    }
    
    return responses[Math.floor(Math.random() * responses.length)];
}

// 简单的回复逻辑（已不再使用，保留以兼容旧代码）
function getResponse(message) {
    message = message.toLowerCase();
    
    // 决策相关问题
    if (message.includes('选择') || message.includes('决策') || message.includes('怎么选')) {
        return '作为INFJ人生导师，我建议你先梳理自己的核心价值观，考虑这件事对你的长期影响，然后跟随内心的直觉。同时，你可以尝试列出 pros 和 cons，帮助你更清晰地看到各个选择的利弊。';
    }
    
    // 预测结果相关问题
    if (message.includes('结果') || message.includes('预测') || message.includes('考试') || message.includes('感情') || message.includes('工作') || message.includes('抢票')) {
        return '根据命理分析，这件事的结果很大程度上取决于你的准备和心态。保持积极的态度，做好充分的准备，结果会更倾向于你期望的方向。记住，命运掌握在自己手中。';
    }
    
    // 运势相关问题
    if (message.includes('运势') || message.includes('今天') || message.includes('kpi') || message.includes('计划')) {
        const运势建议 = [
            '今天你的能量较高，适合处理重要的决策和任务。建议将重点放在创造性工作上，会有不错的收获。',
            '今天需要注意情绪管理，可能会遇到一些小挑战。建议保持冷静，一步一步解决问题，晚上给自己一些放松的时间。',
            '今天是适合社交和合作的日子，不妨多与他人交流，可能会获得新的机会和灵感。',
            '今天适合反思和规划，回顾过去的经验，为未来制定更清晰的目标。',
            '今天你的直觉会很准，相信自己的判断，可能会有意外的惊喜。'
        ];
        const随机建议 =运势建议[Math.floor(Math.random() *运势建议.length)];
        return `今日运势：${随机建议}\n\n今日KPI建议：\n1. 完成一件重要的任务\n2. 花15分钟冥想或反思\n3. 与至少一个朋友或同事交流\n4. 确保充足的休息和水分摄入`;
    }
    
    // 默认回复
    return '感谢你的提问。作为INFJ人生导师和命理运势分析师，我可以帮助你分析人生决策、预测事件结果、提供每日运势指引。请问你具体想了解哪方面的内容呢？';
}

// 发送按钮点击事件
sendButton.addEventListener('click', sendMessage);

// 回车键发送消息
userInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// 初始加载时滚动到底部
window.addEventListener('load', function() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
});

// 运势卡重新抽卡功能
const drawCardBtn = document.querySelector('.draw-card-btn');
const sendToChatBtn = document.querySelector('.send-to-chat-btn');
const fortuneCard = document.getElementById('fortuneCard');
const fortuneMessage = document.getElementById('fortuneText');
const scoreNumber = document.getElementById('scoreNumber');
const fortuneTipsList = document.getElementById('tipsList');
const fortuneKpiList = document.getElementById('kpiList');
const cardDate = document.getElementById('cardDate');

// 跟踪卡片是否已翻转状态
let isCardFlipped = false;

// 用户头像上传功能
const avatarUpload = document.getElementById('avatarUpload');
const userAvatar = document.getElementById('userAvatar');

avatarUpload.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            userAvatar.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// 运势消息数组
const fortuneMessages = [
    '今天你的能量较高，适合处理重要的决策和任务。建议将重点放在创造性工作上，会有不错的收获。',
    '今天需要注意情绪管理，可能会遇到一些小挑战。建议保持冷静，一步一步解决问题，晚上给自己一些放松的时间。',
    '今天是适合社交和合作的日子，不妨多与他人交流，可能会获得新的机会和灵感。',
    '今天适合反思和规划，回顾过去的经验，为未来制定更清晰的目标。',
    '今天你的直觉会很准，相信自己的判断，可能会有意外的惊喜。',
    '今天适合学习和成长，尝试新的知识和技能，会有不错的收获。',
    '今天需要注意休息，保持良好的作息习惯，为接下来的挑战做好准备。',
    '今天是适合表达自己的日子，勇敢地说出你的想法和感受，会得到积极的回应。',
    '今天财运不错，可能会有意外的收入或投资机会。建议保持理性，不要冲动消费。',
    '今天适合户外活动，接触大自然，有助于提升你的能量和创造力。',
    '今天人际关系运势较好，适合处理团队合作或家庭关系问题。',
    '今天工作效率较高，适合完成重要的项目或任务，会取得不错的成果。'
];

// 今日行动建议数组
const actionTips = [
    '保持积极的心态，迎接新的挑战',
    '多与他人交流，可能会获得新的机会',
    '注意休息，保持良好的精神状态',
    '尝试新的方法解决问题',
    '关注细节，避免粗心大意',
    '保持耐心，不要急于求成',
    '主动帮助他人，积累善缘',
    '学习新知识，提升自己',
    '保持运动，增强体质',
    '冥想放松，调整心态'
];

// 今日计划KPI数组
const kpiItems = [
    '完成一件重要的任务',
    '花15分钟冥想或反思',
    '与至少一个朋友或同事交流',
    '确保充足的休息和水分摄入',
    '学习一项新技能或知识',
    '完成日常锻炼',
    '整理工作或生活空间',
    '设定明日目标',
    '阅读30分钟',
    '表达感恩之情'
];

// 随机获取数组元素的函数
function getRandomItems(array, count) {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

// 更新日期显示
function updateCardDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    cardDate.textContent = `${year}年${month}月${day}日`;
}

// 生成随机运势内容
function generateFortuneContent() {
    // 生成随机运势指数
    const randomScore = Math.floor(Math.random() * 31) + 60; // 60-90之间
    scoreNumber.textContent = randomScore;
    
    // 生成随机运势消息
    const randomMessage = fortuneMessages[Math.floor(Math.random() * fortuneMessages.length)];
    fortuneMessage.textContent = randomMessage;
    
    // 生成随机今日行动建议
    const randomTips = getRandomItems(actionTips, 3);
    fortuneTipsList.innerHTML = randomTips.map(tip => `<li>${tip}</li>`).join('');
    
    // 生成随机今日计划KPI
    const randomKpi = getRandomItems(kpiItems, 4);
    fortuneKpiList.innerHTML = randomKpi.map(kpi => `<li>${kpi}</li>`).join('');
    
    // 更新日期
    updateCardDate();
}

// 翻转卡片函数
function flipCard() {
    if (!isCardFlipped) {
        // 首次抽卡，先翻转
        generateFortuneContent();
        fortuneCard.classList.add('flipped');
        isCardFlipped = true;
    } else {
        // 重新抽卡，先翻转回去，再翻过来
        fortuneCard.classList.remove('flipped');
        setTimeout(() => {
            generateFortuneContent();
            fortuneCard.classList.add('flipped');
        }, 400);
    }
}

// 重新抽卡函数
function drawNewCard() {
    flipCard();
}

// 绑定重新抽卡按钮事件
drawCardBtn.addEventListener('click', drawNewCard);

// 发送签文到聊天框功能
sendToChatBtn.addEventListener('click', async function() {
    const fortuneText = fortuneMessage.textContent;
    const tipsText = Array.from(fortuneTipsList.children).map(li => li.textContent).join('\n- ');
    const kpiText = Array.from(fortuneKpiList.children).map(li => li.textContent).join('\n- ');
    
    const message = `今日运势：${fortuneText}\n\n今日行动建议：\n- ${tipsText}\n\n今日计划KPI：\n- ${kpiText}\n\n如何根据今日运势规划决策？`;
    
    // 添加用户消息
    addMessage('user', message);
    
    try {
        // 调用 DeepSeek API 获取真实回复
        const response = await callDeepSeekAPI(message);
        addMessage('bot', response);
    } catch (error) {
        console.error('API Error:', error);
        addMessage('bot', '抱歉，我遇到了一些问题，请稍后再试。');
    }
});

// 添加消息到聊天框
function addMessage(type, text) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', type === 'user' ? 'user-message' : 'bot-message');
    
    if (type === 'user') {
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <img src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=simple%20user%20avatar%2C%20placeholder%2C%20minimal%20style&image_size=square" alt="用户" class="user-avatar">
            </div>
            <div class="message-content">
                <p>${text}</p>
            </div>
        `;
    } else {
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <img src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=wise%20old%20man%20with%20green%20hues%2C%20serene%20expression%2C%20mystical%20aura%2C%20soft%20lighting%2C%20digital%20art%20style&image_size=square_hd" alt="绿老头" class="bot-avatar">
            </div>
            <div class="message-content">
                <p>${text}</p>
            </div>
        `;
    }
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ==================== 用户认证系统 ====================

// 当前登录用户
let currentUser = null;

// DOM 元素
const authModal = document.getElementById('authModal');
const modalClose = document.getElementById('modalClose');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const surveyForm = document.getElementById('surveyForm');
const userInfo = document.getElementById('userInfo');
const displayUsername = document.getElementById('displayUsername');
const logoutBtn = document.getElementById('logoutBtn');

// 表单切换按钮
const goToRegister = document.getElementById('goToRegister');
const goToLogin = document.getElementById('goToLogin');
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const completeSurvey = document.getElementById('completeSurvey');

// 临时存储注册信息
let tempRegisterData = {};

// 显示Toast提示
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// 打开认证模态框
function openAuthModal(showLogin = true) {
    authModal.classList.add('active');
    if (showLogin) {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        surveyForm.classList.add('hidden');
    } else {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
        surveyForm.classList.add('hidden');
    }
}

// 关闭认证模态框
function closeAuthModal() {
    authModal.classList.remove('active');
}

// 切换到登录表单
function switchToLogin() {
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    surveyForm.classList.add('hidden');
}

// 切换到注册表单
function switchToRegister() {
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    surveyForm.classList.add('hidden');
}

// 切换到调查问卷
function switchToSurvey() {
    loginForm.classList.add('hidden');
    registerForm.classList.add('hidden');
    surveyForm.classList.remove('hidden');
    updateSurveyProgress(1);
}

// 更新问卷进度
function updateSurveyProgress(step) {
    const totalSteps = 6;
    const progressFill = document.getElementById('progressFill');
    const currentStep = document.getElementById('currentStep');
    
    progressFill.style.width = `${(step / totalSteps) * 100}%`;
    currentStep.textContent = step;
    
    // 隐藏所有页面，显示当前页面
    for (let i = 1; i <= totalSteps; i++) {
        const page = document.getElementById(`surveyPage${i}`);
        if (page) {
            page.classList.toggle('hidden', i !== step);
        }
    }
}

// 检查登录状态
function checkLoginStatus() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        updateUserUI();
        return true;
    }
    return false;
}

// 更新用户界面
function updateUserUI() {
    if (currentUser) {
        userInfo.classList.remove('hidden');
        displayUsername.textContent = currentUser.username;
        
        // 隐藏未登录提示，显示抽卡按钮
        const cardBack = document.querySelector('.card-back');
        if (cardBack) {
            const prompt = cardBack.querySelector('.login-prompt');
            const drawBtn = cardBack.querySelector('.first-draw-btn');
            if (prompt) prompt.remove();
            if (drawBtn) drawBtn.style.display = 'block';
        }
    } else {
        userInfo.classList.add('hidden');
        addLoginPrompt();
    }
}

// 添加未登录提示
function addLoginPrompt() {
    const cardBack = document.querySelector('.card-back-content');
    if (cardBack && !cardBack.querySelector('.login-prompt')) {
        const drawBtn = cardBack.querySelector('.first-draw-btn');
        if (drawBtn) drawBtn.style.display = 'none';
        
        const prompt = document.createElement('div');
        prompt.className = 'login-prompt';
        prompt.innerHTML = `
            <p>🔒 登录后即可抽取每日运势<br>获取专属于你的个性化建议</p>
            <button class="login-prompt-btn" onclick="openAuthModal()">立即登录</button>
        `;
        cardBack.appendChild(prompt);
    }
}

// 登录
function handleLogin() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!username || !password) {
        showToast('请填写用户名和密码', 'error');
        return;
    }
    
    // 从localStorage获取用户数据
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    
    if (users[username] && users[username].password === password) {
        currentUser = {
            username: username,
            profile: users[username].profile
        };
        
        // 保存登录状态
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        showToast('登录成功！', 'success');
        closeAuthModal();
        updateUserUI();
    } else {
        showToast('用户名或密码错误', 'error');
    }
}

// 注册第一步：验证基本信息
function handleRegisterStep1() {
    const username = document.getElementById('registerUsername').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // 验证
    if (!username || !password || !confirmPassword) {
        showToast('请填写所有必填项', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showToast('两次密码输入不一致', 'error');
        return;
    }
    
    if (password.length < 6) {
        showToast('密码长度至少6位', 'error');
        return;
    }
    
    // 检查用户名是否已存在
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    if (users[username]) {
        showToast('用户名已存在', 'error');
        return;
    }
    
    // 保存临时数据，进入问卷
    tempRegisterData = { username, password };
    switchToSurvey();
}

// 收集问卷数据
function collectSurveyData() {
    // 获取兴趣爱好（多选框）
    const hobbies = [];
    document.querySelectorAll('.checkbox-item input:checked').forEach(cb => {
        hobbies.push(cb.value);
    });
    
    // 滑块值
    const stressLevel = document.getElementById('stressLevel').value;
    
    return {
        // 第1页
        birthDate: document.getElementById('birthDate').value,
        birthTime: document.getElementById('birthTime').value,
        gender: document.getElementById('gender').value,
        
        // 第2页
        hobbies: hobbies,
        interestTopic: document.getElementById('interestTopic').value,
        
        // 第3页
        difficultyResponse: document.getElementById('difficultyResponse').value,
        decisionStyle: document.getElementById('decisionStyle').value,
        personalityType: document.getElementById('personalityType').value,
        
        // 第4页
        currentFocus: document.getElementById('currentFocus').value,
        shortTermGoal: document.getElementById('shortTermGoal').value,
        longTermGoal: document.getElementById('longTermGoal').value,
        
        // 第5页
        stressSource: document.getElementById('stressSource').value,
        stressLevel: stressLevel,
        sleepQuality: document.getElementById('sleepQuality').value,
        
        // 第6页
        divinationAttitude: document.getElementById('divinationAttitude').value,
        adviceType: document.getElementById('adviceType').value,
        additionalInfo: document.getElementById('additionalInfo').value,
        
        // 注册时间
        registerTime: new Date().toISOString()
    };
}

// 完成注册
function handleCompleteRegistration() {
    const profile = collectSurveyData();
    
    // 保存用户数据到localStorage
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    users[tempRegisterData.username] = {
        password: tempRegisterData.password,
        profile: profile
    };
    localStorage.setItem('users', JSON.stringify(users));
    
    // 自动登录
    currentUser = {
        username: tempRegisterData.username,
        profile: profile
    };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    showToast('注册成功！欢迎加入！', 'success');
    closeAuthModal();
    updateUserUI();
    
    // 清空临时数据
    tempRegisterData = {};
}

// 退出登录
function handleLogout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    showToast('已退出登录', 'info');
    updateUserUI();
    
    // 重置卡片状态（如果已翻转）
    if (isCardFlipped) {
        fortuneCard.classList.remove('flipped');
        isCardFlipped = false;
    }
}

// ==================== 问卷页面切换 ====================
function bindSurveyNavigation() {
    // 下一页按钮
    document.querySelectorAll('.survey-next-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const nextPage = parseInt(btn.dataset.next);
            updateSurveyProgress(nextPage);
        });
    });
    
    // 上一页按钮
    document.querySelectorAll('.survey-prev-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const prevPage = parseInt(btn.dataset.prev);
            updateSurveyProgress(prevPage);
        });
    });
    
    // 滑块值显示
    const stressSlider = document.getElementById('stressLevel');
    const sliderValue = document.querySelector('.slider-value');
    if (stressSlider && sliderValue) {
        stressSlider.addEventListener('input', () => {
            sliderValue.textContent = stressSlider.value;
        });
    }
}

// ==================== 修改抽卡逻辑 ====================
const originalDrawNewCard = drawNewCard;
drawNewCard = function() {
    if (!currentUser) {
        showToast('请先登录后再抽卡', 'error');
        openAuthModal();
        return;
    }
    originalDrawNewCard();
};

// 同时修改首次抽卡按钮
const firstDrawBtn = document.querySelector('.first-draw-btn');
if (firstDrawBtn) {
    firstDrawBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!currentUser) {
            showToast('请先登录后再抽卡', 'error');
            openAuthModal();
            return;
        }
        flipCard();
    });
}

// ==================== 事件绑定 ====================
function bindAuthEvents() {
    // 模态框关闭
    modalClose.addEventListener('click', closeAuthModal);
    authModal.addEventListener('click', (e) => {
        if (e.target === authModal) closeAuthModal();
    });
    
    // 表单切换
    goToRegister.addEventListener('click', (e) => {
        e.preventDefault();
        switchToRegister();
    });
    
    goToLogin.addEventListener('click', (e) => {
        e.preventDefault();
        switchToLogin();
    });
    
    // 登录按钮
    loginBtn.addEventListener('click', handleLogin);
    
    // 注册按钮
    registerBtn.addEventListener('click', handleRegisterStep1);
    
    // 完成问卷按钮
    completeSurvey.addEventListener('click', handleCompleteRegistration);
    
    // 退出登录
    logoutBtn.addEventListener('click', handleLogout);
    
    // 问卷导航
    bindSurveyNavigation();
    
    // 回车登录
    document.getElementById('loginPassword').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });
}

// ==================== 初始化 ====================
function initAuthSystem() {
    // 绑定事件
    bindAuthEvents();
    
    // 检查登录状态
    if (!checkLoginStatus()) {
        addLoginPrompt();
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initAuthSystem);

// 立即初始化（避免DOMContentLoaded延迟）
setTimeout(initAuthSystem, 100);

// ==================== 黄历/算命功能 ====================

// 更新 API 系统提示词
function updateSystemPrompt() {
    return `你是一位 INFJ 温柔治愈玄学导师，精通黄历、运势、算命、八字命理，同时擅长心理陪伴、决策建议、情绪疏导。
请用温暖、理解、支持的语气回应用户。
当用户输入以下关键词时，请提供详细的玄学相关内容：
- 黄历
- 今日运势
- 算命
- 八字
- 今日宜
- 今日忌

内容应包含：今日黄历详情、今日宜/今日忌、吉时、财神方位、整体运势、事业/财运/感情分析。
请用美观的格式呈现，语言要专业但不失温度，符合治愈系风格。`;
}

// 黄历数据库
const almanacData = {
    heavenlyStems: ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'],
    earthlyBranches: ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'],
    zodiacAnimals: ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'],
    directions: ['正东', '正南', '正西', '正北', '东北', '东南', '西北', '西南'],
    luckyTimes: ['子时(23:00-01:00)', '丑时(01:00-03:00)', '寅时(03:00-05:00)', '卯时(05:00-07:00)',
                  '辰时(07:00-09:00)', '巳时(09:00-11:00)', '午时(11:00-13:00)', '未时(13:00-15:00)',
                  '申时(15:00-17:00)', '酉时(17:00-19:00)', '戌时(19:00-21:00)', '亥时(21:00-23:00)'],
    goodActivities: ['嫁娶', '祭祀', '祈福', '求嗣', '开光', '出行', '开市', '立券', '安床', '移徙', '入宅', '动土',
                     '安葬', '破土', '修造', '竖柱', '上梁', '纳采', '订盟', '纳畜', '牧养'],
    badActivities: ['开市', '入宅', '安床', '伐木', '上梁', '纳畜', '嫁娶', '出行', '安葬', '行丧', '开光', '修造',
                    '动土', '破土', '竖柱', '安门', '盖屋', '造船', '开市', '立券', '求财'],
    fortuneLevels: ['大吉', '吉', '平', '小凶', '凶'],
    careerAnalysis: [
        '今日事业运旺盛，贵人相助，可大胆进取，适合洽谈合作与签署重要文件。',
        '工作上需稳扎稳打，虽有小阻碍，但有贵人暗中相助，终能化险为夷。',
        '今日职场人际关系良好，与同事相处融洽，团队合作顺畅。',
        '事业发展顺利，但需保持低调，避免与他人发生口舌之争。'
    ],
    wealthAnalysis: [
        '今日财运亨通，正财偏财皆有，可适当进行稳健投资。',
        '财运平平，虽无大额收入，但日常开支无忧，忌大额投资与赌博。',
        '有意外之财的可能，但需见好就收，不可贪得无厌。',
        '财运欠佳，建议保守理财，避免借贷与担保。'
    ],
    loveAnalysis: [
        '感情运势甜蜜，单身者有机会遇到心仪对象，已有伴者感情升温。',
        '感情平淡中见真情，多关心对方感受，可安排温馨约会增进感情。',
        '感情上需注意沟通方式，避免误会与争吵，多些包容与理解。',
        '桃花运旺盛，但需注意辨别真心，避免陷入烂桃花的困扰。'
    ]
};

// 生成今日黄历
function generateAlmanac() {
    const now = new Date();
    const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    
    // 基于日期生成"随机"但稳定的黄历数据
    const seed = dayOfYear + now.getFullYear() * 365;
    
    const randomFromSeed = (arr, offset = 0) => arr[(seed + offset) % arr.length];
    const randomMultiple = (arr, count) => {
        const result = [];
        for (let i = 0; i < count; i++) {
            const item = arr[(seed + i * 7) % arr.length];
            if (!result.includes(item)) result.push(item);
        }
        return result;
    };

    const yearGan = almanacData.heavenlyStems[(now.getFullYear() - 4) % 10];
    const yearZhi = almanacData.earthlyBranches[(now.getFullYear() - 4) % 12];
    const zodiac = almanacData.zodiacAnimals[(now.getFullYear() - 4) % 12];

    return {
        date: `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`,
        lunarDate: `${yearGan}${yearZhi}年 【${zodiac}年】`,
        fortuneLevel: randomFromSeed(almanacData.fortuneLevels, 10),
        luckyTimes: randomMultiple(almanacData.luckyTimes, 4),
        wealthDirection: randomFromSeed(almanacData.directions, 20),
        goodActivities: randomMultiple(almanacData.goodActivities, 6),
        badActivities: randomMultiple(almanacData.badActivities, 4),
        careerAnalysis: randomFromSeed(almanacData.careerAnalysis, 30),
        wealthAnalysis: randomFromSeed(almanacData.wealthAnalysis, 40),
        loveAnalysis: randomFromSeed(almanacData.loveAnalysis, 50)
    };
}

// 渲染黄历卡片
function renderAlmanacCard(almanac) {
    return `
        <div class="almanac-card">
            <div class="almanac-title">📅 今日黄历</div>
            <div class="almanac-date">${almanac.date} &nbsp;|&nbsp; ${almanac.lunarDate}</div>
            
            <div class="almanac-grid">
                <div class="almanac-box">
                    <div class="almanac-box-label">今日运势</div>
                    <div class="almanac-box-value">${almanac.fortuneLevel}</div>
                </div>
                <div class="almanac-box">
                    <div class="almanac-box-label">财神方位</div>
                    <div class="almanac-box-value">${almanac.wealthDirection}</div>
                </div>
            </div>
            
            <div class="good-bad-section">
                <div class="good-things">
                    <h5>✅ 今日宜</h5>
                    ${almanac.goodActivities.map(item => `<span>${item}</span>`).join('')}
                </div>
                <div class="bad-things">
                    <h5>❌ 今日忌</h5>
                    ${almanac.badActivities.map(item => `<span>${item}</span>`).join('')}
                </div>
            </div>
            
            <div class="almanac-section">
                <h4>🌟 吉时</h4>
                <div class="almanac-lucky-time">
                    ${almanac.luckyTimes.map(time => `<span class="lucky-time-item">${time}</span>`).join('')}
                </div>
            </div>
            
            <div class="almanac-section">
                <h4>🔮 运势分析</h4>
                <div class="almanac-fortune-analysis">
                    <p><strong>💼 事业运：</strong>${almanac.careerAnalysis}</p>
                    <p><strong>💰 财运：</strong>${almanac.wealthAnalysis}</p>
                    <p><strong>💕 感情运：</strong>${almanac.loveAnalysis}</p>
                </div>
            </div>
        </div>
    `;
}

// 检测是否为黄历/算命关键词
function isAlmanacKeyword(message) {
    const keywords = ['黄历', '今日运势', '算命', '八字', '今日宜', '今日忌', '运势', '算卦', '命理'];
    return keywords.some(keyword => message.includes(keyword));
}

// 显示黄历消息
function showAlmanacMessage() {
    const almanac = generateAlmanac();
    const almanacHTML = renderAlmanacCard(almanac);
    
    // 添加到聊天区域
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', 'bot-message');
    messageDiv.innerHTML = `
        <div class="message-avatar">
            <img src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=wise%20old%20man%20with%20green%20hues%2C%20serene%20expression%2C%20mystical%20aura%2C%20soft%20lighting%2C%20digital%20art%20style&image_size=square_hd" alt="绿老头" class="bot-avatar">
        </div>
        <div class="message-content">
            ${almanacHTML}
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 绑定黄历按钮事件
function bindAlmanacButton() {
    const almanacBtn = document.getElementById('almanacBtn');
    if (almanacBtn) {
        almanacBtn.addEventListener('click', () => {
            showAlmanacMessage();
        });
    }
}

// 重写 sendMessage 函数以支持关键词检测
const originalSendMessage = sendMessage;
sendMessage = async function() {
    const message = userInput.value.trim();
    if (message) {
        // 添加用户消息
        addMessage('user', message);
        userInput.value = '';
        
        // 检测是否为黄历关键词
        if (isAlmanacKeyword(message)) {
            // 显示本地生成的黄历
            showAlmanacMessage();
        } else {
            // 正常调用 API
            try {
                const response = await callDeepSeekAPI(message);
                addMessage('bot', response);
            } catch (error) {
                console.error('API Error:', error);
                addMessage('bot', '抱歉，我遇到了一些问题，请稍后再试。');
            }
        }
    }
};

// 更新 API 调用的系统提示词
const originalCallDeepSeekAPI = callDeepSeekAPI;
callDeepSeekAPI = async function(message) {
    const apiKey = 'sk-80fdb8dcd8514e7d9e76e67cf7397a49';
    const systemPrompt = updateSystemPrompt();
    
    // 多种调用方式，确保部署后能正常工作
    const callMethods = [
        // 方式1: 直接调用（GitHub Pages HTTPS 环境应该支持）
        () => fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: message }
                ],
                temperature: 0.7,
                max_tokens: 1500,
                stream: false
            })
        }),
        
        // 方式2: 使用 CORS Anywhere 代理（备选方案）
        () => fetch('https://api.allorigins.win/post?url=' + encodeURIComponent('https://api.deepseek.com/v1/chat/completions'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: message }
                ],
                temperature: 0.7,
                max_tokens: 1500,
                stream: false
            })
        }),
        
        // 方式3: 使用另一个 CORS 代理
        () => fetch('https://corsproxy.io/?' + encodeURIComponent('https://api.deepseek.com/v1/chat/completions'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: message }
                ],
                temperature: 0.7,
                max_tokens: 1500,
                stream: false
            })
        })
    ];
    
    for (let i = 0; i < callMethods.length; i++) {
        try {
            console.log(`尝试调用 DeepSeek API (方式 ${i + 1})...`);
            const response = await callMethods[i]();
            
            if (response.ok) {
                const data = await response.json();
                console.log(`API 调用成功 (方式 ${i + 1})!`);
                return data.choices[0].message.content;
            }
            console.log(`方式 ${i + 1} 失败，HTTP 状态:`, response.status);
        } catch (error) {
            console.log(`方式 ${i + 1} 出错:`, error.message);
            continue;
        }
    }
    
    // 如果所有 API 调用方式都失败，使用智能 fallback
    console.log('所有 API 调用方式失败，使用智能回复');
    return await fallbackResponse(message);
};

// 初始化黄历功能
document.addEventListener('DOMContentLoaded', bindAlmanacButton);
setTimeout(bindAlmanacButton, 200);
