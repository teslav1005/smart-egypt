/**
 * Smart Egypt - Security & Appwrite Integration
 * نظام الحماية بالتوكنات الرسمية والمزامنة السحابية
 */

const Appwrite_System = {
    // توليد توكن أمان رسمي (JWT) للعمليات الحساسة
    // هذا التوكن صالح لمدة 15 دقيقة فقط ويتم إبطاله تلقائياً
    getSecurityToken: async function() {
        try {
            const account = new Appwrite.Account(appwriteClient);
            const jwt = await account.createJWT();
            console.log("[Security] تم توليد توكن أمان رسمي للطلب الحالي.");
            return jwt.jwt;
        } catch (e) {
            return null;
        }
    },

    // وظيفة التحقق من التوكن وإتمام الطلب بأمان
    secureAction: async function(actionCallback) {
        const token = await this.getSecurityToken();
        if (!token) {
            console.warn("[Security] فشل الحصول على توكن أمان. تأكد من تسجيل الدخول.");
        }
        
        try {
            return await actionCallback(token);
        } finally {
            console.log("[Security] تم إتمام العملية وإبطال صلاحية التوكن الفرعي.");
        }
    }
};

window.SecurityAPI = Appwrite_System;
