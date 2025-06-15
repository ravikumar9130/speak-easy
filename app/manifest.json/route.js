import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    name: "SpeakEasy - Voice Reminder Assistant",
    short_name: "SpeakEasy",
    description: "Accessible voice-activated reminder app for users with cognitive disabilities, visual impairments, and elderly users",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#3B82F6",
    orientation: "portrait-primary",
    categories: ["productivity", "accessibility", "health"],
    lang: "en-US",
    dir: "ltr",
    icons: [
      {
        "src": "/icons/icon-72x72.png",
        "sizes": "72x72",
        "type": "image/png",
        "purpose": "maskable any"
      },
      {
        "src": "/icons/icon-96x96.png",
        "sizes": "96x96",
        "type": "image/png",
        "purpose": "maskable any"
      },
      {
        "src": "/icons/icon-128x128.png",
        "sizes": "128x128",
        "type": "image/png",
        "purpose": "maskable any"
      },
      {
        "src": "/icons/icon-144x144.png",
        "sizes": "144x144",
        "type": "image/png",
        "purpose": "maskable any"
      },
      {
        "src": "/icons/icon-152x152.png",
        "sizes": "152x152",
        "type": "image/png",
        "purpose": "maskable any"
      },
      {
        "src": "/icons/icon-192x192.png",
        "sizes": "192x192",
        "type": "image/png",
        "purpose": "maskable any"
      },
      {
        "src": "/icons/icon-384x384.png",
        "sizes": "384x384",
        "type": "image/png",
        "purpose": "maskable any"
      },
      {
        "src": "/icons/icon-512x512.png",
        "sizes": "512x512",
        "type": "image/png",
        "purpose": "maskable any"
      }
    ],
    screenshots: [
      {
        "src": "/screenshots/mobile.png",
        "sizes": "390x844",
        "type": "image/png",
        "form_factor": "narrow",
        "label": "SpeakEasy Mobile View"
      }
    ],
    shortcuts: [
      {
        "name": "Quick Voice Reminder",
        "short_name": "Voice",
        "description": "Start voice input immediately",
        "url": "/?action=voice",
        "icons": [
          {
            "src": "/icons/mic-shortcut.png",
            "sizes": "96x96"
          }
        ]
      },
      {
        "name": "View Reminders",
        "short_name": "Reminders",
        "description": "View all active reminders",
        "url": "/?action=view",
        "icons": [
          {
            "src": "/icons/bell-shortcut.png",
            "sizes": "96x96"
          }
        ]
      }
    ],
    related_applications: [],
    prefer_related_applications: false,
    edge_side_panel: {
      "preferred_width": 400
    }
  });
}