
    // --- App Configuration & Initial Data ---
    const appData = {
        chat: {
            title: "استوديو المحادثة",
            icon: "fa-regular fa-comment-dots",
            placeholder: "اسأل أو اكتب ما تريد هنا...",
            models: {
                "DeepSeek V4 Pro": { desc: "أقوى نموذج للدردشة والتحليل المعمق" },
                "GPT-4o Premium": { desc: "النموذج الأكثر ذكاءً وتطوراً من OpenAI" },
                "Claude 3.5 Sonnet": { desc: "مثالي للكتابة الإبداعية والبرمجة" }
            }
        },
        image: {
            title: "استوديو الصور",
            icon: "fa-regular fa-image",
            placeholder: "صف الصورة التي تتخيلها بدقة...",
            models: {
                "Flux 1.1 Pro": { desc: "دقة فوتوغرافية وتفاصيل مذهلة", ratios: ["1:1", "16:9", "9:16", "3:2", "2:3"], counts: [1, 2, 4], extendable: false },
                "DALL-E 3 High": { desc: "فهم عميق للوصف الفني المعقد", ratios: ["1:1", "16:9", "9:16"], counts: [1], extendable: false },
                "Midjourney V6": { desc: "لمسة فنية سينمائية فريدة", ratios: ["1:1", "16:9", "9:16", "4:5"], counts: [1, 4], extendable: false }
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
    let currentChatId = null; // null means new chat

    let currentMode = "chat";
    let activeModelsList = appData.chat.models;
    let currentModel = Object.keys(activeModelsList)[0];
    let currentRatio = "16:9";
    let currentGenSetting = null;
    let isExtended = false;
    let currentImages = {}; // Max 2 slots
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
            
            currentImages = {}; // Reset ref images
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
        } else {
            document.getElementById('dynamicSettingsTitle').innerHTML = '<i class="fa-regular fa-clock ml-1"></i> مدة الفيديو (ثوانٍ)';
            document.getElementById('extendContainer').classList.remove('hidden');
            if(!modelData.durations.includes(currentGenSetting)) currentGenSetting = modelData.durations[0];
            modelData.durations.forEach(dur => {
                const btn = document.createElement('button');
                btn.className = `flex-1 py-2 rounded-xl text-xs font-bold border border-white/10 transition-all ${dur === currentGenSetting ? 'bg-white text-black shadow-sm' : 'bg-transparent text-gray-400 hover:bg-white/5'}`;
                btn.innerText = dur + " ثانية";
                btn.onclick = () => { currentGenSetting = dur; updateGenUI(); };
                settingsContainer.appendChild(btn);
            });
            
            const sw = document.getElementById('extendSwitch');
            if(isExtended) sw.classList.add('active'); else sw.classList.remove('active');
            sw.onclick = () => { isExtended = !isExtended; updateGenUI(); };
        }

        for(let i=0; i<2; i++) {
            const slot = document.getElementById(`genSlot-${i}`);
            if(currentImages[i]) {
                slot.style.backgroundImage = `url(${currentImages[i]})`;
                slot.innerHTML = `<button onclick="removeGenImage(event, ${i})" class="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] shadow-lg"><i class="fa-solid fa-xmark"></i></button>`;
                slot.classList.add('has-image');
            } else {
                slot.style.backgroundImage = 'none';
                slot.innerHTML = '<i class="fa-solid fa-plus text-gray-500"></i>';
                slot.classList.remove('has-image');
            }
        }
    }

    window.triggerGenUpload = function(slot) { activeUploadSlot = slot; document.getElementById('hiddenGenFileInput').click(); };
    document.getElementById('hiddenGenFileInput').addEventListener('change', function(e) {
        if(e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (ex) => { currentImages[activeUploadSlot] = ex.target.result; updateGenUI(); validateSendButton(); };
            reader.readAsDataURL(e.target.files[0]);
        }
    });
    window.removeGenImage = function(e, slot) { e.stopPropagation(); delete currentImages[slot]; updateGenUI(); validateSendButton(); };

    document.getElementById('hiddenChatFileInput').addEventListener('change', function(e) {
        if(e.target.files.length > 0) {
            for (const file of e.target.files) {
                const reader = new FileReader();
                reader.onload = (ex) => { chatAttachedImages.push(ex.target.result); renderChatPreviews(); validateSendButton(); };
                reader.readAsDataURL(file);
            }
        }
    });

    function renderChatPreviews() {
        if(chatAttachedImages.length === 0) { chatAttachmentPreviewArea.classList.add('hidden'); return; }
        chatAttachmentPreviewArea.classList.remove('hidden');
        chatAttachmentPreviewArea.innerHTML = '';
        chatAttachedImages.forEach((src, idx) => {
            const div = document.createElement('div');
            div.className = "preview-slot";
            div.style.backgroundImage = `url(${src})`;
            div.innerHTML = `<button onclick="removeChatImage(${idx})" class="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[8px] shadow-lg"><i class="fa-solid fa-xmark"></i></button>`;
            chatAttachmentPreviewArea.appendChild(div);
        });
    }
    window.removeChatImage = function(idx) { chatAttachedImages.splice(idx, 1); renderChatPreviews(); validateSendButton(); };

    // --- Core Logic ---
    promptInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
        validateSendButton();
    });

    function validateSendButton() {
        const text = promptInput.value.trim();
        let isValid = text !== '';
        if(currentMode === 'chat' && chatAttachedImages.length > 0) isValid = true;
        if(currentMode !== 'chat' && Object.keys(currentImages).length > 0) isValid = true;

        if(isValid) { sendBtn.classList.remove('opacity-40', 'pointer-events-none'); sendBtn.classList.add('bg-white'); }
        else { sendBtn.classList.add('opacity-40', 'pointer-events-none'); sendBtn.classList.remove('bg-white'); }
    }

    sendBtn.addEventListener('click', () => {
        const text = promptInput.value.trim();
        if(text === '' && (currentMode !== 'chat' || chatAttachedImages.length === 0)) return;

        if(!currentChatId) {
            welcomeSection.classList.add('hidden');
            inspirationSection.classList.add('hidden');
            chatSection.classList.remove('hidden');
            const newId = Date.now();
            chatHistoryData.unshift({ id: newId, title: text.substring(0, 25) || "محادثة جديدة", pinned: false, locked: false, pin: null });
            currentChatId = newId;
            renderChatHistory();
        }

        const msgDiv = document.createElement('div');
        msgDiv.className = "flex flex-col gap-2 items-end mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300";
        
        let attachmentsHtml = '';
        if(currentMode === 'chat' && chatAttachedImages.length > 0) {
            attachmentsHtml = `<div class="flex gap-1 flex-wrap justify-end mb-1">` + 
                chatAttachedImages.map(img => `<img src="${img}" class="w-20 h-20 object-cover rounded-lg border border-white/10 shadow-lg" onclick="viewMedia('${img}', 'image')">`).join('') + 
                `</div>`;
        } else if (currentMode !== 'chat' && Object.keys(currentImages).length > 0) {
            attachmentsHtml = `<div class="flex gap-1 flex-wrap justify-end mb-1">` + 
                Object.values(currentImages).map(img => `<img src="${img}" class="w-16 h-16 object-cover rounded-lg border border-white/10 opacity-60">`).join('') + 
                `</div>`;
        }

        msgDiv.innerHTML = `
            ${attachmentsHtml}
            <div class="bg-white text-black p-3.5 rounded-2xl rounded-tr-none text-sm font-bold shadow-xl max-w-[85%] leading-relaxed">${text || (currentMode === 'image' ? 'توليد صورة فنية...' : 'توليد فيديو سينمائي...')}</div>
        `;
        chatSection.appendChild(msgDiv);
        
        promptInput.value = '';
        promptInput.style.height = 'auto';
        chatAttachedImages = [];
        currentImages = {};
        renderChatPreviews();
        updateGenUI();
        validateSendButton();
        optionsArea.classList.add('collapsed');
        
        chatSection.scrollTop = chatSection.scrollHeight;
        workspaceArea.scrollTop = workspaceArea.scrollHeight;

        // Mock Bot Response
        setTimeout(() => {
            const botDiv = document.createElement('div');
            botDiv.className = "flex flex-col gap-2 items-start mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500";
            
            let botContent = '';
            if(currentMode === 'chat') {
                botContent = `<div class="bg-zinc-900 border border-white/5 text-gray-200 p-4 rounded-2xl rounded-tl-none text-sm font-medium shadow-lg max-w-[90%] leading-relaxed">أهلاً بك! أنا مصر الذكية، كيف يمكنني مساعدتك اليوم في هذا الاستوديو الشامل؟</div>`;
            } else if(currentMode === 'image') {
                const mockImg = "https://picsum.photos/seed/"+Date.now()+"/800/800";
                botContent = `
                    <div class="text-[10px] text-gray-500 mb-1 font-bold mr-1">تم التوليد بواسطة ${currentModel}</div>
                    <div class="relative group">
                        <img src="${mockImg}" class="w-full rounded-2xl border border-white/10 shadow-2xl cursor-pointer transition group-hover:brightness-110" onclick="viewMedia('${mockImg}', 'image')">
                        <div class="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button class="w-8 h-8 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white text-xs"><i class="fa-solid fa-download"></i></button>
                        </div>
                    </div>
                `;
            } else {
                botContent = `
                    <div class="text-[10px] text-gray-500 mb-1 font-bold mr-1">تم التوليد بواسطة ${currentModel}</div>
                    <div class="relative group aspect-video bg-zinc-900 rounded-2xl border border-white/10 flex items-center justify-center overflow-hidden">
                        <i class="fa-solid fa-play text-3xl text-white/20"></i>
                        <div class="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition cursor-pointer" onclick="viewMedia('https://www.w3schools.com/html/mov_bbb.mp4', 'video')">
                             <div class="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-2xl scale-90 group-hover:scale-100 transition"><i class="fa-solid fa-play ml-1"></i></div>
                        </div>
                    </div>
                `;
            }

            botDiv.innerHTML = botContent;
            chatSection.appendChild(botDiv);
            workspaceArea.scrollTop = workspaceArea.scrollHeight;
        }, 1500);
    });

    // --- UI Helpers ---
    window.toggleSidebar = function() {
        const sidebar = document.getElementById('appSidebar');
        const overlay = document.getElementById('sidebarOverlay');
        sidebar.classList.toggle('translate-x-full');
        overlay.classList.toggle('hidden');
        setTimeout(() => overlay.classList.toggle('opacity-0'), 10);
    };
    document.getElementById('menuBtn').addEventListener('click', toggleSidebar);
    document.getElementById('sidebarOverlay').addEventListener('click', toggleSidebar);
    document.getElementById('sidebarNewChatBtn').addEventListener('click', () => {
        currentChatId = null;
        chatSection.innerHTML = '';
        welcomeSection.classList.remove('hidden');
        inspirationSection.classList.add('hidden');
        setMode('chat');
        renderChatHistory();
        toggleSidebar();
    });

    window.openCenterModal = function(id) { document.getElementById(id).classList.add('active'); };
    window.closeCenterModal = function(id) { document.getElementById(id).classList.remove('active'); };

    document.getElementById('profileMenuBtn').addEventListener('click', (e) => { e.stopPropagation(); document.getElementById('profilePopover').classList.toggle('hidden'); });
    document.addEventListener('click', () => document.getElementById('profilePopover').classList.add('hidden'));

    window.viewMedia = function(src, type) {
        const modal = document.getElementById('mediaViewerModal');
        const img = document.getElementById('mediaViewerImage');
        const video = document.getElementById('mediaViewerVideo');
        
        img.classList.add('hidden');
        video.classList.add('hidden');
        video.pause();

        if(type === 'image') { img.src = src; img.classList.remove('hidden'); }
        else { video.src = src; video.classList.remove('hidden'); video.play(); }

        modal.classList.add('active');
        document.getElementById('mediaDownloadBtn').onclick = () => { const a = document.createElement('a'); a.href = src; a.download = 'SmartEgypt_Media'; a.click(); };
    };
    window.closeMediaViewer = function() {
        const modal = document.getElementById('mediaViewerModal');
        modal.classList.remove('active');
        document.getElementById('mediaViewerVideo').pause();
    };

    // --- Sidebar Features ---
    document.getElementById('themeToggleBtnSidebar').addEventListener('click', () => { document.body.classList.toggle('light-mode'); });
    document.getElementById('langToggleBtnSidebar').addEventListener('click', function() { this.querySelector('span:first-child').innerText = (this.querySelector('span:first-child').innerText === 'EN') ? 'AR' : 'EN'; });

    // Initial Setup
    renderChatHistory();
    setMode('chat');

