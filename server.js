const express = require('express');
const cors = require('cors');
const LLPaySdk = require('ga-payment-sdk');

const app = express();

app.use((req, res, next) => {
    const allowedOrigin = req.headers.origin || '*';
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') return res.status(200).end();
    next();
});
app.use(express.json());

process.on('uncaughtException',  (err)    => console.error('🔥 خطأ غير ملتقط:', err));
process.on('unhandledRejection', (reason) => console.error('🔥 وعد غير معالج:', reason));

app.get('/', (req, res) => res.send("🚀 السيرفر يعمل!"));

// ======= إعداد المفاتيح =======
const MERCHANT_ID = "202605290003945002";

function formatKey(keyStr, type) {
    const clean = keyStr.replace(/-----.*?-----/g, '').replace(/[\r\n\s]+/g, '');
    if (!clean || clean.length < 100) return "INVALID_KEY";
    const lines = clean.match(/.{1,64}/g).join('\n');
    return `-----BEGIN ${type}-----\n${lines}\n-----END ${type}-----`;
}

// ضع مفاتيحك الطويلة هنا كما كانت
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

let LLPay;
try {
    LLPay = new LLPaySdk({
        env:               'sandbox',
        sign_type:         'RSA',
        merchant_sign_key: formatKey(RAW_PRIVATE_KEY, 'PRIVATE KEY'),
        ll_sign_key:       formatKey(RAW_PUBLIC_KEY,  'PUBLIC KEY'),
        merchant_id:       MERCHANT_ID,
        is_print_log:      true
    });
    console.log("✅ تم تهيئة LianLian SDK بنجاح");
} catch (e) {
    console.error("🔥 فشل تهيئة SDK:", e);
}

// دالة الوقت بالتنسيق الدقيق المطلوب من البوابة
function makeTimestamp() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return now.getFullYear() + pad(now.getMonth() + 1) + pad(now.getDate()) +
           pad(now.getHours()) + pad(now.getMinutes()) + pad(now.getSeconds());
}

// مسار الدفع النظيف
app.post('/api/get-iframe-token', (req, res) => {
    console.log("📥 طلب iframe token جديد ورد للسيرفر");

    if (!LLPay) return res.status(500).json({ success: false, error: "SDK غير مهيأ" });

    // استخراج البيانات القادمة من المتصفح بأمان
    const payerName  = req.body.customer?.name  || "Sami Alrashidi";
    const payerPhone = req.body.customer?.phone || "966500000000";
    const payerEmail = req.body.customer?.email || "yuanwayco@gmail.com";
    const amount     = req.body.amount || "2000.10";
    const currency   = req.body.currency || "USD";
    
    const ts = makeTimestamp();
    const uniqueId = Date.now().toString().slice(-6);

    // 🚨 الهيكل المبسط والمثالي لمنع خطأ INVALID_PARAMETER
    const payParams = {
        merchant_transaction_id: "TXN_" + ts + uniqueId,
        notification_url: "https://yuanway-pay-production.up.railway.app/api/webhook/lianlian",
        country: "US",
        merchant_order: {
            merchant_order_id: "ORD_" + ts + uniqueId,
            merchant_order_time: ts,
            order_amount: amount,
            order_currency_code: currency,
            order_description: "Yuanway Test Order",
            products: [{
                product_id: "101",
                name: "Yuanway Product",
                price: amount,
                quantity: 1 // يجب أن يكون رقماً وليس نصاً لمنع الأخطاء
            }]
        },
        payer_info: {
            payer_type: "USER",
            payer_id: "USER_" + uniqueId,
            payer_name: payerName,
            payer_email: payerEmail,
            payer_phone: payerPhone
        },
        // 🚨 هذان الحقلان هما اللذان سيمنعان خطأ الواجهة الأمامية
        payment_method: "CARD",
        front_model: "iframe"
    };

    // نستخدم pay() مباشرة لأنها تقوم بتوليد التوكن الخاص بالإطار تلقائياً
    LLPay.pay({
        params: payParams,
        successcb: function(payResult) {
            try {
                const payData = typeof payResult.body === 'string' ? JSON.parse(payResult.body) : payResult.body;
                console.log("✅ رد الدفع ناجح:", JSON.stringify(payData));

                // استخراج التوكن الخاص بالإطار
                const iframeToken = payData?.order?.key || payData?.credential_token || payData?.token;
                return res.json({ success: true, data: payData, token: iframeToken });
            } catch(e) {
                console.error("❌ فشل تحليل الرد:", e);
                return res.status(500).json({ success: false, error: "فشل التحليل الداخلي" });
            }
        },
        failcb: function(err) {
            console.error("❌ فشل من البوابة:", err);
            return res.status(400).json({ success: false, error: String(err) });
        }
    });
});

// ======= مسار إشعارات البوابة (Webhook) =======
app.post('/api/webhook/lianlian', (req, res) => {
    console.log("📨 Webhook:", JSON.stringify(req.body));
    res.status(200).json({ code: "0000", message: "success" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 السيرفر يعمل على المنفذ ${PORT}`);
});