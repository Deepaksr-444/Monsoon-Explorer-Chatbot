import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Chat, FunctionCall } from '@google/genai';
import { Message } from './types';
import { startChat } from './services/geminiService';
import { INITIAL_MESSAGE } from './constants';
import ChatBubble from './components/ChatBubble';
import SuggestionButton from './components/SuggestionButton';

const App: React.FC = () => {
  const [hasStarted, setHasStarted] = useState(false);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState('https://source.unsplash.com/1920x1080/?india,monsoon,landscape');
  const [currentLocation, setCurrentLocation] = useState<string>('Monsoon Landscape, India');

  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initChat = () => {
      const session = startChat();
      setChatSession(session);
    };
    initChat();
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);
  
  const processImageTag = (text: string) => {
    const imageRegex = /\[IMAGE: (.*?)\]/;
    const match = text.match(imageRegex);
    if (match && match[1]) {
      const locationFullName = match[1];
      const location = locationFullName.split(',')[0].trim();
      const newImageUrl = `https://source.unsplash.com/1920x1080/?${encodeURIComponent(location)},india,monsoon`;
      setBackgroundImage(newImageUrl);
      setCurrentLocation(locationFullName);
      return text.replace(imageRegex, '').trim();
    }
    return text;
  };

  const handleSendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim() || isLoading || !chatSession) return;

    const newUserMessage: Message = { id: `user-${Date.now()}`, role: 'user', text: messageText };
    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);
    setUserInput('');

    try {
      const stream = await chatSession.sendMessageStream({ message: messageText });
      
      let botMessageId = `bot-${Date.now()}`;
      let currentBotText = '';
      let firstChunk = true;
      let aggregatedFunctionCalls: FunctionCall[] = [];

      for await (const chunk of stream) {
        if (chunk.functionCalls) {
            aggregatedFunctionCalls.push(...chunk.functionCalls);
        }
        
        const chunkText = chunk.text;
        if(chunkText) {
            const processedText = processImageTag(chunkText);
            currentBotText += processedText;
            
            if (firstChunk) {
               setMessages(prev => [...prev, { id: botMessageId, role: 'bot', text: currentBotText }]);
               firstChunk = false;
            } else {
               setMessages(prev => prev.map(msg => 
                 msg.id === botMessageId ? { ...msg, text: currentBotText } : msg
               ));
            }
        }
      }

      if (aggregatedFunctionCalls.length > 0) {
        const functionCall = aggregatedFunctionCalls[0];
        const location = functionCall.args.location;

        const toolStatusMessage: Message = { id: `bot-tool-${Date.now()}`, role: 'bot', text: `Checking the weather for ${location}... 🌿` };
        setMessages(prev => [...prev, toolStatusMessage]);

        // --- Simulate Tool Execution ---
        const toolResult = {
            location: location,
            temperature: `${Math.floor(Math.random() * 5) + 20}°C`,
            condition: 'Light rain with misty conditions and cool breezes',
            humidity: `${Math.floor(Math.random() * 10) + 85}%`
        };
        
        const secondStream = await chatSession.sendMessageStream({
          toolResponse: {
            functionResponses: [{
              id: functionCall.id,
              name: functionCall.name,
              // FIX: Pass the structured toolResult object directly instead of a stringified version.
              // This allows the model to better understand and use the data.
              response: { result: toolResult },
            }]
          }
        });

        let finalBotMessageId = `bot-final-${Date.now()}`;
        let finalBotText = '';
        let finalFirstChunk = true;

        for await (const chunk of secondStream) {
            const chunkText = chunk.text;
            const processedText = processImageTag(chunkText);
            finalBotText += processedText;
            
            if (finalFirstChunk) {
               setMessages(prev => [...prev, { id: finalBotMessageId, role: 'bot', text: finalBotText }]);
               finalFirstChunk = false;
            } else {
               setMessages(prev => prev.map(msg => 
                 msg.id === finalBotMessageId ? { ...msg, text: finalBotText } : msg
               ));
            }
        }
      }

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = { id: `bot-${Date.now()}`, role: 'bot', text: 'Oops! Something went wrong. Please try again. ☔' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, chatSession]);

  const handleSuggestionClick = (text: string) => {
    handleSendMessage(text);
  };
  
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(userInput);
  };
  
  const handleGetStarted = () => {
    setHasStarted(true);
    setMessages([INITIAL_MESSAGE]);
  };

  return (
    <div 
        className="relative h-screen w-screen bg-cover bg-center bg-no-repeat flex items-center justify-center font-sans transition-all duration-1000"
        style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="absolute inset-0 bg-black/50"></div>
       
      {hasStarted && currentLocation && (
        <div 
            className="absolute bottom-4 left-4 text-white p-2 rounded-lg bg-black/40 backdrop-blur-sm text-sm md:text-base transition-opacity duration-500"
            style={{textShadow: '1px 1px 4px rgba(0,0,0,0.8)'}}
        >
            📍 {currentLocation}
        </div>
      )}
      
      {!hasStarted ? (
        <div className="relative text-center text-white p-8 max-w-3xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-extrabold mb-4 tracking-tight" style={{textShadow: '2px 2px 8px rgba(0,0,0,0.7)'}}>
              Monsoon Explorer 🌧️
            </h1>
            <p className="text-lg md:text-xl mb-8" style={{textShadow: '1px 1px 4px rgba(0,0,0,0.7)'}}>
              Your AI guide to India's most breathtaking rainy-season destinations.
            </p>
            <button 
                onClick={handleGetStarted} 
                className="px-8 py-4 bg-teal-500 hover:bg-teal-600 text-white rounded-full text-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg focus:outline-none focus:ring-4 focus:ring-teal-300"
            >
                Get Started
            </button>
        </div>
      ) : (
        <div className="relative flex flex-col w-full h-full max-w-3xl max-h-[90vh] md:max-h-[80vh] bg-white/20 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 overflow-hidden">
          <header className="p-4 border-b border-white/20 text-center">
            <h1 className="text-2xl font-bold text-white">Monsoon Explorer 🌧️</h1>
          </header>

          <main ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
            {messages.map(msg => (
              <ChatBubble key={msg.id} message={msg} />
            ))}
            {isLoading && (
              <div className="flex justify-start">
                  <div className="flex items-center gap-2 p-3 rounded-lg shadow bg-white dark:bg-gray-800 rounded-bl-none">
                      <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                      <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse [animation-delay:0.4s]"></div>
                  </div>
              </div>
            )}
          </main>

          <footer className="p-4 border-t border-white/20">
            <div className="flex items-center justify-center gap-2 mb-3 flex-wrap">
              <SuggestionButton text="Top 5 Spots" onClick={handleSuggestionClick} disabled={isLoading} />
              <SuggestionButton text="Travel Tips" onClick={handleSuggestionClick} disabled={isLoading} />
              <SuggestionButton text="All Destinations" onClick={handleSuggestionClick} disabled={isLoading} />
              <SuggestionButton text="Weather in Munnar?" onClick={handleSuggestionClick} disabled={isLoading} />
            </div>
            <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Ask about monsoon destinations..."
                disabled={isLoading}
                className="flex-1 w-full px-4 py-3 bg-white/10 text-white placeholder-white/60 border-2 border-transparent rounded-full focus:outline-none focus:border-teal-400 transition-colors duration-200"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="p-3 bg-teal-500 hover:bg-teal-600 text-white rounded-full disabled:bg-teal-800 disabled:cursor-not-allowed transition-colors duration-200 flex-shrink-0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              </button>
            </form>
          </footer>
        </div>
      )}
    </div>
  );
};

export default App;