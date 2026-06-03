const express  = require('express');
const LLPaySdk = require('ga-payment-sdk');

const app = express();

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin',      req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Methods',     'GET, POST, OPTIONS, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers',     'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') return res.status(200).end();
    next();
});
app.use(express.json());

process.on('uncaughtException',  err    => console.error('🔥', err));
process.on('unhandledRejection', reason => console.error('🔥', reason));

app.get('/', (req, res) => res.send('🚀 Server running'));

// ─── مفاتيح RSA ───────────────────────────────────────────
const MERCHANT_ID = '202605290003945002';

function formatKey(raw, type) {
    const clean = raw.replace(/-----.*?-----/g, '').replace(/[\r\n\s]+/g, '');
    if (!clean || clean.length < 100) return 'INVALID_KEY';
    return `-----BEGIN ${type}-----\n${clean.match(/.{1,64}/g).join('\n')}\n-----END ${type}-----`;
}

const PRIVATE_KEY = `MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC5mS50324+Eb2I
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

const PUBLIC_KEY = `MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAuZkudN9uPhG9iK3vvldA
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
        merchant_sign_key: formatKey(PRIVATE_KEY, 'PRIVATE KEY'),
        ll_sign_key:       formatKey(PUBLIC_KEY,  'PUBLIC KEY'),
        merchant_id:       MERCHANT_ID,
        is_print_log:      true
    });
    console.log('✅ SDK ready');
} catch(e) { console.error('🔥 SDK init failed:', e); }

// ─── helper ────────────────────────────────────────────────
function makeTs() {
    const n = new Date(), p = x => String(x).padStart(2,'0');
    return `${n.getFullYear()}${p(n.getMonth()+1)}${p(n.getDate())}${p(n.getHours())}${p(n.getMinutes())}${p(n.getSeconds())}`;
}

// ─────────────────────────────────────────────────────────────
// المسار 1: جلب token للـ iframe
// نستخدم نفس params التي أثبتت نجاحها (order.key)
// ─────────────────────────────────────────────────────────────
app.post('/api/get-iframe-token', (req, res) => {
    console.log('📥 get-iframe-token | amount:', req.body.amount);
    if (!LLPay) return res.status(500).json({ success: false, error: 'SDK error' });

    const timeNow  = Date.now();
    const ts       = makeTs();
    const amount   = req.body.amount   || '200.10';   // string كما كان في النسخة الناجحة
    const currency = req.body.currency || 'USD';
    const email    = req.body.email    || 'yuanwayco@gmail.com';

    // ─── Iframe/Hosted-Fields flow ───────────────────────────────────────────────
    // ❌ payment_method: 'inter_credit_card' يُعامَل كـ direct-charge ويشترط card_no
    // ✅ بدون payment_method يرجع LianLian credential_token للـ iframe
    const customerData = req.body.customer || {};
    const params = {
        merchant_transaction_id: 'TXN_' + timeNow,
        notification_url: 'https://yuanway-pay-production.up.railway.app/api/webhook/lianlian',
        country: 'US',
        merchant_order: {
            merchant_order_id:   'ORD_' + timeNow,
            merchant_order_time: ts,
            order_amount:        parseFloat(amount),
            order_currency_code: currency,
            order_description:   'Yuan Way Order',
            products: [{
                product_id:        '101',
                sku:               'YW-001',
                name:              'Yuanway Product',
                price:             parseFloat(amount),
                quantity:          1,
                url:               'https://yuanway2030.com',
                category:          'general',
                shipping_provider: 'other'
            }]
        },
        customer: {
            customer_type: 'I',
            first_name:    customerData.first_name || 'Customer',
            last_name:     customerData.last_name  || 'User',
            full_name:     customerData.full_name  || 'Customer User',
            email:         customerData.email || email,
            phone:         customerData.phone || '+966500000000' // 👈 أضف هذا السطر هنا
        }
    };

    LLPay.pay({
        params,
        successcb(result) {
            try {
                const data  = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
                console.log('✅ pay() response keys:', Object.keys(data));

                // order.key هو الـ token الذي يستخدمه llpay.min.js
                const token = data?.order?.key
                           || data?.credential_token
                           || data?.token
                           || data?.key;

                if (!token) {
                    console.error('❌ لا يوجد token في الرد:', JSON.stringify(data));
                    return res.status(400).json({ success: false, error: 'لا يوجد token في رد LianLian' });
                }

                console.log('🎯 token:', token);
                return res.json({ success: true, token, order_id: data?.order?.id });
            } catch(e) {
                console.error('❌ parse error:', e);
                return res.status(500).json({ success: false, error: 'parse error' });
            }
        },
        failcb(err) {
            console.error('❌ pay() failed:', err);
            return res.status(400).json({ success: false, error: String(err) });
        }
    });
});

