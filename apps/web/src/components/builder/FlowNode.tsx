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
          handleStyle={{ width: 32, height: 32, background: 'transparent', border: 'none', borderRadius: '50%' }}
        />

        {/* Note Toolbar - Moved to the left and vertical */}
        <div className="absolute -left-12 top-1/2 -translate-y-1/2 hidden group-hover:flex flex-col items-center gap-3 px-1.5 py-3 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl z-[100] animate-in fade-in zoom-in-95 duration-200 before:content-[''] before:absolute before:left-full before:top-0 before:bottom-0 before:w-4 before:bg-transparent">
          <div className="relative group/color p-1.5 cursor-pointer">
            <Palette size={14} className="text-white/50 hover:text-white transition-colors" />
            <input 
              type="color" 
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              value={noteColor}
              onChange={(e) => data.onUpdate?.(id, { config: { ...data.config, noteColor: e.target.value } })}
            />
          </div>
          <button onClick={onDeleteClick} className="p-1.5 text-white/50 hover:text-red-400 transition-colors">
            <Trash2 size={14} />
          </button>
        </div>

        <div 
          style={{ backgroundColor: noteColor }}
          onDoubleClick={() => setIsEditing(true)}
          className={`
            w-full h-full p-6 rounded-xl shadow-2xl transition-all duration-300
            ${selected ? 'opacity-100 ring-1 ring-black/5' : 'opacity-90 hover:opacity-100'}
            text-zinc-900 flex flex-col cursor-text overflow-hidden
          `}
        >
          <div className="flex-1 overflow-hidden">
            {isEditing ? (
              <textarea
                ref={textAreaRef}
                autoFocus
                className="w-full h-full bg-transparent border-none outline-none resize-none text-[13px] font-medium leading-relaxed overflow-hidden"
                value={content}
                onChange={(e) => data.onUpdate?.(id, { config: { ...data.config, content: e.target.value } })}
                onBlur={() => setIsEditing(false)}
                placeholder="Type your notes here..."
              />
            ) : (
              <div className="h-full overflow-hidden">
                <MemoizedMarkdown content={content || "*Double click to add instructions*"} />
              </div>
            )}
          </div>
          
          {!isEditing && (
             <div className="absolute top-4 right-6 opacity-20 pointer-events-none">
                <StickyIcon size={16} />
             </div>
          )}
        </div>
      </div>
    );
  }

  if (!tool) return null;

  // ─── Standard Normalized Action Card ───────────────────────────────────────
  const Icon = tool.icon as any;
  const isTrigger = data.isTrigger || tool.isTrigger;
  
  const statusStyles = {
    idle: 'border-white/5 bg-[#121212]',
    pending: 'border-blue-500/20 bg-[#121212]',
    running: 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)] bg-blue-500/5',
    completed: 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.1)] bg-[#121212]',
    failed: 'border-red-500/50 bg-[#121212]',
  };

  return (
    <div className={`group relative transition-all duration-300 ${selected ? 'scale-[1.02]' : ''}`}>
      
      {/* Node Toolbar - Moved to the left and vertical */}
      <div className={`
        absolute -left-12 top-1/2 -translate-y-1/2 hidden group-hover:flex flex-col items-center gap-3 px-1.5 py-3 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl z-[100] animate-in fade-in zoom-in-95 duration-200
        before:content-[''] before:absolute before:-right-4 before:top-0 before:bottom-0 before:w-8 before:bg-transparent
        ${(data.toolId === 'skill.output') ? '!hidden' : ''}
      `}>
        <button onClick={onPlayClick} className="p-1.5 text-white/50 hover:text-white transition-colors relative z-[101]"><Play size={14} fill="currentColor" /></button>
        {data.toolId !== 'skill.input' && (
          <button onClick={onDeleteClick} className="p-1.5 text-white/50 hover:text-red-400 transition-colors relative z-[101]"><Trash2 size={14} /></button>
        )}
      </div>

      {/* Main Body */}
      <div 
        className={`
          w-[240px] min-h-[85px] rounded-[2rem] border p-4 flex items-center gap-3 transition-all duration-500
          ${statusStyles[status]}
          ${selected ? 'border-blue-500 shadow-2xl' : 'hover:border-white/10 shadow-lg'}
        `}
      >
        {/* Status indicator pulse ring */}
        {status === 'running' && (
          <div className="absolute inset-0 -m-1 rounded-[2rem] border-2 border-blue-500 animate-ping opacity-20 pointer-events-none" />
        )}

        {/* Icon Section */}
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border border-white/5 ${tool.bg} shadow-inner overflow-hidden`}>
          {typeof tool.icon === 'string' && (tool.icon.startsWith('http') || tool.icon.startsWith('/')) ? (
            <img src={tool.icon} alt={tool.label} className="w-full h-full object-contain p-2" />
          ) : (
            <Icon size={20} className={tool.color} />
          )}
        </div>

        {/* Info Section */}
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-black text-white/90 truncate leading-tight tracking-tight">
            {data.label}
          </p>
          <p className="text-[9px] font-bold text-muted uppercase tracking-widest truncate opacity-40 mt-1">
             {status === 'running' ? 'Executing...' : tool.name.replace(' node', '')}
          </p>
        </div>

        {/* Internal Status Icon (Top Right) */}
        <div className="absolute top-2.5 right-2.5">
           {status === 'completed' && <CheckCircle size={14} className="text-emerald-500" />}
           {status === 'failed' && <AlertCircle size={14} className="text-red-500" />}
           {status === 'running' && <Loader2 size={14} className="animate-spin text-blue-500" />}
           {isTrigger && status === 'idle' && <Zap size={10} className="text-orange-400 fill-orange-400 animate-pulse" />}
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
                <div className="w-[1px] h-4 border-l border-dashed border-white/20 transition-opacity" />
                
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
                  className="w-5 h-5 bg-[#1a1a1a] border border-white/10 rounded-lg flex items-center justify-center text-white/40 hover:bg-white hover:text-black transition-all cursor-pointer shadow-xl scale-90 hover:scale-110 z-50 mt-0"
                >
                  <Plus size={10} strokeWidth={3} />
                </div>
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
