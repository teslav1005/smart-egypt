const appData = {
    chat: {
        title: "استوديو المحادثة",
        icon: "fa-regular fa-comment-dots",
        placeholder: "اسأل أو اكتب ما تريد هنا...",
        models: {
            "DeepSeek V4 Pro": { desc: "أقوى محرك للتحليل والمنطق" },
            "Moonshot Kimi": { desc: "متخصص في الأكواد والبرمجة" },
            "Gemini 3.5 Flash": { desc: "بحث وتوليد سريع" }
        }
    },
    image: {
        title: "استوديو الصور",
        icon: "fa-regular fa-images",
        placeholder: "اكتب وصف الصورة بدقة هنا...",
        models: {
            "Nano Banana 2": { desc: "واقعية مذهلة وجودة 2K", ratios: ["1:1", "16:9", "9:16", "4:3"], counts: ["1x", "2x", "3x", "4x"] },
            "GPT Image 2": { desc: "قوة خارقة في النصوص والتفاصيل", ratios: ["1:1", "16:9", "9:16"], counts: ["1x", "2x"] }
        }
    },
    video: {
        title: "استوديو الفيديو",
        icon: "fa-solid fa-clapperboard",
        placeholder: "اكتب وصف المشهد السينمائي...",
        models: {
            "Veo 3.1": { desc: "واقعية مذهلة وحركية عالية", ratios: ["16:9", "9:16"], durations: [4, 8], extendable: true },
            "LTX 2.3": { desc: "دقة تحكم سينمائي", ratios: ["16:9", "1:1"], durations: [5, 10, 15], extendable: true }
        }
    }
};

let chatHistoryData = [
    { id: 1, title: "تصميم موقع إلكتروني", pinned: true, locked: false, pin: null },
    { id: 2, title: "تحليل بيانات السوق لعام 2026", pinned: false, locked: true, pin: "1234" }
];
let activeActionChatId = null;
let currentChatId = null; 

let currentMode = "chat";
let activeModelsList = appData.chat.models;
let currentModel = "DeepSeek V4 Pro";
let currentRatio = "16:9";
let currentGenSetting = null;
let isExtended = false;
let currentImages = {}; 
let activeUploadSlot = null;
let chatAttachedImages = [];

const promptInput = document.getElementById('promptInput');
const sendBtn = document.getElementById('sendBtn');
const welcomeSection = document.getElementById('welcomeSection');
const inspirationSection = document.getElementById('inspirationSection');
const chatSection = document.getElementById('chatSection');
const dynamicActionBtn = document.getElementById('dynamicActionBtn');
const dynamicActionIcon = document.getElementById('dynamicActionIcon');
const optionsArea = document.getElementById('optionsArea');
const chatAttachmentPreviewArea = document.getElementById('chatAttachmentPreviewArea');
const generativeOptionsSection = document.getElementById('generativeOptionsSection');
const chatModelSelectorTrigger = document.getElementById('chatModelSelectorTrigger');

