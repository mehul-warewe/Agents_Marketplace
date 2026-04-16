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
  StickyNote as StickyIcon 
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
  };
  selected?: boolean;
}

const MemoizedMarkdown = React.memo(({ content }: { content: string }) => {
  return (
    <div className="prose prose-sm prose-invert max-w-none">
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
    
    // Prioritize icon from data (set by makeNode override)
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

  // ─── Sticky Note Variant ───────────────────────────────────────────────────
  if (isStickyNote) {
    const content = data.config?.content || "";
    const noteColor = data.config?.noteColor || '#FFD233';

    return (
      <div className="group relative w-full h-full">
        <NodeResizer 
          minWidth={100} 
          minHeight={50} 
          isVisible={true}
          lineStyle={{ border: '16px solid transparent' }}
          handleStyle={{ width: 12, height: 12, background: 'var(--primary)', border: 'none', borderRadius: '50%' }}
        />

        {/* Note Toolbar - Moved to the left and vertical */}
        <div className="absolute -left-12 top-1/2 -translate-y-1/2 hidden group-hover:flex flex-col items-center gap-3 px-1.5 py-3 bg-card border border-border/40 rounded-xl shadow-xl z-[100] animate-in fade-in zoom-in-95 duration-200">
          <div className="relative group/color p-1.5 cursor-pointer">
            <Palette size={14} className="text-muted-foreground hover:text-foreground transition-colors" />
            <input 
              type="color" 
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              value={noteColor}
              onChange={(e) => data.onUpdate?.(id, { config: { ...data.config, noteColor: e.target.value } })}
            />
          </div>
          <button onClick={onDeleteClick} className="p-1.5 text-muted-foreground hover:text-red-500 transition-colors">
            <Trash2 size={14} />
          </button>
        </div>

        <div 
          style={{ backgroundColor: noteColor }}
          onDoubleClick={() => setIsEditing(true)}
          className={`
            w-full h-full p-6 rounded-2xl shadow-lg transition-all duration-300
            ${selected ? 'opacity-100 ring-2 ring-primary/20' : 'opacity-90 hover:opacity-100'}
            text-zinc-900 flex flex-col cursor-text overflow-hidden
          `}
        >
          <div className="flex-1 overflow-hidden">
            {isEditing ? (
              <textarea
                ref={textAreaRef}
                autoFocus
                className="w-full h-full bg-transparent border-none outline-none resize-none text-sm font-medium leading-relaxed overflow-hidden placeholder:text-black/20"
                value={content}
                onChange={(e) => data.onUpdate?.(id, { config: { ...data.config, content: e.target.value } })}
                onBlur={() => setIsEditing(false)}
                placeholder="Type your notes here..."
              />
            ) : (
              <div className="h-full overflow-hidden text-sm font-medium leading-relaxed opacity-80">
                <MemoizedMarkdown content={content || "*Double click to edit*"} />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!tool) return null;

  // ─── Standard Normalized Action Card ───────────────────────────────────────
  const Icon = tool.icon as any;
  const isTrigger = data.isTrigger || tool.isTrigger;
  
  const statusStyles = {
    idle: 'border-border/40 bg-card',
    pending: 'border-primary/20 bg-card',
    running: 'border-primary shadow-lg shadow-primary/10 bg-primary/5',
    completed: 'border-primary/20 bg-card shadow-md',
    failed: 'border-red-500/30 bg-card',
  };

  return (
    <div className={`group relative transition-all duration-300 ${selected ? 'scale-[1.02]' : ''}`}>
      
      {/* Node Toolbar - Moved to the left and vertical */}
      <div className={`
        absolute -left-12 top-1/2 -translate-y-1/2 hidden group-hover:flex flex-col items-center gap-3 px-2 py-3 bg-card border border-border/40 rounded-xl shadow-xl z-[100] animate-in fade-in zoom-in-95 duration-200
        ${(data.toolId === 'skill.output') ? '!hidden' : ''}
      `}>
        <button onClick={onPlayClick} className="p-1.5 text-muted-foreground hover:text-primary transition-colors relative z-[101]"><Play size={14} fill="currentColor" /></button>
        {data.toolId !== 'skill.input' && (
          <button onClick={onDeleteClick} className="p-1.5 text-muted-foreground hover:text-red-500 transition-colors relative z-[101]"><Trash2 size={14} /></button>
        )}
      </div>

      {/* Main Body */}
      <div 
        className={`
          w-[260px] min-h-[90px] rounded-3xl border p-4 flex items-center gap-4 transition-all duration-300
          ${statusStyles[status]}
          ${selected ? 'border-primary shadow-xl ring-4 ring-primary/5' : 'hover:border-primary/20 shadow-md'}
        `}
      >
        {/* Status indicator pulse ring */}
        {status === 'running' && (
          <div className="absolute inset-0 -m-1 rounded-3xl border-2 border-primary animate-ping opacity-20 pointer-events-none" />
        )}

        {/* Icon Section */}
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border border-border/40 transition-all duration-300 overflow-hidden p-3 bg-secondary group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary`}>
          {typeof tool.icon === 'string' && (tool.icon.startsWith('http') || tool.icon.startsWith('/')) ? (
            <img src={tool.icon} alt={tool.label} className="w-full h-full object-contain" />
          ) : (
            <Icon size={24} strokeWidth={2.5} className="transition-colors group-hover:text-primary-foreground" />
          )}
        </div>

        {/* Info Section */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold font-display text-foreground truncate leading-tight tracking-tight">
            {data.label}
          </p>
          <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest truncate mt-1.5">
             {status === 'running' ? 'Active' : tool.name.replace(' node', '')}
          </p>
        </div>

        {/* Internal Status Icon (Top Right) */}
        <div className="absolute top-4 right-4 animate-in fade-in slide-in-from-top-1">
           {status === 'completed' && <CheckCircle size={14} className="text-primary" />}
           {status === 'failed' && <AlertCircle size={14} className="text-red-500" />}
           {status === 'running' && <Loader2 size={14} className="animate-spin text-primary" />}
           {isTrigger && status === 'idle' && <Zap size={10} className="text-amber-500 fill-amber-500 animate-pulse" />}
        </div>
      </div>

      {/* Handles */}
      {!isTrigger && (
        <Handle
          type="target"
          position={Position.Top}
          className="!opacity-0 !pointer-events-none"
          style={{ top: -4 }}
        />
      )}
      
      {tool.outputs.map((socket: any) => {
        const isConnected = data.isEmployeeMode 
          ? edges.some(e => e.source === id) 
          : edges.some(e => e.source === id && (e.sourceHandle === socket.name || tool.outputs.length === 1));

        return (
          <React.Fragment key={socket.name}>
            <Handle
              type="source"
              position={Position.Bottom}
              id={socket.name}
              className="!opacity-0 !pointer-events-none"
              style={{ bottom: -4 }}
            />
            
            {/* Contextual + trigger always visible IF NOT connected */}
            {!isConnected && (
              <div className="absolute top-[100%] left-1/2 -translate-x-1/2 flex flex-col items-center">
                {/* Short dashed line extension (vertical) */}
                <div className="w-[1px] h-6 border-l border-dashed border-border/60" />
                
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    data.onAddConnect?.({
                      nodeId: id,
                      handleId: socket.name,
                      handleType: 'source',
                      socketType: socket.type,
                      clientX: e.clientX,
                      clientY: e.clientY
                    });
                  }}
                  className="w-8 h-8 bg-card border border-border/40 rounded-xl flex items-center justify-center text-muted-foreground/40 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all cursor-pointer shadow-lg scale-90 hover:scale-100 z-50 mt-0"
                >
                  <Plus size={16} strokeWidth={2.5} />
                </div>
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
