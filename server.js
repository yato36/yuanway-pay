const express  = require('express');
const crypto   = require('crypto');

const app = express();

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin',      req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Methods',     'GET, POST, OPTIONS, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers',     'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') return res.status(200).end();
    next();
});

// الاحتفاظ بالـ Body الخام للتحقق من التوقيع بدقة في الـ Webhook
app.use(express.json({
    verify: (req, res, buf) => { req.rawBody = buf.toString(); }
}));

process.on('uncaughtException',  err    => console.error('🔥', err));
process.on('unhandledRejection', reason => console.error('🔥', reason));

app.get('/', (req, res) => res.send('🚀 Server running'));

// ─── إعدادات الحساب والمفاتيح ───────────────────────────────────────────
const MERCHANT_ID = '202605290003945002';

function formatKey(raw, type) {
    const clean = raw.replace(/-----.*?-----/g, '').replace(/[\r\n\s]+/g, '');
    return `-----BEGIN ${type}-----\n${clean.match(/.{1,64}/g).join('\n')}\n-----END ${type}-----`;
}

// 1. مفتاحك الخاص (المستخدم لتوقيع طلباتك المرسلة للبوابة)
const PRIVATE_KEY_RAW = `MIIEogIBAAKCAQBj0PeaXtoumSrgkOTrhqf+D6EMy/glD/qoHoZYkjMkmT8skOca
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
8xGpHTb68w2OFOxFEKyaXc9ADMWO+sMHTW4n0eMuXgisv4SQRDI=`;

// 2. مفتاح LianLian العام المأخوذ من الصورة (يستخدم للتحقق من التحديثات القادمة إليك)
const LL_PUBLIC_KEY_RAW = `MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAj8z935LpCyhonQ8siJC7ihx5ENfsq9Ta+O6YjkzfGEMjoIJCaphJ9DPFipHZU5Xb1C2SUL81kady+xMbE2/sbWPN9roMhfcOWJ2ripNE1zhk9+8HbhxVOTcnbr7qZLNfcBv0ppim+R5p9kTCMzwwM9XR2YnvGo99MaBiFJA19jwGfof/pJGXQlo4ZHmbKGiMnTh1chvQAC7+/au7cMDJ93teHhlc2sl2eWnmJoSWGHZo7ja4LL6ybziWve+1miAW/2QDUSm6secOgW55wpr9B7w56dftvryYPRU+qjlwMPXfVWGOnikef83XRSdAbES2nUheasIHHy4wIWzp1Y8+DQIDAQABMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAj8z935LpCyhonQ8siJC7ihx5ENFsq9Ta+O6YjkzfGEmjolJCAphJ9DPFipHZU5Xb1C2SUL81kady+xMbE2/sbWPN9roMhfcOWJ2ripNE1zhk9+8HbhxVOTcnbr7qZLNfcBv0ppim+R5p9kTCMzwwM9XR2YNvGo99MaBiFJA19jwGfof/pJGXQlo4ZHmBkGiMnTh1cHvQAC7+/au7cMDj93teHhlc2sI2eWnmJoSWGHZo7ja4LL6ybziWve+1miAW/2QDUSm6secOgW55wpr9B7w56dftvryYPRU+qjIwMPXfVWGOnikef83XRSdAbES2nUheaslHHy4wIWzp1Y8+DQIDAQAB`;

const FORMATTED_PRIVATE_KEY = formatKey(PRIVATE_KEY_RAW, 'PRIVATE KEY');
const FORMATTED_LL_PUBLIC_KEY = formatKey(LL_PUBLIC_KEY_RAW, 'PUBLIC KEY');

function makeTs() {
    const n = new Date();
    const p = x => String(x).padStart(2,'0');
    return `${n.getUTCFullYear()}${p(n.getUTCMonth()+1)}${p(n.getUTCDate())}${p(n.getUTCHours())}${p(n.getUTCMinutes())}${p(n.getUTCSeconds())}`;
}

