const express  = require('express');
const crypto   = require('crypto');
const LLPaySdk = require('ga-payment-sdk');


let supabase = null;
try {
    const { createClient } = require('@supabase/supabase-js');
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
        supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_KEY
        );
        console.log('✅ Supabase client initialized');
    } else {
        console.warn('⚠️  SUPABASE_URL أو SUPABASE_SERVICE_KEY غير موجودة — الـ webhook لن يحدّث الطلبات');
    }
} catch (e) {
    console.warn('⚠️  @supabase/supabase-js غير مثبّت — نفّذ: npm install @supabase/supabase-js');
}

const app = express();

// ============================================================
// PRODUCTION CREDENTIALS
// ============================================================
const MERCHANT_ID     = '202605180005016003';
const SUB_MERCHANT_ID = '1020260518350007';

const PRIVATE_KEY_PEM = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQD1eRKgqs54pxVg
5gY+O6sufVk2lif1T3lAxs7byjwJ5M+rHADkT9lI7QvOLKiDb5mIfcVzNw0an6pu
SgiHI4575hP1qIxGEAGP1U4XlnFIHk1s3+uGYyeSq+rbpWAOYQpVzlFooyDQ+kyT
IzZKPUhzDVXfiyXNZy0/Hum+FmOV769Uwbd7nkfhf7WEU137s82tks8I+af3anMn
ZIZ1zhxQWO1RbAhj+p0mscJXtY68WMOfpCsR0kDpnj1npz4FXqPevwSg1gJVrDtl
9FLLQRcARJr6CPtarF/72dtJoyNuyduLSSB50nbMFyLn1VZs09SV1VRqiEN/ckFl
n/by9A5zAgMBAAECggEAAftNNoV73nuyTM/N4ALevQ5y0o4vYAD31AisZnEXkttl
K5xu2X9BLOiEHbq8yAtfs/4NU1Ycaf4FauAfIFQo9YByDn/2ScMdtVRDenPVqCZd
mv53gwtUcJsuNeii4zSReYIpVmMbnPOTz2pydtxPqQER7Nt5/w+nfwz5gpH3e6As
TfSVTS5l0UmVdPrh++hi5btt2gbeqcoVPXYBYVvukOfz3Rod3PS/mTmKBKDIhHLm
fDMcL5eKIM9XjCgolaQ4HECILg3bvrApyp3fvdOAVbj9lKhfjfLpVy00x/+cK8tC
WzG+5N5qwIvnSUBfdInY4ezQKlOZ/Eq5TiGMcwFbjQKBgQD9PecqSOXFLANi5qVx
SYf0J1EAnOoiDKGGQQHzvPpgbp6tLFFfda67fYwkhdqZRuw3NNfLRdIUHHEanggQ
tlGXtWBjPuKcXrMFbK4PhMl1u87wjARy5LGINilmNVgKn/1wImaGLG1LmeycK8CD
Iqb939RAuyIu4Uz5+73d89pK7QKBgQD4JYIkP6r5KFOqFO/Sf/wlVHMW1b4hTMP8
/mWS/3f4nMxcJBqVA8u5PSJ9lRa1tOdY5kbD3waMVXl086aKBmhFttgNWYRfi/S3
9TUsy0cnfyqSRQQasohvcdHtlIT+0d9KolJt3g8rl6FgfIXAaLZu9PiAlV836xsy
Z2B0ZASy3wKBgBmvSJ3iTOOlpiZGzGrkEVTzE+UjBSA09cD/IOqOtTpInfFkeFBd
SD6d6jPeG6DGL7kds/FbAIanp9USSDEhvL7NV5xZSXSgqjmXn0PVrPUy+jctjFn2
1gbBr4s9R9O0DGluI8XiBafQUc45JcpnHlbLd+Sk1j+4/CyymrxDOlW1AoGAZKoC
o2XYm/7KAeNAbqpQxWv+zDKlUKjtkMI6vmk4Z/hjxrU2u2Cw0lKEnWFPtyLN/vhb
mLXu2BsMjG8TDkcPIcjM2I2J76C9A6tLiQJluRYTVQb+ZT4rrtoDiVeIpD7LUGGN
AtjkWpDGfHfHYoiYCWcDMFZoLC0J+WaKcGzqow0CgYEA1iPPSLRjybHcbc455jbz
5Z5RRhN9CJtsUXNp3G0f4BN/Ur7GRv9yDdOHzEDQPTIto92Xvj7FMd83nXHnMgqW
y2BkwX/3A18fDqEaCUXzohXxHCoYuvQiRlBOZxX5EDdclSyXACGdTAXhkXI/2j7V
PQjIP6pDV4bsj4wlF8Sd2q8=
-----END PRIVATE KEY-----`;

const LL_PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA4IuEplVKAYsWgFPPwvEz
/nb6Ktz2RJwk1elmrNrn220ACM95Q8s2jLIlFM2CBfSwyPtyUJQxXOzMyKFIHOkd
Msw7ySFJD7H11u9ypklz3dduSrXcMUOArMsNAvhw0IhYWAaCqftsSMa5giOlT7uU
+QLSRrKd4hUW+kJA6ATZ1xkmqUPkJ2mU5m6xGjgDfTUpxs9QoWU1lSg92ZBfZyDn
6gtVje6VhecXrCwdEBw4s2s/BRms/GpbyBPiQTHlax34kCPT1tXJj/mSoXA4u8ox
y44VDaEvWBsYLPX4AkcJydD2uzAoryyCuB2MWQavoMWyj0IMZ+EjhW6qoCgMdJM3
ZQIDAQAB
-----END PUBLIC KEY-----`;

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

