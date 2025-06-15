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

      // Create MediaRecorder with better settings
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType || undefined,
        audioBitsPerSecond: 128000
      });
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

          // Send to transcription API
          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.webm');

          const response = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Transcription failed');
          }

          const result = await response.json();
          if (result.text && result.text.trim()) {
            setTranscript(result.text.trim());
            setConfidence(result.confidence || 0.9);
            setError(null);
          } else {
            throw new Error('No speech detected in the recording');
          }
        } catch (err) {
          console.error('Transcription error:', err);
          setError(err instanceof Error ? err.message : 'Failed to process audio');
        } finally {
          setIsProcessing(false);
          setIsAIListening(false);
          
          // Cleanup
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
          }
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setError('Recording failed. Please try again.');
        setIsAIListening(false);
        setIsProcessing(false);
        
        // Cleanup
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      // Start recording with smaller chunks for better reliability
      mediaRecorder.start(1000);
      
      // Auto-stop after 15 seconds
      const stopTimeout = setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          stopAIListening();
        }
      }, 15000);

      // Store timeout reference for cleanup
      timeoutRef.current = stopTimeout;

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
    // First update the state to ensure UI responds immediately
    setIsAIListening(false);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  
    // Only then try to stop the recorder
    if (mediaRecorderRef.current) {
      try {
        // Only try to stop if it's recording
        if (mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        } else {
          // Ensure we clean up even if not recording
          setIsProcessing(false);
          
          // Ensure stream tracks are stopped
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
          }
        }
      } catch (err) {
        console.error('Error stopping AI recording:', err);
        setIsProcessing(false);
      }
    } else {
      // If no recorder exists, just reset the state
      setIsProcessing(false);
    }
  }, []);

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
            case 'service-not-allowed':
              setError('Speech service not allowed. Using AI transcription...');
              setTimeout(() => startAIListening(), 500);
              break;
            case 'bad-grammar':
              setError('Speech not recognized. Trying AI transcription...');
              setTimeout(() => startAIListening(), 500);
              break;
            default:
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
  }, [startAIListening]); // Add startAIListening to dependencies

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
  }, [isListening, isAIListening, isSupported, startAIListening]);

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