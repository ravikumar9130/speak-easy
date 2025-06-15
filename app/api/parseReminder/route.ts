import { NextRequest, NextResponse } from 'next/server';

interface ParsedReminder {
  text: string;
  intervalMs: number;
  intervalText: string;
}

export async function POST(request: NextRequest) {
  try {
    const { input } = await request.json();
    
    if (!input || typeof input !== 'string') {
      return NextResponse.json(
        { error: 'Invalid input provided' },
        { status: 400 }
      );
    }

    const parsed = parseReminderInput(input.toLowerCase());
    
    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Error parsing reminder:', error);
    return NextResponse.json(
      { error: 'Failed to parse reminder' },
      { status: 500 }
    );
  }
}

function parseReminderInput(input: string): ParsedReminder {
  // Enhanced time parsing with more flexible patterns
  const timePatterns = [
    // "in X minutes/hours/seconds"
    /(?:in|after)\s*(\d+)\s*(minutes?|mins?|hours?|hrs?|seconds?|secs?)/i,
    // "every X minutes/hours/seconds"
    /every\s*(\d+)\s*(minutes?|mins?|hours?|hrs?|seconds?|secs?)/i,
    // "X minutes/hours/seconds"
    /(\d+)\s*(minutes?|mins?|hours?|hrs?|seconds?|secs?)/i
  ];

  let intervalMs = 300000; // Default 5 minutes
  let intervalText = '5 minutes';
  let matchFound = false;

  // Try each pattern
  for (const pattern of timePatterns) {
    const match = input.match(pattern);
    if (match) {
      matchFound = true;
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
      break;
    }
  }

  // Extract reminder text by removing time patterns and common prefixes
  let text = input;
  
  // Remove time expressions
  for (const pattern of timePatterns) {
    text = text.replace(pattern, '');
  }
  
  // Remove common reminder prefixes
  const prefixPatterns = [
    /^(remind me to|remind me|to|please|hey|)\s*/i,
    /\s+(remind me to|remind me|to)\s*/i
  ];
  
  for (const pattern of prefixPatterns) {
    text = text.replace(pattern, ' ');
  }
  
  // Clean up the text
  text = text
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/^(and|or|then|also)\s+/i, '')
    .trim();

  // Capitalize first letter
  if (text) {
    text = text.charAt(0).toUpperCase() + text.slice(1);
  }

  // Enhanced text extraction for common reminder types
  if (!text || text.length < 2) {
    if (input.includes('water') || input.includes('hydrate')) {
      text = 'Drink water';
    } else if (input.includes('medication') || input.includes('medicine') || input.includes('pills')) {
      text = 'Take medication';
    } else if (input.includes('break') || input.includes('stretch')) {
      text = 'Take a break';
    } else if (input.includes('call') || input.includes('phone')) {
      text = 'Make a phone call';
    } else if (input.includes('eat') || input.includes('meal') || input.includes('lunch') || input.includes('dinner')) {
      text = 'Time to eat';
    } else if (input.includes('exercise') || input.includes('workout')) {
      text = 'Exercise time';
    } else {
      text = 'Reminder';
    }
  }

  return {
    text,
    intervalMs,
    intervalText
  };
}