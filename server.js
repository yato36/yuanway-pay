const express  = require('express');
const cors     = require('cors');
const LLPaySdk = require('ga-payment-sdk');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

// ─────────────────────────────────────────
//  الإعدادات
// ─────────────────────────────────────────
const MERCHANT_ID = "202605290003945002";

function formatKey(raw, type) {
    const clean = raw.replace(/-----.*?-----/g, '').replace(/[\r\n\s]+/g, '');
    if (!clean || clean.length < 100) return "INVALID_KEY";
    return `-----BEGIN ${type}-----\n${clean.match(/.{1,64}/g).join('\n')}\n-----END ${type}-----`;
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

// ─────────────────────────────────────────
//  تهيئة الـ SDK
// ─────────────────────────────────────────
const LLPay = new LLPaySdk({
    env:               'sandbox',
    sign_type:         'RSA',
    merchant_sign_key: formatKey(RAW_PRIVATE_KEY, 'PRIVATE KEY'),
    ll_sign_key:       formatKey(RAW_PUBLIC_KEY,  'PUBLIC KEY'),
    merchant_id:       MERCHANT_ID,
    is_print_log:      true,
});

// ─────────────────────────────────────────
//  Endpoint 1: جلب iframe token
//  POST /api/get-iframe-token
//  الدالة الصحيحة في SDK: getTokenIframe
//  تستدعي: GET /v3/merchants/{id}/token
// ─────────────────────────────────────────
app.post('/api/get-iframe-token', (req, res) => {
    console.log('\n📥 [get-iframe-token] طلب جديد');

    LLPay.getTokenIframe({
        successcb(result) {
            console.log('✅ رد getTokenIframe — verifySign:', result.verifySignResult);
            let data;
            try {
                data = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
            } catch {
                return res.status(500).json({ success: false, error: 'Invalid response body' });
            }

            console.log('📦 البيانات الكاملة:', JSON.stringify(data, null, 2));

            // استخراج الـ token — يكون في أحد هذه الحقول
            const token =
                data?.credential_token ||
                data?.token            ||
                data?.data?.credential_token ||
                data?.data?.token;

            if (token) {
                console.log('🎉 Token:', token);
                return res.json({ success: true, token });
            }

            // إذا ما وجد token، أرسل البيانات كاملة للتحليل
            console.error('⚠️ لم يُوجد token في الرد:', data);
            res.status(500).json({
                success: false,
                error: data?.return_message || 'Token not found in response',
                raw: data,
            });
        },
        failcb(error) {
            console.error('❌ getTokenIframe فشل:', error);
            res.status(500).json({ success: false, error: String(error) });
        },
    });
});

// ─────────────────────────────────────────
//  Endpoint 2: إنشاء طلب دفع (للـ iframe)
//  POST /api/create-order
// ─────────────────────────────────────────
app.post('/api/create-order', (req, res) => {
    const { amount = '10.00', currency = 'USD', customer = {} } = req.body;
    const ts      = Date.now();
    const orderId = `ORD_${ts}`;
    const txnId   = `TXN_${ts}`;
    const orderTime = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);

    console.log(`\n📥 [create-order] ${orderId} — ${amount} ${currency}`);

    const params = {
        merchant_transaction_id: txnId,
        notification_url: 'https://yuanway2030.com/notify.php',
        redirect_url:     'https://yuanway2030.com/success.php',
        cancel_url:       'https://yuanway2030.com/cancel.php',
        country: 'US',
        merchant_order: {
            merchant_order_id:   orderId,
            merchant_order_time: orderTime,
            order_amount:        amount,
            order_currency_code: currency,
            order_description:   'Yuanway Order',
            products: [{
                product_id: '101',
                name:       'Yuanway Product',
                price:      amount,
                quantity:   1,
                category:   'general',
            }],
        },
        customer: {
            customer_type: 'I',
            first_name:    customer.first_name || 'Customer',
            last_name:     customer.last_name  || 'User',
            full_name:     customer.full_name  || 'Customer User',
            email:         customer.email      || 'customer@yuanway2030.com',
            phone:         customer.phone      || '+966500000000',
            address: {
                line1:       '4114 Sepulveda Blvd',
                city:        'Culver City',
                state:       'CA',
                country:     'US',
                postal_code: '90230',
            },
        },
    };

    LLPay.pay({
        params,
        successcb(result) {
            let data;
            try {
                data = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
            } catch {
                return res.status(500).json({ success: false, error: 'Invalid response body' });
            }

            const paymentUrl = data?.order?.payment_url;
            if (data.return_code === 'SUCCESS' || paymentUrl) {
                console.log('✅ الطلب أُنشئ بنجاح — orderId:', orderId);
                return res.json({
                    success: true,
                    order_id: orderId,
                    txn_id:   txnId,
                    payment_url: paymentUrl,
                    data,
                });
            }
            res.status(500).json({ success: false, error: data?.return_message || 'Order creation failed' });
        },
        failcb(error) {
            console.error('❌ create-order فشل:', error);
            // محاولة استخراج payment_url حتى عند فشل التوقيع
            if (error?.body) {
                try {
                    const d = typeof error.body === 'string' ? JSON.parse(error.body) : error.body;
                    if (d?.order?.payment_url) {
                        return res.json({
                            success: true,
                            order_id: orderId,
                            txn_id:   txnId,
                            payment_url: d.order.payment_url,
                            data: d,
                        });
                    }
                } catch {}
            }
            res.status(500).json({ success: false, error: String(error) });
        },
    });
});

// ─────────────────────────────────────────
//  تشغيل السيرفر
// ─────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`\n🚀 Yuanway Payment Server — port ${PORT}`);
    console.log(`   Merchant: ${MERCHANT_ID} | Env: sandbox\n`);
});