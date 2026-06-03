const express = require('express');
const crypto  = require('crypto');
const LLPaySdk = require('ga-payment-sdk');

const app = express();

// --- Configuration Constants ---
const MERCHANT_ID = '202605290003945002';
const SUB_MERCHANT_ID = '1020260529853001';

// المفتاح الخاص الأصلي (PKCS#1)
const PRIVATE_KEY_PKCS1 = `-----BEGIN RSA PRIVATE KEY-----
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

// ✅ FIX #1 + #2: تحويل المفتاح من PKCS#1 إلى PKCS#8 (string)
// السبب: الـ SDK يستخدم node-rsa مع importKey(..., "pkcs8-private-pem")
// وهو يرفض PKCS#1 بخطأ "encoding too long"
// كذلك merchant_sign_key يجب أن يكون string وليس KeyObject
const PRIVATE_KEY_PEM = crypto
    .createPrivateKey({ key: PRIVATE_KEY_PKCS1, format: 'pem', type: 'pkcs1' })
    .export({ type: 'pkcs8', format: 'pem' })
    .toString();

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

// ✅ تهيئة صحيحة للـ SDK: merchant_sign_key = string PKCS#8 وليس KeyObject
const config = {
    env:               'sandbox',
    sign_type:         'RSA',
    merchant_sign_key: PRIVATE_KEY_PEM,   // ← string الآن، وبصيغة PKCS#8
    ll_sign_key:       LL_PUBLIC_KEY_PEM,
    merchant_id:       MERCHANT_ID,
    sub_merchant_id:   SUB_MERCHANT_ID,
    is_print_log:      false
};
const LLPay = new LLPaySdk(config);

// Timestamp helper (لا يزال مطلوباً للـ execute-payment)
function makeTimestamp() {
    return new Date().toISOString().replace(/T/, '').replace(/\..+/, '').replace(/:/g, '').replace(/-/g, '').slice(0, 14);
}

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

// Webhook test endpoint
app.get('/api/webhook/lianlian', (req, res) => {
    res.json({ status: 'webhook endpoint active', timestamp: new Date().toISOString() });
});

// --- API Endpoints ---

// Route 1: جلب الـ iframe token عبر الـ SDK مباشرةً
// ✅ FIX #3: استخدام LLPay.getTokenIframe() بدلاً من implementation يدوي
// السبب: الكود القديم كان يوقّع بـ RSA-SHA256 بينما LianLian تتوقع SHA1withRSA
// Route 1: جلب الـ iframe token مع كامل البارامترات الإلزامية لمنع الـ Decline
app.post('/api/get-iframe-token', (req, res) => {
    console.log('Fetching iframe token via SDK with full parameters...');

    const { amount, currency, customer } = req.body;
    
    // تأمين قيم افتراضية في حال نقصها لمنع فشل الطلب
    const parsedAmount = amount ? parseFloat(amount).toFixed(2) : "10.00";
    const userEmail = customer?.email || `guest_${Date.now()}@yuanway2030.com`;

    const iframeParams = {
        merchant_user_no: userEmail,
        order_amount:     parsedAmount,
        order_currency:   currency || 'USD',
        payment_method:   'inter_credit_card', // تحديد نوع الدفع لمنع الالتباس في البوابة
        customer: {
            customer_type: 'I',
            first_name:    customer?.first_name || 'Yuanway',
            last_name:     customer?.last_name  || 'Customer',
            full_name:     customer?.full_name  || 'Yuanway Customer',
            email:         userEmail
        }
    };

    LLPay.getTokenIframe({
        params: iframeParams,
        successcb: (result) => {
            try {
                const parsed = JSON.parse(result.body);
                // البوابة أحياناً تعيد التوكن مباشرة وأحياناً داخل كائن data
                const token = parsed.token || parsed.data?.token || parsed.order;
                
                if (token) {
                    return res.json({ success: true, token });
                } else {
                    console.error('LianLian Response Error Raw:', parsed);
                    return res.status(400).json({ 
                        success: false, 
                        error: parsed.return_message || 'No token in response', 
                        raw: parsed 
                    });
                }
            } catch (e) {
                return res.status(500).json({ success: false, error: 'Failed to parse response', raw: result.body });
            }
        },
        failcb: (err) => {
            console.error('getTokenIframe SDK Internal Failure:', err);
            return res.status(400).json({ success: false, error: err });
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
            merchant_order_time: makeTimestamp(),
            order_amount:        parsedAmount,
            order_currency_code: currency || 'USD',
            order_description:   'Yuan Way Transaction',
            products: [{
                product_id:        '101',
                sku:               'SKU-101',
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
            return res.json({ success: true, data: result });
        },
        failcb: (err) => {
            return res.status(400).json({ success: false, error: err });
        }
    });
});

// Route 3: Asynchronous Webhook Payment Notification Receiver
app.post('/api/webhook/lianlian', (req, res) => {
    console.log('Webhook received:', JSON.stringify(req.body));
    // قبول كل الطلبات في بيئة الـ sandbox
    res.json({ return_code: 'SUCCESS', return_message: 'OK' });
});

// --- Server Boot ---
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => console.log(`Yuanway Payment Gateway listening on port ${PORT}`));