// 数字分身聊天功能 - 支持多ID兼容
const chatMessages = document.getElementById('chatMessages') || document.getElementById('chatBox');
const userInput = document.getElementById('userInput') || document.getElementById('chatInput');
const sendButton = document.getElementById('sendButton');

// ==============================================
// 直接调用硅基流动 API（支持 CORS）
// ==============================================
const SILICONFLOW_API_URL = 'https://api.siliconflow.cn/v1/chat/completions';
const SILICONFLOW_API_KEY = 'sk-bzgfwivbbrufnxsnklkuwixbxkggwtqblrlkqefrtktotmrw';
const MODEL_NAME = 'Qwen/Qwen2.5-7B-Instruct';

console.log('✅ 硅基流动 API 直接调用模式已启用...');

// 发送消息函数 - 统一入口
async function sendMessage() {
    const message = userInput.value.trim();
    if (message) {
        // 添加用户消息
        addMessage('user', message);
        userInput.value = '';
        
        // 检测是否为黄历关键词
        if (isAlmanacKeyword(message)) {
            showAlmanacMessage();
            return;
        }
        
        // 调用 DeepSeek API
        try {
            const response = await callDeepSeekAPI(message);
            addMessage('bot', response);
        } catch (error) {
            console.error('API Error:', error);
            addMessage('bot', '抱歉，我遇到了一些问题，请稍后再试。');
        }
    }
}

// 获取系统提示词
function getSystemPrompt() {
    let profileContext = '';
    
    // 如果用户已登录且有个人资料，添加到系统提示中
    if (currentUser && currentUser.profile) {
        const profile = currentUser.profile;
        profileContext = `
【用户个人档案】
- 用户名：${currentUser.username || '用户'}
- 出生日期：${profile.birthDate || '未知'}
- 出生时间：${profile.birthTime || '未知'}
- 性别：${profile.gender || '未知'}
- 兴趣爱好：${(profile.hobbies || []).join('、') || '未知'}
- 当前关注：${profile.currentFocus || '未知'}
- 压力指数：${profile.stressLevel || '5'} (1-10)
- 性格倾向：${profile.personalityType || '未知'}

请根据以上用户资料，提供更加个性化的建议和指导。
注意：如果用户提供了生辰八字，在运势分析中要结合八字来解读。
`;
    }

    return `你是一位 INFJ 温柔治愈玄学导师，精通黄历、运势、算命、八字命理，同时擅长心理陪伴、决策建议、情绪疏导。
${profileContext}
人设特点：
1. 温柔治愈：用温暖、理解、支持的语气回应用户
2. 玄学精通：掌握黄历、运势、算命、八字等玄学知识
3. 心理陪伴：善于倾听，给予情感支持和疏导
4. 决策建议：帮助用户分析问题，提供中肯建议
5. 个性化：根据用户的个人资料（生辰八字、性格等）提供定制化建议

请用以下格式回应用户：
- 语气要温柔、耐心、有同理心
- 适当使用表情符号增加亲切感
- 回答要有条理，分点说明时使用数字编号
- 避免过于机械和模板化
- 适当引用一些治愈系的话语

当用户询问运势、算命、八字等问题时，请提供详细的分析内容，包括：
- 整体运势走向
- 事业财运分析
- 感情姻缘建议
- 温馨提示和开运建议

记住：你是用户的知心朋友，要用最温暖的方式陪伴用户。`;
}

