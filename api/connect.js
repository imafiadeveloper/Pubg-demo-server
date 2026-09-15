const crypto = require('crypto');

const LICENSE_SECRET = "Vm8Lk7Uj2JmsjCPVPVjrLa7zgfx3uz9E";

const VALID_KEYS = {
    "DEMO-1234-5678": "2026-12-31",
    "TEST-KEY-0001":  "2026-12-31",
    "VIP-9999-8888":  "2026-12-31"
};

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ status: false, reason: 'Method not allowed' });
    }

    try {
        let body = req.body;
        if (typeof body === 'string') {
            body = Object.fromEntries(new URLSearchParams(body));
        }

        const game     = body.game;
        const user_key = body.user_key;
        const serial   = body.serial;

        console.log(`[LOGIN] game=${game} | key=${user_key} | serial=${serial}`);

        if (!game || !user_key || !serial) {
            return res.status(200).json({
                status: false,
                reason: 'Missing required fields'
            });
        }

        if (!VALID_KEYS[user_key]) {
            console.log(`[FAIL] Key not found: ${user_key}`);
            return res.status(200).json({
                status: false,
                reason: 'Invalid key'
            });
        }

        const expDate = new Date(VALID_KEYS[user_key]);
        if (expDate < new Date()) {
            console.log(`[FAIL] Key expired: ${user_key}`);
            return res.status(200).json({
                status: false,
                reason: 'Key expired'
            });
        }

        const auth = `${game}-${user_key}-${serial}-${LICENSE_SECRET}`;
        const token = crypto.createHash('md5').update(auth).digest('hex');
        const rng = Math.floor(Date.now() / 1000);

        console.log(`[SUCCESS] key=${user_key} | token=${token}`);

        return res.status(200).json({
            status: true,
            data: {
                token: token,
                rng: rng,
                EXP: VALID_KEYS[user_key]
            }
        });

    } catch (e) {
        console.error('[ERROR]', e.message);
        return res.status(200).json({
            status: false,
            reason: 'Server error: ' + e.message
        });
    }
};
