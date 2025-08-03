// Audio utilities for recording and processing

export interface AudioRecordingOptions {
  mimeType?: string;
  audioBitsPerSecond?: number;
}

export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;

  // Check if recording is supported
  static isSupported(): boolean {
    return typeof window !== 'undefined' && 
           'MediaRecorder' in window && 
           'getUserMedia' in navigator.mediaDevices;
  }

  // Start recording
  async startRecording(options: AudioRecordingOptions = {}): Promise<void> {
    if (!AudioRecorder.isSupported()) {
      throw new Error('Audio recording is not supported in this browser');
    }

    try {
      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create MediaRecorder with options
      const defaultOptions = {
        mimeType: 'audio/webm',
        audioBitsPerSecond: 128000
      };
      
      this.mediaRecorder = new MediaRecorder(this.stream, { ...defaultOptions, ...options });
      this.audioChunks = [];

      // Handle data available event
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      // Start recording
      this.mediaRecorder.start();
    } catch (error) {
      this.cleanup();
      throw error;
    }
  }

  // Stop recording and return audio blob
  async stopRecording(): Promise<Blob | null> {
    if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
      return null;
    }

    return new Promise((resolve) => {
      this.mediaRecorder!.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.cleanup();
        resolve(audioBlob);
      };

      this.mediaRecorder.stop();
    });
  }

  // Get recording state
  getState(): RecordingState | null {
    return this.mediaRecorder?.state || null;
  }

  // Cleanup resources
  private cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    this.mediaRecorder = null;
    this.audioChunks = [];
  }
}

// Convert blob to base64
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Convert base64 to blob
export function base64ToBlob(base64: string, mimeType: string = 'audio/webm'): Blob {
  const byteCharacters = atob(base64.split(',')[1]);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

// Get audio duration from blob
export async function getAudioDuration(blob: Blob): Promise<number> {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const arrayBuffer = await blob.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  audioContext.close();
  return audioBuffer.duration;
}

// Simple audio recording function wrapper
export async function recordAudio(options?: AudioRecordingOptions): Promise<{ start: () => Promise<void>; stop: () => Promise<Blob | null> }> {
  const recorder = new AudioRecorder();
  
  return {
    start: async () => {
      await recorder.startRecording(options);
    },
    stop: async () => {
      return await recorder.stopRecording();
    }
  };
}

// Create a simple audio visualizer
export function createAudioVisualizer(
  audioContext: AudioContext,
  source: MediaStreamAudioSourceNode,
  canvas: HTMLCanvasElement
): () => void {
  const analyser = audioContext.createAnalyser();
  source.connect(analyser);
  
  analyser.fftSize = 256;
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  
  const canvasCtx = canvas.getContext('2d')!;
  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;
  
  let animationId: number;
  
  function draw() {
    animationId = requestAnimationFrame(draw);
    
    analyser.getByteFrequencyData(dataArray);
    
    canvasCtx.fillStyle = 'rgb(0, 0, 0)';
    canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
    
    const barWidth = (WIDTH / bufferLength) * 2.5;
    let barHeight;
    let x = 0;
    
    for (let i = 0; i < bufferLength; i++) {
      barHeight = dataArray[i] / 2;
      
      canvasCtx.fillStyle = `rgb(50, ${barHeight + 100}, 50)`;
      canvasCtx.fillRect(x, HEIGHT - barHeight / 2, barWidth, barHeight);
      
      x += barWidth + 1;
    }
  }
  
  draw();
  
  // Return cleanup function
  return () => {
    cancelAnimationFrame(animationId);
    analyser.disconnect();
  };
}