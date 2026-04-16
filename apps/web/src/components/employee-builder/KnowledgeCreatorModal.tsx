'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, BookOpen, Upload, FileUp } from 'lucide-react';

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
      const filename = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
      setData({ title: filename, content: text });
      setMode('write'); // Switch to write mode to show preview
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-background/95 backdrop-blur-3xl"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-2xl bg-card border border-border/60 rounded-3xl shadow-2xl overflow-hidden flex flex-col p-10 space-y-8"
      >
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <div className="flex items-center gap-3 text-primary">
              <BookOpen size={18} strokeWidth={2.5} />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Knowledge Base</span>
            </div>
            <h2 className="text-2xl font-bold font-display tracking-tight text-foreground">Add Context Record</h2>
          </div>
          <button onClick={onClose} className="p-2.5 bg-secondary hover:bg-muted transition-all rounded-xl text-muted-foreground">
            <X size={20} />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="flex items-center gap-4 border-b border-border/40">
          <button
            onClick={() => setMode('write')}
            className={`px-6 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
              mode === 'write'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted hover:text-foreground'
            }`}
          >
            Write
          </button>
          <button
            onClick={() => setMode('upload')}
            className={`px-6 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
              mode === 'upload'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted hover:text-foreground'
            }`}
          >
            Upload File
          </button>
        </div>

        {mode === 'write' ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 ml-1">Document Title</label>
              <input
                value={data.title}
                onChange={e => setData({ ...data, title: e.target.value })}
                placeholder="e.g. Sales Report Q1"
                className="w-full bg-secondary border border-border/40 rounded-xl px-4 py-3 text-sm font-medium focus:border-primary/40 focus:outline-none transition-all placeholder:text-muted/40"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 ml-1">Content Body</label>
              <textarea
                value={data.content}
                onChange={e => setData({ ...data, content: e.target.value })}
                placeholder="Paste the documentation source here..."
                className="w-full bg-secondary border border-border/40 rounded-xl px-4 py-4 text-sm font-medium focus:border-primary/40 focus:outline-none min-h-[220px] resize-none no-scrollbar placeholder:text-muted/40 leading-relaxed"
              />
            </div>
            {data.content && (
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
                <p className="text-[10px] text-primary font-bold mb-2">PREVIEW:</p>
                <p className="text-[10px] text-foreground/80 line-clamp-3 whitespace-pre-wrap">
                  {data.content.slice(0, 200)}...
                </p>
              </div>
            )}
          </div>
        ) : (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            className={`relative w-full min-h-[300px] border-2 border-dashed rounded-3xl flex items-center justify-center transition-all ${
              isDragging
                ? 'border-primary bg-primary/10'
                : 'border-border/40 bg-foreground/[0.02] hover:border-primary/50'
            }`}
          >
            <div className="text-center space-y-6 pointer-events-none">
              <div className="flex justify-center">
                <div className="p-6 rounded-2xl bg-primary/10 text-primary">
                  <FileUp size={32} strokeWidth={2.5} />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-bold uppercase tracking-wider">Drag & drop a file</p>
                <p className="text-[10px] text-muted">or click to browse (txt, md, csv, json)</p>
              </div>
            </div>
            <input
              type="file"
              accept=".txt,.md,.csv,.json"
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
          className="w-full h-14 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 active:scale-[0.98]"
        >
          Add to Knowledge Base
        </button>
      </motion.div>
    </div>
  );
}
