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
    config?: Record<string, any>;
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
  const tool = useMemo(() => {
    return data.toolId 
      ? getToolById(data.toolId) 
      : getToolByExecutionKey(data.executionKey);
  }, [data.toolId, data.executionKey]);
  
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

  if (!tool) return null;

  // ─── Sticky Note Variant ───────────────────────────────────────────────────
  if (isStickyNote) {
    const content = data.config?.content || "Click to edit note...";
    const noteColor = data.config?.noteColor || '#FFD233';
    return (
      <div className="group relative">
        <NodeResizer minWidth={150} minHeight={100} isVisible={selected} />
        <div 
          style={{ backgroundColor: noteColor }}
          className={`
            w-full h-full p-6 rounded-3xl shadow-xl transition-all duration-300
            ${selected ? 'ring-4 ring-blue-500/30' : 'opacity-90 hover:opacity-100'}
            text-zinc-900 overflow-hidden
          `}
        >
          <div className="text-[13px] font-medium leading-relaxed opacity-90 h-full overflow-hidden">
            <MemoizedMarkdown content={content} />
          </div>
          <button onClick={onDeleteClick} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 shadow-lg text-[10px]">✕</button>
        </div>
      </div>
    );
  }

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
      
      {/* Node Toolbar - With hit-bridge to prevent flickering */}
      <div className="absolute -top-12 left-1/2 -translate-x-1/2 hidden group-hover:flex items-center gap-3 px-3 py-1.5 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl z-[100] animate-in fade-in zoom-in-95 duration-200 before:content-[''] before:absolute before:top-full before:left-0 before:right-0 before:h-4 before:bg-transparent">
        <button onClick={onPlayClick} className="p-1.5 text-white/50 hover:text-white transition-colors relative z-[101]"><Play size={14} fill="currentColor" /></button>
        <button onClick={onDeleteClick} className="p-1.5 text-white/50 hover:text-red-400 transition-colors relative z-[101]"><Trash2 size={14} /></button>
      </div>

      {/* Main Body */}
      <div 
        className={`
          w-[200px] min-h-[70px] rounded-[1.75rem] border p-3 flex items-center gap-3 transition-all duration-500
          ${statusStyles[status]}
          ${selected ? 'border-blue-500 shadow-2xl' : 'hover:border-white/10 shadow-lg'}
        `}
      >
        {/* Status indicator pulse ring */}
        {status === 'running' && (
          <div className="absolute inset-0 -m-1 rounded-[2rem] border-2 border-blue-500 animate-ping opacity-20 pointer-events-none" />
        )}

        {/* Icon Section */}
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border border-white/5 ${tool.bg} shadow-inner`}>
          {typeof tool.icon === 'string' ? (
            <img src={tool.icon} alt={tool.label} className="w-6 h-6 object-contain" />
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
          position={Position.Left}
          className="!w-2 !h-2 !bg-[#252525] !border !border-gray-600 hover:!bg-white hover:!scale-125 !shadow-none transition-all"
          style={{ left: -4 }}
        />
      )}
      
      {tool.outputs.map(socket => {
        const isConnected = edges.some(e => e.source === id && (e.sourceHandle === socket.name || tool.outputs.length === 1));
        return (
          <React.Fragment key={socket.name}>
            <Handle
              type="source"
              position={Position.Right}
              id={socket.name}
              className="!w-2 !h-2 !bg-[#252525] !border !border-gray-600 hover:!bg-white hover:!scale-125 !shadow-none transition-all"
              style={{ right: -4 }}
            />
            
            {/* Contextual + trigger */}
            {!isConnected && (
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
                className="absolute left-[100%] top-1/2 -translate-y-1/2 ml-4 w-5 h-5 bg-[#1a1a1a] border border-white/10 rounded-lg flex items-center justify-center text-white/40 opacity-0 group-hover:opacity-100 hover:bg-white hover:text-black transition-all cursor-pointer shadow-xl scale-90 hover:scale-100 z-50"
              >
                <Plus size={10} strokeWidth={3} />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
