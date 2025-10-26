# Voice Command AI

This project is a voice-controlled AI application that records audio from your microphone, transcribes it to text using AssemblyAI, and then performs actions based on the recognized commands.

## Features

-   Record audio directly from the browser.
-   Transcribe spoken words into text in real-time.
-   Execute commands based on the transcribed text (e.g., opening websites, checking the time).
-   Simple and intuitive user interface.

## How It Works

1.  The user clicks the "Start Recording" button on the webpage.
2.  The browser records audio using the `MediaRecorder` API.
3.  When the recording is stopped, the audio is sent to the backend server.
4.  The server uploads the audio to the AssemblyAI API for transcription.
5.  Once the transcription is complete, the server receives the text.
6.  A `performAction` function on the server checks the text for specific commands.
7.  The corresponding action is executed (e.g., opening a URL).
8.  The transcribed text is sent back to the frontend and displayed to the user.

## Available Commands

-   "open youtube" - Opens YouTube in a new tab.
-   "open google" - Opens Google in a new tab.
-   "time" - Logs the current time to the server console.

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```
2. Install the dependencies:
   ```bash
   npm install
   ```

## Usage

1. Create a `.env` file in the root directory and add your AssemblyAI API key:
   ```
   ASSEMBLYAI_API_KEY=your_api_key
   ```
2. Start the application:
   ```bash
   npm start
