'use client';
import React, { useCallback } from 'react';
import { Handle, Position, useEdges, NodeResizer } from 'reactflow';
import { CheckCircle, AlertCircle, Play, Loader2, MoreHorizontal, Zap, Plus, Power, Trash2, Settings, StickyNote } from 'lucide-react';
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
    config?: Record<string, string>;
  };
  selected?: boolean;
}

// ─── Memoized Markdown Content ──────────────────────────────────────────────
// This prevents YouTube embeds and complex markdown from flickering/reloading
// when the parent node re-renders (e.g. during selection or unrelated canvas state changes).
const MemoizedMarkdown = React.memo(({ content }: { content: string }) => {
  return (
    <ReactMarkdown 
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={{
        h1: ({node, ...props}: any) => <h1 className="text-[17px] font-black tracking-tight mb-4 border-b border-black/10 pb-2 flex items-center gap-2" {...props} />,
        h2: ({node, ...props}: any) => <h2 className="text-[15px] font-black tracking-tight mb-3 mt-6 border-b border-black/5 pb-1" {...props} />,
        h3: ({node, ...props}: any) => <h3 className="text-[13px] font-black uppercase tracking-widest opacity-40 mb-2 mt-4" {...props} />,
        h4: ({node, ...props}: any) => <h4 className="text-[13px] font-bold text-red-500/80 mb-2" {...props} />,
        a: ({node, ...props}: any) => <a className="text-red-500 font-bold underline decoration-red-500/20 hover:text-red-600 transition-colors" target="_blank" {...props} />,
        img: ({node, ...props}: any) => <img className="rounded-2xl shadow-2xl my-6 max-w-full border border-black/5" {...props} />,
        code: ({node, ...props}: any) => <code className="bg-black/5 px-1.5 py-0.5 rounded font-mono text-[11px]" {...props} />,
        ul: ({node, ...props}: any) => <ul className="list-disc ml-5 mb-4 space-y-1.5" {...props} />,
        ol: ({node, ...props}: any) => <ol className="list-decimal ml-5 mb-4 space-y-1.5 font-bold" {...props} />,
        li: ({node, ...props}: any) => <li className="font-medium" {...props} />,
        p: ({node, ...props}: any) => <p className="mb-4 last:mb-0" {...props} />,
        hr: () => <hr className="my-8 border-black/10" />,
        blockquote: ({node, ...props}: any) => <blockquote className="border-l-4 border-red-500/30 pl-4 italic my-6 text-zinc-600" {...props} />,
        div: ({node, className, ...props}: any) => {
          const youtubeMatch = className?.match(/youtube-embed-(.+)/);
          if (youtubeMatch) {
            return (
              <iframe 
                src={`https://www.youtube.com/embed/${youtubeMatch[1]}`}
                className="w-full aspect-video rounded-2xl shadow-2xl my-8 border border-black/5 bg-black/5 animate-in fade-in duration-700"
                allowFullScreen
              />
            );
          }
          return <div className={className} {...props} />;
        }
      }}
    >
      {content.replace(/@\[youtube\]\((.+?)\)/g, '<div class="youtube-embed-$1"></div>')}
    </ReactMarkdown>
  );
});

