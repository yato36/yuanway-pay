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

process.on('uncaughtException', (err) => console.error('🔥 خطأ غير ملتقط:', err));
process.on('unhandledRejection', (reason) => console.error('🔥 وعد غير معالج:', reason));

app.get('/', (req, res) => res.send("🚀 السيرفر يعمل ومؤمن بالكامل بنظام توليد المعرفات الداخلي!"));

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
    console.error("🔥 خطأ في تهيئة المكتبة:", initError);
}

// 1. طلب توكن الإطار (توليد المعرفات داخلياً)
app.post('/api/get-iframe-token', (req, res) => {
    console.log("📥 [مرحلة 1] طلب توكن الإطار المدمج...");
    try {
        const timeNow = Date.now();
        const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
        const orderAmount = Number(req.body.amount) || 10.00;
        
        // 🔥 الحل الجذري: توليد الـ ID بصيغة نصية واضحة وصريحة داخل السيرفر لحماية الفحص
        const serverGeneratedOrderId = "ORD_" + timeNow;

        const params = {
            merchant_transaction_id: "TOK_" + serverGeneratedOrderId, 
            notification_url: "https://yuanway-pay-production.up.railway.app/api/webhook/lianlian",
            country: "US",
            payment_method: "inter_credit_card",
            merchant_order: {
                merchant_order_id: serverGeneratedOrderId, // حقل الـ ID المؤمن بالكامل
                merchant_order_time: timestamp,
                order_amount: orderAmount,
                order_currency_code: req.body.currency || "USD",
                order_description: "Yuanway Session Init",
                products: [{ 
                    product_id: "101", 
                    sku: "SKU_101",
                    name: "Session Token", 
                    price: orderAmount, 
                    quantity: 1, 
                    category: "system",
                    shipping_provider: "other" 
                }]
            },
            customer: {
                customer_type: "I",
                first_name: req.body.customer?.first_name || "Sami",
                last_name: req.body.customer?.last_name || "Alrashidi",
                email: req.body.customer?.email || "yuanwayco@gmail.com",
                phone: req.body.customer?.phone || "+966500000000"
            }
        };

        LLPay.pay({
            params: params,
            successcb: function (result) {
                try {
                    const responseData = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
                    const iframeToken = responseData.token || responseData.credential_token || responseData.order?.key;
                    
                    // 🔥 نرسل الـ Token والـ orderId المتولد معاً للواجهة الأمامية لاستخدامه في الخصم لاحقاً
                    return res.json({ success: true, token: iframeToken, order_id: serverGeneratedOrderId });
                } catch (e) {
                    return res.status(500).json({ success: false, error: "فشل استخراج التوكن" });
                }
            },
            failcb: function (error) {
                console.error("❌ فشل استخراج التوكن من البوابة:", error);
                return res.status(400).json({ success: false, error: String(error) });
            }
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: "خطأ داخلي" });
    }
});

// 2. طلب السحب المالي النهائي
// مسار الدفع النهائي المحدث بالكامل
app.post('/api/process-payment', (req, res) => {
    console.log("📥 [مرحلة 3] طلب سحب مالي نهائي بالهيكلة المطابقة تماماً لرد الشركة...");
    try {
        const timeNow = Date.now();
        const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
        
        // استخدام معرف طلب فريد وموحد
        const orderId = "ORD_PAY_" + timeNow;

        const params = {
            merchant_transaction_id: "TXN_" + timeNow,
            merchant_id: MERCHANT_ID,
            notification_url: "https://yuanway-pay-production.up.railway.app/api/webhook/lianlian",
            redirect_url: "https://yuanway2030.com/payment-methods.html",
            cancel_url: "https://yuanway2030.com/payment-methods.html",
            country: "US",
            payment_method: "inter_credit_card", 
            merchant_order: {
                merchant_order_id: orderId, // 🔥 المعرف المطلوب من البوابة
                merchant_order_time: timestamp,
                order_amount: req.body.amount || "10.00",
                order_currency_code: req.body.currency || "USD",
                order_description: "Yuan Way Final Order",
                products: [{ 
                    product_id: "101", 
                    sku: "SKU_101", 
                    name: "Yuanway Order", 
                    price: req.body.amount || "10.00", 
                    quantity: 1, 
                    url: "https://yuanway2030.com",
                    shipping_provider: "other" 
                }]
            },
            customer: {
                customer_type: "I",
                first_name: req.body.customer?.first_name || "Sami",
                last_name: req.body.customer?.last_name || "Alrashidi",
                full_name: req.body.customer?.full_name || "Sami Alrashidi",
                email: req.body.customer?.email || "yuanwayco@gmail.com"
            },
            payment_data: {
                card: {
                    card_token: req.body.card_token,
                    holder_name: req.body.holder_name || "Sami Alrashidi" 
                },
                installments: 1
            },
            terminal_data: { 
                user_order_ip: "127.0.0.1",
                user_client_browser_js_enabled: true,
                user_client_browser_language: "ar",
                user_client_browser_user_agent: "Mozilla/5.0"
            }
        };

        LLPay.pay({
            params: params,
            successcb: (result) => res.json({ success: true, data: result.body }),
            failcb: (error) => {
                console.error("❌ رفض من البوابة:", error);
                res.status(400).json({ success: false, error: String(error) });
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: "خطأ داخلي" });
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 السيرفر يعمل ويستمع بكفاءة على المنفذ ${PORT}`);
});