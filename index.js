import express from 'express';
import cors from 'cors';
import multer from 'multer';
import open from 'open';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = 3004;

const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY;

app.use(cors());
app.use(express.static('public'));

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

function performAction(command) {
    command = command.toLowerCase();
    console.log("Detected Command:", command);

    if (command.includes("open youtube")) {
        console.log("➡ Opening YouTube...");
        open("https://www.youtube.com");
    } else if (command.includes("open google")) {
        console.log("➡ Opening Google...");
        open("https://www.google.com");
    } else if (command.includes("time")) {
        console.log("⏰ Current Time:", new Date().toLocaleTimeString());
    } else {
        console.log("❌ Sorry, I didn't understand the command.");
    }
}

app.post('/transcribe', upload.single('audio'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No audio file uploaded.' });
    }

    if (!ASSEMBLYAI_API_KEY) {
        return res.status(500).json({ error: 'Server misconfiguration: ASSEMBLYAI_API_KEY not set.' });
    }

    try {
        console.log('🎙 Received audio, uploading to AssemblyAI...');

        // 1) Upload audio bytes to AssemblyAI
        const uploadResp = await fetch('https://api.assemblyai.com/v2/upload', {
            method: 'POST',
            headers: {
                authorization: ASSEMBLYAI_API_KEY,
            },
            body: req.file.buffer
        });

        if (!uploadResp.ok) {
            const body = await uploadResp.text().catch(() => '');
            console.error('Upload failed:', uploadResp.status, body);
            return res.status(500).json({ error: `Upload to AssemblyAI failed: ${uploadResp.status} ${uploadResp.statusText}`, details: body });
        }

        const uploadData = await uploadResp.json();
        const audio_url = uploadData.upload_url;
        console.log('✅ Uploaded audio URL:', audio_url);

        // 2) Create a transcript
        const createResp = await fetch('https://api.assemblyai.com/v2/transcript', {
            method: 'POST',
            headers: {
                authorization: ASSEMBLYAI_API_KEY,
                'content-type': 'application/json'
            },
            body: JSON.stringify({ audio_url })
        });

        if (!createResp.ok) {
            const body = await createResp.text().catch(() => '');
            console.error('Create transcript failed:', createResp.status, body);
            return res.status(500).json({ error: `Failed to create transcript: ${createResp.status} ${createResp.statusText}`, details: body });
        }

        const createData = await createResp.json();
        const transcriptId = createData.id;
        console.log('🆔 Transcript created, id:', transcriptId);

        // 3) Poll for completion
        let transcriptData;
        const poll = async () => {
            const pResp = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
                method: 'GET',
                headers: { authorization: ASSEMBLYAI_API_KEY }
            });
            if (!pResp.ok) {
                const body = await pResp.text().catch(() => '');
                throw new Error(`Polling failed: ${pResp.status} ${pResp.statusText} ${body}`);
            }
            return pResp.json();
        };

        const maxAttempts = 60;
        let attempts = 0;
        while (attempts < maxAttempts) {
            transcriptData = await poll();
            if (transcriptData.status === 'completed') break;
            if (transcriptData.status === 'error') throw new Error(transcriptData.error || 'Transcription error');
            await new Promise(r => setTimeout(r, 1000)); // wait 1s
            attempts++;
        }

        if (!transcriptData || transcriptData.status !== 'completed') {
            console.error('Transcription did not complete in time', transcriptData);
            return res.status(500).json({ error: 'Transcription did not complete in time.' });
        }

        const text = transcriptData.text || '';
        console.log('📝 Transcribed Text:', text);
        performAction(text);
        return res.json({ transcript: text });
    } catch (error) {
        console.error('Error transcribing audio:', error);
        return res.status(500).json({ error: 'Error transcribing audio.', details: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
