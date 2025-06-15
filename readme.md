# SpeakEasy: Voice-Controlled Reminder App

![SpeakEasy Banner](https://img.shields.io/badge/Hackathon-Hack%20the%20Vibe-blue?style=for-the-badge)

## 🏆 Hack the Vibe Hackathon Project

SpeakEasy is a voice-controlled reminder application built with Next.js that lets you create and manage reminders using natural language. Say goodbye to forgotten tasks and hello to a more organized life!

[![Next.js](https://img.shields.io/badge/Built%20with-Next.js-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Tailwind](https://img.shields.io/badge/Styled%20with-Tailwind-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/Written%20in-TypeScript-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?style=flat-square&logo=vercel)](https://vercel.com/)

![Live Demo](https://img.shields.io/badge/Live%20Demo-Available-success?style=for-the-badge)

**[https://speak-easy-neon.vercel.app/](https://speak-easy-neon.vercel.app/)**

---

## 🚀 Getting Started

### Prerequisites

* Node.js 18.x or higher
* npm or yarn

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/speak-easy.git
   cd speak-easy
   ```

2. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory:

   ```
   HUGGING_FACE_API_KEY=your_hugging_face_api_key
   ```

4. Start the development server:

   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🎤 How to Use

### Creating Reminders

* Click the microphone button or type in the input field.
* Speak or type commands like:

  * "Remind me to drink water every 30 minutes"
  * "Take a break in 2 hours"
  * "Check email every 15 minutes"

### Managing Reminders

* **Pause/Resume**: Toggle the play/pause button on reminders.
* **Delete**: Remove reminders with the trash icon.
* **View Countdown**: See the time remaining until the next reminder.

### Voice Command Examples

* "Remind me to stand up every 45 minutes"
* "Check posture every hour"
* "Take medication in 30 minutes"
* "Call mom in 2 hours"
* "Drink water every 20 minutes"

---

## 📱 PWA Installation

SpeakEasy can be installed as a Progressive Web App:

1. Visit SpeakEasy live demo at: [https://speak-easy-neon.vercel.app/](https://speak-easy-neon.vercel.app/)
2. Click the "Install" button in your browser's address bar.
3. Follow the prompts to install it on your device.

![PWA Compatible](https://img.shields.io/badge/PWA-Compatible-5A0FC8?style=flat-square&logo=pwa)

---

## 🔒 Privacy

SpeakEasy respects your privacy:

* Voice processing is local when possible.
* Reminders are stored locally on your device.
* No user data is sent externally except for voice transcription when needed.

---

## 🧠 How It Works

* **Voice Recognition**: Uses the Web Speech API, fallback to Hugging Face Whisper.
* **Natural Language Parsing**: Extracts reminder details from user speech.
* **Local Storage**: Saves reminders on the device, persisting sessions.
* **PWA Features**: Enables installation and offline use.

---

## 📈 Future Improvements & Roadmap

* Multi-language Support
* Integration with Wearables
* Cloud Sync Across Devices

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## 📄 License

Licensed under the MIT License – see the LICENSE file for details.

---

## 👏 Acknowledgements

* [Next.js](https://nextjs.org/)
* [Tailwind CSS](https://tailwindcss.com/)
* [Radix UI](https://www.radix-ui.com/)
* [Hugging Face](https://huggingface.co/)
* [Lucide Icons](https://lucide.dev/)

---

<div align="center">
  <br>
  <p>
    <strong>Built with ❤️ for Hack the Vibe Hackathon</strong>
  </p>
  <p>
    <a href="https://speak-easy-neon.vercel.app/">Try SpeakEasy Live</a>
  </p>
</div>