// --- Sidebar Chat Logic ---
function renderChatHistory() {
    const container = document.getElementById('chatHistoryContainer');
    if(!container) return;
    container.innerHTML = '';
    const sortedChats = [...chatHistoryData].sort((a, b) => (b.pinned === a.pinned) ? 0 : a.pinned ? -1 : 1);

    sortedChats.forEach(chat => {
        const displayTitle = chat.locked ? '***** 🔒' : chat.title;
        const pinIconHtml = chat.pinned ? '<i class="fa-solid fa-thumbtack text-blue-400 text-[10px] ml-1"></i>' : '';
        const lockIconHtml = chat.locked ? '<i class="fa-solid fa-lock text-red-500 text-[10px] ml-1"></i>' : '';
        const isActiveClass = currentChatId === chat.id ? 'bg-white/10 border border-white/10' : '';

        const chatEl = document.createElement('div');
        chatEl.className = `group relative flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 cursor-pointer transition ${isActiveClass}`;
        chatEl.innerHTML = `
            <div class="flex items-center gap-2 overflow-hidden flex-1" onclick="handleChatClick(${chat.id})">
                <i class="fa-regular fa-message ${currentChatId === chat.id ? 'text-white' : 'text-gray-500'} text-xs flex-shrink-0"></i>
                <span class="text-xs ${currentChatId === chat.id ? 'text-white font-bold' : 'text-gray-300 font-medium'} truncate">${pinIconHtml}${lockIconHtml}${displayTitle}</span>
            </div>
            <button onclick="toggleChatMenu(event, ${chat.id})" class="text-gray-500 hover:text-white px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition focus:opacity-100"><i class="fa-solid fa-ellipsis-vertical text-xs"></i></button>
            <div id="chatMenu-${chat.id}" class="chat-action-menu">
                <button onclick="togglePinChat(event, ${chat.id})" class="text-right px-3 py-2 text-[11px] text-gray-300 hover:bg-white/10 flex items-center gap-2"><i class="fa-solid fa-thumbtack w-3"></i> ${chat.pinned ? 'إلغاء التثبيت' : 'تثبيت المحادثة'}</button>
                <button onclick="openRenameModal(event, ${chat.id})" class="text-right px-3 py-2 text-[11px] text-gray-300 hover:bg-white/10 flex items-center gap-2" ${chat.locked ? 'disabled style="opacity:0.5"' : ''}><i class="fa-solid fa-pen w-3"></i> تعديل الاسم</button>
                <button onclick="openLockModal(event, ${chat.id})" class="text-right px-3 py-2 text-[11px] text-red-400 hover:bg-white/10 flex items-center gap-2"><i class="fa-solid ${chat.locked ? 'fa-unlock' : 'fa-lock'} w-3"></i> ${chat.locked ? 'إلغاء القفل' : 'غلق المحادثة'}</button>
                <div class="h-px bg-white/10 w-full my-0.5"></div>
                <button onclick="deleteChat(event, ${chat.id})" class="text-right px-3 py-2 text-[11px] text-red-500 hover:bg-white/10 flex items-center gap-2"><i class="fa-solid fa-trash w-3"></i> حذف المحادثة</button>
            </div>`;
        container.appendChild(chatEl);
    });
}

function closeAllChatMenus() { document.querySelectorAll('.chat-action-menu').forEach(m => m.classList.remove('active')); }
window.toggleChatMenu = function(e, id) { e.stopPropagation(); closeAllChatMenus(); document.getElementById(`chatMenu-${id}`).classList.add('active'); };
document.addEventListener('click', closeAllChatMenus);

window.handleChatClick = function(id) {
    const chat = chatHistoryData.find(c => c.id === id);
    if (chat.locked) {
        activeActionChatId = id;
        document.getElementById('unlockPinInput').value = '';
        openCenterModal('unlockChatModal');
    } else {
        currentChatId = id;
        renderChatHistory();
        chatSection.innerHTML = `<div class="text-center text-xs text-gray-500 py-6 font-bold bg-zinc-900/50 rounded-xl mx-2 border border-white/5">تم فتح المحادثة المحددة</div>`;
        setMode('chat');
        toggleSidebar();
    }
};

window.togglePinChat = function(e, id) { e.stopPropagation(); const chat = chatHistoryData.find(c => c.id === id); chat.pinned = !chat.pinned; closeAllChatMenus(); renderChatHistory(); };
window.deleteChat = function(e, id) { e.stopPropagation(); chatHistoryData = chatHistoryData.filter(c => c.id !== id); if(currentChatId === id) document.getElementById('sidebarNewChatBtn').click(); closeAllChatMenus(); renderChatHistory(); };
window.openRenameModal = function(e, id) { e.stopPropagation(); closeAllChatMenus(); const chat = chatHistoryData.find(c => c.id === id); if(chat.locked) return; activeActionChatId = id; document.getElementById('renameChatInput').value = chat.title; openCenterModal('renameChatModal'); };
window.saveChatRename = function() { const newTitle = document.getElementById('renameChatInput').value.trim(); if(newTitle && activeActionChatId) { chatHistoryData.find(c => c.id === activeActionChatId).title = newTitle; renderChatHistory(); } closeCenterModal('renameChatModal'); };
window.openLockModal = function(e, id) { e.stopPropagation(); closeAllChatMenus(); const chat = chatHistoryData.find(c => c.id === id); activeActionChatId = id; if (chat.locked) { chat.locked = false; chat.pin = null; renderChatHistory(); } else { document.getElementById('setPinInput').value = ''; openCenterModal('setLockModal'); } };
window.saveChatLock = function() { const pin = document.getElementById('setPinInput').value; if(pin.length === 4 && activeActionChatId) { const chat = chatHistoryData.find(c => c.id === activeActionChatId); chat.locked = true; chat.pin = pin; renderChatHistory(); closeCenterModal('setLockModal'); } };
window.verifyChatUnlock = function() { const pin = document.getElementById('unlockPinInput').value; if(activeActionChatId) { const chat = chatHistoryData.find(c => c.id === activeActionChatId); if (chat.pin === pin) { closeCenterModal('unlockChatModal'); setTimeout(() => { currentChatId = chat.id; renderChatHistory(); setMode('chat'); chatSection.innerHTML = `<div class="text-center text-xs text-green-500 py-6 font-bold bg-green-500/10 rounded-xl mx-2 border border-green-500/20"><i class="fa-solid fa-unlock ml-1"></i> تم فتح المحادثة المغلقة بنجاح</div>`; toggleSidebar(); }, 300); } } };

