
import React from 'react';
import { Message } from '../types';

interface ChatBubbleProps {
  message: Message;
}

const UserIcon = () => (
  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold flex-shrink-0">
    U
  </div>
);

const BotIcon = () => (
  <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white font-bold flex-shrink-0">
    🌿
  </div>
);

const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';

  // Basic markdown-like rendering for bold text **text**
  const renderText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className={`flex items-start gap-3 my-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && <BotIcon />}
      <div
        className={`max-w-md p-3 rounded-lg shadow ${
          isUser
            ? 'bg-blue-600 text-white rounded-br-none'
            : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-none'
        }`}
      >
        <p className="text-sm whitespace-pre-wrap">{renderText(message.text)}</p>
      </div>
       {isUser && <UserIcon />}
    </div>
  );
};

export default ChatBubble;
