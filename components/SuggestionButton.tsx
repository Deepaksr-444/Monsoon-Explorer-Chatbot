
import React from 'react';

interface SuggestionButtonProps {
  text: string;
  onClick: (text: string) => void;
  disabled: boolean;
}

const SuggestionButton: React.FC<SuggestionButtonProps> = ({ text, onClick, disabled }) => {
  return (
    <button
      onClick={() => onClick(text)}
      disabled={disabled}
      className="px-4 py-2 text-sm bg-white/20 hover:bg-white/30 text-white rounded-full transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
    >
      {text}
    </button>
  );
};

export default SuggestionButton;
