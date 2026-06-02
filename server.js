const express = require('express');
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

// helper: timestamp بصيغة YYYYMMDDHHmmss
function makeTimestamp() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return now.getFullYear()
        + pad(now.getMonth() + 1)
        + pad(now.getDate())
        + pad(now.getHours())
        + pad(now.getMinutes())
        + pad(now.getSeconds());
}

// ============================================================
// المسار الرئيسي: يولد iframe token بطريقتين بالتسلسل:
//   1) getTokenIframe()  →  يرجع credential_token (مفتاح الـ iframe)
//   2) pay()             →  ينشئ الطلب ويربطه بالـ token
// ============================================================
app.post('/api/get-iframe-token', (req, res) => {
    console.log("📥 طلب iframe token جديد");

    if (!LLPay) return res.status(500).json({ success: false, error: "SDK غير مهيأ" });

    const payerName  = req.body.payer_name || "Sami Alrashidi";
    const payerPhone = req.body.phone      || "966500000000";
    const payerEmail = req.body.email      || "yuanwayco@gmail.com";
    const amount     = req.body.amount     || "200.10";
    const currency   = req.body.currency   || "USD";

    // ── الخطوة 1: نجيب الـ iframe credential_token أولاً ──
    LLPay.getTokenIframe({
        params: {},
        successcb: function(tokenResult) {
            try {
                const tokenData = typeof tokenResult.body === 'string'
                    ? JSON.parse(tokenResult.body) : tokenResult.body;

                console.log("✅ getTokenIframe رد:", JSON.stringify(tokenData));

                // credential_token هو الـ key اللي يستخدمه llpay.min.js
                const credentialToken = tokenData.credential_token || tokenData.token || tokenData.key;

                // ── الخطوة 2: ننشئ الطلب بـ pay() ──
                const ts  = makeTimestamp();
                const tid = ts + String(Date.now()).slice(-4);

                // ✅ merchant_order_id فريد: timestamp كامل + آخر 6 أرقام من milliseconds
                const orderId = "ORD" + ts + String(Date.now()).slice(-6);

                const payParams = {
                    merchant_transaction_id: tid,
                    notification_url: "https://yuanway-pay-production.up.railway.app/api/webhook/lianlian",
                    redirect_url:     "https://yuanway2030.com/payment-methods.html",
                    cancel_url:       "https://yuanway2030.com/payment-methods.html",
                    country:          "US",
                    merchant_order: {
                        merchant_order_id:   orderId,   // ✅ إصلاح: ID فريد دائماً
                        merchant_order_time: ts,
                        order_amount:        amount,
                        order_currency_code: currency,
                        order_description:   "Yuan Way Order",
                        products: [{
                            product_id:        "101",
                            name:              "Yuanway Product",
                            price:             amount,
                            quantity:          "1",
                            sku:               "SKU_101",
                            url:               "https://yuanway2030.com",
                            shipping_provider: "other"
                        }],
                        shipping: {
                            name:    payerName,
                            phone:   payerPhone,
                            cycle:   "48h",
                            address: {
                                line1:       "123 Main Street",
                                city:        "Riyadh",
                                state:       "Riyadh",
                                country:     "SA",
                                postal_code: "11564"
                            }
                        }
                    },
                    customer:          { email: payerEmail },
                    payer: {
                        payer_id:     "USER_" + String(Date.now()).slice(-8),
                        payer_name:   payerName,
                        phone_number: payerPhone,
                        email:        payerEmail
                    },
                    terminal_data:     {},
                    payment_method:    "CARD",     // ✅ إصلاح: كان null
                    front_model:       "iframe",   // ✅ إصلاح: كان null — سبب الخطأ الرئيسي
                    payment_data:      { installments: "1" },
                    subscription_data: null,
                    biz_code:          null,
                    additional_info:   null
                };

                LLPay.pay({
                    params: payParams,
                    successcb: function(payResult) {
                        try {
                            const payData = typeof payResult.body === 'string'
                                ? JSON.parse(payResult.body) : payResult.body;

                            console.log("✅ pay() رد:", JSON.stringify(payData));

                            // الـ token للـ iframe: إما من getTokenIframe أو من order.key
                            const iframeToken = payData?.order?.key
                                             || credentialToken
                                             || payData?.credential_token
                                             || payData?.token;

                            console.log("🎯 iframeToken النهائي:", iframeToken);
                            return res.json({ success: true, data: payData, token: iframeToken });
                        } catch(e) {
                            console.error("❌ فشل تحليل رد pay():", e);
                            return res.status(500).json({ success: false, error: "فشل تحليل البيانات" });
                        }
                    },
                    failcb: function(err) {
                        console.error("❌ pay() فشل:", err);
                        // إذا فشل pay()، نرجع credential_token على الأقل
                        if (credentialToken) {
                            console.log("⚠️ نستخدم credential_token من getTokenIframe");
                            return res.json({ success: true, data: tokenData, token: credentialToken });
                        }
                        return res.status(400).json({ success: false, error: String(err) });
                    }
                });

            } catch(e) {
                console.error("❌ فشل تحليل رد getTokenIframe:", e);
                return res.status(500).json({ success: false, error: "فشل تحليل token" });
            }
        },
        failcb: function(err) {
            console.error("❌ getTokenIframe فشل:", err);
            return res.status(400).json({ success: false, error: String(err) });
        }
    });
});

// ======= Webhook =======
app.post('/api/webhook/lianlian', (req, res) => {
    console.log("📨 Webhook:", JSON.stringify(req.body).slice(0, 300));
    res.status(200).json({ code: "0000", message: "success" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 السيرفر يعمل على المنفذ ${PORT}`);
});