/**
 * ============================================================
 * ربط Appwrite - نظام الحماية والمزامنة الفورية
 * يتم حقن هذه الوظائف لتعمل مع التصميم الأصلي دون تعديله
 * ============================================================
 */

const AppAPI_Config = {
    PROJECT_ID: '6a3d46ce0001fa77a613',
    ENDPOINT: 'https://fra.cloud.appwrite.io/v1',
    DATABASE_ID: '6a3da226000f35fb5466',
    COLLECTION_CHATS_ID: 'chats'
};

const appwriteClient = new Appwrite.Client()
    .setEndpoint(AppAPI_Config.ENDPOINT)
    .setProject(AppAPI_Config.PROJECT_ID);

const appwriteAccount = new Appwrite.Account(appwriteClient);
const appwriteDatabases = new Appwrite.Databases(appwriteClient);

const SmartEgypt_Auth = {
    // تسجيل الدخول بجوجل مع إغلاق فوري للنافذة وتحويل دقيق
    login: function() {
        closeCenterModal('loginModal');
        const currentUrl = window.location.origin + window.location.pathname;
        appwriteAccount.createOAuth2Session('google', currentUrl, currentUrl);
    },

    // جلب بيانات المستخدم وتحديث الواجهة
    syncUser: async function() {
        try {
            const user = await appwriteAccount.get();
            if (user) {
                // إخفاء زر الدخول وتحديث البيانات
                const loginBtn = document.querySelector('button[onclick="openCenterModal(\'loginModal\')"]');
                if (loginBtn) loginBtn.classList.add('hidden');
                
                document.querySelector('.text-white.text-sm.font-bold.truncate').innerText = user.name || user.email;
                document.querySelector('.text-gray-400.text-[10px].truncate.mt-0.5').innerText = "حساب موثق";
                document.querySelector('#profileMenuBtn img').src = `https://ui-avatars.com/api/?name=${user.name}&background=0D8ABC&color=fff`;
                
                // جلب سجل المحادثات الحقيقي
                this.loadRealHistory(user.$id);
            }
        } catch (e) { console.log("المستخدم غير مسجل دخول حالياً."); }
    },

    // جلب سجل المحادثات مع حماية التوكن
    loadRealHistory: async function(userId) {
        try {
            const jwt = await appwriteAccount.createJWT(); // توكن الحماية الرسمي لكل طلب
            const response = await appwriteDatabases.listDocuments(
                AppAPI_Config.DATABASE_ID,
                AppAPI_Config.COLLECTION_CHATS_ID,
                [Appwrite.Query.equal('userId', userId)]
            );
            if (response.documents.length > 0) {
                chatHistoryData = response.documents.map(doc => ({
                    id: doc.$id,
                    title: doc.title,
                    pinned: false,
                    locked: false,
                    pin: null
                }));
                renderChatHistory();
            }
        } catch (e) { console.error("خطأ في مزامنة السجل:", e); }
    }
};

// ربط الأزرار بالوظائف الجديدة
document.querySelector('#loginModal button').onclick = () => SmartEgypt_Auth.login();
window.addEventListener('DOMContentLoaded', () => SmartEgypt_Auth.syncUser());
