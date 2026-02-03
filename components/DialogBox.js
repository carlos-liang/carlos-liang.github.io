import React, { useState, useEffect, useRef } from 'react';

const DialogBox = ({ messages, onDone }) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  
  const typeSpeed = 30; // ms per char
  const timerRef = useRef(null);

  useEffect(() => {
    if (currentMessageIndex >= messages.length) {
        return;
    }

    const fullMessage = messages[currentMessageIndex];
    setDisplayedText('');
    setIsTyping(true);
    let charIndex = 0;

    const typeChar = () => {
      if (charIndex < fullMessage.length) {
        setDisplayedText(fullMessage.slice(0, charIndex + 1));
        charIndex++;
        timerRef.current = setTimeout(typeChar, typeSpeed);
      } else {
        setIsTyping(false);
      }
    };

    timerRef.current = setTimeout(typeChar, typeSpeed);

    return () => clearTimeout(timerRef.current);
  }, [currentMessageIndex, messages]);

  const handleClick = () => {
    if (isTyping) {
        // Instant finish
        clearTimeout(timerRef.current);
        setDisplayedText(messages[currentMessageIndex]);
        setIsTyping(false);
    } else {
        // Next message
        if (currentMessageIndex < messages.length - 1) {
            setCurrentMessageIndex(prev => prev + 1);
        } else {
            if (onDone) onDone();
        }
    }
  };

  if (currentMessageIndex >= messages.length) return null;

  return (
    <div 
        className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-[90%] max-w-2xl z-50 select-none cursor-pointer"
        onClick={handleClick}
    >
        {/* Outer Container for spacing/shadow if needed */}
        <div className="relative">
            {/* The Dialog Box */}
            <div 
                className="bg-white border-[5px] border-[#6faedd] rounded-[30px] px-6 pt-4 pb-6 min-h-[100px] flex flex-col justify-start items-start"
                style={{
                    imageRendering: 'pixelated',
                    boxShadow: '0 0 0 2px #376888, 0 4px 0 rgba(0,0,0,0.1)' 
                }}
            >
                <p 
                    className="text-[#333333] text-base leading-relaxed m-0 w-full"
                    style={{ 
                        fontFamily: '"PokemonGb", monospace',
                        textShadow: '1px 1px 0 #ddd' 
                    }}
                >
                    {displayedText}
                    {!isTyping && (
                        <svg 
                            width="16" 
                            height="16" 
                            viewBox="0 0 16 16" 
                            className="inline-block ml-2 align-baseline animate-bounce"
                            style={{ imageRendering: 'pixelated' }}
                        >
                             {/* Red Body */}
                            <path 
                                d="M1 4h14v2h-2v2h-2v2h-2v2h-2v-2h-2v-2h-2v-2h-2z" 
                                fill="#FF0000" 
                            />
                            {/* Darker Shadow/Border on right/bottom edges */}
                            <path 
                                d="M15 4v2h-2v2h-2v2h-2v2h-1v-2h2v-2h2v-2h2v-2h1z" 
                                fill="#8B0000" 
                            />
                        </svg>
                    )}
                </p>
            </div>
        </div>
    </div>
  );
};

export default DialogBox;
