export function buildReachableSubgraph(startNodes: any[], edges: any[]): Set<string> {
  const reachableIds = new Set<string>();
  const stack = startNodes.map((n: any) => n.id);
  
  while (stack.length > 0) {
    const id = stack.pop()!;
    if (reachableIds.has(id)) continue;
    reachableIds.add(id);
    edges.filter((e: any) => e.source === id).forEach((e: any) => stack.push(e.target));
  }
  
  return reachableIds;
}

export function resolveStartNodes(nodes: any[], edges: any[], triggerNodeId?: string): any[] {
  const totalInDegree = new Map<string, number>();
  edges.forEach((e: any) => totalInDegree.set(e.target, (totalInDegree.get(e.target) || 0) + 1));
  
  let startNodes = nodes.filter((n: any) => {
    if (triggerNodeId) return n.id === triggerNodeId;
    const inDeg = totalInDegree.get(n.id) || 0;
    if (inDeg !== 0) return false;
    if (n.data?.isTrigger) return true;
    return edges.some((e: any) => e.source === n.id);
  });

  if (triggerNodeId && startNodes.length === 0) {
     const directNode = nodes.find((n: any) => n.id === triggerNodeId);
     if (directNode) startNodes = [directNode];
  }

  return startNodes;
}

export function calculateActiveInDegree(reachableIds: Set<string>, edges: any[]): Map<string, number> {
  const inDegree = new Map<string, number>();
  edges.forEach((e: any) => {
    if (reachableIds.has(e.source) && reachableIds.has(e.target)) {
      inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
    }
  });
  return inDegree;
}
