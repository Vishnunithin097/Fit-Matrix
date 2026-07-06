import { motion } from 'framer-motion';
import { AlertCircle, Loader, Paperclip, SendHorizonal, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { sendChatMessage, uploadScan } from '../lib/api';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  timestamp?: Date;
}

const prompts = ['Plan my next meal', 'How can I recover today?', 'Analyze this label image', 'Suggest a strength routine'];

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', text: '🤖 Fit Matrix AI is ready. Ask for meal advice, workout support, recovery guidance, or upload a product label.', timestamp: new Date() }
  ]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const threadsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { threadsEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSubmit = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!draft.trim()) return;
    const userMessage: ChatMessage = { role: 'user', text: draft, timestamp: new Date() };
    setMessages((current) => [...current, userMessage]);
    setDraft('');
    setLoading(true);
    setError(null);

    try {
      const response = await sendChatMessage(draft);
      setMessages((current) => [...current, { role: 'assistant', text: response.data.reply || 'No response available.', timestamp: new Date() }]);
    } catch {
      setError('Unable to reach the AI assistant. Please try again.');
      setMessages((current) => [...current, { role: 'assistant', text: '❌ I hit a connectivity issue. Please retry in a moment.', timestamp: new Date() }]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const response = await uploadScan(file);
      setMessages((current) => [...current, { role: 'assistant', text: response.data?.message || '📸 Product scan complete.', timestamp: new Date() }]);
      if (response.data?.scannedProduct) {
        setMessages((current) => [...current, { role: 'assistant', text: `✅ Product detected: ${response.data.scannedProduct.productName || 'Unknown'} • ${response.data.scannedProduct.calories || 'N/A'} kcal • Health score ${response.data.scannedProduct.healthScore || 'N/A'}/10`, timestamp: new Date() }]);
      }
    } catch {
      setError('Unable to process the image. Please try a clearer photo of the label.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-stack">
      <section className="hero-panel compact">
        <div>
          <p className="eyebrow">AI health companion</p>
          <h1 className="hero-title">Conversational coaching, reimagined.</h1>
        </div>
        <div className="hero-badge">
          <Sparkles size={18} />
          <span>Gemini + local model fallback</span>
        </div>
      </section>

      <div className="prompt-row">
        {prompts.map((prompt) => (
          <button key={prompt} className="prompt-chip" onClick={() => setDraft(prompt)}>
            {prompt}
          </button>
        ))}
      </div>

      <motion.div className="chat-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="chat-thread">
          {messages.map((message, index) => (
            <motion.div
              key={`${message.role}-${index}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`chat-bubble ${message.role}`}
            >
              <p>{message.text}</p>
              {message.timestamp && (
                <span className="chat-time">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </motion.div>
          ))}
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="chat-bubble assistant">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </motion.div>
          )}
          <div ref={threadsEndRef} />
        </div>

        {error && (
          <motion.div className="chat-error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </motion.div>
        )}

        <form className="chat-input-row" onSubmit={handleSubmit}>
          <label className="icon-btn file-upload-btn" style={{ cursor: 'pointer' }} title="Upload label image">
            <Paperclip size={16} />
            <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>
          <input
            placeholder="Ask about nutrition, workouts, health, or upload a product label..."
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            disabled={loading}
          />
          <button className="primary-btn" type="submit" disabled={loading || !draft.trim()} title="Send message">
            {loading ? <Loader size={16} className="spinner" /> : <SendHorizonal size={16} />}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
