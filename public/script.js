const recordButton = document.getElementById('recordButton');
const transcriptDiv = document.getElementById('transcript');

let isRecording = false;
let mediaRecorder;
let chunks = [];

recordButton.addEventListener('click', () => {
    if (isRecording) {
        mediaRecorder.stop();
        recordButton.textContent = 'Start Recording';
        isRecording = false;
    } else {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                mediaRecorder = new MediaRecorder(stream);
                mediaRecorder.start();
                recordButton.textContent = 'Stop Recording';
                isRecording = true;

                mediaRecorder.ondataavailable = e => {
                    chunks.push(e.data);
                };

                mediaRecorder.onstop = () => {
                    console.log('Recording stopped.');
                    const blob = new Blob(chunks, { 'type' : 'audio/webm' });
                    console.log('Created blob:', blob);
                    chunks = [];
                    sendAudioToServer(blob);
                };
            })
            .catch(err => console.error('Error accessing microphone:', err));
    }
});

function sendAudioToServer(blob) {
    const formData = new FormData();
    formData.append('audio', blob, 'recording.webm');

    console.log('Sending audio to server...');

    fetch('/transcribe', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        console.log('Received response from server:', response);
        if (!response.ok) {
            throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Received data from server:', data);
        if (data.transcript) {
            transcriptDiv.textContent = data.transcript;
            handleCommand(data.transcript);
        } else {
            let errorMessage = 'Error: ' + (data.error || 'Unknown error');
            if (data.details) {
                errorMessage += ` (Details: ${data.details})`;
            }
            transcriptDiv.textContent = errorMessage;
        }
    })
    .catch(err => {
        console.error('Error sending audio to server:', err);
        transcriptDiv.textContent = 'Error communicating with the server: ' + err.message;
    });
}

function handleCommand(transcript) {
    const lowerTranscript = transcript.toLowerCase();
    if (lowerTranscript.includes('open ')) {
        const words = lowerTranscript.split(' ');
        const openIndex = words.findIndex(word => word === 'open');

        if (openIndex > -1 && openIndex < words.length - 1) {
            let site = words[openIndex + 1];
            site = site.replace(/[?.!]/g, '');

            if (site === 'vs' && words.length > openIndex + 2 && words[openIndex + 2].startsWith('code')) {
                transcriptDiv.textContent = "Sorry, I cannot open desktop applications.";
                return;
            }
            
            let url;
            if (!site.includes('.')) {
                url = `https://www.${site}.com`;
            } else {
                url = `https://${site}`;
            }
            
            window.open(url, '_blank');
        }
    }
}
