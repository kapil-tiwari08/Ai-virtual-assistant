import React, { useEffect, useState, useRef } from "react";
import speech, { useSpeechRecognition } from "react-speech-recognition";
import "./App.css";

function App() {
  const { listening, transcript, resetTranscript } = useSpeechRecognition();
  const [thinking, setThinking] = useState(false);
  const [aiText, setAiText] = useState("");
  const [error, setError] = useState("");
  const synthRef = useRef(window.speechSynthesis);
  const utteranceRef = useRef(null);

  const callGeminiAPI = async (message) => {
    try {
      setThinking(true);
      setError("");

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${
          import.meta.env.VITE_GEMINI_API_KEY
        }`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: message }] }],
          }),
        }
      );

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
    } catch (err) {
      setError(err.message);
      return "Sorry, there was an error processing your request.";
    } finally {
      setThinking(false);
    }
  };

  const speakText = (text) => {
    if (utteranceRef.current) {
      synthRef.current.cancel();
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;
    synthRef.current.speak(utterance);
  };

  useEffect(() => {
    if (!listening && transcript) {
      (async () => {
        const apiResponse = await callGeminiAPI(transcript);
        setAiText(apiResponse);
        speakText(apiResponse);
        resetTranscript();
      })();
    }
  }, [listening, transcript, resetTranscript]);

  const handleListen = () => {
    resetTranscript();
    setAiText("");
    setError("");
    speech.startListening();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <div className="w-full max-w-2xl bg-gray-800 p-6 rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-4">
          🎙️ Voice Assistant
        </h1>

        <div className="text-center text-lg mb-4">
          {listening ? (
            <span className="text-green-400 animate-pulse">
              🎤 Listening...
            </span>
          ) : (
            <span className="text-gray-400">
              Click the button to start speaking
            </span>
          )}
        </div>

        <button
          onClick={handleListen}
          disabled={listening || thinking}
          className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300"
        >
          {thinking ? "Processing..." : "🎤 ASK ME ANYTHING"}
        </button>

        {transcript && (
          <div className="mt-4 bg-blue-600 text-white p-3 rounded-lg shadow-md">
            <strong>You:</strong> {transcript}
          </div>
        )}

        {thinking && (
          <div className="mt-4 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-blue-400"></div>
          </div>
        )}

        {error && (
          <div className="mt-4 bg-red-600 text-white p-3 rounded-lg shadow-md">
            ❌ Error: {error}
          </div>
        )}

        {aiText && (
          <div className="mt-4 bg-gray-700 p-4 rounded-lg shadow-md border-l-4 border-green-400">
            <h3 className="text-green-400 font-semibold">🤖 AI Response:</h3>
            <p>{aiText}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