export default function FlowNode({ id, data, selected }: FlowNodeProps) {
  const tool = data.toolId 
    ? getToolById(data.toolId) 
    : getToolByExecutionKey(data.executionKey);
  
  if (!tool) return null; // Safety check

  const isStickyNote = data.executionKey === 'sticky_note';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Icon = tool.icon as React.ComponentType<any>;
  const status = data.status ?? 'idle';

  if (isStickyNote) {
     const content = data.config?.content || "Click to edit note...";
     const noteColor = data.config?.noteColor || '#635e4fff';
     
     const isHex = noteColor.startsWith('#');
     const colorStyle = isHex ? { backgroundColor: noteColor } : {};
     const colorClass = isHex ? 'text-zinc-900 border-black/10' : (
       noteColor === 'Yellow' ? 'bg-[#FFD233] text-zinc-900 border-[#EBC22D]' :
       noteColor === 'Blue'   ? 'bg-blue-100 text-blue-900 border-blue-200' :
       'bg-[#FFD233] text-zinc-900 border-[#EBC22D]'
     );

     return (
       <>
         <NodeResizer 
           minWidth={150} 
           minHeight={100} 
           isVisible={selected}
           lineClassName="!border-none"
           handleClassName="!w-6 !h-6 !bg-blue-500/5 !border-0 !rounded-lg opacity-0 group-hover:opacity-100" 
         />
         <div 
           style={colorStyle}
           className={`
             w-full h-full p-8 rounded-[2rem] shadow-xl border-l-[6px] 
             transition-all duration-300 font-sans cursor-pointer
             ${colorClass} ${selected ? 'shadow-2xl opacity-100' : 'opacity-90 hover:opacity-100'}
           `}
         >
           <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-40 transition-opacity">
              <StickyNote size={12} />
           </div>

           <div className="text-[13.5px] font-medium leading-[1.8] opacity-95 select-none overflow-y-auto no-scrollbar h-full prose-zinc max-w-none">
             <MemoizedMarkdown content={content} />
           </div>

            <button 
               onClick={(e) => { e.stopPropagation(); (data as any).onDelete?.(id); }}
               className="absolute -bottom-2 -right-2 w-5 h-5 bg-card border border-border/10 rounded-full flex items-center justify-center text-[8px] opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all shadow-md z-[100]"
            >
              ✕
            </button>
         </div>
       </>
     );
  }

  // Hook for standard nodes
  // eslint-disable-next-line react-hooks/rules-of-hooks
  // Hook for standard nodes - Move below StickyNote return to prevent note flickers
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const edges = useEdges();

  const onPlayClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      data.onTrigger?.(id);
    },
    [data, id],
  );

  // n8n style handles: Small, neutral, professional
  const handleClass =
    '!w-2 !h-2 !rounded-full !border !border-[#333] !bg-[#555] hover:!bg-foreground hover:!scale-125 transition-all !shadow-none';

  const isAgent = tool.variant === 'agent';
  const isConnector = tool.variant === 'connector';
  const isTriggerVariant = tool.variant === 'trigger';

  // Status-based colors and animations
  const statusStyles = {
    idle: 'border-transparent opacity-100 shadow-sm', // Remove grayscale/opacity-40
    pending: 'border-blue-400/30 opacity-90 shadow-[0_0_10px_rgba(59,130,246,0.1)]',
    running: 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)] animate-pulse-glow opacity-100',
    completed: 'border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.15)] opacity-100',
    failed: 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)] opacity-100',
  };

  const statusColor = {
    idle: 'bg-zinc-500',
    pending: 'bg-blue-400/40',
    running: 'bg-blue-500',
    completed: 'bg-emerald-500',
    failed: 'bg-red-500',
  };

  // ─── Connection Detection (n8n mode vs Tool mode) ──────────────────────────
  const isConnectedToAgent = edges.some(e => 
    e.source === id && 
    (e.targetHandle?.toLowerCase().includes('tool') || 
     e.targetHandle?.toLowerCase().includes('model') || 
     e.targetHandle?.toLowerCase().includes('memory') || 
     e.targetHandle?.toLowerCase().includes('parser'))
  );

  const isModel = tool.category === 'Models';
  const hasMultiplePorts = tool.inputs.length > 1 || tool.outputs.length > 1;

  const isToolMode = !hasMultiplePorts && (((isConnector || isTriggerVariant) && isConnectedToAgent) || isModel);
  const isLinearMode = !hasMultiplePorts && (isConnector || isTriggerVariant) && !isConnectedToAgent && !isModel;

  // ─── Dynamic Rendering ───────────────────────────────────────────────────────
  if (isToolMode || isLinearMode) {
    // Tool Mode (Circle) vs Linear Mode (Compact Square Box)
    const bodyClass = isToolMode 
      ? 'w-16 h-16 rounded-full' 
      : 'w-24 h-24 rounded-2xl'; // Compact square for linear mode

    return (
      <div className={`group relative transition-all duration-300 ${selected ? 'scale-105 z-50' : ''}`}>
        {/* Node Toolbar Overlay */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 hidden group-hover:flex items-center gap-4 px-3 py-1.5 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-2xl z-[100] animate-in fade-in slide-in-from-bottom-2 duration-200">
          <button onClick={onPlayClick} className="text-white/60 hover:text-white transition-colors"><Play size={12} fill="currentColor" /></button>
          <button className="text-white/60 hover:text-white transition-colors"><Power size={12} /></button>
          <button onClick={(e) => { e.stopPropagation(); (data as any).onDelete?.(id); }} className="text-white/60 hover:text-red-400 transition-colors"><Trash2 size={12} /></button>
          <button className="text-white/60 hover:text-white transition-colors"><MoreHorizontal size={12} /></button>
        </div>
        
        {/* Execution Ring Overlay */}
        {status === 'running' && (
          <div className={`absolute inset-0 -m-1 ${isToolMode ? 'rounded-full' : 'rounded-2xl'} border-2 border-blue-500 animate-ping opacity-20 pointer-events-none`} />
        )}

        {/* Target Handle (Left) — Only if NOT connected as a tool */}
        {!isConnectedToAgent && tool.inputs.map(socket => {
          return (
            <React.Fragment key={socket.name}>
              <Handle
                type="target"
                position={Position.Left}
                id={socket.name}
                className="!bg-[#252525] !border !border-gray-500 hover:!bg-white !w-2 !h-2 !rounded-full !shadow-none z-30"
                style={{ left: -4, top: '50%', transform: 'translateY(-50%)' }}
              />
            </React.Fragment>
          );
        })}

        {/* Source Handle (Contextual: Top if tool, Right if linear) */}
        {tool.outputs.map(socket => {
          const isActuallyTool = isConnectedToAgent && isToolMode;
          const isConnected = edges.some(e => e.source === id && (e.sourceHandle === socket.name || (!e.sourceHandle && tool.outputs.length === 1)));

          return (
            <React.Fragment key={socket.name}>
              <Handle
                type="source"
                position={isActuallyTool ? Position.Top : Position.Right}
                id={socket.name}
                style={{
                  ...(isActuallyTool 
                    ? { top: -4, left: '50%', transform: 'translateX(-50%) rotate(45deg)' } 
                    : { right: -4, top: '50%', transform: 'translateY(-50%)' })
                }}
                className={`!bg-[#252525] !border !border-gray-500 hover:!bg-white ${isActuallyTool ? '!w-2.5 !h-2.5 !rounded-none' : '!w-2 !h-2 !rounded-full'} !shadow-none z-30`}
              />
              {!isConnected && (
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    (data as any).onAddConnect?.({
                      nodeId: id,
                      handleId: socket.name,
                      handleType: 'source',
                      socketType: socket.type,
                      clientX: e.clientX,
                      clientY: e.clientY
                    });
                  }}
                  className={`
                    absolute z-40 w-5 h-5 rounded bg-[#1e1e1e] border border-zinc-700 
                    flex items-center justify-center text-zinc-500 shadow-lg cursor-pointer 
                    hover:bg-zinc-800 hover:text-white transition-all scale-95 hover:scale-100
                    opacity-0 group-hover:opacity-100 transition-opacity duration-200
                    ${isActuallyTool ? 'bottom-full left-1/2 -translate-x-1/2 mb-4' : 'left-full top-1/2 -translate-y-1/2 ml-4'}
                  `}
                >
                  <Plus size={10} />
                </div>
              )}
            </React.Fragment>
          );
        })}

        {/* Status indicator on body */}
        <div
          className={`
            ${bodyClass} flex items-center justify-center border-0 transition-all relative
            ${status !== 'idle' ? statusStyles[status] : statusStyles.idle}
            ${tool.bg}
          `}
        >
          {/* Internal Pulse for Running */}
          {status === 'running' && (
             <div className="absolute inset-0 bg-blue-500/10 animate-pulse" />
          )}

          {typeof tool.icon === 'string' ? (
            <img 
              src={tool.icon} 
              alt={tool.label} 
              className={`${isToolMode ? 'w-8 h-8' : 'w-12 h-12'} object-contain transition-all duration-300`} 
            />
          ) : (
            <Icon 
              size={isToolMode ? 28 : 40} 
              style={tool.color.startsWith('#') || tool.color.startsWith('rgb') ? { color: tool.color } : {}}
              className={`${!(tool.color.startsWith('#') || tool.color.startsWith('rgb')) ? tool.color : ''} transition-colors duration-500`} 
            />
          )}
          
          {isTriggerVariant && <Zap size={10} className="absolute -left-1 top-1/2 -translate-y-1/2 text-orange-400 fill-orange-400 animate-pulse" />}

          {/* Status Overlay */}
          <div className="absolute top-3 left-3 flex items-center gap-1 z-50">
             {status === 'completed' && <CheckCircle size={16} className="text-emerald-500 bg-black/40 rounded-full" />}
             {status === 'failed' && <AlertCircle size={16} className="text-red-500 bg-black/40 rounded-full" />}
             {status === 'running' && <Loader2 size={16} className="animate-spin text-blue-500 bg-black/40 rounded-full" />}
          </div>
        </div>

        {/* Persistent Bottom Label */}
        <div className={`absolute ${isToolMode ? 'top-[100%]' : 'top-[105%]'} left-1/2 -translate-x-1/2 pt-2 text-center whitespace-nowrap pointer-events-none`}>
           <p className="text-[11px] font-black tracking-tight text-foreground">{data.label}</p>
        </div>
      </div>
    );
  }

  // Box Shape (Agent or standard)
  return (
    <div
      className={`
        group relative ${isAgent ? 'min-w-[320px] max-w-[450px]' : 'min-w-[170px] max-w-[240px]'} rounded-[2rem]
        border transition-all duration-300
        ${isAgent ? 'bg-[#1a1a1a] text-white shadow-2xl p-2' : 'bg-[#1e1e1e] border-border/10'}
        ${status !== 'idle' ? statusStyles[status] : (selected
          ? 'border-blue-500 shadow-xl ring-4 ring-blue-500/10 scale-[1.02] z-50'
          : 'hover:border-border/40 hover:scale-[1.01] shadow-lg')}
      `}
    >
      {/* Node Toolbar Overlay */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 hidden group-hover:flex items-center gap-4 px-3 py-1.5 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-2xl z-[100] animate-in fade-in slide-in-from-bottom-2 duration-200">
        <button onClick={onPlayClick} className="text-white/60 hover:text-white transition-colors"><Play size={12} fill="currentColor" /></button>
        <button className="text-white/60 hover:text-white transition-colors"><Power size={12} /></button>
        <button onClick={(e) => { e.stopPropagation(); (data as any).onDelete?.(id); }} className="text-white/60 hover:text-red-400 transition-colors"><Trash2 size={12} /></button>
        <button className="text-white/60 hover:text-white transition-colors"><MoreHorizontal size={12} /></button>
      </div>

      {/* Running Pulse Ring */}
      {status === 'running' && (
        <div className="absolute inset-0 -m-1 rounded-2xl border-2 border-blue-500 animate-pulse opacity-40 pointer-events-none" />
      )}

      {/* ── Type Tag (Top Left) — Only for non-Agents if requested (currently hiding all per user) */}
      {!isAgent && false && (
        <div className={`absolute -top-3 left-4 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest bg-card border border-border/60 ${status === 'idle' ? 'text-muted-foreground/40' : tool.color} z-10 transition-colors`}>
          {tool.category.replace(' / ', '_')}
        </div>
      )}

      {/* ── Progress Bar (Bottom) */}
      {status === 'running' && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 overflow-hidden rounded-b-2xl">
           <div className="w-1/2 h-full bg-white/40 animate-[slide-right_1.5s_infinite]" />
        </div>
      )}

      {/* ── Handles Loop */}
      {tool.inputs.map((socket, index) => {
        const side = socket.position || 'left';
        const totalInSide = tool.inputs.filter(s => (s.position || 'left') === side).length;
        const subIdx = tool.inputs.filter(s => (s.position || 'left') === side).indexOf(socket);
        const offset = totalInSide === 1 ? 50 : 15 + (subIdx * 70) / (totalInSide - 1); // Wider spacing
        const isDiamond = side === 'bottom' || side === 'top';
        const isConnected = edges.some(e => e.target === id && (e.targetHandle === socket.name || (!e.targetHandle && tool.inputs.length === 1)));

        return (
          <React.Fragment key={socket.name}>
            <Handle
              type="target"
              position={side === 'bottom' ? Position.Bottom : side === 'top' ? Position.Top : side === 'right' ? Position.Right : Position.Left}
              id={socket.name}
              style={{
                left: side === 'left' ? -4 : side === 'right' ? 'calc(100% + 4px)' : `${offset}%`,
                top: side === 'top' ? -4 : side === 'bottom' ? 'calc(100% + 4px)' : `${offset}%`,
                transform: isDiamond ? 'translate(-50%, -50%) rotate(45deg)' : 'translate(-50%, -50%)',
                width: 10,
                height: 10,
              }}
              className={`!bg-[#252525] !border !border-gray-500 hover:!bg-white ${isDiamond ? '!rounded-none' : '!rounded-full'} !shadow-none z-30`}
            />

            {!isConnected && null}

            {/* Socket Label */}
            {socket.label && (
              <div 
                className={`absolute text-[8px] font-bold tracking-tight text-muted-foreground/50 pointer-events-none whitespace-nowrap uppercase`}
                style={{
                  left: (side === 'top' || side === 'bottom') ? `${offset}%` : (side === 'left' ? 12 : 'auto'),
                  right: side === 'right' ? 12 : 'auto',
                  top: side === 'top' ? 'auto' : side === 'bottom' ? 'calc(100% - 18px)' : `${offset}%`,
                  bottom: side === 'top' ? 'calc(100% - 18px)' : 'auto',
                  transform: (side === 'left' || side === 'right') ? 'translateY(-50%)' : 'translateX(-50%)',
                }}
              >
                {socket.label.replace('*', '')}
                {socket.label.includes('*') && <span className="text-red-500 ml-0.5">*</span>}
              </div>
            )}
          </React.Fragment>
        );
      })}

      {/* ── Outputs handles loop */}
      {tool.outputs.map((socket, index) => {
        const isConnected = edges.some(e => e.source === id && (e.sourceHandle === socket.name || (!e.sourceHandle && tool.outputs.length === 1)));
        const side = socket.position || 'right';
        const isDiamond = side === 'bottom' || side === 'top';
        const totalInSide = tool.outputs.filter(s => (s.position || 'right') === side).length;
        const subIdx = tool.outputs.filter(s => (s.position || 'right') === side).indexOf(socket);
        const offset = totalInSide === 1 ? 50 : 20 + (subIdx * 60) / (totalInSide - 1);

        return (
          <React.Fragment key={socket.name}>
            <Handle
              type="source"
              position={side === 'top' ? Position.Top : side === 'bottom' ? Position.Bottom : side === 'left' ? Position.Left : Position.Right}
              id={socket.name}
              style={{
                left: side === 'left' ? -4 : side === 'right' ? 'calc(100% + 4px)' : `${offset}%`,
                top: side === 'top' ? -4 : side === 'bottom' ? 'calc(100% + 4px)' : `${offset}%`,
                transform: isDiamond ? 'translate(-50%, -50%) rotate(45deg)' : 'translate(-50%, -50%)',
                width: 10,
                height: 10,
              }}
              className={`!bg-[#252525] !border !border-gray-500 hover:!bg-white ${isDiamond ? '!rounded-none' : '!rounded-full'} !shadow-none z-30`}
            />

            {/* Socket Label */}
            {socket.label && (
              <div 
                className={`absolute text-[8px] font-bold tracking-tight text-muted-foreground/50 pointer-events-none whitespace-nowrap uppercase`}
                style={{
                  left: (side === 'top' || side === 'bottom') ? `${offset}%` : (side === 'left' ? 12 : 'auto'),
                  right: side === 'right' ? 12 : 'auto',
                  top: (side === 'top' || side === 'bottom') ? (side === 'top' ? 'auto' : 'calc(100% - 18px)') : `${offset}%`,
                  bottom: side === 'top' ? 'calc(100% - 18px)' : 'auto',
                  transform: (side === 'left' || side === 'right') ? 'translateY(-50%)' : 'translateX(-50%)',
                }}
              >
                {socket.label.replace('*', '')}
                {socket.label.includes('*') && <span className="text-red-500 ml-0.5">*</span>}
              </div>
            )}

            {!isConnected && (
              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  (data as any).onAddConnect?.({
                    nodeId: id,
                    handleId: socket.name,
                    handleType: 'source',
                    socketType: socket.type,
                    clientX: e.clientX,
                    clientY: e.clientY
                  });
                }}
                className={`
                   absolute z-40 w-5 h-5 rounded bg-[#1e1e1e] border border-zinc-700 
                   flex items-center justify-center text-zinc-500 shadow-lg cursor-pointer 
                   hover:bg-zinc-800 hover:text-white transition-all scale-95 hover:scale-100
                   opacity-0 group-hover:opacity-100 transition-opacity duration-200
                   ${side === 'top' ? 'bottom-full left-1/2 -translate-x-1/2 mb-4' : side === 'bottom' ? 'top-full left-1/2 -translate-x-1/2 mt-4' : side === 'left' ? 'right-full top-1/2 -translate-y-1/2 mr-4' : 'left-full top-1/2 -translate-y-1/2 ml-4'}
                `}
              >
                <Plus size={10} />
              </div>
            )}
          </React.Fragment>
        );
      })}

      {/* ── Content */}
      <div className="p-4 flex flex-col items-center justify-center gap-2 min-h-[80px] relative">
        <div className="flex items-center gap-4 w-full">
          <div className={`p-2 rounded-lg ${status === 'idle' ? 'bg-zinc-900/50' : tool.bg} border border-white/5 shrink-0 transition-colors`}>
            {typeof tool.icon === 'string' ? (
              <img src={tool.icon} alt={tool.label} className={`w-6 h-6 object-contain ${status === 'idle' && false ? 'opacity-40 grayscale' : ''}`} />
            ) : (
              <Icon 
                size={isAgent ? 36 : 24} 
                style={tool.color.startsWith('#') || tool.color.startsWith('rgb') ? { color: tool.color } : {}}
                className={`${!(tool.color.startsWith('#') || tool.color.startsWith('rgb')) ? tool.color : ''} transition-colors duration-500`} 
                strokeWidth={isAgent ? 1 : 2} 
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
             <h3 className={`text-[14px] font-black tracking-tight truncate ${status === 'idle' ? 'text-muted-foreground/60' : 'text-foreground'}`}>
              {data.label}
            </h3>
            <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest truncate">
               {status === 'running' 
                 ? (isAgent ? 'Executing...' : 'Being called by Agent...') 
                 : (status === 'pending'
                    ? 'Ready for Agent'
                    : (data.config?.operation 
                       ? `${data.config.operation}${data.config.resource ? ': ' + data.config.resource : ''}` 
                       : tool.name))}
            </p>
          </div>
        </div>

        {/* Status markers */}
        <div className="absolute top-1.5 left-1.5 flex items-center gap-1 z-50">
           {status === 'completed' && <CheckCircle size={16} className="text-emerald-500 bg-black/40 rounded-full" />}
           {status === 'failed' && <AlertCircle size={16} className="text-red-500 bg-black/40 rounded-full" />}
           {status === 'running' && <Loader2 size={16} className="animate-spin text-blue-500 bg-black/40 rounded-full" />}
        </div>
      </div>

      {/* Config Warning (n8n style) */}
      {isAgent && !edges.some(e => e.target === id && e.targetHandle?.toLowerCase() === 'model') && (
        <div className="absolute bottom-4 right-4 text-red-500 animate-pulse drop-shadow-lg">
          <AlertCircle size={18} fill="rgba(239, 68, 68, 0.1)" />
        </div>
      )}
    </div>
  );
}

