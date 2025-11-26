// Speech Recognition API types for WebKit
// Note: webkitSpeechRecognition is already declared as 'any' in lib.dom.d.ts
// We only need to declare the event interfaces that aren't in the default types

declare global {
  interface SpeechRecognitionEvent extends Event {
    readonly results: SpeechRecognitionResultList
  }

  interface SpeechRecognitionErrorEvent extends Event {
    readonly error: string
  }

  interface SpeechRecognitionResultList {
    readonly length: number
    item(index: number): SpeechRecognitionResult
    [index: number]: SpeechRecognitionResult
  }

  interface SpeechRecognitionResult {
    readonly length: number
    readonly isFinal: boolean
    item(index: number): SpeechRecognitionAlternative
    [index: number]: SpeechRecognitionAlternative
  }

  interface SpeechRecognitionAlternative {
    readonly transcript: string
    readonly confidence: number
  }
}

export {}