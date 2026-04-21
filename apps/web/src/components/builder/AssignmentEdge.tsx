'use client';

import React from 'react';
import { EdgeProps, getSmoothStepPath, EdgeLabelRenderer } from 'reactflow';
import { MessageSquare, ArrowRight } from 'lucide-react';

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
          strokeWidth: 2,
          stroke: 'currentColor',
          opacity: 0.2,
        }}
        className="react-flow__edge-path text-foreground"
        d={edgePath}
        markerEnd={markerEnd}
      />
      <path
        id={`${id}-animation`}
        style={{
          ...style,
          strokeWidth: 2,
          stroke: '#6366f1',
          strokeDasharray: '6, 6',
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
          <div className="bg-card border border-border rounded-full px-3 py-1.5 flex items-center gap-2 shadow-sm hover:scale-105 transition-all cursor-pointer hover:border-indigo-500/40">
            <ArrowRight size={10} className="text-indigo-500" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 group-hover:text-indigo-500 transition-colors">ASSIGNMENT</span>
            
            {/* Tooltip Content */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-56 p-4 bg-card border border-border rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-50">
               <div className="flex items-center gap-2 mb-2">
                 <MessageSquare size={12} className="text-muted-foreground/40" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">Instructional Context</span>
               </div>
               <p className="text-[10px] font-medium text-foreground/80 leading-relaxed italic">
                 {data?.instruction || "Manager will delegate tasks dynamically based on the current objective and workflow state."}
               </p>
               <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-card border-r border-b border-border rotate-45" />
            </div>
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
