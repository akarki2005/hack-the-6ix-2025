const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const { createReposFromTemplate } = require('./frontend/pages/api/github_utils');

const app = express();
const PORT = 3000;
const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET || 'your-secret';

// 👇 For regular JSON parsing
app.use(bodyParser.json());

// 👇 Raw body parser for webhook endpoint
app.use('/webhook', bodyParser.raw({ type: '*/*' }));

// 🚀 Assign repos endpoint
app.post('/api/assign-repos', async (req, res) => {
    const {
        token,
        templateOwner,
        templateRepo,
        baseRepoName,
        yourUsername,
        studentList
    } = req.body;

    if (!token || !templateOwner || !templateRepo || !baseRepoName || !yourUsername || !studentList) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        const links = await createReposFromTemplate(
            token,
            templateOwner,
            templateRepo,
            baseRepoName,
            yourUsername,
            studentList
        );
        res.status(200).json({ message: 'Repos created', links });
    } catch (error) {
        console.error("Error in repo creation:", error);
        res.status(500).json({ message: 'Internal Server Error', error });
    }
});

// 🔐 Verify GitHub signature
function isValidSignature(req) {
    const signature = req.headers['x-hub-signature-256'];
    if (!signature) return false;

    const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
    const digest = 'sha256=' + hmac.update(req.body).digest('hex');

    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

// 🕸️ Webhook endpoint
app.post('/webhook', (req, res) => {
    if (!isValidSignature(req)) {
        console.warn('❌ Invalid webhook signature');
        return res.status(401).send('Invalid signature');
    }

    const payload = JSON.parse(req.body.toString());

    if (payload.action === 'opened' && payload.pull_request) {
        const pr = payload.pull_request;
        console.log(`✅ PR opened on ${payload.repository.full_name}: #${pr.number} - ${pr.title}`);
        // You can add logic here to:
        // - Trigger evaluations
        // - Send notifications
        // - Log to DB
    }

    res.status(200).send('Webhook received');
});

app.listen(PORT, () => {
    console.log(`🚀 Server listening on http://localhost:${PORT}`);
});