const { render, screen, fireEvent } = require('@testing-library/react');
const { VoiceFirstChat } = require('./src/components/voice-first-chat');

// Create a simple debug test
const debugTest = () => {
  console.log("Starting debug test...");
  
  const component = render(<VoiceFirstChat />);
  
  console.log("Initial state - looking for Text Mode button");
  const textModeButton = screen.queryByRole('button', { name: /text mode/i });
  console.log("Text Mode button found:", !!textModeButton);
  
  if (textModeButton) {
    console.log("Clicking Text Mode button to switch to Voice Mode");
    fireEvent.click(textModeButton);
    
    setTimeout(() => {
      console.log("After click - looking for Voice Mode text");
      const voiceModeText = screen.queryByText(/voice mode/i);
      console.log("Voice Mode text found:", !!voiceModeText);
      
      console.log("Looking for mic buttons");
      const allButtons = screen.getAllByRole('button');
      console.log("Total buttons found:", allButtons.length);
      
      allButtons.forEach((button, index) => {
        const svg = button.querySelector('svg');
        console.log(`Button ${index}:`, {
          textContent: button.textContent,
          hasSvg: !!svg,
          svgClasses: svg ? svg.className : 'no svg'
        });
      });
    }, 100);
  }
};

debugTest();