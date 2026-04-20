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
    inputSchema?: any[];
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
    const noteColor = data.config?.noteColor || '#468feeff';

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
        <div className="absolute -left-12 top-1/2 -translate-y-1/2 hidden group-hover:flex flex-col items-center gap-3 px-1.5 py-3 bg-card border border-border rounded-xl shadow-xl z-[100] animate-in fade-in zoom-in-95 duration-200">
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

  // ─── Status & Security Detection ──────────────────────────────────────────
  const isTrigger = data.isTrigger || tool.isTrigger;
  const config = data.config || {};
  
  // Detect "Missing Credential" state
  const needsCredential = !!(tool.credentialTypes?.length || tool.configFields?.some(f => f.type === 'credential'));
  const isMissingCredential = needsCredential && !config.credentialId;

  const statusStyles = {
    idle: isMissingCredential ? 'border-red-500 bg-red-500/10' : 'border-border bg-card',
    pending: 'border-primary/40 bg-card',
    running: 'border-primary shadow-lg shadow-primary/20 bg-primary/10',
    completed: 'border-primary/40 bg-card shadow-md',
    failed: 'border-red-500/60 bg-card',
  };

  const Icon = tool.icon as any;

  return (
    <div className={`group relative transition-all duration-300 ${selected ? 'scale-[1.02]' : ''}`}>
      
      {/* Node Toolbar - Moved to the left and vertical */}
      <div className={`
        absolute -left-12 top-1/2 -translate-y-1/2 hidden group-hover:flex flex-col items-center gap-3 px-2 py-3 bg-card border border-border rounded-xl shadow-xl z-[100] animate-in fade-in zoom-in-95 duration-200
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
          w-[220px] min-h-[70px] rounded-xl border p-3 flex items-center gap-3 transition-all duration-300
          ${statusStyles[status]}
          ${selected ? 'border-primary shadow-xl ring-4 ring-primary/5' : 'hover:border-primary/20 shadow-md'}
        `}
      >
        {/* Status indicator pulse ring */}
        {status === 'running' && (
          <div className="absolute inset-0 -m-1 rounded-3xl border-2 border-primary animate-ping opacity-20 pointer-events-none" />
        )}

        {/* Icon Section */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-border transition-all duration-300 overflow-hidden p-2.5 bg-secondary group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary shadow-sm`}>
          {typeof tool.icon === 'string' && (tool.icon.startsWith('http') || tool.icon.startsWith('/')) ? (
            <img src={tool.icon} alt={tool.label} className="w-full h-full object-contain" />
          ) : (
            <Icon size={18} strokeWidth={2.5} className="transition-colors group-hover:text-primary-foreground text-indigo-500" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-bold font-display text-foreground truncate leading-tight tracking-tight uppercase">
            {data.label}
          </p>
          <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest truncate mt-1">
             {status === 'running' ? 'Active' : tool.name.replace(' node', '')}
          </p>
        </div>

        {/* Internal Status Icon (Top Right) */}
        <div className="absolute top-4 right-4 animate-in fade-in slide-in-from-top-1">
           {status === 'completed' && <CheckCircle size={14} className="text-primary" />}
           {status === 'failed' && <AlertCircle size={14} className="text-red-500" />}
           {status === 'running' && <Loader2 size={14} className="animate-spin text-primary" />}
           {isTrigger && status === 'idle' && !isMissingCredential && <Zap size={10} className="text-amber-500 fill-amber-500 animate-pulse" />}
           {isMissingCredential && status === 'idle' && (
             <div className="group/warn relative">
                <AlertCircle size={14} className="text-red-500 animate-pulse" />
                <div className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-red-500 text-white text-[8px] font-black uppercase rounded opacity-0 group-hover/warn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                   Credential Required
                </div>
             </div>
           )}
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
      
      {/* Dynamic Sockets for Multiple Outputs (like Split Branch) */}
      {((data.inputSchema?.length || 0) > 0 || tool.outputs.length > 1) && data.toolId !== 'skill.input' && (
        <div className="absolute inset-x-0 bottom-[-4px] flex justify-around px-2 pointer-events-none gap-4">
          {(data.inputSchema || tool.outputs).map((socket: any) => {
            const socketName = socket.name;
            const isConnected = edges.some(e => e.source === id && e.sourceHandle === socketName);
            const isTruePath = socketName.toLowerCase() === 'true';
            const isFalsePath = socketName.toLowerCase() === 'false';
            const isParallelPath = socketName.startsWith('path_');
            
            return (
              <div key={socketName} className="relative flex flex-col items-center pointer-events-auto min-w-[60px]">
                <Handle
                  type="source"
                  position={Position.Bottom}
                  id={socketName}
                  className={`!w-3 !h-3 !border-2 !border-background !opacity-100 !relative !bottom-0 !left-auto !translate-x-0 transition-colors ${
                    isTruePath ? '!bg-emerald-500' : isFalsePath ? '!bg-red-500' : isParallelPath ? '!bg-purple-500' : '!bg-indigo-500'
                  }`}
                />
                {!isConnected && (
                  <div className="flex flex-col items-center mt-2 group/socket">
                    <div className={`w-[1px] h-5 border-l border-dashed transition-colors ${
                      isTruePath ? 'border-emerald-500/40 group-hover/socket:border-emerald-500' : 
                      isFalsePath ? 'border-red-500/40 group-hover/socket:border-red-500' : 
                      isParallelPath ? 'border-purple-500/40 group-hover/socket:border-purple-500' :
                      'border-border/40 group-hover/socket:border-indigo-500/40'
                    }`} />
                    <div 
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
                      className={`w-7 h-7 bg-card border rounded-lg flex flex-col items-center justify-center transition-all cursor-pointer shadow-lg scale-90 hover:scale-100 z-50 mb-1.5 ${
                        isTruePath ? 'border-emerald-500/20 text-emerald-500/40 hover:bg-emerald-500 hover:text-white hover:border-emerald-500' :
                        isFalsePath ? 'border-red-500/20 text-red-500/40 hover:bg-red-500 hover:text-white hover:border-red-500' :
                        isParallelPath ? 'border-purple-500/20 text-purple-500/40 hover:bg-purple-500 hover:text-white hover:border-purple-500' :
                        'border-border/40 text-muted-foreground/30 hover:bg-indigo-500 hover:text-white hover:border-indigo-500'
                      }`}
                    >
                      <Plus size={14} strokeWidth={3} />
                    </div>
                    <span className={`text-[8px] font-black uppercase tracking-widest transition-colors ${
                      isTruePath ? 'text-emerald-500/60 group-hover/socket:text-emerald-500' :
                      isFalsePath ? 'text-red-500/60 group-hover/socket:text-red-500' :
                      isParallelPath ? 'text-purple-500/60 group-hover/socket:text-purple-500' :
                      'text-muted-foreground/40 group-hover/socket:text-indigo-500'
                    }`}>
                      {socket.label || socket.name}
                    </span>
                  </div>
                )}
                {isConnected && (
                  <span className={`mt-2 text-[7px] font-black uppercase tracking-[0.2em] transition-colors ${
                    isTruePath ? 'text-emerald-500/40' : isFalsePath ? 'text-red-500/40' : isParallelPath ? 'text-purple-500/40' : 'text-muted-foreground/20'
                  }`}>
                    {socket.label || socket.name}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Standard Handle (Single Output) */}
      {(tool.outputs.length === 1 && (!data.inputSchema || data.inputSchema.length === 0 || data.toolId === 'skill.input')) && (
        <>
          <Handle
            type="source"
            position={Position.Bottom}
            id={tool.outputs[0]?.name}
            className="!opacity-0 !pointer-events-none"
            style={{ bottom: -4 }}
          />
          
          {(() => {
            const socket = tool.outputs[0];
            const isConnected = data.isEmployeeMode 
              ? edges.some(e => e.source === id) 
              : edges.some(e => e.source === id && e.sourceHandle === socket?.name);

            if (isConnected) return null;

            return (
              <div className="absolute top-[100%] left-1/2 -translate-x-1/2 flex flex-col items-center">
                <div className="w-[1px] h-6 border-l border-dashed border-border/60" />
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      data.onAddConnect?.({
                        nodeId: id,
                        handleId: socket?.name || 'output',
                        handleType: 'source',
                        socketType: socket?.type || 'any',
                        clientX: e.clientX,
                        clientY: e.clientY
                      });
                    }}
                    className="w-8 h-8 bg-card border border-border rounded-xl flex items-center justify-center text-muted-foreground/60 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all cursor-pointer shadow-lg scale-90 hover:scale-100 z-50 mt-0"
                  >
                  <Plus size={16} strokeWidth={2.5} />
                </div>
              </div>
            );
          })()}
        </>
      )}
    </div>
  );
}
