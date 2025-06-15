# SpeakEasy: Voice-Controlled Reminder App

![SpeakEasy Logo](public/icons/icon-192x192.png)

## 🏆 Hack the Vibe Hackathon Project

SpeakEasy is a voice-controlled reminder application built with Next.js that lets you create and manage reminders using natural language. Say goodbye to forgotten tasks and hello to a more organized life!

## ✨ Features

- **Voice Recognition**: Create reminders by speaking naturally to your device
- **Natural Language Processing**: Automatically parses your spoken commands into structured reminders
- **Recurring & One-time Reminders**: Set reminders that repeat or happen just once
- **Offline Support**: Works even without an internet connection
- **Progressive Web App**: Install on your device for a native-like experience
- **Dark/Light Mode**: Choose your preferred theme
- **Mobile-Friendly**: Responsive design works on all devices

## 🛠️ Tech Stack

- **Frontend**: Next.js 13, React 18, TypeScript
- **UI Components**: Radix UI, Tailwind CSS
- **Voice Recognition**: Web Speech API with fallback to Hugging Face's Whisper model
- **PWA Features**: Service Workers, Web App Manifest
- **State Management**: React Hooks
- **Deployment**: Vercel

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/speak-easy.git
   cd speak-easy
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables
   Create a `.env.local` file in the root directory:
   ```
   HUGGING_FACE_API_KEY=your_hugging_face_api_key
   ```

4. Start the development server
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🎤 How to Use

### Creating Reminders

1. Click the microphone button or type in the input field
2. Speak or type a command like:
   - "Remind me to drink water every 30 minutes"
   - "Take a break in 2 hours"
   - "Check email every 15 minutes"

### Managing Reminders

- **Pause/Resume**: Toggle the play/pause button on any reminder
- **Delete**: Remove a reminder with the trash icon
- **View Countdown**: See the time remaining until the next reminder

## 🌐 Voice Command Examples

SpeakEasy understands a variety of time formats and commands:

- "Remind me to stand up every 45 minutes"
- "Check posture every hour"
- "Take medication in 30 minutes"
- "Call mom in 2 hours"
- "Drink water every 20 minutes"

## 📱 PWA Installation

SpeakEasy can be installed as a Progressive Web App on your device:

1. Visit the application in a supported browser
2. Look for the "Install" button in the app
3. Follow the prompts to install it on your device

## 🔒 Privacy

SpeakEasy respects your privacy:
- All voice processing happens locally when possible
- Reminders are stored in your browser's local storage
- No user data is sent to external servers except for voice transcription when needed

## 🧠 How It Works

SpeakEasy uses a combination of technologies to provide a seamless reminder experience:

1. **Voice Recognition**: Uses the Web Speech API when available, with fallback to server-side transcription via Hugging Face's Whisper model
2. **Natural Language Processing**: Parses your commands to extract the reminder text and timing information
3. **Local Storage**: Saves your reminders to your device so they persist between sessions
4. **PWA Features**: Enables installation and offline functionality

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👏 Acknowledgements

- [Next.js](https://nextjs.org/) - The React Framework
- [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework
- [Radix UI](https://www.radix-ui.com/) - Unstyled, accessible components
- [Hugging Face](https://huggingface.co/) - For the Whisper speech-to-text model
- [Lucide Icons](https://lucide.dev/) - Beautiful & consistent icons

---

Built with ❤️ for Hack the Vibe Hackathon