function generateSignature(merchantId, timestamp, bodyString) {
    const dataToSign = `${merchantId}&${timestamp}&${bodyString}`;
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(dataToSign);
    return sign.sign(FORMATTED_PRIVATE_KEY, 'base64');
}

// دالة التحقق من التوقيع لرسائل الـ Webhook القادمة من البوابة
function verifyLianLianSignature(merchantId, timestamp, bodyString, incomingSignature) {
    try {
        const dataToVerify = `${merchantId}&${timestamp}&${bodyString}`;
        const verify = crypto.createVerify('RSA-SHA256');
        verify.update(dataToVerify);
        return verify.verify(FORMATTED_LL_PUBLIC_KEY, incomingSignature, 'base64');
    } catch (err) {
        console.error('❌ Error during signature verification:', err);
        return false;
    }
}

// ─────────────────────────────────────────────────────────────
// 🎯 الخطوة 1: جلب توكن الـ Iframe
// ─────────────────────────────────────────────────────────────
app.post('/api/get-iframe-token', async (req, res) => {
    console.log('📥 get-iframe-token | Request received');

    const customerData = req.body.customer || {};
    const merchantUserNo = customerData.email || 'guest_' + Date.now(); 

    const params = {
        merchant_id: MERCHANT_ID,
        merchant_user_no: merchantUserNo
    };

    try {
        const bodyString = JSON.stringify(params);
        const timestamp = makeTs(); 
        const signature = generateSignature(MERCHANT_ID, timestamp, bodyString);

        const lianlianUrl = `https://celer-api.LianLianpay-inc.com/v3/merchants/${MERCHANT_ID}/token`;

        const response = await fetch(lianlianUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Signature': signature,
                'Timestamp': timestamp,
                'Timezone': 'UTC'
            },
            body: bodyString
        });

        const result = await response.json();
        console.log('LianLian Token API Response:', result);

        if (response.ok && (result.order || result.token || result.data?.token)) {
            const validToken = result.order || result.token || result.data?.token;
            console.log('🎯 Iframe Token Generated Successfully:', validToken);
            return res.json({ success: true, token: validToken });
        } else {
            console.error('❌ LianLian Error:', result);
            return res.status(400).json({ success: false, error: result.message || result.return_message || 'فشل جلب التوكن من LianLian' });
        }

    } catch (err) {
        console.error('🔥 Server Exception:', err);
        return res.status(500).json({ success: false, error: 'حدث خطأ داخلي في السيرفر' });
    }
});

