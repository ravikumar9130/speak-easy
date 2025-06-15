'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ThemeToggle } from '@/components/theme-toggle';
import { useVoiceRecognition } from '@/hooks/use-voice-recognition';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { 
  Mic, 
  MicOff, 
  Clock, 
  Bell, 
  Plus, 
  Trash2, 
  Play, 
  Pause,
  Volume2,
  AlertCircle,
  Download,
  Loader2,
  Wifi,
  WifiOff
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Reminder {
  id: string;
  text: string;
  originalInput: string;
  intervalMs: number;
  intervalText: string;
  isActive: boolean;
  nextReminder: Date;
  timerId?: NodeJS.Timeout;
  createdAt: Date;
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function Home() {
  const [reminders, setReminders, isRemindersLoaded] = useLocalStorage<Reminder[]>('speakeasy-reminders', [], {
    serializer: (value) => JSON.stringify(value),
    deserializer: (value) => {
      const parsed = JSON.parse(value);
      return parsed.map((reminder: any) => ({
        ...reminder,
        nextReminder: new Date(reminder.nextReminder),
        createdAt: new Date(reminder.createdAt)
      }));
    }
  });
  const [textInput, setTextInput] = useState('');
  const [error, setError] = useState<string>('');
  const [notification, setNotification] = useState<string>('');
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  const {
    isListening,
    isSupported,
    transcript,
    confidence,
    error: voiceError,
    startListening,
    stopListening,
    resetTranscript,
    startAIListening,
    stopAIListening,
    isAIListening,
    isProcessing
  } = useVoiceRecognition();

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle voice transcript
  useEffect(() => {
    if (transcript) {
      setTextInput(transcript);
      resetTranscript();
    }
  }, [transcript, resetTranscript]);

  // Handle voice errors
  useEffect(() => {
    if (voiceError) {
      setError(voiceError);
      setTimeout(() => setError(''), 5000);
    }
  }, [voiceError]);

  // PWA Install prompt handling
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstallable(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
  };

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Service Worker registration
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    }
  }, []);

    // Convert string dates to Date objects after loading
  useEffect(() => {
    if (isRemindersLoaded && reminders.length > 0) {
      const convertedReminders = reminders.map(reminder => ({
        ...reminder,
        nextReminder: reminder.nextReminder instanceof Date ? 
          reminder.nextReminder : new Date(reminder.nextReminder),
        createdAt: reminder.createdAt instanceof Date ? 
          reminder.createdAt : new Date(reminder.createdAt)
      }));
      
      // Only update if needed
      const needsUpdate = JSON.stringify(reminders) !== JSON.stringify(convertedReminders);
      if (needsUpdate) {
        setReminders(convertedReminders);
      }
    }
  }, [isRemindersLoaded, reminders, setReminders]);

  const parseReminderInput = async (input: string) => {
    try {
      const response = await fetch('/api/parseReminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input })
      });
      
      if (response.ok) {
        return await response.json();
      } else {
        return parseReminderClient(input);
      }
    } catch (error) {
      return parseReminderClient(input);
    }
  };

  const parseReminderClient = (input: string): { text: string; intervalMs: number; intervalText: string } => {
    const timeRegex = /(?:in|after|every)\s*(\d+)\s*(minutes?|mins?|hours?|hrs?|seconds?|secs?)/i;
    const match = input.match(timeRegex);
    
    let intervalMs = 300000; // Default 5 minutes
    let intervalText = '5 minutes';
    
    if (match) {
      const value = parseInt(match[1]);
      const unit = match[2].toLowerCase();
      
      if (unit.startsWith('sec')) {
        intervalMs = Math.max(value * 1000, 5000); // Minimum 5 seconds
        intervalText = `${value} second${value !== 1 ? 's' : ''}`;
      } else if (unit.startsWith('min')) {
        intervalMs = Math.max(value * 60000, 30000); // Minimum 30 seconds
        intervalText = `${value} minute${value !== 1 ? 's' : ''}`;
      } else if (unit.startsWith('hour') || unit.startsWith('hr')) {
        intervalMs = value * 3600000;
        intervalText = `${value} hour${value !== 1 ? 's' : ''}`;
      }
    }
    
    let text = input.replace(timeRegex, '').replace(/^(remind me to|remind me|to)\s*/i, '').trim();
    
    if (!text || text.length < 2) {
      if (input.includes('water') || input.includes('hydrate')) {
        text = 'Drink water';
      } else if (input.includes('medication') || input.includes('medicine') || input.includes('pills')) {
        text = 'Take medication';
      } else if (input.includes('break') || input.includes('stretch')) {
        text = 'Take a break';
      } else {
        text = 'Reminder';
      }
    }
    
    // Capitalize first letter
    text = text.charAt(0).toUpperCase() + text.slice(1);
    
    return { text, intervalMs, intervalText };
  };

  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification.mp3');
      audio.play().catch(() => {
        console.log('Audio notification attempted');
      });
    } catch (error) {
      console.log('Audio notification attempted');
    }
  };

  const showNotification = useCallback((text: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('SpeakEasy Reminder', {
        body: text,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-96x96.png',
        tag: 'speakeasy-reminder'
      });
    }
    
    playNotificationSound();
    setNotification(text);
    setTimeout(() => setNotification(''), 5000);
  }, []);

  const createReminder = async () => {
    if (!textInput.trim()) return;
    
    setError('');
    const parsed = await parseReminderInput(textInput);
    
    const reminder: Reminder = {
      id: Date.now().toString(),
      text: parsed.text,
      originalInput: textInput,
      intervalMs: parsed.intervalMs,
      intervalText: parsed.intervalText,
      isActive: true,
      nextReminder: new Date(Date.now() + parsed.intervalMs),
      createdAt: new Date()
    };
    
    const timerId = setInterval(() => {
      showNotification(reminder.text);
      setReminders(prev => prev.map(r => 
        r.id === reminder.id 
          ? { ...r, nextReminder: new Date(Date.now() + r.intervalMs) }
          : r
      ));
    }, parsed.intervalMs);
    
    reminder.timerId = timerId;
    setReminders(prev => [...prev, reminder]);
    setTextInput('');
  };

  const toggleReminder = (id: string) => {
    setReminders(prev => prev.map(reminder => {
      if (reminder.id === id) {
        if (reminder.isActive && reminder.timerId) {
          clearInterval(reminder.timerId);
          return { ...reminder, isActive: false, timerId: undefined };
        } else if (!reminder.isActive) {
          const timerId = setInterval(() => {
            showNotification(reminder.text);
            setReminders(current => current.map(r => 
              r.id === id 
                ? { ...r, nextReminder: new Date(Date.now() + r.intervalMs) }
                : r
            ));
          }, reminder.intervalMs);
          
          return { 
            ...reminder, 
            isActive: true, 
            timerId,
            nextReminder: new Date(Date.now() + reminder.intervalMs) 
          };
        }
      }
      return reminder;
    }));
  };

  const deleteReminder = (id: string) => {
    setReminders(prev => {
      const reminder = prev.find(r => r.id === id);
      if (reminder?.timerId) {
        clearInterval(reminder.timerId);
      }
      return prev.filter(r => r.id !== id);
    });
  };

  const handleVoiceInput = () => {
    if (isListening) {
      stopListening();
    } else if (isAIListening) {
      stopAIListening();
    } else {
      // Try Web Speech API first, fallback to AI if not supported
      if (isSupported && isOnline) {
        startListening();
      } else {
        startAIListening();
      }
    }
  };

  const formatTimeUntil = (date: Date | string) => {
    try {
      // Ensure date is a Date object
      const dateObj = date instanceof Date ? date : new Date(date);
      
      // Check if the date is valid
      if (isNaN(dateObj.getTime())) {
        return 'Soon';
      }
      
      const now = new Date();
      const diff = dateObj.getTime() - now.getTime();
      
      if (diff <= 0) return 'Now';
      
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);
      
      if (days > 0) return `${days}d ${hours % 24}h`;
      if (hours > 0) return `${hours}h ${minutes % 60}m`;
      return `${minutes}m`;
    } catch (error) {
      console.error('Error formatting time until:', error);
      return 'Soon';
    }
  };
  

  const getVoiceButtonText = () => {
    if (isProcessing) return 'Processing...';
    if (isListening) return 'Stop Listening';
    if (isAIListening) return 'Stop AI Recording';
    return 'Start Voice Input';
  };

  const getVoiceButtonIcon = () => {
    if (isProcessing) return <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 animate-spin" />;
    if (isListening || isAIListening) return <MicOff className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />;
    return <Mic className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900 transition-colors duration-300">
      <div className="container mx-auto px-4 py-4 sm:py-8 max-w-4xl">
        {/* Header with Theme Toggle and Install Button */}
        <div className="flex justify-between items-start mb-8 sm:mb-12">
          <div className="text-center flex-1">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                <Volume2 className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                SpeakEasy
              </h1>
            </div>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto px-4">
              Your AI-powered voice reminder assistant. Simply speak or type what you need to remember, 
              and get intelligent reminders with voice and visual notifications.
            </p>
          </div>
          
          <div className="flex flex-col gap-2 ml-4">
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
              <ThemeToggle />
            </div>
            {isInstallable && (
              <Button
                onClick={handleInstallClick}
                size="icon"
                className="h-12 w-12 bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700"
                aria-label="Install SpeakEasy App"
              >
                <Download className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>

        {/* Notification Banner */}
        {notification && (
          <Alert className="mb-6 border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-200">
            <Bell className="h-4 w-4" />
            <AlertDescription className="text-lg font-medium">
              🔔 {notification}
            </AlertDescription>
          </Alert>
        )}

        {/* Error Banner */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Voice Status */}
        {(isListening || isAIListening || isProcessing) && (
          <Alert className="mb-6 border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-200">
            <Mic className="h-4 w-4" />
            <AlertDescription className="flex items-center gap-2">
              {isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
              {isProcessing ? 'Processing your voice...' : 
               isAIListening ? 'AI listening... Speak now!' : 
               'Listening... Speak now!'}
              {confidence > 0 && (
                <Badge variant="secondary" className="ml-2">
                  Confidence: {Math.round(confidence * 100)}%
                </Badge>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Main Input Card */}
        <Card className="mb-8 shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl text-center flex items-center justify-center gap-2">
              <Plus className="h-5 w-5 sm:h-6 sm:w-6" />
              Create New Reminder
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Input
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Type your reminder here (e.g., 'Remind me to drink water every 2 hours')"
                className="text-base sm:text-lg p-4 h-12 sm:h-14 border-2 focus:border-blue-500 transition-colors"
                onKeyDown={(e) => e.key === 'Enter' && createReminder()}
              />
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={handleVoiceInput}
                  disabled={isProcessing}
                  className={cn(
                    "h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg font-semibold transition-all duration-200 w-full sm:w-auto",
                    (isListening || isAIListening) 
                      ? "bg-red-500 hover:bg-red-600 animate-pulse" 
                      : "bg-blue-500 hover:bg-blue-600",
                    isProcessing && "bg-yellow-500 hover:bg-yellow-600"
                  )}
                >
                  {getVoiceButtonIcon()}
                  {getVoiceButtonText()}
                </Button>
                
                <Button
                  onClick={createReminder}
                  disabled={!textInput.trim()}
                  className="h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg font-semibold bg-green-500 hover:bg-green-600 disabled:opacity-50 w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Add Reminder
                </Button>
              </div>

              {/* Voice Recognition Status */}
              <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                {!isSupported && !isOnline && (
                  <p>⚠️ Voice recognition unavailable (offline)</p>
                )}
                {!isSupported && isOnline && (
                  <p>🤖 Using AI voice recognition</p>
                )}
                {isSupported && isOnline && (
                  <p>🎤 Web Speech API + AI fallback available</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Reminders */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200">
              Your Reminders ({reminders.length})
            </h2>
          </div>

          {!isRemindersLoaded ? (
            <Card className="text-center py-12">
              <CardContent>
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
                <p className="text-lg text-gray-500 dark:text-gray-400">Loading your reminders...</p>
              </CardContent>
            </Card>
          ) : reminders.length === 0 ? (
            <Card className="text-center py-12 border-dashed border-2 border-gray-300 dark:border-gray-600 bg-transparent">
              <CardContent>
                <Bell className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <p className="text-lg text-gray-500 dark:text-gray-400 mb-2">No reminders yet</p>
                <p className="text-gray-400 dark:text-gray-500">
                  Create your first reminder using voice or text input above
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {reminders.map((reminder) => (
                <Card 
                  key={reminder.id} 
                  className={cn(
                    "shadow-lg border-l-4 transition-all duration-200 hover:shadow-xl",
                    reminder.isActive 
                      ? "border-l-green-500 bg-green-50/50 dark:bg-green-900/20" 
                      : "border-l-gray-400 bg-gray-50/50 dark:bg-gray-800/50"
                  )}
                >
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3 min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <Badge 
                            variant={reminder.isActive ? "default" : "secondary"}
                            className="text-sm px-3 py-1"
                          >
                            {reminder.isActive ? "Active" : "Paused"}
                          </Badge>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            Every {reminder.intervalText}
                          </span>
                        </div>
                        
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-200 break-words">
                          {reminder.text}
                        </h3>
                        
                        <p className="text-gray-600 dark:text-gray-400 italic text-sm sm:text-base break-words">
                          &quot;{reminder.originalInput}&quot;
                        </p>
                        
                        {reminder.isActive && (
                          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <Clock className="h-4 w-4 flex-shrink-0" />
                            <span>
                              Next reminder in {formatTimeUntil(reminder.nextReminder)}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                        <Button
                          onClick={() => toggleReminder(reminder.id)}
                          variant="outline"
                          size="sm"
                          className="h-10 w-10 p-0"
                          aria-label={reminder.isActive ? "Pause reminder" : "Resume reminder"}
                        >
                          {reminder.isActive ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        
                        <Button
                          onClick={() => deleteReminder(reminder.id)}
                          variant="outline"
                          size="sm"
                          className="h-10 w-10 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          aria-label="Delete reminder"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Help Section */}
        <Card className="mt-12 bg-blue-50/50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl text-blue-800 dark:text-blue-200 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              How to Use SpeakEasy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-4 text-sm text-blue-700 dark:text-blue-300">
              <div>
                <h4 className="font-semibold mb-2">Voice Commands:</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>&ldquo;Remind me to drink water every 2 hours&rdquo;</li>
                  <li>&ldquo;Take medication in 30 minutes&rdquo;</li>
                  <li>&ldquo;Call mom every 3 hours&rdquo;</li>
                  <li>&ldquo;Exercise every day&rdquo;</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Features:</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>🎤 Web Speech API + AI fallback</li>
                  <li>🔔 Visual & audio notifications</li>
                  <li>📱 PWA - Install as app</li>
                  <li>🌙 Dark/Light mode</li>
                  <li>💾 Auto-save reminders</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}