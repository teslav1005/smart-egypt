/**
 * ملف الربط الفعلي مع Appwrite ونظام الحماية بالتوكنات المزدوجة
 */

const APPWRITE_CONFIG = {
    PROJECT_ID: '6a3d46ce0001fa77a613',
    ENDPOINT: 'https://fra.cloud.appwrite.io/v1',
    DATABASE_ID: '6a3da226000f35fb5466',
    COLLECTION_CHATS_ID: 'chats',
    BUCKET_ID: '6a3d9658002685e5ea5e',
    API_KEY: 'standard_fe1767c10da837eeed0287f2a4b3552670441f45fafc738561490a4269897f6677dac476acecdcfe0f3d7e3962bcea8bd08a79ae2d9d3d62efa88ff03df91137e837af2d35c6d8d22b2a56d9431971a38f35244b7dab820e113c75ba6f54cfba9f7ea891e96c039928bc61909b58694d4cb7af7c3955330e9ab18107aa057b24'
};

const client = new Appwrite.Client()
    .setEndpoint(APPWRITE_CONFIG.ENDPOINT)
    .setProject(APPWRITE_CONFIG.PROJECT_ID);

const account = new Appwrite.Account(client);
const databases = new Appwrite.Databases(client);
const storage = new Appwrite.Storage(client);

const SecurityManager = {
    // توليد توكن فريد للطلبات الفرعية
    generateSubToken: function() {
        return 'sub-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now();
    },

    // جلب توكن المستخدم الرسمي (Session ID)
    getUserToken: async function() {
        try {
            const session = await account.getSession('current');
            return session.$id;
        } catch (error) {
            return null;
        }
    },

    // تسجيل الدخول بجوجل مع تحويل فوري
    loginWithGoogle: function() {
        const currentUrl = window.location.origin + window.location.pathname;
        account.createOAuth2Session('google', currentUrl, currentUrl);
    },

    // جلب بيانات المستخدم الحالي
    getCurrentUser: async function() {
        try {
            return await account.get();
        } catch (error) {
            return null;
        }
    },

    // تسجيل الخروج
    logout: async function() {
        try {
            await account.deleteSession('current');
            window.location.reload();
        } catch (error) {
            console.error("فشل تسجيل الخروج:", error);
        }
    },

    // حفظ محادثة مع توكن رسمي وفرعي
    saveChat: async function(title, initialMessage) {
        const subToken = this.generateSubToken();
        const userToken = await this.getUserToken();
        
        try {
            const user = await this.getCurrentUser();
            if (!user) throw new Error("يجب تسجيل الدخول");

            return await databases.createDocument(
                APPWRITE_CONFIG.DATABASE_ID,
                APPWRITE_CONFIG.COLLECTION_CHATS_ID,
                'unique()',
                {
                    userId: user.$id,
                    title: title,
                    lastMessage: initialMessage,
                    createdAt: new Date().toISOString(),
                    userToken: userToken,    // التوكن الرسمي للمستخدم
                    subToken: subToken       // التوكن الفرعي للطلب
                }
            );
        } catch (error) {
            console.error("خطأ في الحفظ:", error);
            throw error;
        }
    },

    // جلب السجل الحقيقي
    getChatHistory: async function() {
        try {
            const user = await this.getCurrentUser();
            if (!user) return [];
            const response = await databases.listDocuments(
                APPWRITE_CONFIG.DATABASE_ID,
                APPWRITE_CONFIG.COLLECTION_CHATS_ID,
                [Appwrite.Query.equal('userId', user.$id), Appwrite.Query.orderDesc('createdAt')]
            );
            return response.documents;
        } catch (error) {
            return [];
        }
    }
};

window.AppAPI = SecurityManager;
window.APPWRITE_CONFIG = APPWRITE_CONFIG;
