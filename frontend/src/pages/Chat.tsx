import { motion } from 'framer-motion';
import { AlertCircle, Loader, Paperclip, SendHorizonal, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { sendChatMessage, uploadScan } from '../lib/api';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  timestamp?: Date;
}

const prompts = ['Plan my next meal', 'How can I recover today?', 'Analyze this food or product image', 'Suggest a strength routine', 'What should I eat before gym?', 'How do I improve sleep and recovery?'];

function formatMetric(value: any) {
  if (value === null || value === undefined || value === '') return 'N/A';
  const numeric = Number(value);
  if (!Number.isNaN(numeric)) return numeric.toString();
  return String(value);
}

function escapeMarkdownHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderMarkdown(text: string): string {
  const normalized = text.replace(/\r/g, '');
  const blocks = normalized.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);

  return blocks.map((block) => {
    const lines = block.split('\n');

    if (lines.every((line) => /^-\s+/.test(line.trim()))) {
      return `<ul>${lines.map((line) => `<li>${escapeMarkdownHtml(line.trim().replace(/^-\s+/, ''))}</li>`).join('')}</ul>`;
    }

    if (lines.every((line) => /^\d+\.\s+/.test(line.trim()))) {
      return `<ol>${lines.map((line) => `<li>${escapeMarkdownHtml(line.trim().replace(/^\d+\.\s+/, ''))}</li>`).join('')}</ol>`;
    }

    if (block.startsWith('### ')) {
      return `<h3>${escapeMarkdownHtml(block.replace(/^###\s+/, ''))}</h3>`;
    }

    if (block.startsWith('## ')) {
      return `<h2>${escapeMarkdownHtml(block.replace(/^##\s+/, ''))}</h2>`;
    }

    if (block.startsWith('# ')) {
      return `<h1>${escapeMarkdownHtml(block.replace(/^#\s+/, ''))}</h1>`;
    }

    const html = escapeMarkdownHtml(block)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.+?)__/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br />');

    return `<p>${html}</p>`;
  }).join('');
}

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', text: '🤖 FitMind AI is ready. Ask about fitness, nutrition, wellness, or upload a food photo or product label for analysis.', timestamp: new Date() }
  ]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysisCard, setAnalysisCard] = useState<any | null>(null);
  const threadsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { threadsEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSubmit = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!draft.trim()) return;
    const userMessage: ChatMessage = { role: 'user', text: draft, timestamp: new Date() };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setDraft('');
    setLoading(true);
    setError(null);

    try {
      const response = await sendChatMessage(draft, nextMessages.map(({ role, text }) => ({ role, text })));
      setMessages((current) => [...current, { role: 'assistant', text: response.data.reply || 'No response available.', timestamp: new Date() }]);
    } catch {
      setError('Unable to reach the AI assistant. Please try again.');
      setMessages((current) => [...current, { role: 'assistant', text: '❌ I hit a connectivity issue. Please retry in a moment.', timestamp: new Date() }]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file?: File) => {
    const incoming = file || selectedFile;
    if (!incoming) return;
    setLoading(true);
    setError(null);

    try {
      const response = await uploadScan(incoming);
      const analysis = response.data?.foodAnalysis || response.data?.scannedProduct;
      const replyText = response.data?.reply || response.data?.message || '📸 Image analyzed.';
      setAnalysisCard(response.data || null);
      setMessages((current) => [...current, { role: 'assistant', text: replyText, timestamp: new Date() }]);
      if (analysis) {
        const summary = response.data?.detectedImageType === 'product'
          ? `✅ ${analysis.productName || 'Product'} (${analysis.brand || 'Unknown brand'}) • ${analysis.calories || 'N/A'} kcal • Health score ${analysis.healthRating || analysis.healthScore || 'N/A'}`
          : `✅ ${analysis.foodName || 'Food item'} • ${analysis.calories || 'N/A'} kcal • ${(analysis.confidence ? (analysis.confidence * 100).toFixed(0) : 'N/A')}% confidence`;
        setMessages((current) => [...current, { role: 'assistant', text: summary, timestamp: new Date() }]);
      }
      if (response.data?.error) {
        setError(response.data.error);
      }
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Unable to process the image. Please try a clearer photo of the meal or product label.';
      setError(message);
    } finally {
      setLoading(false);
      setImagePreview(null);
      setSelectedFile(null);
    }
  };

  const handleInputFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setImagePreview(URL.createObjectURL(file));
    event.target.value = '';
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setImagePreview(URL.createObjectURL(file));
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
              {message.role === 'assistant' ? (
                <div dangerouslySetInnerHTML={{ __html: renderMarkdown(message.text) }} />
              ) : (
                <p>{message.text}</p>
              )}
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

        {imagePreview && (
          <div className="image-preview-wrap">
            <img src={imagePreview} alt="Selected preview" className="image-preview" />
            <div className="image-preview-actions">
              <button type="button" className="secondary-btn" onClick={() => { setImagePreview(null); setSelectedFile(null); }}>Remove</button>
              <button type="button" className="primary-btn small" onClick={() => handleFileUpload()} disabled={loading}>Analyze image</button>
            </div>
          </div>
        )}

        {analysisCard && (
          <div className="analysis-card">
            <div className="analysis-header">
              <span className="analysis-badge">
                {analysisCard.detectedImageType === 'product' ? 'Packaged product scan' : 'Food scan'}
              </span>
              <button type="button" className="ghost-btn" onClick={() => setAnalysisCard(null)}>Clear</button>
            </div>

            {analysisCard.detectedImageType === 'product' ? (
              <>
                <h3>{analysisCard.scannedProduct?.productName || 'Product'}</h3>
                <p className="analysis-subtitle">{analysisCard.scannedProduct?.brand || 'Brand not available'}</p>
                <div className="analysis-grid">
                  {[
                    ['Calories', analysisCard.scannedProduct?.calories],
                    ['Protein', analysisCard.scannedProduct?.protein],
                    ['Carbs', analysisCard.scannedProduct?.carbs],
                    ['Fat', analysisCard.scannedProduct?.fat],
                    ['Sugar', analysisCard.scannedProduct?.sugar],
                    ['Sodium', analysisCard.scannedProduct?.sodium],
                    ['Serving', analysisCard.scannedProduct?.servingSize],
                    ['Health /10', analysisCard.scannedProduct?.healthRating],
                  ].map(([label, value]) => (
                    <div key={label} className="analysis-stat">
                      <span>{label}</span>
                      <strong>{formatMetric(value)}</strong>
                    </div>
                  ))}
                </div>
                <ul className="analysis-list">
                  <li>Healthy: {analysisCard.scannedProduct?.healthy ? 'Yes' : 'Moderate'}</li>
                  <li>Good for weight loss: {analysisCard.scannedProduct?.weightLossSuitable ? 'Yes' : 'Not ideal'}</li>
                  <li>Good for muscle gain: {analysisCard.scannedProduct?.muscleGainSuitable ? 'Yes' : 'Moderate'}</li>
                  <li>Pre-workout: {analysisCard.scannedProduct?.goodPreWorkout ? 'Yes' : 'Not ideal'}</li>
                  <li>Post-workout: {analysisCard.scannedProduct?.goodPostWorkout ? 'Yes' : 'Moderate'}</li>
                </ul>
              </>
            ) : (
              <>
                <h3>{analysisCard.foodAnalysis?.foodName || 'Food item'}</h3>
                <p className="analysis-subtitle">{analysisCard.foodAnalysis?.confidence ? `${(analysisCard.foodAnalysis.confidence * 100).toFixed(0)}% confidence` : 'Confidence unavailable'}</p>
                <div className="analysis-grid">
                  {[
                    ['Calories', analysisCard.foodAnalysis?.calories],
                    ['Protein', analysisCard.foodAnalysis?.protein],
                    ['Carbs', analysisCard.foodAnalysis?.carbs],
                    ['Fat', analysisCard.foodAnalysis?.fat],
                    ['Fibre', analysisCard.foodAnalysis?.fibre],
                    ['Sugar', analysisCard.foodAnalysis?.sugar],
                    ['Sodium', analysisCard.foodAnalysis?.sodium],
                    ['Serving', analysisCard.foodAnalysis?.servingSize],
                  ].map(([label, value]) => (
                    <div key={label} className="analysis-stat">
                      <span>{label}</span>
                      <strong>{formatMetric(value)}</strong>
                    </div>
                  ))}
                </div>
                <ul className="analysis-list">
                  <li>Healthy: {analysisCard.foodAnalysis?.healthy ? 'Yes' : 'Moderate'}</li>
                  <li>Weight loss suitability: {analysisCard.foodAnalysis?.weightLossSuitable ? 'Good fit' : 'Less ideal'}</li>
                  <li>Muscle gain suitability: {analysisCard.foodAnalysis?.muscleGainSuitable ? 'Good fit' : 'Moderate'}</li>
                  <li>Before workout: {analysisCard.foodAnalysis?.beforeWorkout ? 'Yes' : 'Not ideal'}</li>
                  <li>After workout: {analysisCard.foodAnalysis?.afterWorkout ? 'Yes' : 'Not ideal'}</li>
                </ul>
              </>
            )}
          </div>
        )}

        <div className="upload-dropzone" onDragOver={(event) => event.preventDefault()} onDrop={handleDrop}>
          <form className="chat-input-row" onSubmit={handleSubmit}>
            <label className="icon-btn file-upload-btn" style={{ cursor: 'pointer' }} title="Upload food or product image">
              <Paperclip size={16} />
              <input type="file" accept="image/*" onChange={handleInputFile} style={{ display: 'none' }} />
            </label>
            <input
              placeholder="Ask about fitness, nutrition, wellness, or upload a food or product image..."
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              disabled={loading}
            />
            <button className="primary-btn" type="submit" disabled={loading || !draft.trim()} title="Send message">
              {loading ? <Loader size={16} className="spinner" /> : <SendHorizonal size={16} />}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