// ============================================================
// HELPER: parse LianLian SDK response body
// ============================================================
function parseLLBody(result) {
    if (!result) return {};
    if (typeof result.body === 'string') {
        try { return JSON.parse(result.body); } catch(e) { return {}; }
    }
    if (typeof result === 'object') return result;
    return {};
}

// HELPER: extract 3DS redirect URL from any response shape
function extract3DSUrl(parsed) {
    return parsed.redirect_url
        || parsed.payment_url
        || parsed.payment_redirect_url
        || parsed.data?.redirect_url
        || parsed.data?.payment_url
        || parsed.payment?.redirect_url
        || parsed.result?.redirect_url
        || parsed.order?.payment_url
        || null;
}

// HELPER: timestamp for LianLian
function makeTimestamp() {
    return new Date().toISOString()
        .replace(/[-T:.Z]/g, '')
        .slice(0, 14);
}

// ============================================================
// CORS
// ============================================================
const ALLOWED_ORIGINS = [
    'https://yuanway2030.com',
    'https://www.yuanway2030.com',
    'http://localhost:3000',
    'http://localhost:5500',
    'http://127.0.0.1:5500'
];

app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin || '*');
    } else {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods',     'GET, POST, OPTIONS, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers',     'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') return res.status(200).end();
    next();
});

app.use(express.json({
    verify: (req, res, buf) => { req.rawBody = buf.toString(); }
}));

// ============================================================
// HEALTH CHECK
// ============================================================
app.get('/', (req, res) => res.json({
    status:          'active',
    env:             'production',
    merchant_id:     MERCHANT_ID,
    sub_merchant_id: SUB_MERCHANT_ID,
    supabase:        supabase ? 'connected' : 'not configured',
    timestamp:       new Date().toISOString()
}));

app.get('/api/webhook/lianlian', (req, res) => {
    res.json({ status: 'webhook endpoint active', timestamp: new Date().toISOString() });
});

