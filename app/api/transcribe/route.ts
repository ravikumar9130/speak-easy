import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Convert File to ArrayBuffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const audioBuffer = new Uint8Array(arrayBuffer);

    // Call Hugging Face API with retry logic
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        const response = await fetch(
          'https://api-inference.huggingface.co/models/openai/whisper-large-v3',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.HUGGING_FACE_API_KEY}`,
              'Content-Type': 'application/octet-stream',
            },
            body: audioBuffer,
          }
        );

        if (response.ok) {
          const result = await response.json();
          
          // Handle different response formats
          let transcribedText = '';
          if (typeof result === 'string') {
            transcribedText = result;
          } else if (result.text) {
            transcribedText = result.text;
          } else if (Array.isArray(result) && result.length > 0) {
            transcribedText = result[0].text || result[0];
          }
          
          return NextResponse.json({
            text: transcribedText.trim(),
            confidence: result.confidence || 0.9
          });
        } else if (response.status === 503) {
          // Model is loading, wait and retry
          await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1)));
          retryCount++;
          continue;
        } else {
          const errorText = await response.text();
          console.error('Hugging Face API error:', errorText);
          break;
        }
      } catch (fetchError) {
        console.error('Fetch error:', fetchError);
        retryCount++;
        if (retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to transcribe audio after multiple attempts' },
      { status: 500 }
    );
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}