// --- Mode Switching ---
document.getElementById('modeSelectorTrigger').addEventListener('click', () => { document.getElementById('modeSelectModal').classList.add('active'); });
document.querySelectorAll('.mode-option').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.mode-option').forEach(b => b.className = 'mode-option w-full p-4 rounded-xl flex items-center gap-4 transition-all bg-zinc-900 text-white border border-white/5 hover:bg-zinc-800');
        this.className = 'mode-option w-full p-4 rounded-xl flex items-center gap-4 transition-all bg-white text-black font-bold shadow-lg';
        setMode(this.getAttribute('data-mode'));
        document.getElementById('modeSelectModal').classList.remove('active');
    });
});

function setMode(mode) {
    currentMode = mode;
    const config = appData[mode];
    document.getElementById('currentModeText').innerText = config.title;
    document.getElementById('currentModeIcon').className = config.icon + " text-[11px]";
    
    if(!currentChatId) chatSection.innerHTML = '';
    if(chatSection.innerHTML === '') chatSection.classList.add('hidden');
    else chatSection.classList.remove('hidden');

    promptInput.value = '';
    promptInput.style.height = 'auto';
    validateSendButton();
    
    activeModelsList = config.models;
    currentModel = Object.keys(activeModelsList)[0];
    
    if(mode === 'chat') {
        if(!currentChatId) { welcomeSection.classList.remove('hidden'); inspirationSection.classList.add('hidden'); }
        else { welcomeSection.classList.add('hidden'); inspirationSection.classList.add('hidden'); }
        
        document.getElementById('welcomeModelDisplay').innerText = currentModel;
        chatModelSelectorTrigger.classList.remove('hidden');
        document.getElementById('chatModelText').innerText = currentModel;
        generativeOptionsSection.classList.add('hidden');
        dynamicActionIcon.className = "fa-solid fa-paperclip text-base";
        optionsArea.classList.add('collapsed');
        promptInput.placeholder = config.placeholder;
        
        chatAttachedImages = [];
        renderChatPreviews();
        chatModelSelectorTrigger.onclick = () => { activeModelsList = appData.chat.models; renderModelSelectModal(true); };
    } else {
        if(!currentChatId) { welcomeSection.classList.add('hidden'); inspirationSection.classList.remove('hidden'); }
        else { welcomeSection.classList.add('hidden'); inspirationSection.classList.add('hidden'); }
        
        chatModelSelectorTrigger.classList.add('hidden');
        generativeOptionsSection.classList.remove('hidden');
        dynamicActionIcon.className = "fa-solid fa-sliders text-base";
        promptInput.placeholder = config.placeholder;
        chatAttachmentPreviewArea.classList.add('hidden');
        
        currentImages = {}; 
        updateGenUI();
        document.getElementById('openModelSelect').onclick = () => { activeModelsList = appData[currentMode].models; renderModelSelectModal(false); };
    }
}

dynamicActionBtn.addEventListener('click', () => {
    if(currentMode === 'chat') document.getElementById('hiddenChatFileInput').click();
    else { optionsArea.classList.toggle('collapsed'); if(!optionsArea.classList.contains('collapsed')) promptInput.blur(); }
});
promptInput.addEventListener('focus', () => optionsArea.classList.add('collapsed'));
document.getElementById('closeOptionsBtn').addEventListener('click', () => optionsArea.classList.add('collapsed'));

