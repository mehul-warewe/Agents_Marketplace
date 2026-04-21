'use client';

import React from 'react';
import { EdgeProps, getSmoothStepPath, EdgeLabelRenderer, MarkerType } from 'reactflow';
import { Zap, MessageSquare, ArrowRight } from 'lucide-react';

export default function AssignmentEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 20,
  });

  return (
    <>
      <path
        id={id}
        style={{
          ...style,
          strokeWidth: 2.5,
          stroke: '#6366f1',
          opacity: 0.4,
        }}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />
      <path
        id={`${id}-animation`}
        style={{
          ...style,
          strokeWidth: 2.5,
          stroke: '#6366f1',
          strokeDasharray: '8, 8',
        }}
        className="react-flow__edge-path animate-[dash_30s_linear_infinite]"
        d={edgePath}
      />
      
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="group"
        >
          <div className="bg-card border border-indigo-500/20 rounded-full px-4 py-2 flex items-center gap-2 shadow-2xl hover:scale-110 transition-all cursor-pointer hover:border-indigo-500/50">
            <ArrowRight size={10} className="text-indigo-500" />
            <span className="text-[9px] font-black uppercase tracking-widest text-indigo-500">ASSIGNMENT</span>
            
            {/* Tooltip Content */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-64 p-5 bg-background border border-border/40 rounded-[2rem] shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 overflow-hidden">
               <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full -mr-10 -mt-10" />
               <div className="flex items-center gap-2 mb-3 relative z-10">
                 <MessageSquare size={12} className="text-muted" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-muted">Instructional Flow</span>
               </div>
               <p className="text-[10px] font-bold text-foreground opacity-80 italic leading-relaxed relative z-10">
                 {data?.instruction || "Manager will decide delegate parameters dynamically based on current workflow state."}
               </p>
               <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-background border-r border-b border-border/40 rotate-45" />
            </div>
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
