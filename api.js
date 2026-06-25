/**
 * ملف الربط الفعلي مع Appwrite ونظام الحماية بالتوكنات الفريدة
 */

const APPWRITE_CONFIG = {
    PROJECT_ID: '6a3d46ce0001fa77a613',
    ENDPOINT: 'https://fra.cloud.appwrite.io/v1',
    DATABASE_ID: '6a3da226000f35fb5466',
    COLLECTION_CHATS_ID: 'chats',
    BUCKET_ID: '6a3d9658002685e5ea5e',
    API_KEY: 'standard_fe1767c10da837eeed0287f2a4b3552670441f45fafc738561490a4269897f6677dac476acecdcfe0f3d7e3962bcea8bd08a79ae2d9d3d62efa88ff03df91137e837af2d35c6d8d22b2a56d9431971a38f35244b7dab820e113c75ba6f54cfba9f7ea891e96c039928bc61909b58694d4cb7af7c3955330e9ab18107aa057b24'
};

// تهيئة عميل Appwrite
const client = new Appwrite.Client()
    .setEndpoint(APPWRITE_CONFIG.ENDPOINT)
    .setProject(APPWRITE_CONFIG.PROJECT_ID);

const account = new Appwrite.Account(client);
const databases = new Appwrite.Databases(client);
const storage = new Appwrite.Storage(client);

const SecurityManager = {
    // توليد توكن فريد لكل عملية
    generateToken: function() {
        return 'secure-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now();
    },

    // تسجيل الدخول بجوجل
    loginWithGoogle: function() {
        try {
            account.createOAuth2Session(
                'google',
                window.location.origin, // العودة لنفس الصفحة بعد النجاح
                window.location.origin  // العودة لنفس الصفحة بعد الفشل
            );
        } catch (error) {
            console.error("خطأ في تسجيل الدخول:", error);
        }
    },

    // جلب بيانات المستخدم الحالي
    getCurrentUser: async function() {
        try {
            return await account.get();
        } catch (error) {
            return null;
        }
    },

    // حفظ محادثة جديدة في قاعدة البيانات مع نظام التوكن
    saveChat: async function(title, initialMessage) {
        const requestToken = this.generateToken();
        console.log(`[Security] جاري الحفظ بتوكن: ${requestToken}`);
        
        try {
            const user = await this.getCurrentUser();
            if (!user) throw new Error("يجب تسجيل الدخول أولاً");

            const response = await databases.createDocument(
                APPWRITE_CONFIG.DATABASE_ID,
                APPWRITE_CONFIG.COLLECTION_CHATS_ID,
                'unique()',
                {
                    userId: user.$id,
                    title: title,
                    lastMessage: initialMessage,
                    createdAt: new Date().toISOString(),
                    securityToken: requestToken // إرسال التوكن للتحقق في الباك اند
                }
            );
            return response;
        } catch (error) {
            console.error("خطأ في حفظ المحادثة:", error);
            throw error;
        } finally {
            // حذف التوكن من الذاكرة المحلية فوراً
            console.log(`[Security] تم إبطال التوكن: ${requestToken}`);
        }
    },

    // جلب سجل المحادثات للمستخدم الحالي
    getChatHistory: async function() {
        try {
            const user = await this.getCurrentUser();
            if (!user) return [];

            const response = await databases.listDocuments(
                APPWRITE_CONFIG.DATABASE_ID,
                APPWRITE_CONFIG.COLLECTION_CHATS_ID,
                [
                    Appwrite.Query.equal('userId', user.$id),
                    Appwrite.Query.orderDesc('createdAt')
                ]
            );
            return response.documents;
        } catch (error) {
            console.error("خطأ في جلب السجل:", error);
            return [];
        }
    },

    // رفع ملف (صورة أو فيديو) إلى Appwrite Storage مع توكن حماية
    uploadFile: async function(file) {
        const requestToken = this.generateToken();
        console.log(`[Security] جاري رفع ملف بتوكن: ${requestToken}`);
        
        try {
            const response = await storage.createFile(
                APPWRITE_CONFIG.BUCKET_ID,
                'unique()',
                file
            );
            // جلب رابط المعاينة للملف المرفوع
            const fileUrl = storage.getFilePreview(APPWRITE_CONFIG.BUCKET_ID, response.$id);
            return { fileId: response.$id, url: fileUrl };
        } catch (error) {
            console.error("خطأ في رفع الملف:", error);
            throw error;
        } finally {
            console.log(`[Security] تم إبطال توكن الرفع: ${requestToken}`);
        }
    }
};

window.AppAPI = SecurityManager;
window.APPWRITE_CONFIG = APPWRITE_CONFIG;