function renderModelSelectModal(isChat) {
    const list = document.getElementById('modelsList');
    list.innerHTML = '';
    Object.keys(activeModelsList).forEach(modelName => {
        const data = activeModelsList[modelName];
        const isActive = modelName === currentModel;
        const btn = document.createElement('button');
        btn.className = `w-full text-right p-3.5 rounded-xl transition-all flex justify-between items-center ${isActive ? 'bg-white text-black font-bold shadow-md' : 'bg-transparent border border-white/10 text-white hover:bg-white/5'}`;
        btn.innerHTML = `<div><div class="text-sm font-bold flex items-center gap-1.5">${modelName}</div><div class="text-[10px] ${isActive ? 'text-gray-700' : 'text-gray-400'} mt-1 font-medium">${data.desc}</div></div>${isActive ? '<i class="fa-solid fa-check text-black text-sm"></i>' : ''}`;
        btn.onclick = () => { currentModel = modelName; if(isChat) { document.getElementById('chatModelText').innerText = modelName; document.getElementById('welcomeModelDisplay').innerText = modelName; } else { currentImages = {}; updateGenUI(); } document.getElementById('modelSelectModal').classList.remove('active'); };
        list.appendChild(btn);
    });
    document.getElementById('modelSelectModal').classList.add('active'); 
}

function updateGenUI() {
    const modelData = activeModelsList[currentModel];
    document.getElementById('selectedModelLabel').innerText = currentModel;
    
    const ratioContainer = document.getElementById('ratioContainer');
    ratioContainer.innerHTML = '';
    if(!modelData.ratios.includes(currentRatio)) currentRatio = modelData.ratios[0];
    modelData.ratios.forEach(ratio => {
        const btn = document.createElement('button');
        btn.className = `px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${ratio === currentRatio ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:bg-gray-800'}`;
        btn.innerHTML = `<span dir="ltr">${ratio}</span>`;
        btn.onclick = () => { currentRatio = ratio; updateGenUI(); };
        ratioContainer.appendChild(btn);
    });

    const settingsContainer = document.getElementById('dynamicSettingsContainer');
    settingsContainer.innerHTML = '';
    
    if(currentMode === 'image') {
        document.getElementById('dynamicSettingsTitle').innerHTML = '<i class="fa-regular fa-images ml-1"></i> عدد الصور (النتائج)';
        document.getElementById('extendContainer').classList.add('hidden');
        if(!modelData.counts.includes(currentGenSetting)) currentGenSetting = modelData.counts[0];
        modelData.counts.forEach(count => {
            const btn = document.createElement('button');
            btn.className = `flex-1 py-2 rounded-xl text-xs font-bold border border-white/10 transition-all ${count === currentGenSetting ? 'bg-white text-black shadow-sm' : 'bg-transparent text-gray-400 hover:bg-white/5'}`;
            btn.innerText = count;
            btn.onclick = () => { currentGenSetting = count; updateGenUI(); };
            settingsContainer.appendChild(btn);
        });
    } else if(currentMode === 'video') {
        document.getElementById('dynamicSettingsTitle').innerHTML = '<i class="fa-regular fa-clock ml-1"></i> مدة التوليد';
        if(!modelData.durations.includes(currentGenSetting)) currentGenSetting = modelData.durations[0];
        modelData.durations.forEach(dur => {
            const btn = document.createElement('button');
            btn.className = `flex-1 py-2 rounded-xl text-xs font-bold border border-white/10 transition-all ${dur === currentGenSetting ? 'bg-white text-black shadow-sm' : 'bg-transparent text-gray-400 hover:bg-white/5'}`;
            btn.innerText = `${dur} ثواني`;
            btn.onclick = () => { currentGenSetting = dur; updateGenUI(); };
            settingsContainer.appendChild(btn);
        });
        document.getElementById('extendContainer').classList.toggle('hidden', !modelData.extendable);
    }
    renderGenSlots();
}

function renderGenSlots() {
    const slotsContainer = document.getElementById('imageSlotsContainer');
    if(!slotsContainer) return;
    slotsContainer.innerHTML = '';
    slotsContainer.className = "flex gap-2 overflow-x-auto no-scrollbar pb-1"; 
    
    for(let i=0; i<2; i++) {
        const slot = document.createElement('div');
        const hasImg = !!currentImages[i];
        slot.className = `image-slot ${hasImg ? 'has-image' : ''}`;
        if(hasImg) slot.style.backgroundImage = `url(${currentImages[i]})`;
        slot.innerHTML = hasImg ? '' : '<i class="fa-solid fa-plus text-gray-500 text-xs"></i>';
        slot.onclick = () => { if(hasImg) { delete currentImages[i]; updateGenUI(); } else { activeUploadSlot = i; document.getElementById('hiddenGenFileInput').click(); } };
        slotsContainer.appendChild(slot);
    }
}

