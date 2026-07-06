import { motion } from 'framer-motion';
import { Paperclip, SendHorizonal } from 'lucide-react';

const messages = [
  { role: 'assistant', text: 'I can help with meals, workouts, and recovery insights.' },
  { role: 'user', text: 'Suggest a protein-rich dinner for tonight.' },
];

export default function Chat() {
  return (
    <div className="page-stack">
      <section className="hero-panel compact"><div><p className="eyebrow">AI health companion</p><h1 className="hero-title">Conversational coaching, reimagined.</h1></div></section>
      <motion.div className="chat-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="chat-thread">
          {messages.map((message, index) => (
            <div key={`${message.role}-${index}`} className={`chat-bubble ${message.role}`}>
              <p>{message.text}</p>
            </div>
          ))}
        </div>
        <div className="chat-input-row">
          <button className="icon-btn"><Paperclip size={16} /></button>
          <input placeholder="Ask Fit Matrix AI..." />
          <button className="primary-btn"><SendHorizonal size={16} /></button>
        </div>
      </motion.div>
    </div>
  );
}
