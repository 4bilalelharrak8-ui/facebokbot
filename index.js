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

// 1. صفحة الترحيب
app.get('/', (req, res) => {
  res.send('Bot is running on Vercel!');
});

// 2. Webhook Verification
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

// 3. Receive Messages
app.post('/webhook', async (req, res) => {
    const body = req.body;

    if (body.object === 'page') {
        // نرسل الرد لفيسبوك فوراً
        res.status(200).send('EVENT_RECEIVED');

        for (const entry of body.entry) {
            const webhook_event = entry.messaging[0];
            const sender_psid = webhook_event.sender.id;

            if (webhook_event.message && webhook_event.message.text) {
                const messageText = webhook_event.message.text;
                console.log(`📩 Received: ${messageText}`);

                // المعالجة في الخلفية بدون انتظار
                processMessage(sender_psid, messageText);
            }
        }
    } else {
        res.sendStatus(404);
    }
});

// دالة معالجة الرسالة
async function processMessage(sender_psid, text) {
    try {
        // طلب الرد من الذكاء الاصطناعي
        const aiResponse = await getAIResponse(text);
        // إرسال الرد للمستخدم
        await sendMessage(sender_psid, aiResponse);
    } catch (error) {
        console.error("Error in process message:", error);
    }
}

// Gemini AI Function
async function getAIResponse(text) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    try {
        const response = await axios.post(url, {
            contents: [{ parts: [{ text: text }] }]
        });
        return response.data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error("AI Error");
        return "حدث خطأ في الاتصال بالذكاء الاصطناعي.";
    }
}

// Send Message
async function sendMessage(sender_psid, text) {
    try {
        await axios.post(`https://graph.facebook.com/v19.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
            recipient: { id: sender_psid },
            message: { text: text }
        });
        console.log("✅ Message Sent");
    } catch (e) { 
        console.error("Send Error"); 
    }
}

// مطلوب لعمل Vercel
module.exports = app;        await sendTypingAction(sender_psid);
        const aiResponse = await getAIResponse(text);
        await sendMessage(sender_psid, aiResponse);
    } catch (error) {
        console.error("Error processing message:", error);
    }
}

// Gemini AI Function
async function getAIResponse(text) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    try {
        const response = await axios.post(url, {
            contents: [{ parts: [{ text: text }] }]
        });
        return response.data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error("AI Error");
        return "حدث خطأ.";
    }
}

// Send Message
async function sendMessage(sender_psid, text) {
    try {
        await axios.post(`https://graph.facebook.com/v19.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
            recipient: { id: sender_psid },
            message: { text: text }
        });
        console.log("✅ Message Sent");
    } catch (e) { console.error("Send Error"); }
}

// Typing Action
async function sendTypingAction(sender_psid) {
    await axios.post(`https://graph.facebook.com/v19.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
        recipient: { id: sender_psid },
        sender_action: "typing_on"
    });
}

// 🟢 هذا السطر ضروري جداً لعمل Vercel
module.exports = app;
