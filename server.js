const express = require('express');
const crypto  = require('crypto');

const app = express();

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin',      req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Methods',     'GET, POST, OPTIONS, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers',     'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') return res.status(200).end();
    next();
});

app.use(express.json({
    verify: (req, res, buf) => { req.rawBody = buf.toString(); }
}));

process.on('uncaughtException',  err    => console.error('🔥', err));
process.on('unhandledRejection', reason => console.error('🔥', reason));

app.get('/', (req, res) => res.send('🚀 Yuanway Server running'));

// ══════════════════════════════════════════════════════
// المفاتيح - مع إضافة ترويسات PEM الصحيحة (إلزامية لـ crypto)
// ══════════════════════════════════════════════════════
const MERCHANT_ID = '202605290003945002';

// ✅ مفتاحك الخاص - PKCS#1 RSA Private Key
const PRIVATE_KEY_PEM = `-----BEGIN RSA PRIVATE KEY-----
MIIEogIBAAKCAQBj0PeaXtoumSrgkOTrhqf+D6EMy/glD/qoHoZYkjMkmT8skOca
cK1DdITUKmozwuuW71GUHHGUttiwUEV+Yq33Dtk30H2zoPd4PjGDM3j4hsUFTrpH
oLuCqBC7KlxfUAOUaJFnT3M9TJeDnV27rtww3URoQmjheJqPubp3mhnIERMS/vIQ
N3yBycMCtt9qdx9YYu5jqD3mSUHLw84WzN9MjO1B2HJuHdsYRPkzokMtFxCcaI/1
jfnw6R73/F6Tia1Zr6TxrFIJhHQXWAC/cE0LZWXNhi3SD1Rp281sV6vPumSg7+cs
30CXQUiV1SL3AEPNoy3A33dInxdOeJwPZYG/AgMBAAECggEAKmxQMA4MUS3MKXGr
ueabU8G0w0mVh7sI35dJpi9NCUsQrJJRhs1I9ph5M+trA+DeXGIOnBKSu5AS/KzB
PHwYUB7Bd5VnN4c8ZqCYTpj72zT8W8sgJP1NdLSVl9bjN6c8PkFLO0trQSxiYQ/r
HK+u6h3Ay0ceaGXn2xonBFo8hukizBu4AiPW7rilGgVm2+fu+QqVnNOEgeZOusRM
L0AeYROvHGE6rqD913MiecWQUomAP7Saflc8/cS8VCAFeU7ty0nM0r8U7xQZgibr
VFiMIA7wZRvZDFJCVSHfbL5RSNYcl0MQ3alE4d9n7BCXRx1gtqGzoMlgwryQv+rs
AHV4oQKBgQCotlMVbXbihTMronpWSiSq8OLkjLVYgkzwwkG+HIamUfxXQ/G0c9H8
kDdD8NZsg1epaMobfYfgxrE1x/jjwW2UZObCotTYkCe6GGOVFyhDfSbSM8OC8tj4
Kcxcg02iJvWGyolFkmqewyzokl6vkNPiqCNqyhCYBJw4Ji8IKuwwBwKBgQCXdXtQ
qVWXs8Ou0x3ZRrbBOvKDRg4R8+yTfrfDvC25Ld39KrsYMhsUjQHxzSwaFfFy6wED
2s8NOd0WMjKh1SOWR5js7XBNPx6zpuc1fl9gqQj0EQ3092iqKCmTE3Klnb7hIjD0
t9P9nY6mrVcid8IsIkv/KMKK0dl7LPWX1PJCiQKBgD8+MYDrys/5LIhj3MYx/vLR
X8xa7rPiDGOH/kr8uIDqZNR1lMqXTBUIHp9qTYbZ6WeI75JEiUX6VX2am7MM1D33
YQV/MpiH2UyKTfIafy5lYMMVQmn5DNpiGMhpNBXf0tQXYkPhMfSXp2L7U2Euwi7J
5pTmcDf8Km9l6OV/6Y/LAoGBAIgcfAWxJ8p9Mo4aC+kHM5XTc72lZ1+a5jBm4J52
rmCMZ8Lsc9b6sHt3fRfgWpHWxnWP3AmqyggIyDb6RaZJ9QFItpW1jAbfgqfQhlf8
iZpETleIPBK5hMXl8fbKs21CpheMspI54bk5rsj7XiMLnOQsrj9QUgSPMfMQJGWe
aViBAoGAKHkY2VwDBR7LGOa7Qp+iGMqkdTMwoQ+QfK4wJ2Uy8XQtfWvngceUcXwy
6x8Sle8V/8tTxhwjZCP4WlmP1ASh1ee58oMQhKqudEF2HOQssufgFsrfmF5MeGr3
8xGpHTb68w2OFOxFEKyaXc9ADMWO+sMHTW4n0eMuXgisv4SQRDI=
-----END RSA PRIVATE KEY-----`;

