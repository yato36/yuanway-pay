const express = require('express');
const path    = require('path');
const fs      = require('fs');
const LLPaySdk = require('ga-payment-sdk');

const app = express();

// --- Configuration Constants ---
const MERCHANT_ID = '202605290003945002';
const SUB_MERCHANT_ID = '1020260529853001';
const SUPABASE_URL = 'https://yuxwglmtycsakllhwoaj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1eHdnbG10eWNzYWtsbGh3b2FqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NDM4NTMsImV4cCI6MjA4NjMxOTg1M30.ynlf7dKK4JzwHH5YjtetqAyCbLuERxFZZ6g1kkTbYGk';

// ✅ قراءة المفتاح الخاص مباشرة من الملف النصي لضمان سلامة التشفير ومنع أخطاء ASN1
const privateKeyPath = path.join(__dirname, 'private.key');
const PRIVATE_KEY_PEM = fs.readFileSync(privateKeyPath, 'utf8').trim();

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
    merchant_sign_key: PRIVATE_KEY_PEM, 
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

// Route 1: Fetch Embedded Iframe Token via SDK
app.post('/api/get-iframe-token', (req, res) => {
    console.log('Dispatching request wrapper for getTokenIframe...');

    const params = {
        merchant_user_no: req.body.email || `guest_${Date.now()}`
    };

    LLPay.getTokenIframe({
        params: params,
        successcb: (result) => {
            console.log('SDK successful response payload:', JSON.stringify(result));
            return res.json({ success: true, token: result.token || result.body?.token });
        },
        failcb: (err) => {
            console.error('SDK explicit failure return:', JSON.stringify(err));
            return res.status(400).json({ success: false, error: err.return_message || 'Token generation rejected' });
        }
    });
});

// Route 2: Confirm and Execute Credit Card Payment via SDK
app.post('/api/execute-payment', (req, res) => {
    console.log('Dispatching request wrapper for credit card payment...');
    const { card_token, holder_name, amount, currency, email, order_id } = req.body;

    if (!card_token) {
        return res.status(400).json({ success: false, error: 'Missing token parameter' });
    }

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
            customer_type: 'I',
            first_name:    'Yuanway',
            last_name:     'Customer',
            full_name:     holder_name || 'Generic Customer',
            email:         email || 'yuanwayco@gmail.com'
        },
        payment_data: {
            card: {
                card_token:  card_token,
                holder_name: holder_name || 'Generic Customer'
            },
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
            console.log(`Payment confirmed via SDK for Transaction ID: ${currentTxnId}`);
            if (order_id) {
                await updateOrderStatus(order_id, 'مدفوع');
            }
            return res.json({ success: true, data: result });
        },
        failcb: (err) => {
            console.error('Payment authorization transaction rejected by SDK:', err);
            return res.status(400).json({ success: false, error: err.return_message || 'Transaction Declined' });
        }
    });
});

// Route 3: Asynchronous Webhook Payment Notification Receiver via SDK Parser
app.post('/api/webhook/lianlian', (req, res) => {
    const rawPayload = req.rawBody || JSON.stringify(req.body);
    
    const verification = LLPay.llNotice(rawPayload, req.headers);
    
    if (!verification.verifySignResult) {
        console.error('Rejected webhook update: Validation signature mismatch via SDK parser');
        return res.status(401).json({ return_code: 'FAIL', return_message: 'Unauthorized Signature' });
    }

    res.json({ return_code: 'SUCCESS', return_message: 'OK' });

    const payload = req.body;
    const gatewayStatus = payload.order_status || payload.status || '';
    const orderId = payload.merchant_order_id || payload.order_id || null;

    const statusMatrix = {
        'SU': 'مدفوع', 'PA': 'مدفوع', 'SUCCESS': 'مدفوع',
        'FA': 'ملغي',  'CA': 'ملغي',  'FAILED':  'ملغي', 'RE': 'ملغي'
    };

    const resolvedStatus = statusMatrix[gatewayStatus];
    if (resolvedStatus && orderId) {
        console.log(`Webhook job parsing complete [Order ID: ${orderId} -> Status: ${resolvedStatus}]`);
        updateOrderStatus(orderId, resolvedStatus);
    }
});

// --- Server Boot ---
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => console.log(`Yuanway Payment Gateway listening on port ${PORT}`));