window.toggleExtend = function() { isExtended = !isExtended; document.getElementById('extendSwitch').classList.toggle('active', isExtended); };

// File Inputs
document.getElementById('hiddenChatFileInput').addEventListener('change', function(e) {
    if(e.target.files.length > 0) { Array.from(e.target.files).forEach(file => { const r = new FileReader(); r.onload = (ev) => { chatAttachedImages.push(ev.target.result); renderChatPreviews(); }; r.readAsDataURL(file); }); }
    this.value = '';
});
document.getElementById('hiddenGenFileInput').addEventListener('change', function(e) {
    if(e.target.files[0]) { const r = new FileReader(); r.onload = (ev) => { currentImages[activeUploadSlot] = ev.target.result; updateGenUI(); }; r.readAsDataURL(e.target.files[0]); }
    this.value = '';
});

function renderChatPreviews() {
    if(chatAttachedImages.length === 0) { chatAttachmentPreviewArea.classList.add('hidden'); chatAttachmentPreviewArea.innerHTML = ''; validateSendButton(); return; }
    chatAttachmentPreviewArea.classList.remove('hidden'); chatAttachmentPreviewArea.innerHTML = '';
    chatAttachedImages.forEach((imgData, idx) => {
        const slot = document.createElement('div'); slot.className = 'preview-slot'; slot.style.backgroundImage = `url(${imgData})`;
        const delBtn = document.createElement('button'); delBtn.className = 'absolute -top-1 -left-1 bg-black text-white w-4 h-4 rounded-full flex items-center justify-center border border-white/20 text-[8px] hover:bg-red-500 transition'; delBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
        delBtn.onclick = (e) => { e.stopPropagation(); chatAttachedImages.splice(idx, 1); renderChatPreviews(); };
        slot.appendChild(delBtn); chatAttachmentPreviewArea.appendChild(slot);
    });
    validateSendButton();
}

// Sidebar
const appSidebar = document.getElementById('appSidebar'); const sidebarOverlay = document.getElementById('sidebarOverlay');
function toggleSidebar() { const isClosed = appSidebar.classList.contains('translate-x-full'); if(isClosed) { appSidebar.classList.remove('translate-x-full'); sidebarOverlay.classList.remove('hidden'); setTimeout(() => sidebarOverlay.classList.remove('opacity-0'), 10); } else { appSidebar.classList.add('translate-x-full'); sidebarOverlay.classList.add('opacity-0'); setTimeout(() => sidebarOverlay.classList.add('hidden'), 300); document.getElementById('profilePopover').classList.add('hidden'); closeAllChatMenus(); } }
document.getElementById('menuBtn').addEventListener('click', toggleSidebar); sidebarOverlay.addEventListener('click', toggleSidebar);

document.getElementById('sidebarNewChatBtn').addEventListener('click', () => {
    currentChatId = null; 
    chatSection.innerHTML = ''; 
    setMode(currentMode);
    renderChatHistory(); 
    toggleSidebar();
});

document.getElementById('profileMenuBtn').addEventListener('click', (e) => { e.stopPropagation(); document.getElementById('profilePopover').classList.toggle('hidden'); document.getElementById('profilePopover').classList.toggle('flex'); });
document.addEventListener('click', (e) => { if(!document.getElementById('profileMenuBtn').contains(e.target) && !document.getElementById('profilePopover').contains(e.target)) { document.getElementById('profilePopover').classList.add('hidden'); document.getElementById('profilePopover').classList.remove('flex'); } });
document.querySelectorAll('.modal-close-trigger').forEach(t => t.addEventListener('click', function() { this.closest('.modal-overlay').classList.remove('active'); }));

window.openCenterModal = function(id) { const m = document.getElementById(id); m.classList.add('active'); m.classList.remove('pointer-events-none', 'opacity-0'); const c = m.querySelector('.center-modal-content'); if(c) { setTimeout(() => { c.classList.remove('scale-95'); c.classList.add('scale-100'); }, 10); } };
window.closeCenterModal = function(id) { const m = document.getElementById(id); const c = m.querySelector('.center-modal-content'); if(c) { c.classList.remove('scale-100'); c.classList.add('scale-95'); } setTimeout(() => { m.classList.remove('active'); m.classList.add('pointer-events-none', 'opacity-0'); }, 250); };

