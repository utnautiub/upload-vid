const express = require('express');
const multer = require('multer');
const { google } = require('googleapis');
const stream = require('stream');

const app = express();

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_OAUTH_CLIENT_ID,
    process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    process.env.GOOGLE_OAUTH_REDIRECT_URI
);

oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_OAUTH_REFRESH_TOKEN
});

const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

const upload = multer({ storage: multer.memoryStorage() });

app.post('/api/upload', upload.single('video'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Không có file nào được tải lên' });
    }

    try {
        const bufferStream = new stream.PassThrough();
        bufferStream.end(req.file.buffer);

        const response = await youtube.videos.insert({
            part: 'snippet,status',
            requestBody: {
                snippet: {
                    title: req.body.title,
                    description: req.body.description,
                },
                status: {
                    privacyStatus: 'public', // hoặc 'private', 'unlisted'
                },
            },
            media: {
                body: bufferStream,
            },
        });

        res.json({ message: 'Video đã được tải lên thành công', videoId: response.data.id });
    } catch (error) {
        console.error('Lỗi khi tải lên YouTube:', error);
        res.status(500).json({ message: `Có lỗi xảy ra khi tải lên YouTube: ${error.message}` });
    }
});

app.get('/api/auth', (req, res) => {
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/youtube.upload'],
        prompt: 'consent'
    });
    res.redirect(authUrl);
});

app.get('/api/oauth2callback', async (req, res) => {
    const { code } = req.query;
    try {
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);
        console.log('Refresh Token:', tokens.refresh_token);
        res.send('Xác thực thành công! Bạn có thể đóng tab này.');
    } catch (error) {
        console.error('Lỗi khi lấy token:', error);
        res.status(500).send('Có lỗi xảy ra khi xác thực');
    }
});

module.exports = app;