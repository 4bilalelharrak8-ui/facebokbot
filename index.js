const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

app.use(bodyParser.json());
app.get('/', (req, res) => {
  res.send('السيرفر يعمل بنجاح - جاهز للربط');
});
// 1. Webhook Verification
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403);
        }
    }
});

// 2. Receive Messages
app.post('/webhook', async (req, res) => {
    const body = req.body;

    if (body.object === 'page') {
        for (const entry of body.entry) {
            const webhook_event = entry.messaging[0];
            const sender_psid = webhook_event.sender.id;

            if (webhook_event.message && webhook_event.message.text) {
                const messageText = webhook_event.message.text;
                console.log(`📩 Received: ${messageText}`);

                await sendTypingAction(sender_psid);
                const aiResponse = await getAIResponse(messageText);
                await sendMessage(sender_psid, aiResponse);
            }
        }
        res.status(200).send('EVENT_RECEIVED');
    } else {
        res.sendStatus(404);
    }
});

// 3. AI Function (تم تغيير الموديل هنا إلى gemini-2.5-flash)
async function getAIResponse(text) {
    // الرابط الجديد والموديل الصحيح من القائمة التي ظهرت لك
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    try {
        const response = await axios.post(url, {
            contents: [{
                parts: [{ text: text }]
            }]
        });

        return response.data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error("Gemini Error:", error.response ? error.response.data.error.message : error.message);
        return "عذراً، حدث خطأ في الاتصال.";
    }
}

// 4. Send Message
async function sendMessage(sender_psid, text) {
    try {
        await axios.post(`https://graph.facebook.com/v19.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
            recipient: { id: sender_psid },
            message: { text: text }
        });
        console.log("✅ Message Sent");
    } catch (e) { console.error("Send Error"); }
}

// 5. Typing Action
async function sendTypingAction(sender_psid) {
    await axios.post(`https://graph.facebook.com/v19.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
        recipient: { id: sender_psid },
        sender_action: "typing_on"
    });
}

app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});