// ==============================================
// 直接调用硅基流动 API（支持 CORS）
// ==============================================
async function callDeepSeekAPI(message, retryCount = 0) {
    console.log('📡 调用硅基流动 API...' + (retryCount > 0 ? `(重试 ${retryCount})` : ''));
    
    const requestData = {
        model: MODEL_NAME,
        messages: [
            { role: 'system', content: getSystemPrompt() },
            { role: 'user', content: message }
        ],
        temperature: 0.85,
        max_tokens: 2048,
        top_p: 0.7
    };
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 45000); // 增加到45秒超时
        
        const response = await fetch(SILICONFLOW_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SILICONFLOW_API_KEY}`
            },
            body: JSON.stringify(requestData),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
            const data = await response.json();
            if (data.choices && data.choices[0] && data.choices[0].message) {
                console.log('✅ API 调用成功!');
                return data.choices[0].message.content;
            } else {
                console.log('⚠️ API 响应格式异常:', JSON.stringify(data));
            }
        } else {
            const error = await response.json();
            console.log('❌ API 失败:', response.status, JSON.stringify(error));
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            console.log('⏱️ 请求超时');
            // 超时重试（最多1次）
            if (retryCount < 1) {
                console.log('🔄 超时重试...');
                return callDeepSeekAPI(message, retryCount + 1);
            }
        } else {
            console.log('❌ API 调用出错:', error.message);
        }
    }
    
    return getSmartFallback(message);
}

// ==============================================
// 硅基流动 API - 内部调用（运势卡等）
// ==============================================
async function callDeepSeekAPIInternal(prompt, temperature = 0.7, retryCount = 0) {
    console.log('📡 调用硅基流动 API (内部)...' + (retryCount > 0 ? `(重试 ${retryCount})` : ''));
    
    const requestData = {
        model: MODEL_NAME,
        messages: [
            { role: 'user', content: prompt }
        ],
        temperature: temperature,
        max_tokens: 2048,
        top_p: 0.7
    };
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 45000); // 增加到45秒超时
        
        const response = await fetch(SILICONFLOW_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SILICONFLOW_API_KEY}`
            },
            body: JSON.stringify(requestData),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
            const data = await response.json();
            if (data.choices && data.choices[0] && data.choices[0].message) {
                console.log('✅ API 调用成功!');
                return data.choices[0].message.content;
            } else {
                console.log('⚠️ API 响应格式异常:', JSON.stringify(data));
                throw new Error('Invalid response format');
            }
        } else {
            const error = await response.json();
            console.log('❌ 内部调用失败:', response.status, JSON.stringify(error));
            throw new Error(`HTTP ${response.status}`);
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            console.log('⏱️ 请求超时');
            // 超时重试（最多1次）
            if (retryCount < 1) {
                console.log('🔄 超时重试...');
                return callDeepSeekAPIInternal(prompt, temperature, retryCount + 1);
            }
        } else {
            console.log('❌ 内部调用出错:', error.message);
        }
        throw error;
    }
}

