const express = require('express');
const multer = require('multer');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

console.log('123123')

const oauth2Client = new google.auth.OAuth2(
    '166455301843-urhn6ad8e0ccv9u09uj1c9h6na0t07ad.apps.googleusercontent.com',
    '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',
    'https://utnautiub.vercel.app/oauth2callback'
);

oauth2Client.setCredentials({
    refresh_token: '1//0euN2uuhlKTXYCgYIARAAGA4SNwF-L9Iru2llDhGz5Lp4b-sYl-JVmIBBQ0f3NfMYBRhsp0eDH8_cbfVUMSG3psZxsLGV2gr6MBQ'
});

const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

app.use(express.static(path.join(__dirname)));

app.post('/upload', upload.single('video'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Không có file nào được tải lên' });
    }

    try {
        const response = await youtube.videos.insert({
            part: 'snippet,status',
            requestBody: {
                snippet: {
                    title: req.body.title,
                    description: req.body.description,
                },
                status: {
                    privacyStatus: 'public',
                },
            },
            media: {
                body: fs.createReadStream(req.file.path),
            },
        });

        fs.unlinkSync(req.file.path);
        res.json({ message: 'Video đã được tải lên thành công', videoId: response.data.id });
    } catch (error) {
        console.error('Lỗi khi tải lên YouTube:', error);
        res.status(500).json({ message: 'Có lỗi xảy ra khi tải lên YouTube' });
    }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server đang chạy tại http://localhost:${PORT}`));

// Thêm các endpoints này vào file server.js

app.get('/auth', (req, res) => {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/youtube.upload'],
      prompt: 'consent' 
    });
    res.redirect(authUrl);
  });
  
  app.get('/oauth2callback', async (req, res) => {
    const { code } = req.query;
    try {
      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);
      console.log('Refresh Token:', tokens.refresh_token);
      res.send('Xác thực thành công! Bạn có thể đóng tab này và kiểm tra console của server để lấy refresh token.');
    } catch (error) {
      console.error('Lỗi khi lấy token:', error);
      res.status(500).send('Có lỗi xảy ra khi xác thực');
    }
  });
  
  app.post('/upload', upload.single('video'), async (req, res) => {
    try {
    } catch (error) {
      console.error('Lỗi khi tải lên YouTube:', error);
      res.status(500).json({ message: `Có lỗi xảy ra khi tải lên YouTube: ${error.message}` });
    }
  });