// ============================================================
// GET IFRAME TOKEN
// ============================================================
app.post('/api/get-iframe-token', (req, res) => {
    const { amount, currency, customer } = req.body;
    const parsedAmount = amount ? parseFloat(amount).toFixed(2) : '10.00';
    const usedCurrency = currency || 'SAR'; // ✅ SAR افتراضي
    const userEmail    = customer?.email || `guest_${Date.now()}@yuanway2030.com`;

    console.log(`[get-iframe-token] amount=${parsedAmount} currency=${usedCurrency} email=${userEmail}`);

    const iframeParams = {
        merchant_user_no: userEmail,
        order_amount:     parsedAmount,
        order_currency:   usedCurrency,
        payment_method:   'inter_credit_card',
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
            console.log('[get-iframe-token] raw response:', result.body);
            const parsed = parseLLBody(result);
            const token  = parsed.token || parsed.data?.token || parsed.order;
            if (token) {
                return res.json({ success: true, token });
            }
            return res.status(400).json({
                success: false,
                error:   parsed.return_message || 'No token in response',
                raw:     parsed
            });
        },
        failcb: (err) => {
            console.error('[get-iframe-token] fail:', err);
            return res.status(400).json({ success: false, error: err });
        }
    });
});

// ============================================================
// EXECUTE PAYMENT — ✅ مع دعم 3DS كامل
// ============================================================
app.post('/api/execute-payment', (req, res) => {
    const {
        card_token,
        holder_name,
        amount,
        currency,
        email,
        browser_data, // ✅ بيانات المتصفح الحقيقية من الفرونت
        order_id      // ✅ اختياري: Supabase order ID لربطه بالـ txn
    } = req.body;

    if (!card_token) {
        return res.status(400).json({ success: false, error: 'Missing card_token' });
    }

    const currentTxnId  = `TXN_${Date.now()}`;
    const parsedAmount  = parseFloat(amount) || 10.00;
    const usedCurrency  = currency || 'SAR'; // ✅ SAR افتراضي
    const clientIp      = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || '127.0.0.1';

    console.log(`[execute-payment] txn=${currentTxnId} amount=${parsedAmount} currency=${usedCurrency} ip=${clientIp} order_id=${order_id || 'N/A'}`);

    // ✅ بيانات المتصفح — استخدم الحقيقية من الفرونت إذا وُجدت
    const bd = browser_data || {};
    const terminalData = {
        user_order_ip:                        clientIp,
        user_client_browser_accept_header:    bd.accept_header    || 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        user_client_browser_color_depth:      parseInt(bd.color_depth)  || 24,
        user_client_browser_java_enabled:     false,
        user_client_browser_js_enabled:       true,
        user_client_browser_language:         bd.language         || 'ar-SA',
        user_client_browser_screen_height:    parseInt(bd.screen_height) || 900,
        user_client_browser_screen_width:     parseInt(bd.screen_width)  || 390,
        user_client_browser_time_zone_offset: bd.tz_offset        || '180',
        user_client_browser_user_agent:       bd.user_agent       || 'Mozilla/5.0 (compatible)'
    };

    const paymentParams = {
        merchant_transaction_id: currentTxnId,
        notification_url:        'https://yuanway-pay-production.up.railway.app/api/webhook/lianlian',
        redirect_url:            'https://yuanway2030.com/payment-methods.html?from_payment=true',
        cancel_url:              'https://yuanway2030.com/payment-methods.html?from_payment=cancel',
        country:                 'SA',    // ✅ كان 'US' — السعودية
        payment_method:          'inter_credit_card',
        merchant_order: {
            merchant_order_id:   `ORD_${Date.now()}`,
            merchant_order_time: makeTimestamp(),
            order_amount:        parsedAmount,
            order_currency_code: usedCurrency,
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
            customer_type: 'I',
            first_name:    'Yuanway',
            last_name:     'Customer',
            full_name:     holder_name || 'Generic Customer',
            email:         email       || 'yuanwayco@gmail.com'
        },
        payment_data: {
            card: {
                card_token,
                holder_name: holder_name || 'Generic Customer'
            },
            installments: 1
        },
        terminal_data: terminalData
    };

    LLPay.pay({
        params: paymentParams,

        successcb: (result) => {
            const parsed = parseLLBody(result);
            console.log('[execute-payment] parsed response:', JSON.stringify(parsed));

            // ربط transaction_id بالطلب في Supabase (بدون await)
            if (supabase && order_id) {
                supabase
                    .from('orders')
                    .update({ transaction_id: currentTxnId })
                    .eq('id', order_id)
                    .then(() => console.log(`[execute-payment] linked order ${order_id} → ${currentTxnId}`))
                    .catch(e => console.warn('[execute-payment] supabase link error:', e.message));
            }

            // فحص 3DS: هل يوجد redirect_url؟
            const redirectUrl = extract3DSUrl(parsed);
            if (redirectUrl) {
                console.log('[execute-payment] 3DS required → redirect:', redirectUrl);
                return res.json({
                    success:           true,
                    redirect_required: true,
                    redirect_url:      redirectUrl,
                    transaction_id:    currentTxnId,
                    data:              parsed
                });
            }

            // التحقق من حالة الدفع
            const returnCode = String(parsed.return_code || parsed.code || '').toUpperCase();
            const status     = String(parsed.status || parsed.payment_status || '').toUpperCase();

            if (returnCode && !['000000','200','0000','200000','0'].includes(returnCode)) {
                console.error('[execute-payment] Payment declined:', returnCode);
                return res.json({
                    success: false,
                    error:   parsed.return_message || parsed.message || 'لم تكتمل عملية الدفع، يرجى المحاولة مرة أخرى.',
                    data:    parsed
                });
            }

            if (status === 'WAITING_PAYMENT' || status === 'PENDING' || status === 'WAITING') {
                return res.json({
                    success: false,
                    error:   'العملية معلقة بانتظار التحقق من البنك.',
                    data:    parsed
                });
            }

            // دفع ناجح مباشرة بدون 3DS
            console.log('[execute-payment] direct success (no 3DS)');
            return res.json({
                success:           true,
                redirect_required: false,
                transaction_id:    currentTxnId,
                data:              parsed
            });
        },

        failcb: (err) => {
            console.error('[execute-payment] fail:', JSON.stringify(err));
            return res.status(400).json({ success: false, error: err });
        }
    });
});

