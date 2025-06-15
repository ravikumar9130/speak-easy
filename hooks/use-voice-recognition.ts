'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface VoiceRecognitionHook {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  confidence: number;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  startAIListening: () => void;
  stopAIListening: () => void;
  isAIListening: boolean;
  isProcessing: boolean;
}

export const useVoiceRecognition = (): VoiceRecognitionHook => {
  const [isListening, setIsListening] = useState(false);
  const [isAIListening, setIsAIListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Web Speech API
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        setIsSupported(true);
        const recognition = new SpeechRecognition();
        
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 3;

        recognition.onstart = () => {
          setIsListening(true);
          setError(null);
          setTranscript('');
          
          // Set timeout for recognition
          timeoutRef.current = setTimeout(() => {
            if (recognitionRef.current) {
              recognition.stop();
              setError('Speech recognition timeout. Please try again.');
            }
          }, 15000);
        };

        recognition.onresult = (event) => {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          
          const result = event.results[0];
          if (result && result[0]) {
            setTranscript(result[0].transcript.trim());
            setConfidence(result[0].confidence || 0.8);
            setError(null);
          }
        };

        recognition.onerror = (event) => {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          
          setIsListening(false);
          
          // Handle specific errors with fallbacks
          switch (event.error) {
            case 'no-speech':
              setError('No speech detected. Trying AI transcription...');
              setTimeout(() => startAIListening(), 500);
              break;
            case 'audio-capture':
              setError('Microphone not accessible. Please check permissions and try AI transcription.');
              break;
            case 'not-allowed':
              setError('Microphone permission denied. Please enable microphone access in your browser settings.');
              break;
            case 'network':
              setError('Network error. Switching to AI transcription...');
              setTimeout(() => startAIListening(), 500);
              break;
            case 'service-not-allowed':
              setError('Speech service not allowed. Using AI transcription...');
              setTimeout(() => startAIListening(), 500);
              break;
            case 'bad-grammar':
              setError('Speech not recognized. Trying AI transcription...');
              setTimeout(() => startAIListening(), 500);
              break;
            default:
              setError(`Recognition failed: ${event.error}. Trying AI transcription...`);
              setTimeout(() => startAIListening(), 500);
          }
        };

        recognition.onend = () => {
          setIsListening(false);
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
        };

        recognitionRef.current = recognition as SpeechRecognition | null;
      } else {
        setIsSupported(false);
        setError('Speech recognition not supported. Using AI transcription.');
      }
    }
  }, []);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening && !isAIListening) {
      try {
        setError(null);
        setTranscript('');
        setConfidence(0);
        recognitionRef.current.start();
      } catch (err) {
        console.error('Speech recognition start error:', err);
        setError('Failed to start speech recognition. Trying AI transcription...');
        setTimeout(() => startAIListening(), 500);
      }
    } else if (!isSupported) {
      startAIListening();
    }
  }, [isListening, isAIListening, isSupported]);

  const stopListening = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error('Error stopping recognition:', err);
        setIsListening(false);
      }
    }
  }, [isListening]);

  const startAIListening = useCallback(async () => {
    if (isAIListening || isListening) return;

    try {
      setIsAIListening(true);
      setIsProcessing(false);
      setError(null);
      setTranscript('');
      setConfidence(0);

      // Check for MediaRecorder support
      if (!window.MediaRecorder) {
        throw new Error('MediaRecorder not supported in this browser');
      }

      // Request microphone access with better constraints
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
          channelCount: 1
        } 
      });
      
      streamRef.current = stream;
      audioChunksRef.current = [];

      // Determine best audio format
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = '';
          }
        }
      }

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsProcessing(true);
        
        try {
          const audioBlob = new Blob(audioChunksRef.current, { 
            type: mimeType || 'audio/webm' 
          });
          
          // Check if we have audio data
          if (audioBlob.size === 0) {
            throw new Error('No audio data recorded');
          }

          // Send to AI transcription
          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.webm');

          const response = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData,
          });

          if (response.ok) {
            const result = await response.json();
            if (result.text && result.text.trim()) {
              setTranscript(result.text.trim());
              setConfidence(result.confidence || 0.9);
              setError(null);
            } else {
              setError('No speech detected in the recording. Please try again.');
            }
          } else {
            const errorData = await response.json();
            setError(`AI transcription failed: ${errorData.error || 'Unknown error'}`);
          }
        } catch (err) {
          console.error('AI transcription error:', err);
          setError('Failed to process audio. Please check your internet connection and try again.');
        } finally {
          setIsProcessing(false);
        }

        // Cleanup
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        setIsAIListening(false);
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setError('Recording failed. Please try again.');
        setIsAIListening(false);
        setIsProcessing(false);
      };

      // Start recording
      mediaRecorder.start(1000); // Collect data every second
      
      // Auto-stop after 15 seconds
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          stopAIListening();
        }
      }, 15000);

    } catch (err) {
      console.error('AI listening error:', err);
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError('Microphone permission denied. Please enable microphone access in your browser settings.');
        } else if (err.name === 'NotFoundError') {
          setError('No microphone found. Please connect a microphone and try again.');
        } else if (err.name === 'NotSupportedError') {
          setError('Audio recording not supported in this browser.');
        } else {
          setError(`Microphone error: ${err.message}`);
        }
      } else {
        setError('Failed to access microphone. Please try again.');
      }
      setIsAIListening(false);
      setIsProcessing(false);
    }
  }, [isAIListening, isListening]);

  const stopAIListening = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.error('Error stopping AI recording:', err);
        setIsAIListening(false);
        setIsProcessing(false);
      }
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setConfidence(0);
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (recognitionRef.current && isListening) {
        try {
          recognitionRef.current.stop();
        } catch (err) {
          console.error('Cleanup error:', err);
        }
      }
    };
  }, [isListening]);

  return {
    isListening,
    isSupported,
    transcript,
    confidence,
    error,
    startListening,
    stopListening,
    resetTranscript,
    startAIListening,
    stopAIListening,
    isAIListening,
    isProcessing
  };
};