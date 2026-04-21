'use client';

import React, { useCallback, useMemo } from 'react';
import { Handle, Position, useEdges, NodeResizer } from 'reactflow';
import { 
  CheckCircle, 
  AlertCircle, 
  Play, 
  Loader2, 
  Zap, 
  Plus, 
  Trash2,
  Settings2,
} from 'lucide-react';
import { getToolByExecutionKey, getToolById } from './toolRegistry';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Palette } from 'lucide-react';

interface FlowNodeProps {
  id: string;
  data: {
    label: string;
    toolId?: string;
    description?: string;
    executionKey: string;
    isTrigger?: boolean;
    status?: 'idle' | 'running' | 'completed' | 'failed' | 'pending';
    onTrigger?: (nodeId: string) => void;
    onDelete?: (nodeId: string) => void;
    onAddConnect?: (params: any) => void;
    onUpdate?: (id: string, newData: any) => void;
    config?: Record<string, any>;
    isEmployeeMode?: boolean;
    inputSchema?: any[];
  };
  selected?: boolean;
}

const MemoizedMarkdown = React.memo(({ content }: { content: string }) => {
  return (
    <div className="prose prose-xs dark:prose-invert max-w-none">
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});

export default function FlowNode({ id, data, selected }: FlowNodeProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const textAreaRef = React.useRef<HTMLTextAreaElement>(null);

  const tool = useMemo(() => {
    const base = data.toolId 
      ? getToolById(data.toolId) 
      : getToolByExecutionKey(data.executionKey);
    
    if (base && (data as any).icon && typeof (data as any).icon === 'string') {
      return { ...base, icon: (data as any).icon };
    }
    return base;
  }, [data.toolId, data.executionKey, (data as any).icon]);
  
  const edges = useEdges();
  const status = data.status ?? 'idle';
  const isStickyNote = data.executionKey === 'sticky_note';

  const onPlayClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    data.onTrigger?.(id);
  }, [data, id]);

  const onDeleteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    data.onDelete?.(id);
  }, [data, id]);

  const isTrigger = data.isTrigger || tool?.isTrigger;
  const config = data.config || {};
  const needsCredential = !!(tool?.credentialTypes?.length || tool?.configFields?.some(f => f.type === 'credential'));
  const isMissingCredential = needsCredential && !config.credentialId;

  /* ── Sticky Note Variant ─────────────────────────────────────────────────── */
  if (isStickyNote) {
    const content = data.config?.content || "";
    const noteColor = data.config?.noteColor || '#4f46e5';

    return (
      <div className="relative w-full h-full group">
        <NodeResizer 
          minWidth={100} 
          minHeight={60} 
          isVisible={selected}
          lineStyle={{ border: 'none' }}
          handleStyle={{ width: 8, height: 8, background: '#6366f1', border: 'none', borderRadius: '50%' }}
        />

        <div className="absolute -left-10 top-0 hidden group-hover:flex flex-col gap-2 p-1.5 bg-card border border-border rounded-xl shadow-lg z-[100] animate-in slide-in-from-right-1">
          <div className="relative p-1.5 cursor-pointer hover:bg-muted rounded-lg transition-colors">
            <Palette size={13} className="text-muted-foreground" />
            <input 
              type="color" 
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              value={noteColor}
              onChange={(e) => data.onUpdate?.(id, { config: { ...data.config, noteColor: e.target.value } })}
            />
          </div>
          <button onClick={onDeleteClick} className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
            <Trash2 size={13} />
          </button>
        </div>

        <div 
          style={{ borderLeftColor: noteColor }}
          onDoubleClick={() => setIsEditing(true)}
          className={`
            w-full h-full p-6 bg-card border border-border border-l-4 rounded-xl shadow-sm transition-all duration-300
            ${selected ? 'ring-2 ring-indigo-500/10 border-indigo-500/40' : 'hover:border-border/80'}
            flex flex-col cursor-text overflow-hidden
          `}
        >
          <div className="flex-1 overflow-hidden">
            {isEditing ? (
              <textarea
                ref={textAreaRef}
                autoFocus
                className="w-full h-full bg-transparent border-none outline-none resize-none text-[11px] font-medium leading-relaxed overflow-hidden placeholder:text-muted-foreground/20"
                value={content}
                onChange={(e) => data.onUpdate?.(id, { config: { ...data.config, content: e.target.value } })}
                onBlur={() => setIsEditing(false)}
                placeholder="Type your notes..."
              />
            ) : (
              <div className="h-full overflow-hidden text-[11px] font-medium leading-relaxed text-foreground/80 lowercase">
                <MemoizedMarkdown content={content || "*Double click to edit*"} />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!tool) return null;

  const Icon = tool.icon as any;
  const isOutput = data.toolId === 'skill.output';
  const isInput  = data.toolId === 'skill.input';

  return (
    <div className={`group relative transition-all duration-300 ${selected ? 'scale-[1.02]' : ''}`}>
      
      {/* Node Mini Toolbar */}
      <div className={`
        absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-1 p-1 bg-card border border-border rounded-xl shadow-lg z-[100] scale-90 opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200
        ${isOutput ? '!hidden' : ''}
      `}>
        <button 
          onClick={onPlayClick} 
          className="p-1.5 text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-500/5 rounded-lg transition-all"
          title="Run from here"
        >
          <Play size={13} fill="currentColor" />
        </button>
        <div className="w-px h-3 bg-border mx-0.5" />
        {!isInput && (
          <button 
            onClick={onDeleteClick} 
            className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-all"
            title="Delete node"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      {/* Main Body */}
      <div 
        className={`
          w-[200px] min-h-[64px] bg-card border rounded-2xl flex items-center gap-3 px-3 py-2.5 transition-all duration-300 relative
          ${status === 'running' ? 'border-indigo-500 ring-4 ring-indigo-500/5' : ''}
          ${isMissingCredential && status === 'idle' ? 'border-red-500/50 bg-red-500/5' : 'border-border'}
          ${selected ? 'border-indigo-500/60 shadow-lg ring-4 ring-indigo-500/5' : 'hover:border-border/80 shadow-sm'}
        `}
      >
        {/* Pulse for running state */}
        {status === 'running' && (
          <div className="absolute inset-0 -m-1 rounded-[22px] border-2 border-indigo-500 animate-pulse opacity-20 pointer-events-none" />
        )}

        {/* Icon Section */}
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-300 bg-muted/50 ${selected ? 'border-indigo-500/30 text-indigo-600' : 'border-border text-muted-foreground/60'}`}>
          {typeof tool.icon === 'string' && (tool.icon.startsWith('http') || tool.icon.startsWith('/')) ? (
            <img src={tool.icon} alt={tool.label} className="w-5 h-5 object-contain" />
          ) : (
            <Icon size={16} strokeWidth={2.5} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold text-foreground truncate leading-tight tracking-tight uppercase">
            {data.label}
          </p>
          <p className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-[0.15em] truncate mt-1">
             {status === 'running' ? 'Active' : (isInput ? 'Trigger' : isOutput ? 'Terminal' : 'Operation')}
          </p>
        </div>

        {/* Floating Status Icon */}
        <div className="absolute top-2 right-2">
           {status === 'completed' && <CheckCircle size={10} className="text-emerald-500" strokeWidth={3} />}
           {status === 'failed' && <AlertCircle size={10} className="text-red-500" strokeWidth={3} />}
           {status === 'running' && <Loader2 size={10} className="animate-spin text-indigo-500" strokeWidth={3} />}
           {isTrigger && status === 'idle' && !isMissingCredential && <Zap size={8} className="text-amber-500 fill-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]" />}
        </div>
        
        {isMissingCredential && status === 'idle' && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 bg-red-500 rounded text-[7px] font-black uppercase text-white shadow-sm animate-pulse">
            <AlertCircle size={8} strokeWidth={4} />
            Setup Required
          </div>
        )}
      </div>

      {/* Connection Handles */}
      {!isTrigger && (
        <Handle
          type="target"
          position={Position.Top}
          className="!w-1.5 !h-1.5 !bg-border !border-none !opacity-0 !pointer-events-none"
        />
      )}
      
      {/* Dynamic Sockets */}
      {((data.inputSchema?.length || 0) > 0 || tool.outputs.length > 1) && !isOutput && (
        <div className="absolute inset-x-0 bottom-[-4px] flex justify-around px-2 pointer-events-none gap-4">
          {(data.inputSchema || tool.outputs).map((socket: any) => {
            const socketName = socket.name;
            const isConnected = edges.some(e => e.source === id && e.sourceHandle === socketName);
            const isChoice = socketName.toLowerCase() === 'true' || socketName.toLowerCase() === 'false';
            
            return (
              <div key={socketName} className="relative flex flex-col items-center pointer-events-auto">
                <Handle
                  type="source"
                  position={Position.Bottom}
                  id={socketName}
                  className={`!w-2 !h-2 !border-none !opacity-100 !relative !bottom-0 !left-auto !translate-x-0 transition-all ${
                    isConnected ? '!bg-indigo-500 shadow-sm' : '!bg-border hover:!bg-indigo-500'
                  }`}
                />
                {!isConnected && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      data.onAddConnect?.({
                        nodeId: id,
                        handleId: socketName,
                        handleType: 'source',
                        socketType: socket.type || 'any',
                        clientX: e.clientX,
                        clientY: e.clientY
                      });
                    }}
                    className="w-6 h-6 mt-3 bg-card border border-border rounded-lg flex items-center justify-center text-muted-foreground/40 hover:bg-muted hover:text-foreground transition-all shadow-sm group/plus"
                  >
                    <Plus size={12} strokeWidth={3} className="group-hover:scale-110 transition-transform" />
                  </button>
                )}
                <span className={`mt-1.5 text-[8px] font-black uppercase tracking-[0.1em] transition-colors ${isConnected ? 'text-indigo-500' : 'text-muted-foreground/30'}`}>
                  {socket.label || socket.name}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Standard Single Handle */}
      {(tool.outputs.length === 1 && (!data.inputSchema || data.inputSchema.length === 0 || isInput)) && !isOutput && (
        <>
          <Handle
            type="source"
            position={Position.Bottom}
            id={tool.outputs[0]?.name}
            className="!w-2 !h-2 !bg-indigo-500 !border-none !opacity-0 !pointer-events-none"
          />
          
          {(() => {
            const isConnected = edges.some(e => e.source === id);
            if (isConnected) return null;

            return (
              <div className="absolute top-[100%] left-1/2 -translate-x-1/2 flex flex-col items-center">
                <div className="w-px h-5 border-l border-dashed border-border/40" />
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      data.onAddConnect?.({
                        nodeId: id,
                        handleId: tool.outputs[0]?.name || 'output',
                        handleType: 'source',
                        socketType: tool.outputs[0]?.type || 'any',
                        clientX: e.clientX,
                        clientY: e.clientY
                      });
                    }}
                    className="w-7 h-7 bg-card border border-border rounded-xl flex items-center justify-center text-muted-foreground/40 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-md active:scale-95"
                  >
                  <Plus size={14} strokeWidth={3} />
                </button>
              </div>
            );
          })()}
        </>
      )}
    </div>
  );
}
