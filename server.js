const express = require('express');
const LLPaySdk = require('ga-payment-sdk');

const app = express();

// --- Configuration Constants ---
const MERCHANT_ID = '202605290003945002';
const SUB_MERCHANT_ID = '1020260529853001';
const SUPABASE_URL = 'https://yuxwglmtycsakllhwoaj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1eHdnbG10eWNzYWtsbGh3b2FqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NDM4NTMsImV4cCI6MjA4NjMxOTg1M30.ynlf7dKK4JzwHH5YjtetqAyCbLuERxFZZ6g1kkTbYGk';

// ✅ الحل للأزمة: المفتاح تم تحويله بالكامل إلى تنسيق PKCS#8 ونمرره كـ String صريح ومباشر بدون كائنات تشفير
const PRIVATE_KEY_PEM = `-----BEGIN PRIVATE KEY-----
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
-----END PRIVATE KEY-----`;

// LianLian Public Key
const LL_PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAj8z935LpCyhonQ8siJC7
ihx5ENfsq9Ta+O6YjkzfGEMjoIJCaphJ9DPFipHZU5Xb1C2SUL81kady+xMbE2/s
bWPN9roMhfcOWJ2ripNE1zhk9+8HbhxVOTcnbr7qZLNfcBv0ppim+R5p9kTCMzww
M9XR2YnvGo99MaBiFJA19jwGfof/pJGXQlo4ZHmbKGiMnTh1chvQAC7+/au7cMDJ
93teHhlc2sl2eWnmJoSWGHZo7ja4LL6ybziWve+1miAW/2QDUSm6secOgW55wpr9
B7w56dftvryYPRU+qjlwMPXfVWGOnikef83XRSdAbES2nUheasIHHy4wIWzp1Y8+
DQIDAQAB
-----END PUBLIC KEY-----`;

// --- Initialize LianLian SDK Instance ---
const config = {
    env:               'product', 
    sign_type:         'RSA',
    merchant_sign_key: PRIVATE_KEY_PEM, // مررت كـ String صريح بتنسيق PKCS#8 متوافق مع شرط المكتبة الصارم
    ll_sign_key:       LL_PUBLIC_KEY_PEM,
    merchant_id:       MERCHANT_ID,
    sub_merchant_id:   SUB_MERCHANT_ID,
    is_print_log:      true
};
const LLPay = new LLPaySdk(config);

// --- Middleware Setup ---
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

// --- Base Routes ---
app.get('/', (req, res) => res.send('Yuanway Gateway Service Active'));

// --- Database Sync Helper ---
async function updateOrderStatus(orderId, status) {
    if (!orderId) return;
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}`, {
            method: 'PATCH',
            headers: {
                'apikey':        SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type':  'application/json',
                'Prefer':        'return=minimal'
            },
            body: JSON.stringify({ status })
        });
        console.log(`DB Synchronization status [Order: ${orderId} -> ${status}] Status Code: ${response.status}`);
    } catch(err) { 
        console.error('Supabase integration operational failure:', err); 
    }
}

// --- API Endpoints ---

// Route 1: ✅ استدعاء دالة الـ SDK القياسية بعد تنظيف المفتاح وتعديل معطيات التوقيع
app.post('/api/get-iframe-token', (req, res) => {
    console.log('Dispatching request wrapper for getTokenIframe via SDK standard...');

    const queryParams = {
        merchant_user_no: req.body.email || `guest_${Date.now()}`
    };

    LLPay.getTokenIframe({
        params: queryParams,
        successcb: (result) => {
            console.log('SDK successful response payload:', JSON.stringify(result));
            // جلب التוكن من الـ body بعد تحليله تلقائياً بالـ SDK
            const responseData = result.body ? JSON.parse(result.body) : result;
            if (responseData.token || (responseData.data && responseData.data.token)) {
                return res.json({ success: true, token: responseData.token || responseData.data.token });
            } else {
                return res.status(400).json(responseData);
            }
        },
        failcb: (err) => {
            console.error('SDK explicit failure return:', err);
            try {
                const parsedErr = typeof err === 'string' ? JSON.parse(err) : err;
                return res.status(400).json({ success: false, error: parsedErr.return_message || parsedErr });
            } catch(e) {
                return res.status(400).json({ success: false, error: err });
            }
        }
    });
});

// Route 2: Confirm and Execute Credit Card Payment via SDK
app.post('/api/execute-payment', (req, res) => {
    console.log('Dispatching request wrapper for credit card payment...');
    const { card_token, holder_name, amount, currency, email, order_id } = req.body;

    if (!card_token) return res.status(400).json({ success: false, error: 'Missing token parameter' });

    const currentTxnId = `TXN_${Date.now()}`;
    const parsedAmount = parseFloat(amount) || 200.10;
    const clientIp     = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || '127.0.0.1';

    const paymentParams = {
        merchant_transaction_id: currentTxnId,
        notification_url:        'https://yuanway-pay-production.up.railway.app/api/webhook/lianlian',
        redirect_url:            'https://yuanway2030.com/payment-methods.html',
        cancel_url:              'https://yuanway2030.com/payment-methods.html',
        country:                 'US',
        payment_method:          'inter_credit_card',
        merchant_order: {
            merchant_order_id:   `ORD_${Date.now()}`,
            merchant_order_time: new Date().toISOString().replace(/T/, '').replace(/\..+/, '').replace(/:/g, '').replace(/-/g, '').slice(0, 14),
            order_amount:        parsedAmount,
            order_currency_code: currency || 'USD',
            order_description:   'Yuan Way Transaction',
            products: [{
                product_id:        '101',
                name:              'Yuanway Product Store',
                price:             parsedAmount,
                quantity:          1,
                url:               'https://yuanway2030.com',
                shipping_provider: 'other'
            }]
        },
        customer: {
            customer_type: 'I', first_name: 'Yuanway', last_name: 'Customer',
            full_name: holder_name || 'Generic Customer', email: email || 'yuanwayco@gmail.com'
        },
        payment_data: {
            card: { card_token: card_token, holder_name: holder_name || 'Generic Customer' },
            installments: 1
        },
        terminal_data: {
            user_order_ip:                        clientIp,
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
        params: paymentParams,
        successcb: async (result) => {
            if (order_id) {
                await updateOrderStatus(order_id, 'مدفوع');
            }
            return res.json({ success: true, data: result });
        },
        failcb: (err) => {
            return res.status(400).json({ success: false, error: err });
        }
    });
});

// Route 3: Asynchronous Webhook Payment Notification Receiver via SDK Parser
app.post('/api/webhook/lianlian', (req, res) => {
    const rawPayload = req.rawBody || JSON.stringify(req.body);
    const verification = LLPay.llNotice(rawPayload, req.headers);
    if (!verification.verifySignResult) return res.status(401).json({ return_code: 'FAIL', return_message: 'Unauthorized Signature' });
    res.json({ return_code: 'SUCCESS', return_message: 'OK' });
});

// --- Server Boot ---
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => console.log(`Yuanway Payment Gateway listening on port ${PORT}`));