// ✅ مفتاح LianLian العام للتحقق من الـ Webhook
const LL_PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAj8z935LpCyhonQ8siJC7
ihx5ENfsq9Ta+O6YjkzfGEMjoIJCaphJ9DPFipHZU5Xb1C2SUL81kady+xMbE2/s
bWPN9roMhfcOWJ2ripNE1zhk9+8HbhxVOTcnbr7qZLNfcBv0ppim+R5p9kTCMzww
M9XR2YnvGo99MaBiFJA19jwGfof/pJGXQlo4ZHmbKGiMnTh1chvQAC7+/au7cMDJ
93teHhlc2sl2eWnmJoSWGHZo7ja4LL6ybziWve+1miAW/2QDUSm6secOgW55wpr9
B7w56dftvryYPRU+qjlwMPXfVWGOnikef83XRSdAbES2nUheasIHHy4wIWzp1Y8+
DQIDAQAB
-----END PUBLIC KEY-----`;

// ── Supabase ──────────────────────────────────────────────
const SUPABASE_URL = 'https://yuxwglmtycsakllhwoaj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1eHdnbG10eWNzYWtsbGh3b2FqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NDM4NTMsImV4cCI6MjA4NjMxOTg1M30.ynlf7dKK4JzwHH5YjtetqAyCbLuERxFZZ6g1kkTbYGk';

async function updateOrderStatus(orderId, status) {
    if (!orderId) return;
    try {
        const r = await fetch(
            `${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}`,
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
        console.log(`✅ Supabase update order ${orderId} → ${status} | HTTP ${r.status}`);
    } catch(e) { console.error('❌ Supabase update failed:', e); }
}

// ── signature helpers ────────────────────────────────────
function makeTs() {
    return new Date().toISOString().replace(/[-T:.Z]/g, '').slice(0, 14);
}
function sign(bodyObject, timestamp) {
    // ترتيب المفاتيح
    const sortedKeys = Object.keys(bodyObject).sort(); 
    // بناء سلسلة نصية بدون مسافات (مهم جداً)
    let bodyString = '{';
    sortedKeys.forEach((key, index) => {
        bodyString += `"${key}":"${bodyObject[key]}"` + (index < sortedKeys.length - 1 ? ',' : '');
    });
    bodyString += '}';

    const data = `${MERCHANT_ID}&${timestamp}&${bodyString}`;
    return crypto.createSign('RSA-SHA256').update(data).sign(PRIVATE_KEY_PEM, 'base64');
}

function verify(bodyString, timestamp, incomingSig) {
    try {
        const data = `${MERCHANT_ID}&${timestamp}&${bodyString}`;
        return crypto.createVerify('RSA-SHA256').update(data).verify(LL_PUBLIC_KEY_PEM, incomingSig, 'base64');
    } catch(e) { return false; }
}

function llHeaders(bodyString) {
    const ts = makeTs();
    return {
        'Content-Type':  'application/json',
        'sign-type':     'RSA',
        'signature':     sign(bodyString, ts),
        'timestamp':     ts,
        'timezone':      'UTC'
    };
}

// ══════════════════════════════════════════════════════
// ✅ المسار 1: جلب iframe token
// LianLian Support: استخدم POST /payments/elements
// يرجع { token: "..." } للاستخدام في LLP.elements().create('card', { token })
// ══════════════════════════════════════════════════════
app.post('/api/get-iframe-token', async (req, res) => {
    console.log('📥 get-iframe-token');

    const MERCHANT_ID = '202605290003945002'; 
    const SUB_MERCHANT_ID = '1020260529853001'; 
    
    // 1. بناء الـ Body بدقة
    const bodyObj = {
        "merchant_id": MERCHANT_ID,
        "merchant_user_no": req.body.email || 'guest_' + Date.now(),
        "sub_merchant_id": SUB_MERCHANT_ID
    };
    const rawBody = JSON.stringify(bodyObj);

    // 2. توليد الـ Timestamp (يجب أن يكون 14 رقماً)
    const ts = makeTs(); 

    // 3. بناء التوقيع (استخدم دالة sign الخاصة بك التي تأخذ الكائن المرتب)
    const signature = sign(bodyObj, ts); 

    try {
        // 4. الطلب باستخدام الـ Headers التي أرسلتها إيمي
        const url = `https://celer-api.lianlianpay-inc.com/v3/merchants/${MERCHANT_ID}/token`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                "signature": signature,
                "timezone": "Asia/Hong_Kong",
                "timestamp": ts,
                "Content-Type": "application/json"
            },
            body: rawBody
        });

        const result = await response.json();
        console.log('💬 API Response:', JSON.stringify(result));

        if (result.token || result.data) {
            return res.json({ success: true, token: result.token || result.data.token });
        } else {
            return res.status(400).json(result);
        }

    } catch(err) {
        console.error('🔥 Error:', err);
        return res.status(500).json({ success: false, error: 'خطأ في الاتصال' });
    }
});

