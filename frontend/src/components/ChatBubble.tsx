import React, { useState, useRef } from 'react';
import { Send, Sparkles, UploadCloud, AlertCircle, RefreshCw, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useUser } from '../context/UserContext.tsx';

interface ChatMessage {
  id: string;
  sender: 'user' | 'oracle';
  text: string;
  timestamp: Date;
}

export const ChatBubble: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init',
      sender: 'oracle',
      text: "Affirmative. I am the Fit Matrix Cybernetic Wellness Oracle — your interactive health chatbot for text guidance, symptom triage, and nutrition-label analysis.",
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);

  // Scanner state
  const [scanFile, setScanFile] = useState<File | null>(null);
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { token } = useUser();

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || sending) return;

    const userMsg: ChatMessage = {
      id: 'msg_' + Math.random().toString(36).substring(2, 7),
      sender: 'user',
      text: inputText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    const originalText = inputText;
    setInputText('');
    setSending(true);

    try {
      const res = await fetch('/api/chatbot/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ message: originalText })
      });

      if (res.ok) {
        const data = await res.json();
        const oracleMsg: ChatMessage = {
          id: 'msg_' + Math.random().toString(36).substring(2, 7),
          sender: 'oracle',
          text: data.reply,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, oracleMsg]);
      } else {
        const errData = await res.json();
        throw new Error(errData.error || 'Oracle communication breakdown.');
      }
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: 'msg_err',
          sender: 'oracle',
          text: `⚠️ TRANSMISSION TIMEOUT: ${err.message || 'The Oracle core is busy calculating heavy bio-vectors. Try again.'}`,
          timestamp: new Date()
        }
      ]);
    } finally {
      setSending(false);
    }
  };

  // Image Upload and Scanner mechanics
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processLabelImage(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processLabelImage(e.dataTransfer.files[0]);
    }
  };

  const processLabelImage = async (file: File) => {
    setScanFile(file);
    setScanning(true);
    setScanResult(null);
    setScanError(null);

    const formData = new FormData();
    formData.append('labelImage', file);

    try {
      const res = await fetch('/api/chatbot/scan-label', {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: formData
      });

      const data = await res.json();

      if (res.ok) {
        setScanResult(data.scannedProduct);
      } else {
        // Handle 422 or other Blur errors elegantly
        setScanError(data.message || data.error || 'Spectral analysis failed.');
      }
    } catch (err: any) {
      setScanError('Failed to pipe image stream to classifier node.');
    } finally {
      setScanning(false);
    }
  };

  const triggerSelectFile = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* LEFT: ORACLE CHAT TERMINAL */}
      <div className="border border-cyber-purple/20 bg-cyber-dark/80 backdrop-blur-md p-6 rounded-xl shadow-cyber-purple flex flex-col h-[520px] relative overflow-hidden">
        <div className="absolute top-0 right-0 border-t-2 border-r-2 border-cyber-pink/20 w-3 h-3 rounded-tr" />
        <div className="absolute bottom-0 left-0 border-b-2 border-l-2 border-cyber-pink/20 w-3 h-3 rounded-bl" />
        <div className="flex items-center justify-between border-b border-cyber-purple/15 pb-3 mb-4">
          <span className="text-xs font-mono tracking-widest text-cyber-purple font-black uppercase flex items-center gap-1.5 font-display">
            <Sparkles size={14} className="text-cyber-pink animate-pulse" /> MULTI-MODAL HEALTH CHATBOT
          </span>
          <span className="text-[9px] font-mono text-gray-500">// CYBER_COACH_SESSION</span>
        </div>

        {/* Scrollable messages container */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4 scrollbar-thin">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex flex-col max-w-[85%] ${msg.sender === 'user' ? 'ml-auto items-end' : 'mr-auto'}`}
            >
              <div
                className={`p-3.5 rounded-lg text-xs font-mono leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-cyber-purple/25 border border-cyber-purple/40 text-white shadow-cyber-purple'
                    : 'bg-cyber-bg border border-cyber-purple/15 text-gray-300 shadow-[inset_0_0_10px_rgba(188,19,254,0.05)]'
                }`}
              >
                {msg.text}
              </div>
              <span className="text-[8px] font-mono text-gray-600 mt-1 uppercase">
                {msg.sender === 'user' ? 'USER_CORE' : 'ORACLE_NODE'} @ {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
          {sending && (
            <div className="mr-auto max-w-[85%]">
              <div className="p-3 bg-cyber-bg border border-cyber-purple/20 text-cyber-purple font-mono text-xs flex items-center gap-2 rounded-lg">
                <RefreshCw size={12} className="animate-spin" /> CYBER_ORACLE IS ANALYZING SPECTRUMS...
              </div>
            </div>
          )}
        </div>

        {/* Action input bar */}
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder="Ask for meal guidance, recovery tips, or symptom support..."
            className="flex-1 bg-cyber-bg border border-cyber-purple/30 p-2.5 text-xs rounded-lg text-white focus:outline-none focus:border-cyber-pink font-mono"
            disabled={sending}
            required
          />
          <button
            type="submit"
            disabled={sending || !inputText.trim()}
            className="bg-gradient-to-r from-cyber-pink to-cyber-purple border border-cyber-pink px-4 rounded-lg font-mono text-xs flex items-center justify-center gap-1.5 cursor-pointer transition disabled:opacity-50 font-black shadow-cyber-pink text-white"
          >
            <Send size={12} /> SEND
          </button>
        </form>
      </div>

      {/* RIGHT: PACKAGED FOOD LABEL SCANNER */}
      <div className="border border-cyber-purple/20 bg-cyber-dark/80 backdrop-blur-md p-6 rounded-xl shadow-cyber-purple flex flex-col justify-between h-[520px] overflow-y-auto scrollbar-thin relative overflow-hidden">
        <div className="absolute top-0 right-0 border-t-2 border-r-2 border-cyber-pink/20 w-3 h-3 rounded-tr" />
        <div className="absolute bottom-0 left-0 border-b-2 border-l-2 border-cyber-pink/20 w-3 h-3 rounded-bl" />
        <div>
          <div className="flex items-center justify-between border-b border-cyber-purple/15 pb-3 mb-4">
            <span className="text-xs font-mono tracking-widest text-cyber-purple font-black flex items-center gap-1.5 font-display">
              <UploadCloud size={14} className="text-cyber-pink" /> PACKAGED PRODUCT LABELS ANALYZER
            </span>
            <span className="text-[9px] font-mono text-gray-500">// 28K_INDEXER</span>
          </div>

          <p className="text-xs font-mono text-gray-400 mb-4 leading-relaxed">
            Drag-and-drop or upload images of your food ingredients label. This multi-modal health assistant validates focus quality before delivering macro and nutrition insights.
          </p>

          {/* DRAG AND DROP ZONE */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={triggerSelectFile}
            className={`border-2 border-dashed p-6 rounded-xl text-center cursor-pointer transition flex flex-col items-center justify-center min-h-[160px] ${
              isDragOver
                ? 'border-cyber-pink bg-cyber-pink/5 shadow-cyber-pink'
                : 'border-cyber-purple/35 bg-cyber-bg/40 hover:border-cyber-purple/70'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            {scanning ? (
              <div className="space-y-2">
                <RefreshCw className="animate-spin text-cyber-pink mx-auto w-8 h-8" />
                <p className="text-xs font-mono text-cyber-pink font-bold tracking-widest">SCANNING METRIC WEIGHTS...</p>
              </div>
            ) : scanFile ? (
              <div className="space-y-1 text-center">
                <CheckCircle2 className="text-green-400 mx-auto w-8 h-8" />
                <p className="text-xs font-mono text-white font-bold">{scanFile.name}</p>
                <p className="text-[10px] font-mono text-gray-500">{(scanFile.size / 1024).toFixed(1)} KB - Tap to scan another</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                <UploadCloud className="text-cyber-purple mx-auto w-8 h-8 animate-bounce" />
                <p className="text-xs font-mono text-gray-300">DRAG LABEL HERE OR CLICK TO BROWSE</p>
                <p className="text-[9px] font-mono text-gray-500">Supports: PNG, JPG, WEBP (Focus facts tables closely)</p>
              </div>
            )}
          </div>

          {/* SCAN ERRORS (ANTI-BLUR ENCOUNTERS) */}
          {scanError && (
            <div className="mt-4 p-4 border border-red-500/20 bg-red-950/20 rounded-lg flex items-start gap-3 text-red-400 font-mono text-[11px] leading-relaxed">
              <AlertCircle size={18} className="shrink-0 mt-0.5 animate-pulse" />
              <div>
                <span className="font-bold uppercase tracking-widest block text-[10px]">SCAN ERROR TRIGGERED</span>
                {scanError}
              </div>
            </div>
          )}

          {/* SCAN SUCCESS / CLASSIFIER SPECIFICS */}
          {scanResult && (
            <div className="mt-4 border border-cyber-purple/25 bg-cyber-purple/5 p-4 rounded-xl space-y-3.5 shadow-cyber-purple">
              <div className="flex justify-between items-center border-b border-cyber-purple/15 pb-2">
                <div>
                  <span className="text-[8px] font-mono text-cyber-purple font-bold">IDENTIFIED COMMODITY</span>
                  <h4 className="text-sm font-black text-white tracking-tight font-display">
                    {scanResult.brand} {scanResult.productName}
                  </h4>
                </div>
                <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                  scanResult.avoid
                    ? 'bg-red-950/40 border-red-500 text-red-400'
                    : 'bg-green-950/40 border-green-500 text-green-400'
                }`}>
                  {scanResult.avoid ? 'CRITICAL: RED AVOID' : 'SYSTEM OK: PASS'}
                </div>
              </div>

              {/* Nutrients specifications */}
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-cyber-bg p-2 border border-cyber-purple/15 rounded-lg">
                  <span className="text-[8px] font-mono text-gray-500 block font-bold">CALORIES</span>
                  <span className="text-xs font-mono text-white font-black">{scanResult.calories} kcal</span>
                </div>
                <div className="bg-cyber-bg p-2 border border-cyber-purple/15 rounded-lg">
                  <span className="text-[8px] font-mono text-gray-500 block font-bold">PROTEIN</span>
                  <span className="text-xs font-mono text-cyber-pink font-black">{scanResult.protein}g</span>
                </div>
                <div className="bg-cyber-bg p-2 border border-cyber-purple/15 rounded-lg">
                  <span className="text-[8px] font-mono text-gray-500 block font-bold">CARBS</span>
                  <span className="text-xs font-mono text-cyber-purple font-black">{scanResult.carbs}g</span>
                </div>
                <div className="bg-cyber-bg p-2 border border-cyber-purple/15 rounded-lg">
                  <span className="text-[8px] font-mono text-gray-500 block font-bold">HEALTH SCORE</span>
                  <span className="text-xs font-mono text-cyber-pink font-black">{scanResult.healthScore}/100</span>
                </div>
              </div>

              {/* Warnings and advice */}
              <div className="space-y-1 bg-cyber-bg p-2.5 rounded-lg border border-cyber-purple/20 text-[10px] font-mono">
                <span className="text-cyber-pink font-bold flex items-center gap-1"><ShieldAlert size={10} /> SPECTRAL ANALYSIS WARNINGS:</span>
                <p className="text-gray-300 italic">
                  {scanResult.avoid ? `AVOID REASON: ${scanResult.avoidReason}` : "Composition meets general biological safety thresholds."}
                </p>
                <p className="text-cyber-purple mt-2 block border-t border-cyber-purple/10 pt-1 font-bold">
                  CORE INFERENCE: {scanResult.insights}
                </p>
              </div>
            </div>
          )}
        </div>

        {!scanResult && !scanning && !scanError && (
          <div className="text-center text-[10px] font-mono text-gray-600 mt-4 uppercase font-bold">
            // STATUS: WAITING FOR PRODUCT STREAM INPUT
          </div>
        )}
      </div>

    </div>
  );
};
export default ChatBubble;
