async function getGeminiAdvice() {
    try {
      let response = await fetch("https://api.gemini.com/getAdvice"); // Replace with real API
      let data = await response.json();
      return data.advice;
    } catch (error) {
      console.error("Gemini API error:", error);
      return "Stay hydrated and blink more!";
    }
  }