// Toggles
document.getElementById('themeToggleBtnSidebar').addEventListener('click', () => { document.body.classList.toggle('light-mode'); const i = document.querySelector('#themeToggleBtnSidebar i'); i.className = document.body.classList.contains('light-mode') ? 'fa-solid fa-sun text-xs text-yellow-500' : 'fa-solid fa-moon text-xs text-gray-300'; });
let isEnglish = true; document.getElementById('langToggleBtnSidebar').addEventListener('click', (e) => { isEnglish = !isEnglish; document.querySelector('#langToggleBtnSidebar span:first-child').innerText = isEnglish ? "EN" : "AR"; });

// Input Logic
promptInput.addEventListener('input', function() { this.style.height = 'auto'; this.style.height = (this.scrollHeight) + 'px'; validateSendButton(); });
function validateSendButton() { const hT = promptInput.value.trim().length > 0; const hM = currentMode === 'chat' && chatAttachedImages.length > 0; if (hT || hM) { sendBtn.classList.remove('opacity-40', 'pointer-events-none'); sendBtn.classList.add('bg-white', 'text-black'); } else { sendBtn.classList.add('opacity-40', 'pointer-events-none'); sendBtn.classList.remove('bg-white', 'text-black'); } }
function getAspectString(ratio) { if (ratio === "1:1") return "1/1"; if (ratio === "16:9") return "16/9"; if (ratio === "9:16") return "9/16"; if (ratio === "4:3") return "4/3"; return "16/9"; }

// Media Viewer Logic
let currentDownloadUrl = null;
window.openMediaViewer = function(url, type) {
    const modal = document.getElementById('mediaViewerModal');
    const img = document.getElementById('mediaViewerImage');
    const vid = document.getElementById('mediaViewerVideo');
    currentDownloadUrl = url;
    
    img.classList.add('hidden'); vid.classList.add('hidden');
    if(type === 'image') { img.src = url; img.classList.remove('hidden'); } 
    else if(type === 'video') { vid.src = url; vid.classList.remove('hidden'); vid.play().catch(e=>{}); }
    
    modal.classList.add('active');
};
window.closeMediaViewer = function() {
    document.getElementById('mediaViewerModal').classList.remove('active');
    document.getElementById('mediaViewerVideo').pause();
};
window.downloadCurrentMedia = function() {
    if(currentDownloadUrl) {
        const a = document.createElement('a');
        a.href = currentDownloadUrl;
        a.download = `SmartEgypt_${Date.now()}`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
    }
};

