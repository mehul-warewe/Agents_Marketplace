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
    if (e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
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
        className="relative w-full max-w-3xl bg-card border border-border/60 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col p-12 space-y-10"
      >
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-primary">
              <BookOpen size={20} strokeWidth={3} />
              <span className="text-[10px] font-black uppercase tracking-[0.5em] italic">KnowledgeGrounding</span>
            </div>
            <h2 className="text-3xl font-black italic uppercase tracking-tighter leading-none">Inject_Memory_Cluster</h2>
          </div>
          <button onClick={onClose} className="p-4 bg-foreground/5 rounded-2xl hover:bg-foreground/10 transition-all">
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
          <div className="space-y-8">
            <div className="space-y-3">
              <label className="text-[9px] font-black uppercase tracking-[0.3em] text-muted ml-4">Descriptor</label>
              <input
                value={data.title}
                onChange={e => setData({ ...data, title: e.target.value })}
                placeholder="e.g. Professional records v1"
                className="w-full bg-background border border-border/40 rounded-xl px-6 py-4 text-xs font-black uppercase focus:border-primary focus:outline-none shadow-inner"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[9px] font-black uppercase tracking-[0.3em] text-muted ml-4">Content_Stream</label>
              <textarea
                value={data.content}
                onChange={e => setData({ ...data, content: e.target.value })}
                placeholder="PASTE FULL TEXTUAL DATA..."
                className="w-full bg-background border border-border/40 rounded-2xl px-6 py-6 text-xs font-bold uppercase focus:border-primary focus:outline-none shadow-inner min-h-[250px] resize-none no-scrollbar"
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
          className="w-full h-16 bg-foreground text-background rounded-2xl font-black text-xs uppercase tracking-[0.4em] hover:bg-primary hover:text-white transition-all shadow-xl disabled:opacity-50"
        >
          Mount_Knowledge_Node
        </button>
      </motion.div>
    </div>
  );
}
