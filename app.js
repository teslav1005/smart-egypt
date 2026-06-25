/**
 * تحديث شامل لـ app.js لدعم المزامنة الفورية مع Appwrite
 */

// وظيفة تحديث واجهة المستخدم بناءً على حالة تسجيل الدخول
async function updateUIForUser() {
    if (!window.AppAPI) return;

    try {
        const user = await window.AppAPI.getCurrentUser();
        const loginBtn = document.querySelector('button[onclick="openCenterModal(\'loginModal\')"]');
        const userNameEl = document.querySelector('.text-white.text-sm.font-bold.truncate');
        const userStatusEl = document.querySelector('.text-gray-400.text-[10px].truncate.mt-0.5');
        const userAvatarEl = document.querySelector('#profileMenuBtn img');

        if (user) {
            // 1. إخفاء زر الدخول
            if (loginBtn) loginBtn.classList.add('hidden');
            
            // 2. تحديث بيانات الملف الشخصي
            if (userNameEl) userNameEl.innerText = user.name || user.email.split('@')[0];
            if (userStatusEl) userStatusEl.innerText = "حساب موثق";
            if (userAvatarEl) userAvatarEl.src = `https://ui-avatars.com/api/?name=${user.name || user.email}&background=0D8ABC&color=fff`;

            // 3. جلب ومزامنة سجل المحادثات الفعلي
            const realHistory = await window.AppAPI.getChatHistory();
            if (realHistory) {
                chatHistoryData = realHistory.map(doc => ({
                    id: doc.$id,
                    title: doc.title,
                    pinned: false,
                    locked: false,
                    pin: null
                }));
                renderChatHistory();
            }
            
            console.log("تمت مزامنة بيانات المستخدم بنجاح.");
        } else {
            if (loginBtn) loginBtn.classList.remove('hidden');
            if (userNameEl) userNameEl.innerText = "ضيف ذكي";
            if (userStatusEl) userStatusEl.innerText = "سجل دخولك الآن";
        }
    } catch (error) {
        console.error("خطأ في مزامنة الواجهة:", error);
    }
}

// تعديل زر تسجيل الدخول بجوجل
const googleBtn = document.querySelector('#loginModal button');
if (googleBtn) {
    googleBtn.onclick = () => {
        // إغلاق النافذة فوراً وبدء التحويل
        closeCenterModal('loginModal');
        if (window.AppAPI) {
            window.AppAPI.loginWithGoogle();
        }
    };
}

// تعديل زر تسجيل الخروج
window.saveChatLogout = async function() {
    if (window.AppAPI) {
        await window.AppAPI.logout();
    }
};

// ربط زر الحفظ في المنصة بـ Appwrite
sendBtn.addEventListener('click', async () => {
    const text = promptInput.value.trim();
    if(text === '' && (currentMode !== 'chat' || chatAttachedImages.length === 0)) return;

    // حفظ فعلي في Appwrite إذا كانت محادثة جديدة
    if(!currentChatId && window.AppAPI) {
        try {
            const user = await window.AppAPI.getCurrentUser();
            if (user) {
                const doc = await window.AppAPI.saveChat(text.substring(0, 25), text);
                currentChatId = doc.$id;
                renderChatHistory(); // تحديث القائمة الجانبية فوراً
            }
        } catch (e) { console.error("فشل الحفظ في السحابة:", e); }
    }
});

// تشغيل المزامنة عند تحميل الصفحة
window.addEventListener('DOMContentLoaded', updateUIForUser);

/** 
 * بقية أكواد المنصة الأصلية (التنسيق، التنقل، إلخ) 
 * تأكد من بقاء الدوال الأصلية مثل renderChatHistory و toggleSidebar كما هي
 */
// [سيتم دمج بقية الأكواد الأصلية هنا في النسخة النهائية المرفوعة]