// ─────────────────────────────────────────────────────────────
// المسار 2: تأكيد الدفع بعد confirmPay (اختياري)
// يُستدعى فقط إذا confirmPay أرجع card_token
// ─────────────────────────────────────────────────────────────
app.post('/api/process-payment', (req, res) => {
    const { card_token, holder_name, amount, currency, email } = req.body;
    console.log('📥 process-payment | card_token:', card_token?.slice(0,15) + '...');

    if (!LLPay)       return res.status(500).json({ success: false, error: 'SDK error' });
    if (!card_token)  return res.status(400).json({ success: false, error: 'card_token مطلوب' });

    const timeNow = Date.now();
    const ts      = makeTs();
    const amt     = Number(amount) || 200.10;

    const userIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
                || req.socket?.remoteAddress
                || '127.0.0.1';

    const params = {
        merchant_transaction_id: 'PAY_' + timeNow,
        notification_url: 'https://yuanway-pay-production.up.railway.app/api/webhook/lianlian',
        redirect_url:     'https://yuanway2030.com/payment-methods.html',
        cancel_url:       'https://yuanway2030.com/payment-methods.html',
        country:          'US',
        payment_method:   'inter_credit_card',
        merchant_order: {
            merchant_order_id:   'ORD_' + timeNow,
            merchant_order_time: ts,
            order_amount:        amt,
            order_currency_code: currency || 'USD',
            order_description:   'Yuan Way Order',
            products: [{
                product_id: '101',
                name:       'Yuanway Product',
                price:      amt,
                quantity:   1,
                url:        'https://yuanway2030.com',
                shipping_provider: 'other'
            }]
        },
        customer: {
            customer_type: 'I',
            first_name:    'Yuanway',
            last_name:     'Customer',
            full_name:     holder_name || 'Yuanway Customer',
            email:         email       || 'yuanwayco@gmail.com'
        },
        payment_data: {
            card: {
                card_token:  card_token,
                holder_name: holder_name || 'Yuanway Customer'
            },
            installments: 1
        },
        terminal_data: {
            user_order_ip:                        userIp,
            user_client_browser_accept_header:    '*/*',
            user_client_browser_color_depth:      24,
            user_client_browser_java_enabled:     false,
            user_client_browser_js_enabled:       true,
            user_client_browser_language:         'en-US',
            user_client_browser_screen_height:    1080,
            user_client_browser_screen_width:     1920,
            user_client_browser_time_zone_offset: '180',
            user_client_browser_user_agent:       'Mozilla/5.0 (compatible)'
        }
    };

    LLPay.pay({
        params,
        successcb(result) {
            try {
                const data = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
                console.log('✅ process-payment success');
                return res.json({ success: true, data });
            } catch(e) {
                return res.status(500).json({ success: false, error: 'parse error' });
            }
        },
        failcb(err) {
            console.error('❌ process-payment fail:', err);
            return res.status(400).json({ success: false, error: String(err) });
        }
    });
});

// ─── Supabase REST helper ──────────────────────────────────
const SUPABASE_URL = 'https://yuxwglmtycsakllhwoaj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1eHdnbG10eWNzYWtsbGh3b2FqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NDM4NTMsImV4cCI6MjA4NjMxOTg1M30.ynlf7dKK4JzwHH5YjtetqAyCbLuERxFZZ6g1kkTbYGk';

/**
 * يُحدّث حالة الطلب في Supabase بناءً على transaction_id من LianLian
 * @param {string} txnId  - merchant_transaction_id أو order_id من LianLian
 * @param {string} status - الحالة الجديدة بالعربي
 */
async function updateOrderStatusInSupabase(txnId, status) {
    if (!txnId) return;
    try {
        const res = await fetch(
            `${SUPABASE_URL}/rest/v1/orders?transaction_id=eq.${encodeURIComponent(txnId)}`,
            {
                method: 'PATCH',
                headers: {
                    'apikey':        SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type':  'application/json',
                    'Prefer':        'return=minimal'
                },
                body: JSON.stringify({ status })
            }
        );
        if (res.ok) {
            console.log(`✅ Supabase: طلب ${txnId} → ${status}`);
        } else {
            const txt = await res.text();
            console.error(`❌ Supabase update failed (${res.status}):`, txt);
        }
    } catch(e) {
        console.error('❌ استثناء في updateOrderStatusInSupabase:', e);
    }
}

// ─── Webhook ──────────────────────────────────────────────
app.post('/api/webhook/lianlian', async (req, res) => {
    const body = req.body;
    console.log('📨 webhook received:', JSON.stringify(body).slice(0, 300));

    // ✅ رد فوري لـ LianLian قبل المعالجة (مطلوب خلال 5 ثواني)
    res.json({ return_code: 'SUCCESS', return_message: 'OK' });

    // ─── استخراج البيانات من payload اللياني ───────────────
    // LianLian يُرسل merchant_transaction_id أو merchant_order_id
    const txnId     = body.merchant_transaction_id || body.transaction_id || null;
    const orderId   = body.merchant_order_id       || body.order_id       || null;
    const rawStatus = body.order_status || body.status || body.transaction_status || '';

    // ─── تحويل كود الحالة إلى عربي ──────────────────────────
    // أكواد LianLian الشائعة: SU=Success, FA=Failed, OP=Processing, CA=Cancelled
    const statusMap = {
        'SU': 'قيد الانتظار',   // تم الدفع، ينتظر الشحن
        'PA': 'قيد الانتظار',   // Paid
        'success': 'قيد الانتظار',
        'SUCCESS': 'قيد الانتظار',
        'OP': 'قيد الانتظار',   // Order Processing
        'FA': 'ملغي',
        'FAILED': 'ملغي',
        'CA': 'ملغي',
        'CANCELLED': 'ملغي',
        'RE': 'ملغي',           // Refunded
    };

    const newStatus = statusMap[rawStatus] || null;

    if (newStatus && (txnId || orderId)) {
        // حاول التحديث بـ txnId أولاً ثم orderId كـ fallback
        await updateOrderStatusInSupabase(txnId || orderId, newStatus);
    } else {
        console.log(`ℹ️ webhook: حالة غير معروفة "${rawStatus}" أو لا يوجد معرف - تجاهل`);
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server on port ${PORT}`));