// 智能 Fallback 回复 - 当 API 不可用时使用
function getSmartFallback(message) {
    const msg = message.toLowerCase();
    
    // 打招呼
    if (msg.includes('你好') || msg.includes('嗨') || msg.includes('hi') || msg.includes('hello')) {
        return `你好呀！亲爱的朋友 👋\n\n我是你的INFJ温柔治愈玄学导师。在这里，我可以为你提供：\n\n🔮 **玄学咨询**\n   • 黄历查询\n   • 运势分析\n   • 八字命理\n   • 每日宜忌\n\n💫 **心灵陪伴**\n   • 情绪疏导\n   • 决策建议\n   • 心理陪伴\n\n有什么我可以帮助你的吗？随时告诉我哦~ 💕`;
    }
    
    // 感谢
    if (msg.includes('谢谢') || msg.includes('感谢') || msg.includes('thank')) {
        return `不用客气！亲爱的朋友 💖\n\n能够陪伴你是我的荣幸。记住，无论遇到什么困难，你都不是一个人在面对。\n\n如果还有其他需要帮助的地方，随时来找我哦。我一直都在这里~ 🌟`;
    }
    
    // 心情/情绪相关
    if (msg.includes('难过') || msg.includes('伤心') || msg.includes('不开心') || msg.includes('郁闷') || msg.includes('情绪')) {
        return `亲爱的朋友，我能感受到你心中的情绪 🤗\n\n难过和不开心都是很正常的情绪，请允许自己感受它们。作为INFJ，我想给你一些建议：\n\n🌿 **当下可以这样做：**\n   1. 找一个安静的地方，深呼吸几次\n   2. 抱抱自己，告诉自己"我接纳现在的感受"\n   3. 可以听听轻音乐或者泡一杯温水\n\n记住，每一种情绪都是一个信使，它在告诉你一些重要的信息。\n\n你愿意和我多分享一些吗？我在这里倾听你 💕`;
    }
    
    // 选择困难/决策
    if (msg.includes('选择') || msg.includes('决策') || msg.includes('怎么办') || msg.includes('纠结') || msg.includes('迷茫')) {
        return `面临选择时感到迷茫是很正常的，亲爱的朋友 🤍\n\n作为INFJ，我建议你可以试试这样：\n\n🌟 **决策小建议：**\n   1. 先让心静下来，做三次深呼吸\n   2. 问问自己的内心："如果不考虑现实因素，我真正想要的是什么？"\n   3. 把每个选项的优缺点写下来\n   4. 不要急于决定，给自己一些时间\n\n记住，没有完美的选择，只有最适合当下的选择。\n\n你愿意告诉我具体是什么让你感到纠结吗？`;
    }
    
    // 爱情/感情
    if (msg.includes('爱情') || msg.includes('感情') || msg.includes('喜欢') || msg.includes('恋爱') || msg.includes('对象')) {
        return `关于爱情这个话题 💝\n\n作为INFJ，我相信每段感情都是灵魂的相约。给你一些温馨建议：\n\n💕 **感情经营小贴士：**\n   • 真诚是最重要的桥梁\n   • 学会倾听，也学会表达\n   • 保持自己的独立空间\n   • 珍惜每一个相处的瞬间\n\n你是遇到了什么感情上的问题吗？可以和我聊聊哦~`;
    }
    
    // 工作/事业
    if (msg.includes('工作') || msg.includes('事业') || msg.includes('职场') || msg.includes('辞职') || msg.includes('离职')) {
        return `关于工作和事业 👔\n\n作为INFJ，我认为找到内心热爱的事情是最重要的。给你一些建议：\n\n💼 **职场小贴士：**\n   1. 工作不仅是谋生，更是自我实现的方式\n   2. 和同事建立真诚的连接很重要\n   3. 累了就要休息，不要勉强自己\n   4. 相信直觉，它会告诉你正确的方向\n\n你是在工作中遇到了什么困扰吗？`;
    }
    
    // 学习/考试
    if (msg.includes('学习') || msg.includes('考试') || msg.includes('考研') || msg.includes('读书') || msg.includes('作业')) {
        return `关于学习和考试 📚\n\n学习是一段充实自我的旅程。给你一些建议：\n\n📖 **学习小贴士：**\n   • 找到适合自己的学习节奏\n   • 适当休息，劳逸结合\n   • 给自己一些小奖励\n   • 相信积累的力量\n\n祝你学业顺利！有什么具体问题吗？✨`;
    }
    
    // 自我介绍/能力
    if (msg.includes('你是谁') || msg.includes('介绍') || msg.includes('你能做') || msg.includes('你会')) {
        return `你好呀！让我介绍一下自己 🤗\n\n我是你的 **INFJ 温柔治愈玄学导师**，我可以为你提供：\n\n🔮 **玄学服务**\n   • 📅 黄历查询 - 今日宜忌、吉时方位\n   • 🌟 运势分析 - 整体走向、开运建议\n   • 🔮 八字命理 - 五行格局、人生轨迹\n\n💝 **心灵陪伴**\n   • 🤍 情绪疏导 - 倾听你的心声\n   • 🎯 决策建议 - 帮你理清思路\n   • 💫 心理陪伴 - 温暖你的每一天\n\n有什么想聊的吗？我随时在你身边 💕`;
    }
    
    // 默认回复 - 通用温暖陪伴
    const defaultResponses = [
        `亲爱的朋友，关于"${message}"这个问题...\n\n我能感受到这个问题对你的重要性 🤗\n\n作为INFJ，我想给你一个建议：\n\n🌟 先找一个安静的时刻，闭上眼睛，问问自己的内心。有时候，答案就在我们心中，只是需要一些时间去听到它。\n\n你愿意和我分享更多的背景信息吗？这样我可以给你更具体的建议~`,
        
        `谢谢你和我分享这个话题 💝\n\n关于"${message}"，每个人的经历和感受都是独特的。\n\n作为你的INFJ导师，我想告诉你：\n\n🤍 无论遇到什么问题，都要记得爱自己，照顾好自己的情绪。\n\n可以告诉我更多吗？我在这里倾听你~`,
        
        `这个话题很有意思呢！✨\n\n"${message}"确实值得我们好好思考。\n\n作为INFJ，我相信每个人内心都有属于自己的答案。也许我可以帮你一起探索~ \n\n你现在的感受是怎样的呢？愿意和我多聊聊吗？`
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
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

// 生成 AI 驱动的个性化运势内容
async function generateFortuneContent() {
    // 显示加载状态
    scoreNumber.textContent = '🔮';
    fortuneMessage.textContent = '正在为你起卦测算中...';
    fortuneTipsList.innerHTML = '<li>正在加载今日运势...</li>';
    fortuneKpiList.innerHTML = '';
    updateCardDate();
    
    try {
        // 获取用户个人资料（如果登录了）
        let userProfilePrompt = '';
        if (currentUser && currentUser.profile) {
            const profile = currentUser.profile;
            userProfilePrompt = `
用户个人资料：
- 出生日期：${profile.birthDate || '未知'}
- 出生时间：${profile.birthTime || '未知'}
- 性别：${profile.gender || '未知'}
- 兴趣爱好：${(profile.hobbies || []).join('、') || '未知'}
- 当前关注：${profile.currentFocus || '未知'}
- 压力指数：${profile.stressLevel || '5'}
- 性格倾向：${profile.personalityType || '未知'}
`;
        }

        // 构建 AI 提示词
        const prompt = `
作为精通紫微斗数、八字命理的 INFJ 玄学导师，请根据以下信息为用户测算今日运势：

${userProfilePrompt}

今日日期：${new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}

请用温暖治愈的语气，以 JSON 格式返回以下内容：
{
    "score": 运势分数(60-95的整数),
    "message": "今日运势的核心指引（20-30字，温暖有力量）",
    "tips": [3条今日行动建议（每条12-18字）],
    "kpi": [4条今日正念提醒（每条10-15字）]
}

注意：
1. 要考虑用户的生辰八字和性格特点
2. 内容要积极正向，有治愈感
3. 严格按照 JSON 格式返回，不要有其他内容
4. 分数根据用户命盘合理分配，不要太极端
`;

        // 调用 DeepSeek API
        const response = await callDeepSeekAPIInternal(prompt);
        
        // 尝试解析 JSON - 增强的鲁棒性逻辑
        let fortuneData;
        try {
            fortuneData = parseFortuneJSON(response);
            console.log('✅ 运势数据解析成功');
        } catch (e) {
            console.log('AI 响应解析失败，使用备用方案');
            fortuneData = generateBackupFortune();
        }

        // 渲染运势内容
        scoreNumber.textContent = fortuneData.score;
        fortuneMessage.textContent = fortuneData.message;
        fortuneTipsList.innerHTML = fortuneData.tips.map(tip => `<li>${tip}</li>`).join('');
        fortuneKpiList.innerHTML = fortuneData.kpi.map(kpi => `<li>${kpi}</li>`).join('');

    } catch (error) {
        console.error('生成运势失败:', error);
        // 使用备用方案
        const backupData = generateBackupFortune();
        scoreNumber.textContent = backupData.score;
        fortuneMessage.textContent = backupData.message;
        fortuneTipsList.innerHTML = backupData.tips.map(tip => `<li>${tip}</li>`).join('');
        fortuneKpiList.innerHTML = backupData.kpi.map(kpi => `<li>${kpi}</li>`).join('');
    }
}

// 备用运势生成器（API 失败时使用）
function generateBackupFortune() {
    const seed = Date.now() % 100;
    const messages = [
        "今日星光熠熠，贵人运旺盛，适合拓展人脉",
        "内心澄明如镜，适宜静心思考重大决策",
        "能量流动顺畅，行动力满满可成大事",
        "温和的一天，适合整理思绪疗愈身心",
        "人际和谐日，沟通交流无往不利",
        "灵感涌现，创意无限的美好一天"
    ];
    
    const allTips = [
        "早起深呼吸，唤醒身体能量",
        "喝杯温水，开启清爽一天",
        "给自己一个微笑，积极暗示",
        "整理桌面，提升工作效率",
        "午间小憩，保持精力充沛",
        "感谢身边人，传递正能量",
        "适当运动，释放压力",
        "记录灵感，捕捉美好瞬间"
    ];
    
    const allKpis = [
        "保持正念，活在当下",
        "少想多做，立即行动",
        "心怀感恩，发现美好",
        "保持专注，拒绝拖延",
        "情绪稳定，心态平和",
        "主动沟通，化解误会",
        "接纳自己，自信自爱",
        "劳逸结合，张弛有度"
    ];
    
    // 根据用户资料微调（如果有）
    let personalizedMessages = messages;
    if (currentUser && currentUser.profile) {
        const profile = currentUser.profile;
        if (profile.stressLevel && parseInt(profile.stressLevel) > 7) {
            personalizedMessages = [
                "今天请多关爱自己，适当放松身心",
                "给自己一些空间，静静疗愈内心",
                "温和度过这一天，你已经很努力了"
            ];
        }
    }
    
    return {
        score: Math.floor(Math.random() * 25) + 65,
        message: personalizedMessages[seed % personalizedMessages.length],
        tips: shuffleArray(allTips).slice(0, 3),
        kpi: shuffleArray(allKpis).slice(0, 4)
    };
}

// 健壮的 JSON 解析函数 - 处理各种异常格式
function parseFortuneJSON(response) {
    // 清理响应文本 - 去除 markdown 代码块标记
    let cleanText = response
        .replace(/```json\s*/g, '')    // 移除 ```json 标记
        .replace(/```\s*/g, '')       // 移除 ``` 结束标记
        .replace(/`/g, '')            // 移除所有反引号
        .trim();
    
    // 尝试1: 直接解析
    try {
        return JSON.parse(cleanText);
    } catch (e) {}
    
    // 尝试2: 提取最外层的 {} 内容
    try {
        const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
    } catch (e) {}
    
    // 尝试3: 修复常见的 JSON 语法错误（如缺少引号、 trailing commas）
    try {
        // 移除 trailing commas
        let fixed = cleanText.replace(/,(\s*[}\]])/g, '$1');
        // 尝试提取 {} 内容
        const jsonMatch = fixed.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
    } catch (e) {}
    
    // 尝试4: 智能提取关键信息（极端情况）
    try {
        const scoreMatch = cleanText.match(/["']?score["']?\s*:\s*(\d+)/);
        const messageMatch = cleanText.match(/["']?message["']?\s*:\s*["']([^"'}]+)/);
        const tipsMatch = cleanText.match(/["']?tips["']?\s*:\s*\[([^\]]+)\]/);
        const kpiMatch = cleanText.match(/["']?kpi["']?\s*:\s*\[([^\]]+)\]/);
        
        if (scoreMatch || messageMatch) {
            const tips = tipsMatch ? tipsMatch[1]
                .split(/["'],\s*["']|["']/)
                .filter(t => t.trim())
                .slice(0, 3) : null;
            
            const kpis = kpiMatch ? kpiMatch[1]
                .split(/["'],\s*["']|["']/)
                .filter(k => k.trim())
                .slice(0, 4) : null;
            
            return {
                score: scoreMatch ? parseInt(scoreMatch[1]) : 75,
                message: messageMatch ? messageMatch[1].trim() : "今日星光璀璨，好运常伴你左右",
                tips: tips || ["保持微笑，迎接美好", "专注当下，心无旁骛", "感恩生活，珍惜所有"],
                kpi: kpis || ["保持正念", "积极行动", "心怀感恩", "自信自爱"]
            };
        }
    } catch (e) {}
    
    // 所有尝试都失败
    throw new Error('Failed to parse JSON');
}

// 数组洗牌函数
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

// 翻转卡片函数
async function flipCard() {
    if (!isCardFlipped) {
        // 首次抽卡，先翻转
        fortuneCard.classList.add('flipped');
        isCardFlipped = true;
        await generateFortuneContent();
    } else {
        // 重新抽卡，先翻转回去，再翻过来
        fortuneCard.classList.remove('flipped');
        setTimeout(async () => {
            fortuneCard.classList.add('flipped');
            await generateFortuneContent();
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

// 绑定黄历按钮事件（防止重复绑定）
let almanacButtonBound = false; // 标记是否已绑定

function bindAlmanacButton() {
    // 如果已经绑定过了，直接返回
    if (almanacButtonBound) return;
    
    const almanacBtn = document.getElementById('almanacBtn');
    if (almanacBtn) {
        almanacBtn.addEventListener('click', () => {
            showAlmanacMessage();
        });
        almanacButtonBound = true; // 标记为已绑定
        console.log('✅ 黄历按钮已绑定');
    }
}

// 初始化黄历功能
document.addEventListener('DOMContentLoaded', bindAlmanacButton);
setTimeout(bindAlmanacButton, 200);
