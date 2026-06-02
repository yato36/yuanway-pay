const express = require('express');
const cors = require('cors');
const LLPaySdk = require('ga-payment-sdk');

const app = express();

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

// تشخيص المسارات: هذا يطبع أي طلب يصل للسيرفر لنعرف لماذا يحدث 404
app.use((req, res, next) => {
    console.log(`📥 طلب جديد: ${req.method} ${req.url}`);
    next();
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

// تهيئة المكتبة
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
} catch (e) { console.error("🔥 خطأ تهيئة:", e); }

// المسار الصحيح والموحد للدفع المباشر
// استبدل هذا المسار في ملف server.js الخاص بك
app.post('/api/direct-pay', async (req, res) => {
    console.log("📥 استلمنا طلب دفع مباشر، البيانات الواردة:", JSON.stringify(req.body));
    
    // استخراج البيانات من الطلب
    const { amount, card_number, card_expiry, card_cvv, card_name } = req.body;

    // 1. تدقيق صارم جداً: إذا نقص أي حقل، سيتم إيقاف الطلب هنا وإرسال رسالة توضح النقص
    if (!amount) return res.status(400).json({ success: false, error: "المبلغ (amount) مفقود" });
    if (!card_number) return res.status(400).json({ success: false, error: "رقم البطاقة (card_number) مفقود" });
    if (!card_expiry) return res.status(400).json({ success: false, error: "تاريخ الانتهاء (card_expiry) مفقود" });
    if (!card_cvv) return res.status(400).json({ success: false, error: "رمز CVV (card_cvv) مفقود" });
    if (!card_name) return res.status(400).json({ success: false, error: "اسم صاحب البطاقة (card_name) مفقود" });

    try {
        const timeNow = Date.now();
        
        // بناء الهيكل الذي تتطلبه الـ Direct API
        const params = {
            "merchant_transaction_id": "TXN_" + timeNow,
            "merchant_order": {
                "merchant_order_id": "ORD_" + timeNow,
                "order_amount": amount,
                "order_currency_code": "USD"
            },
            "payment_method": {
                "card_number": card_number,
                "card_expiry": card_expiry,
                "card_cvv": card_cvv,
                "card_name": card_name
            },
            "payer_info": {
                "payer_name": card_name,
                "phone_number": "966500000000"
            }
        };

        console.log("🚀 جاري الإرسال إلى ليان ليان بالبيانات:", JSON.stringify(params));

        // استدعاء مكتبة ليان ليان
        LLPay.pay({
            params: params,
            successcb: (result) => {
                console.log("✅ نجاح الدفع المباشر:", result);
                res.json({ success: true, data: result });
            },
            failcb: (error) => {
                console.error("❌ خطأ من ليان ليان:", error);
                // إرسال الخطأ الحقيقي الذي تعيده المكتبة
                res.status(400).json({ success: false, error: error.message || "فشل الاتصال بالبوابة" });
            }
        });

    } catch (e) {
        console.error("🔥 خطأ داخلي في السيرفر:", e);
        res.status(500).json({ success: false, error: "حدث خطأ داخلي في السيرفر" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 السيرفر يعمل على ${PORT}`));