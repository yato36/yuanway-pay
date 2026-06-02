const express = require('express');
const cors = require('cors'); // استخدام المكتبة الرسمية لتجنب تعارضات Railway
const LLPaySdk = require('ga-payment-sdk');

const app = express();

// 1. حارس CORS يدوي فائق القوة لضمان قبول الطلبات
app.use((req, res, next) => {
    // التقاط رابط موقعك والسماح له فوراً
    const allowedOrigin = req.headers.origin || '*';
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // إعطاء الضوء الأخضر للمتصفح في طلبات الاستكشاف (OPTIONS)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    next();
});
app.use(express.json());

// 2. حماية السيرفر من الانهيار: التقاط أي خطأ مميت لمنع توقف التطبيق
process.on('uncaughtException', (err) => {
    console.error('🔥 [CRITICAL] خطأ غير ملتقط أدى لانهيار سابق:', err);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('🔥 [CRITICAL] وعد غير معالج أدى لانهيار سابق:', reason);
});

// مسار فحص حالة السيرفر
app.get('/', (req, res) => {
    res.send("🚀 السيرفر يعمل بنجاح ومحمي من الانهيار!");
});

const MERCHANT_ID = "202605290003945002";

function formatKey(keyStr, type) {
    const clean = keyStr.replace(/-----.*?-----/g, '').replace(/[\r\n\s]+/g, '');
    if (!clean || clean.length < 100) return "INVALID_KEY";
    const lines = clean.match(/.{1,64}/g).join('\n');
    return `-----BEGIN ${type}-----\n${lines}\n-----END ${type}-----`;
}

const RAW_PRIVATE_KEY = `MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC5mS50324+Eb2I
re++V0CTOKGCBCvooWViSODim7qgH8+JW+xa0hT6eoS1jMxrNAFbuKA3sKkYvDk8
S/U+zTDTttCv1B18QRzyuLkC5ASRpvR5jBODDayUzL2vC85AbyOP+rFkqMDfNyFy
jB7fiLymKvERwiQMSqNIHiipCKrAcwLIeHGbKbny9DOIIbZj6R+8JlWYWHkW15Da
StK3UC/bo2dSdnvlIQ8UZym8q+i+TsyuLWcjK/QYH+bNS3jgWwYM5JRmSszea1X6
xOkRatZ0P+tuYesHH7ZYoaxMPaZQioXyDxybLozn/f7BK7ngDz6ARlRfiMOgXqdP
serUah6NAgMBAAECggEAKY97PzGfOqf3VMl6U5mvPKhkRjyP5o5pqQofza7Iqj2l
WCFs+mNrzjEsUYk/Z0wkd7kOq5nUK9VOTcnGl7MUGXypG454sc/U3ydtSo/r0//a
Y/NxlRm1STbVzQJsQ7J/eKjPG3bMhc+PHlrxOOYiNGWOSQc70kLOcIJMYZmuvtxA
HfSRnUzvyv1lThu+xCKw5i03ZNIU0hJ5C6PI+dUsYGa7HjLxNSr6RQFzg63yoSJ8
vI8e1p6YeKOya7onjyAN41W33EjbkqjpLVngSDICmKQcgdRqhWJlS+VFqdrZmogE
bmtlOhdvOU2wh3pfSlOe0GUt+CWs8sSLfAzn3TJU8QKBgQDx+fB0GhJHu+Zg96Ji
7tZHRaNwTRNZzlncOv5U1OSpyUGTTNJy6NHJ1R5Bq+wYcrERu43M9FHpItkB4U+C
du/wiDtRqL/twFcjoDRAgdXcqTINzu1SkHhg4/gAxv1to0JEGagktAOli9ZWKtgs
L0/KMbf3EQYPSd91YJ5AFDUeCQKBgQDEWsulTzoWoFxBJp6xTLM78td4zNhCnQdI
3lO6n18J8ot+MtZT8NHL7tQ7UJhZj6Ma80EBSmEr5achxtO9hZsbdbfvu56sS0Jd
fQHk48vyEBXYAcV6Okx5L0ucV4wYT8EBaHv6J0w72tFOA8xU0cMkKy4BhyPeRjr8
BXxQtixdZQKBgQDiEBpnrW/EmrQJhXCtMur3nQSrRya78P+cs3SmdlrGkKJ15gB6
oC5WfIeO3PpugMASjAFXKC5aO1c33XI1tb5GHlAk4x2kFdyTCPmoBmRxiZSct+Sa
DSSZiIFK4J0lT6/6BWpEF/WMNM9ioxZgeTb29GolJT9fCyn78+8EeJyDWQKBgQCo
DPViJC6ZEuIiOIV1RSnZUvurPdaRHIgRi4apoKDciKNufOAGs4M7QMqPgWkCrfZw
qGSoUBpeUYz7UYoDGIgptlSYb0FcQIUqMkUeuv/fyniHiOyUsbSlux7BTgRvAkMz
i1MgQ+XxDFQ6qvGEXorfN72GPT0rjXwKGj/NbD0IKQKBgHl/4kkw+yZhKeL/RADX
o0Di/MhZq4i/HDYRrtr2Ruj2UJx/Vxuy3XbtlR4X6wMFTcY8x2BjhRwoJJshKnP0
P2zlSbjsI67A0i/23LDFvNWY4wk5jkVmyCjAvunyEUDY4mFv6aYXEkMrOiBa9m2v
o1/KuCEgl6yMZxZ59UD0/Z7G`;