sendBtn.addEventListener('click', async () => {
    const text = promptInput.value.trim();
    if(text === '' && (currentMode !== 'chat' || chatAttachedImages.length === 0)) return;

    // الربط مع نظام الحماية الجديد
    if (window.AppAPI) {
        await window.AppAPI.secureRequest('SEND_PROMPT', { text, mode: currentMode });
    }

    // Save new chat if not existing
    if(!currentChatId) {
        currentChatId = Date.now();
        let titleText = text ? text.substring(0, 25) + (text.length > 25 ? '...' : '') : "محادثة وسائط جديدة";
        chatHistoryData.unshift({ id: currentChatId, title: titleText, pinned: false, locked: false, pin: null });
        renderChatHistory();
    }

    welcomeSection.classList.add('hidden');
    inspirationSection.classList.add('hidden');
    chatSection.classList.remove('hidden');
    optionsArea.classList.add('collapsed');

    let userBubbleHtml = `
        <div class="flex items-start gap-2 justify-start w-full">
            <div class="bg-zinc-800 text-gray-100 p-3.5 rounded-2xl rounded-tr-none text-sm max-w-[85%] leading-relaxed space-y-2 relative font-medium">
                <div class="text-[11px] text-gray-400 mb-1 flex items-center gap-1 font-bold"><i class="fa-regular fa-user"></i> أنت</div>`;
    
    if(currentMode === 'chat' && chatAttachedImages.length > 0) {
        userBubbleHtml += `<div class="flex gap-2 flex-wrap">`;
        chatAttachedImages.forEach(img => { userBubbleHtml += `<img src="${img}" onclick="openMediaViewer('${img}', 'image')" class="max-w-[120px] rounded-lg border border-white/10 block shadow-sm cursor-pointer hover:opacity-80 transition">`; });
        userBubbleHtml += `</div>`;
    } else if (currentMode !== 'chat' && (currentImages[0] || currentImages[1])) {
         userBubbleHtml += `<div class="flex gap-2 flex-wrap">`;
         if(currentImages[0]) userBubbleHtml += `<img src="${currentImages[0]}" onclick="openMediaViewer('${currentImages[0]}', 'image')" class="max-w-[80px] rounded-lg border border-white/10 block shadow-sm cursor-pointer hover:opacity-80 transition">`;
         if(currentImages[1]) userBubbleHtml += `<img src="${currentImages[1]}" onclick="openMediaViewer('${currentImages[1]}', 'image')" class="max-w-[80px] rounded-lg border border-white/10 block shadow-sm cursor-pointer hover:opacity-80 transition">`;
         userBubbleHtml += `</div>`;
    }

    if(text !== '') userBubbleHtml += `<p class="break-words">${text}</p>`;
    userBubbleHtml += `</div></div>`;
    chatSection.innerHTML += userBubbleHtml;

    promptInput.value = ''; promptInput.style.height = 'auto';
    if(currentMode === 'chat') { chatAttachedImages = []; renderChatPreviews(); }
    validateSendButton();
    document.getElementById('workspaceArea').scrollTop = document.getElementById('workspaceArea').scrollHeight;

    const loaderId = 'loader_' + Date.now();
    let botLabel = currentMode === 'chat' ? `مصر الذكية (${currentModel})` : `مصر الذكية Pro (${currentModel})`;
    let processingText = currentMode === 'chat' ? 'جاري المعالجة...' : (currentMode === 'image' ? 'جاري التوليد...' : 'جاري إنتاج المشهد...');
    
    let botBubbleHtml = `
        <div class="flex items-start gap-2 justify-end mt-4 w-full" id="${loaderId}">
            <div class="bg-zinc-900 border border-white/5 p-4 rounded-2xl rounded-tl-none text-sm max-w-[90%] w-full space-y-3 font-medium">
                <div class="text-[11px] text-white mb-1 flex items-center gap-1 font-bold"><i class="fa-solid fa-wand-magic-sparkles text-blue-400"></i> ${botLabel}</div>`;
    
    if(currentMode === 'chat') {
        botBubbleHtml += `<div class="flex items-center gap-2 text-gray-400"><i class="fa-solid fa-spinner fa-spin text-base"></i> <span class="text-xs">${processingText}</span></div>`;
    } else {
        botBubbleHtml += `
            <div class="w-full rounded-xl bg-black border border-white/10 overflow-hidden flex flex-col items-center justify-center p-4 text-center relative shadow-inner" style="aspect-ratio: 16/9;">
                <div class="flex flex-col items-center">
                    <i class="fa-solid fa-spinner fa-spin text-3xl text-white mb-3"></i>
                    <p class="text-sm font-bold text-gray-300">${processingText}</p>
                    <span class="text-[10px] text-gray-500 mt-1">${currentRatio} | ${currentGenSetting}</span>
                </div>
            </div>`;
    }
    botBubbleHtml += `</div></div>`;
    chatSection.innerHTML += botBubbleHtml;
    document.getElementById('workspaceArea').scrollTop = document.getElementById('workspaceArea').scrollHeight;

    // Mock Server Response Delay
    setTimeout(() => {
        const loaderElem = document.getElementById(loaderId);
        if(loaderElem) {
            let successHtml = `
                <div class="bg-zinc-900 border border-white/5 p-4 rounded-2xl rounded-tl-none text-sm max-w-[90%] w-full space-y-3 font-medium shadow-md">
                    <div class="text-[11px] text-white mb-2 flex items-center gap-1 font-bold"><i class="fa-solid fa-wand-magic-sparkles text-blue-400"></i> ${botLabel}</div>`;
            
            if(currentMode === 'chat') {
                successHtml += `<p class="leading-relaxed text-gray-200">تم تسجيل المحادثة الجديدة بنجاح وإضافتها للقائمة الجانبية.</p>`;
            } else if (currentMode === 'image') {
                let count = parseInt(currentGenSetting) || 1;
                let gridClass = (count === 2 || count === 4 || count === 3) ? 'grid grid-cols-2 gap-2' : 'flex flex-col gap-2';
                
                successHtml += `<div class="${gridClass} w-full">`;
                for(let i=0; i<count; i++) {
                    let mockImg = `https://picsum.photos/seed/${Date.now()+i}/600/600`;
                    successHtml += `<img src="${mockImg}" onclick="openMediaViewer('${mockImg}', 'image')" class="w-full rounded-xl cursor-pointer hover:opacity-80 transition object-cover border border-white/10 shadow-sm" style="aspect-ratio: ${getAspectString(currentRatio)};">`;
                }
                successHtml += `</div><p class="text-[10px] text-gray-500 text-center mt-2">انقر على الصورة للتكبير والتحميل</p>`;
            
            } else if (currentMode === 'video') {
                let mockVideoPoster = `https://picsum.photos/seed/${Date.now()}/800/450`;
                let dummyVideo = "https://www.w3schools.com/html/mov_bbb.mp4"; 
                successHtml += `
                <div class="relative w-full rounded-xl overflow-hidden cursor-pointer group border border-white/10 shadow-sm" onclick="openMediaViewer('${dummyVideo}', 'video')">
                    <img src="${mockVideoPoster}" class="w-full object-cover transition duration-300 group-hover:scale-105" style="aspect-ratio: ${getAspectString(currentRatio)};">
                    <div class="absolute inset-0 bg-black/40 flex items-center justify-center transition">
                        <div class="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 group-hover:bg-white/40 group-hover:scale-110 transition duration-300">
                            <i class="fa-solid fa-play text-white text-xl ml-1"></i>
                        </div>
                    </div>
                </div><p class="text-[10px] text-gray-500 text-center mt-2">انقر للتشغيل أو التحميل</p>`;
            }
            
            successHtml += `</div>`;
            loaderElem.innerHTML = successHtml;
            document.getElementById('workspaceArea').scrollTop = document.getElementById('workspaceArea').scrollHeight;
        }
    }, 2500);
});

