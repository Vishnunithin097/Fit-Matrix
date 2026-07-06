import React, { useState, useEffect } from 'react';
import { Terminal, ShieldAlert } from 'lucide-react';

export const MotivationBlock: React.FC = () => {
  const [quote, setQuote] = useState({
    quote: "YOUR BIOLOGICAL VEHICLE IS TEMPORARY. DISCIPLINE IS CONCRETE.",
    author: "Oracle Matrix Core"
  });

  const quotesBackup = [
    { quote: "DO NOT NEGOTIATE WITH YOUR INNER DRIFT. PROGRESS IS NON-NEGOTIABLE.", author: "CHRONOS SYSTEM" },
    { quote: "THE CORE IS SECURE. EMPOWER YOUR HYPERTROPHY PROTOCOL TO REACH OPTIMAL OUTPUT.", author: "BIO-CYBER V3" },
    { quote: "WATER IS LIQUID SYSTEM COOLANT. FAILURE TO HYDRATE INITIATES CHASSIS OVERHEATING.", author: "TITAN GUARD" },
    { quote: "YOUR SYSTEM HAS EXHAUSTED ALL COMPULSIONS. ONLY PURE CONVICTION REMAINS.", author: "NEO ORACLE" }
  ];

  useEffect(() => {
    // Attempt to load live quotes if quotes_dataset exists
    const fetchQuotes = async () => {
      try {
        const res = await fetch('/api/chatbot/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: 'give me 1 random motivational quote' })
        });
        if (res.ok) {
          // If we can get simulated text
        }
      } catch (err) {
        // Fallback
      }
      // Shuffle backup
      const chosen = quotesBackup[Math.floor(Math.random() * quotesBackup.length)];
      setQuote(chosen);
    };

    fetchQuotes();
    const interval = setInterval(fetchQuotes, 60000); // cycle quotes every min
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="border border-cyber-purple/20 bg-cyber-purple/5 p-4 rounded-xl flex items-start gap-4 shadow-[inset_0_0_10px_rgba(188,19,254,0.05)] relative overflow-hidden">
      <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none">
        <Terminal size={120} className="text-cyber-purple" />
      </div>
      <div className="bg-cyber-purple/10 p-2 rounded-lg border border-cyber-purple/20 text-cyber-purple mt-1">
        <ShieldAlert size={18} className="animate-pulse" />
      </div>
      <div>
        <span className="text-[9px] font-mono tracking-widest text-cyber-purple font-bold block uppercase">// SYSTEM MOTIVATION DIRECTIVE</span>
        <p className="text-xs font-mono text-gray-300 mt-1 italic tracking-wide leading-relaxed">
          "{quote.quote}"
        </p>
        <span className="text-[10px] font-mono text-cyber-pink mt-1.5 block font-black">
          // AUTHOR_NODE: {quote.author.toUpperCase()}
        </span>
      </div>
    </div>
  );
};
export default MotivationBlock;