const RAW_PUBLIC_KEY = `MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAuZkudN9uPhG9iK3vvldA
kzihggQr6KFlYkjg4pu6oB/PiVvsWtIU+nqEtYzMazQBW7igN7CpGLw5PEv1Ps0w
07bQr9QdfEEc8ri5AuQEkab0eYwTgw2slMy9rwvOQG8jj/qxZKjA3zchcowe34i8
pirxEcIkDEqjSB4oqQiqwHMCyHhxmym58vQziCG2Y+kfvCZVmFh5FteQ2krSt1Av
26NnUnZ75SEPFGcpvKvovk7Mri1nIyv0GB/mzUt44FsGDOSUZkrM3mtV+sTpEWrW
dD/rbmHrBx+2WKGsTD2mUIqF8g8cmy6M5/3+wSu54A8+gEZUX4jDoF6nT7Hq1Goe
jQIDAQAB`;

// 3. تهيئة المكتبة
let LLPay;
try {
    LLPay = new LLPaySdk({
        env: 'sandbox',
        sign_type: 'RSA',
        merchant_sign_key: formatKey(RAW_PRIVATE_KEY, 'PRIVATE KEY'),
        ll_sign_key: formatKey(RAW_PUBLIC_KEY, 'PUBLIC KEY'),
        merchant_id: MERCHANT_ID,
        is_print_log: true
    });
    console.log("✅ تم تهيئة مكتبة LianLian بنجاح");
} catch (initError) {
    console.error("🔥 تحذير: خطأ في تهيئة LianLian (ولكن السيرفر سيستمر بالعمل):", initError);
}

// 4. مسار جلب التوكن الخاص بالدفع
app.post('/api/get-iframe-token', (req, res) => {
    console.log("📥 طلب جديد وصل إلى مسار الدفع!");

    try {
        if (!LLPay) {
            return res.status(500).json({ success: false, error: "مكتبة الدفع لم تعمل بشكل صحيح على السيرفر." });
        }

        const timeNow = Date.now();
        const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);

        // بناء المعلمات (Params) وتضمين كائن payer_info المطلوب لعملية التوثيق
        const params = {
            merchant_transaction_id: "TXN_" + timeNow,
            notification_url: "https://yuanway-pay-production.up.railway.app/api/webhook/lianlian",
            country: "US",
            merchant_order: {
                merchant_order_id: "ORD_" + timeNow,
                merchant_order_time: timestamp,
                order_amount: req.body.amount || "10.00",
                order_currency_code: req.body.currency || "USD",
                order_description: "Yuan Way Test Order",
                products: [{ product_id: "101", name: "Test Product", price: req.body.amount || "10.00", quantity: 1, category: "test" }]
            },
            // [تمت الإضافة والتعديل] استخدمنا الحروف الإنجليزية لتجنب خطأ front model invalid بسبب الحروف العربية
            payer_info: {
                payer_type: "USER",
                payer_id: "USER_" + timeNow,
                payer_name: req.body.customer?.full_name || "Sami Alrashidi",
                payer_email: req.body.customer?.email || "yuanwayco@gmail.com",
                payer_phone: req.body.customer?.phone || "966500000000"
            },
            // نبقي على customer لتوافق المكتبة في حال كانت تحتاجها داخلياً (باللغة الإنجليزية أيضاً)
            customer: {
                customer_type: "I",
                first_name: req.body.customer?.first_name || "Sami",
                last_name: req.body.customer?.last_name || "Alrashidi",
                email: req.body.customer?.email || "yuanwayco@gmail.com",
                phone: req.body.customer?.phone || "966500000000"
            }
        };

        // 5. استدعاء بوابة الدفع
        LLPay.pay({
            params: params,
            successcb: function (result) {
                console.log("✅ رد ناجح من LianLian!");
                try {
                    const responseData = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
                    const iframeToken = responseData.order?.key || responseData.credential_token || responseData.token;
                    return res.json({ success: true, data: responseData, token: iframeToken });
                } catch (parseError) {
                    console.error("❌ فشل في قراءة بيانات البوابة:", parseError);
                    return res.status(500).json({ success: false, error: "فشل تحليل البيانات" });
                }
            },
            failcb: function (error) {
                console.error("❌ خطأ من البوابة:", error);
                return res.status(400).json({ success: false, error: String(error) });
            }
        });

    } catch (routeError) {
        console.error("🔥 خطأ مفاجئ داخل المسار:", routeError);
        return res.status(500).json({ success: false, error: "حدث خطأ داخلي أثناء معالجة الطلب" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 السيرفر يعمل بنجاح ومحمي على المنفذ ${PORT}`);
});