renderChatHistory();
setMode('chat');

/**
 * ربط الواجهة الأمامية بالوظائف الفعلية لـ Appwrite
 */

// تحديث زر تسجيل الدخول بجوجل
const googleLoginBtn = document.querySelector('#loginModal button');
if (googleLoginBtn) {
    googleLoginBtn.onclick = () => {
        if (window.AppAPI) {
            window.AppAPI.loginWithGoogle();
        }
    };
}

// تحديث حالة المستخدم في القائمة الجانبية عند تحميل الصفحة
window.addEventListener('DOMContentLoaded', async () => {
    if (window.AppAPI) {
        const user = await window.AppAPI.getCurrentUser();
        if (user) {
            const userNameEl = document.querySelector('.text-white.text-sm.font-bold.truncate');
            const userStatusEl = document.querySelector('.text-gray-400.text-[10px].truncate.mt-0.5');
            if (userNameEl) userNameEl.innerText = user.name || user.email;
            if (userStatusEl) userStatusEl.innerText = "متصل عبر Appwrite";
            
            // محاولة جلب السجل الحقيقي
            const realHistory = await window.AppAPI.getChatHistory();
            if (realHistory && realHistory.length > 0) {
                chatHistoryData = realHistory.map(doc => ({
                    id: doc.$id,
                    title: doc.title,
                    pinned: false,
                    locked: false,
                    pin: null
                }));
                renderChatHistory();
            }
        }
    }
});

/**
 * تحديث منطق رفع الملفات ليدعم Appwrite Storage
 */

// تحديث اختيار ملفات الدردشة
document.getElementById('hiddenChatFileInput').addEventListener('change', async function(e) {
    if(e.target.files.length > 0 && window.AppAPI) {
        for (const file of e.target.files) {
            try {
                console.log("جاري رفع الملف إلى Appwrite Storage...");
                const result = await window.AppAPI.uploadFile(file);
                chatAttachedImages.push(result.url);
                renderChatPreviews();
            } catch (error) {
                alert("فشل رفع الملف إلى التخزين. تأكد من إعدادات الـ Bucket.");
            }
        }
    }
    this.value = '';
});

// تحديث اختيار ملفات التوليد (استوديو الصور والفيديو)
document.getElementById('hiddenGenFileInput').addEventListener('change', async function(e) {
    if(e.target.files[0] && window.AppAPI) {
        try {
            console.log("جاري رفع الملف إلى Appwrite Storage...");
            const result = await window.AppAPI.uploadFile(e.target.files[0]);
            currentImages[activeUploadSlot] = result.url;
            updateGenUI();
        } catch (error) {
            alert("فشل رفع الملف إلى التخزين.");
        }
    }
    this.value = '';
});