// ─────────────────────────────────────────────────────────────
// 🎯 الخطوة 2: التنفيذ الفعلي للدفع
// ─────────────────────────────────────────────────────────────
app.post('/api/execute-payment', async (req, res) => {
    console.log('📥 execute-payment | Processing final payment');

    const { amount, currency, customer, card_token, holder_name } = req.body;
    
    if (!card_token) {
        return res.status(400).json({ success: false, error: 'رمز البطاقة (card_token) مفقود' });
    }

    const timeNow  = Date.now();
    const finalAmount = amount || '10.00';
    const finalCurrency = currency || 'USD';

    const params = {
        merchant_transaction_id: 'TXN_' + timeNow,
        merchant_id: MERCHANT_ID,
        payment_method: 'inter_credit_card', 
        notification_url: 'https://yuanway-pay-production.up.railway.app/api/webhook/lianlian',
        country: 'SA',
        merchant_order: {
            merchant_order_id:   'ORD_' + timeNow,
            merchant_order_time: makeTs(), 
            order_amount:        parseFloat(finalAmount),
            order_currency_code: finalCurrency,
            order_description:   'Yuan Way Order',
            products: [{
                product_id:        '101',
                sku:               'YW-001',
                name:              'Yuanway Product',
                price:             parseFloat(finalAmount),
                quantity:          1,
                url:               'https://yuanway2030.com',
                category:          'general',
                shipping_provider: 'other'
            }]
        },
        customer: {
            customer_type: 'I',
            first_name:    customer?.first_name || 'Customer',
            last_name:     customer?.last_name  || 'User',
            full_name:     customer?.full_name  || 'Customer User',
            email:         customer?.email      || 'yuanwayco@gmail.com',
            phone:         customer?.phone      || '+966500000000'
        },
        payment_data: {
            card: {
                card_token: card_token,
                holder_name: holder_name || customer?.full_name || 'Customer User'
            }
        }
    };

    try {
        const bodyString = JSON.stringify(params);
        const timestamp = makeTs(); 
        const signature = generateSignature(MERCHANT_ID, timestamp, bodyString);

        const lianlianUrl = `https://celer-api.LianLianpay-inc.com/v3/merchants/${MERCHANT_ID}/payments`;

        const response = await fetch(lianlianUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Signature': signature,
                'Timestamp': timestamp,
                'Timezone': 'UTC'
            },
            body: bodyString
        });

        const result = await response.json();
        console.log('LianLian Payment API Response:', result);

        if (response.ok && (result.return_code === 'SUCCESS' || result.status === 'SUCCESS' || result.status === 'PA')) {
            console.log('✅ Payment Executed Successfully:', result.merchant_transaction_id);
            return res.json({ success: true, data: result });
        } else {
            console.error('❌ Payment Execution Error:', result);
            return res.status(400).json({ success: false, error: result.message || result.return_message || 'تم رفض العملية من البنك' });
        }

    } catch (err) {
        console.error('🔥 Server Exception during payment execution:', err);
        return res.status(500).json({ success: false, error: 'حدث خطأ داخلي أثناء معالجة الدفع' });
    }
});


// ─── Supabase REST helper ──────────────────────────────────
const SUPABASE_URL = 'https://yuxwglmtycsakllhwoaj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1eHdnbG10eWNzYWtsbGh3b2FqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NDM4NTMsImV4cCI6MjA4NjMxOTg1M30.ynlf7dKK4JzwHH5YjtetqAyCbLuERxFZZ6g1kkTbYGk';

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
        if (res.ok) console.log(`✅ Supabase: طلب ${txnId} → ${status}`);
    } catch(e) { console.error('❌ استثناء في تحديث Supabase:', e); }
}

// ─── Webhook (محصّن بالكامل بالتوقيع الرقمي) ───────────────
app.post('/api/webhook/lianlian', async (req, res) => {
    const incomingSignature = req.headers['signature'];
    const incomingTimestamp = req.headers['timestamp'];
    const body = req.body;

    // التحقق الأمن من التوقيع لمنع التلاعب بحالة الطلبات
    if (incomingSignature && incomingTimestamp) {
        const isValid = verifyLianLianSignature(MERCHANT_ID, incomingTimestamp, req.rawBody || JSON.stringify(body), incomingSignature);
        if (!isValid) {
            console.error('⚠️ Webhook Warning: Invalid signature detected! Request rejected.');
            return res.status(401).json({ return_code: 'FAIL', return_message: 'Invalid Signature' });
        }
    }

    // إرجاع رد فوري للبوابة بنجاح الاستلام لتجنب تكرار الإرسال
    res.json({ return_code: 'SUCCESS', return_message: 'OK' });

    const txnId     = body.merchant_transaction_id || body.transaction_id || null;
    const orderId   = body.merchant_order_id       || body.order_id       || null;
    const rawStatus = body.order_status || body.status || body.transaction_status || '';

    const statusMap = {
        'SU': 'قيد الانتظار', 'PA': 'قيد الانتظار', 'success': 'قيد الانتظار', 'SUCCESS': 'قيد الانتظار', 'OP': 'قيد الانتظار',
        'FA': 'ملغي', 'FAILED': 'ملغي', 'CA': 'ملغي', 'CANCELLED': 'ملغي', 'RE': 'ملغي'
    };

    const newStatus = statusMap[rawStatus];
    if (newStatus && (txnId || orderId)) {
        await updateOrderStatusInSupabase(txnId || orderId, newStatus);
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server on port ${PORT}`));