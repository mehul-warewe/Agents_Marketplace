'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, BookOpen, Upload, FileUp, Activity } from 'lucide-react';

interface KnowledgeCreatorModalProps {
  onClose: () => void;
  onSave: (val: { title: string; content: string }) => void;
}

export default function KnowledgeCreatorModal({ onClose, onSave }: KnowledgeCreatorModalProps) {
  const [mode, setMode] = useState<'write' | 'upload'>('write');
  const [data, setData] = useState({ title: '', content: '' });
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = async (file: File) => {
    try {
      const text = await file.text();
      const filename = file.name.replace(/\.[^/.]+$/, ''); 
      setData({ title: filename, content: text });
      setMode('write'); 
    } catch (err) {
      console.error('Error reading file:', err);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-transparent"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 10 }}
        className="relative w-full max-w-lg bg-card border border-border/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col p-5 space-y-4 z-10"
      >
        <div className="flex justify-between items-center">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 text-primary">
              <BookOpen size={13} />
              <span className="text-[8px] font-bold uppercase tracking-widest leading-none">Knowledge</span>
            </div>
            <h2 className="text-base font-bold tracking-tight text-foreground uppercase leading-none">Link Data</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-foreground/5 rounded-lg text-foreground/20 hover:text-foreground transition-all">
            <X size={14} />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="flex items-center bg-secondary/30 p-0.5 rounded-lg border border-border/10">
          <button
            onClick={() => setMode('write')}
            className={`flex-1 py-1 text-[8px] font-bold uppercase tracking-widest transition-all rounded-md ${
              mode === 'write' ? 'bg-card text-foreground shadow-sm' : 'text-foreground/30 hover:text-foreground'
            }`}
          >
            Manual
          </button>
          <button
            onClick={() => setMode('upload')}
            className={`flex-1 py-1 text-[8px] font-bold uppercase tracking-widest transition-all rounded-md ${
              mode === 'upload' ? 'bg-card text-foreground shadow-sm' : 'text-foreground/30 hover:text-foreground'
            }`}
          >
            Upload
          </button>
        </div>

        {mode === 'write' ? (
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[8px] font-bold uppercase tracking-widest text-foreground/20 px-1">Title</label>
              <input
                value={data.title}
                onChange={e => setData({ ...data, title: e.target.value })}
                placeholder="Asset title..."
                className="w-full h-9 bg-secondary/30 border border-border/10 rounded-xl px-3 text-[11px] font-bold focus:border-primary/50 outline-none transition-all placeholder:text-foreground/5"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-bold uppercase tracking-widest text-foreground/20 px-1">Context</label>
              <textarea
                value={data.content}
                onChange={e => setData({ ...data, content: e.target.value })}
                placeholder="Data payload..."
                className="w-full bg-secondary/30 border border-border/10 rounded-xl px-3 py-3 text-[11px] font-medium focus:border-primary/50 outline-none min-h-[140px] resize-none no-scrollbar placeholder:text-foreground/5 leading-relaxed italic"
              />
            </div>
          </div>
        ) : (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            className={`relative w-full min-h-[180px] border border-dashed rounded-xl flex items-center justify-center transition-all ${
              isDragging
                ? 'border-primary bg-primary/10'
                : 'border-border/10 bg-secondary/10 hover:border-primary/30'
            }`}
          >
            <div className="text-center space-y-3 pointer-events-none p-4">
              <div className="flex justify-center">
                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                  <FileUp size={20} />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-bold uppercase tracking-widest">Drop source</p>
                <p className="text-[7px] font-bold text-foreground/20 uppercase tracking-widest">PDF, TXT, MD</p>
              </div>
            </div>
            <input
              type="file"
              accept=".txt,.md,.csv,.json,.pdf"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        )}

        <button
          onClick={() => onSave(data)}
          disabled={!data.title || !data.content}
          className="w-full h-9 bg-primary text-primary-foreground rounded-xl font-bold text-[9px] uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/20 disabled:opacity-30"
        >
          Finalize Asset
        </button>
      </motion.div>
    </div>
  );
}
