import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';

interface LogoutModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function LogoutModal({ isOpen, onConfirm, onCancel }: LogoutModalProps) {
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<'confirm' | 'progress' | 'complete'>('confirm');

  const handleStartLogout = () => {
    setStage('progress');
    setProgress(0);
  };

  useEffect(() => {
    if (stage !== 'progress') return;

    if (progress < 25) {
      const timer = setTimeout(() => setProgress(25), 300);
      return () => clearTimeout(timer);
    } else if (progress < 50) {
      const timer = setTimeout(() => setProgress(50), 600);
      return () => clearTimeout(timer);
    } else if (progress < 100) {
      const timer = setTimeout(() => setProgress(100), 900);
      return () => clearTimeout(timer);
    } else if (progress === 100) {
      const timer = setTimeout(() => setStage('complete'), 500);
      return () => clearTimeout(timer);
    }
  }, [progress, stage]);

  useEffect(() => {
    if (stage === 'complete') {
      const timer = setTimeout(() => {
        onConfirm();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [stage, onConfirm]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={stage === 'confirm' ? onCancel : undefined}
        >
          <motion.div
            className="logout-modal"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {stage === 'confirm' && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="modal-content"
              >
                <LogOut size={32} className="modal-icon" />
                <h2>End Your FitMatrix Session?</h2>
                <p>Your workout data and progress will be saved securely.</p>
                <div className="modal-actions">
                  <button className="secondary-btn" onClick={onCancel}>
                    Stay Connected
                  </button>
                  <button className="primary-btn danger" onClick={handleStartLogout}>
                    Logout
                  </button>
                </div>
              </motion.div>
            )}

            {stage === 'progress' && (
              <motion.div
                key="progress"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="modal-content"
              >
                <div className="progress-container">
                  <h2>Saving Your Progress</h2>
                  <div className="progress-bar">
                    <motion.div
                      className="progress-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>
                  <p className="progress-text">
                    {progress === 25 && 'Saving workout data...'}
                    {progress === 50 && 'Syncing nutrition metrics...'}
                    {progress === 100 && 'Finalizing session...'}
                  </p>
                  <div className="progress-milestones">
                    <motion.div
                      className={`milestone ${progress >= 25 ? 'completed' : ''}`}
                      animate={{
                        scale: progress >= 25 ? 1.1 : 1,
                        color: progress >= 25 ? '#10b981' : '#d1d5db'
                      }}
                    >
                      25%
                    </motion.div>
                    <motion.div
                      className={`milestone ${progress >= 50 ? 'completed' : ''}`}
                      animate={{
                        scale: progress >= 50 ? 1.1 : 1,
                        color: progress >= 50 ? '#10b981' : '#d1d5db'
                      }}
                    >
                      50%
                    </motion.div>
                    <motion.div
                      className={`milestone ${progress === 100 ? 'completed' : ''}`}
                      animate={{
                        scale: progress === 100 ? 1.1 : 1,
                        color: progress === 100 ? '#10b981' : '#d1d5db'
                      }}
                    >
                      100%
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            )}

            {stage === 'complete' && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="modal-content"
              >
                <CheckCircle2 size={48} className="modal-icon success" />
                <h2>Session Saved Successfully</h2>
                <p>Your progress and metrics have been securely saved.</p>
                <p className="subtext">Redirecting to login...</p>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