// ============================================================
// WEBHOOK — ✅ يُحدِّث Supabase عند تأكيد الدفع من LianLian
// ============================================================
app.post('/api/webhook/lianlian', async (req, res) => {
    const body = req.body;
    console.log('[webhook] received:', JSON.stringify(body));

    // أرسل الرد لـ LianLian فوراً قبل أي معالجة
    res.json({ code: '200', message: 'success' });

    // استخرج بيانات الدفع
    const txnId  = body.merchant_transaction_id || body.txn_id || body.order_id;
    const status = (body.payment_status || body.status || '').toUpperCase();

    console.log(`[webhook] txn=${txnId} status=${status}`);

    // ✅ حدّث Supabase فقط عند نجاح الدفع الفعلي
    if (txnId && (status === 'PAID' || status === 'SUCCEEDED' || status === 'SUCCESS')) {
        if (!supabase) {
            console.warn('[webhook] Supabase غير مهيّأ — لن يُحدَّث الطلب');
            return;
        }
        try {
            const { data, error } = await supabase
                .from('orders')
                .update({
                    status:         'مدفوع',
                    paid_at:        new Date().toISOString()
                })
                .eq('transaction_id', txnId)
                .select('id');

            if (error) {
                console.error('[webhook] supabase update error:', error.message);
            } else {
                console.log(`[webhook] ✅ Order(s) updated for txn ${txnId}:`, data?.map(r => r.id));
            }
        } catch (e) {
            console.error('[webhook] unexpected error:', e.message);
        }
    } else {
        console.log(`[webhook] status "${status}" — no Supabase update needed`);
    }
});

// ============================================================
// START SERVER
// ============================================================
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n✅ Yuanway Gateway (PRODUCTION) listening on port ${PORT}`);
    console.log(`   Merchant ID:     ${MERCHANT_ID}`);
    console.log(`   Sub-Merchant ID: ${SUB_MERCHANT_ID}`);
    console.log(`   Supabase:        ${supabase ? '✅ connected' : '⚠️  not configured'}\n`);
});