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
app.use(express.json());

process.on('uncaughtException',  err    => console.error('🔥', err));
process.on('unhandledRejection', reason => console.error('🔥', reason));

app.get('/', (req, res) => res.send('🚀 Server running'));

// ─── إعدادات الحساب والمفاتيح ───────────────────────────────────────────
const MERCHANT_ID = '202605290003945002';

function formatKey(raw, type) {
    const clean = raw.replace(/-----.*?-----/g, '').replace(/[\r\n\s]+/g, '');
    return `-----BEGIN ${type}-----\n${clean.match(/.{1,64}/g).join('\n')}\n-----END ${type}-----`;
}

const PRIVATE_KEY_RAW = `MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC5mS50324+Eb2I
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

const FORMATTED_PRIVATE_KEY = formatKey(PRIVATE_KEY_RAW, 'PRIVATE KEY');

function makeTs() {
    const n = new Date();
    const p = x => String(x).padStart(2,'0');
    return `${n.getUTCFullYear()}${p(n.getUTCMonth()+1)}${p(n.getUTCDate())}${p(n.getUTCHours())}${p(n.getUTCMinutes())}${p(n.getUTCSeconds())}`;
}

// دالة لتوليد التوقيع الرقمي
function generateSignature(merchantId, timestamp, bodyString) {
    const dataToSign = `${merchantId}&${timestamp}&${bodyString}`;
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(dataToSign);
    return sign.sign(FORMATTED_PRIVATE_KEY, 'base64');
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
                'Timezone': 'UTC' // تم التعديل هنا لتكون UTC
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
                    'apikey':        SUPABASE_KEY, // تمت استعادة المفاتيح الصحيحة هنا
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

// ─── Webhook ──────────────────────────────────────────────
app.post('/api/webhook/lianlian', async (req, res) => {
    const body = req.body;
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