// ══════════════════════════════════════════════════════
// ✅ المسار 2: تنفيذ الدفع بعد الحصول على card_token من الـ SDK
// البنية الدقيقة حسب LianLian Support
// ══════════════════════════════════════════════════════
app.post('/api/execute-payment', async (req, res) => {
    console.log('📥 execute-payment');
    const { card_token, holder_name, amount, currency, email, order_id } = req.body;

    if (!card_token) {
        return res.status(400).json({ success: false, error: 'card_token مفقود' });
    }

    const timeNow = Date.now();
    const ts      = makeTs();
    const amt     = parseFloat(amount) || 200.10;

    const userIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
                || req.socket?.remoteAddress || '127.0.0.1';

    const body = {
        merchant_transaction_id: 'TXN_' + timeNow,
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
                product_id:        '101',
                name:              'Yuanway Product',
                price:             amt,
                quantity:          1,
                url:               'https://yuanway2030.com',
                shipping_provider: 'other'
            }]
        },
        customer: {
            customer_type: 'I',
            first_name:    'Yuanway',
            last_name:     'Customer',
            full_name:     holder_name || 'Yuanway Customer',
            email:         email || 'yuanwayco@gmail.com'
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

    const bodyStr = JSON.stringify(body);

    try {
        const url = `https://celer-api.LianLianpay-inc.com/v3/merchants/${MERCHANT_ID}/payments`;
        const response = await fetch(url, {
            method:  'POST',
            headers: llHeaders(bodyStr),
            body:    bodyStr
        });

        const result = await response.json();
        console.log('💬 /payments response:', JSON.stringify(result).slice(0, 300));

        const success = result?.return_code === 'SUCCESS'
                     || result?.order_status === 'PA'
                     || result?.order_status === 'SU';

        if (success) {
            console.log('✅ Payment executed successfully');
            // ✅ تحديث حالة الطلب في Supabase مباشرة (بدون انتظار Webhook)
            if (order_id) {
                await updateOrderStatus(order_id, 'مدفوع');
            }
            return res.json({ success: true, data: result });
        }

        console.error('❌ Payment failed:', result);
        return res.status(400).json({
            success: false,
            error: result?.return_message || result?.message || 'رُفضت العملية'
        });

    } catch(err) {
        console.error('🔥 execute-payment error:', err);
        return res.status(500).json({ success: false, error: 'خطأ داخلي' });
    }
});

// ══════════════════════════════════════════════════════
// Webhook - يستقبل تحديثات LianLian ويحدث Supabase
// ══════════════════════════════════════════════════════
app.post('/api/webhook/lianlian', async (req, res) => {
    const sig = req.headers['signature'];
    const ts  = req.headers['timestamp'];

    if (sig && ts) {
        const raw = req.rawBody || JSON.stringify(req.body);
        if (!verify(raw, ts, sig)) {
            console.error('⚠️ Webhook: invalid signature');
            return res.status(401).json({ return_code: 'FAIL', return_message: 'Invalid Signature' });
        }
    }

    // أجب فوراً قبل المعالجة
    res.json({ return_code: 'SUCCESS', return_message: 'OK' });

    const body      = req.body;
    const rawStatus = body.order_status || body.status || '';
    const orderId   = body.merchant_order_id || body.order_id || null;

    const statusMap = {
        'SU': 'مدفوع', 'PA': 'مدفوع', 'SUCCESS': 'مدفوع',
        'FA': 'ملغي',  'CA': 'ملغي',  'FAILED':  'ملغي', 'RE': 'ملغي'
    };

    const newStatus = statusMap[rawStatus];
    if (newStatus && orderId) {
        console.log(`📨 Webhook: order ${orderId} → ${newStatus}`);
        await updateOrderStatus(orderId, newStatus);
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server on port ${PORT}`));