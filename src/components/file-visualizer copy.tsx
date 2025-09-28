import React, { useEffect, useMemo, useState, useRef } from "react";

// JSON Hierarchy Visualizer (TypeScript + React) with collapsed object properties inside parent card

type NodeKind =
  | "string"
  | "number"
  | "boolean"
  | "null"
  | "array"
  | "object"
  | "undefined"
  | "function"
  | "symbol"
  | "bigint";

interface NodeType {
  id: string;
  key: string;
  value: any;
  type: NodeKind;
  parentId: string | null;
  depth: number;
  children: string[];
}

interface JSONVisualizerProps {
  json: any;
  width?: number;
  laneWidth?: number;
  cardHeight?: number;
}

function uid(prefix = "n"): string {
  return prefix + Math.random().toString(36).slice(2, 9);
}

function buildNodes(
  value: any,
  key: string = "root",
  parentId: string | null = null,
  depth: number = 0
): NodeType[] {
  const nodes: NodeType[] = [];
  const id = uid("n");

  let type: NodeKind;
  if (value === null) {
    type = "null";
  } else if (Array.isArray(value)) {
    type = "array";
  } else {
    type = typeof value as NodeKind;
    if (type === "object") type = "object";
  }

  const node: NodeType = {
    id,
    key,
    value,
    type,
    parentId,
    depth,
    children: [],
  };

  // Only create children for arrays; objects will show properties inside parent card
  if (type === "array") {
    for (let i = 0; i < value.length; i++) {
      //   console.log(value[i]);
      const childNodes = buildNodes(value[i], `[${i}]`, id, depth + 1);
      //   console.log(childNodes);
      const childNode = childNodes[0];
      node.children.push(childNode.id);
      nodes.push(...childNodes);
    }
  }

  if (type === "object") {
    for (const k of Object.keys(value)) {
      //   console.log(k);
      const v = value[k];
      const vType =
        v === null
          ? "null"
          : Array.isArray(v)
          ? "array"
          : (typeof v as NodeKind);

      if (vType === "object" || vType === "array") {
        const childNodes = buildNodes(v, k, id, depth + 1);
        const childNode = childNodes[childNodes.length - 1]; // last node is the parent node we just created
        node.children.push(childNode.id);
        nodes.push(...childNodes);
      } else {
        // Atomic properties will remain in parent card, no child node
      }
    }
  }

  nodes.push(node);
  return nodes;
}

export default function JSONVisualizer({
  json,
  width = 1200,
  laneWidth = 260,
  cardHeight = 70,
}: JSONVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const nodesArray = useMemo(() => buildNodes(json, "root", null, 0), [json]);

  const nodesById = useMemo(() => {
    const m = new Map<string, NodeType>();
    nodesArray.forEach((n) => m.set(n.id, { ...n }));
    return m;
  }, [nodesArray]);

  const initialPositions = useMemo(() => {
    const yCounters: Record<number, number> = {};
    const map: Record<string, { x: number; y: number }> = {};
    for (const node of nodesArray) {
      const d = node.depth;
      if (!yCounters[d]) yCounters[d] = 0;
      const x = d * laneWidth + 20;
      const y = yCounters[d] * (cardHeight + 24) + 20;
      map[node.id] = { x, y };
      yCounters[d]++;
    }
    return map;
  }, [nodesArray, laneWidth, cardHeight]);

  const [positions, setPositions] =
    useState<Record<string, { x: number; y: number }>>(initialPositions);
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const dragState = useRef<{
    draggingId: string | null;
    offsetX: number;
    offsetY: number;
  }>({ draggingId: null, offsetX: 0, offsetY: 0 });

  useEffect(() => setPositions(initialPositions), [initialPositions]);

  useEffect(() => {
    function onPointerMove(e: PointerEvent | TouchEvent) {
      if (!dragState.current.draggingId || !containerRef.current) return;
      const id = dragState.current.draggingId;
      const containerRect = containerRef.current.getBoundingClientRect();
      const clientX =
        (e as PointerEvent).clientX ??
        ((e as TouchEvent).touches && (e as TouchEvent).touches[0].clientX);
      const clientY =
        (e as PointerEvent).clientY ??
        ((e as TouchEvent).touches && (e as TouchEvent).touches[0].clientY);
      if (clientX === undefined || clientY === undefined) return;
      const x = clientX - containerRect.left - dragState.current.offsetX;
      const y = clientY - containerRect.top - dragState.current.offsetY;
      setPositions((prev) => ({
        ...prev,
        [id]: { x: Math.max(0, x), y: Math.max(0, y) },
      }));
    }

    function onPointerUp() {
      dragState.current.draggingId = null;
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("touchmove", onPointerMove, { passive: false });
    window.addEventListener("touchend", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("touchmove", onPointerMove);
      window.removeEventListener("touchend", onPointerUp);
    };
  }, []);

  function startDrag(
    e: React.PointerEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>,
    id: string
  ) {
    e.preventDefault();
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const clientX =
      (e as React.PointerEvent).clientX ??
      ((e as React.TouchEvent).touches &&
        (e as React.TouchEvent).touches[0].clientX);
    const clientY =
      (e as React.PointerEvent).clientY ??
      ((e as React.TouchEvent).touches &&
        (e as React.TouchEvent).touches[0].clientY);
    if (clientX === undefined || clientY === undefined) return;
    const pos = positions[id] || { x: 0, y: 0 };
    dragState.current.draggingId = id;
    dragState.current.offsetX = clientX - containerRect.left - pos.x;
    dragState.current.offsetY = clientY - containerRect.top - pos.y;
  }

  function toggleCollapse(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function isVisible(nodeId: string): boolean {
    let cur = nodesById.get(nodeId);
    while (cur && cur.parentId) {
      if (collapsed.has(cur.parentId)) return false;
      cur = nodesById.get(cur.parentId);
    }
    return true;
  }

  const visibleNodes = nodesArray.filter((n) => isVisible(n.id));

  function linePath(
    fromPos: { x: number; y: number },
    toPos: { x: number; y: number },
    w: number = 140
  ): string {
    const startX = fromPos.x + 150;
    const startY = fromPos.y + cardHeight / 2;
    const endX = toPos.x + 10;
    const endY = toPos.y + cardHeight / 2;
    const cx1 = startX + w;
    const cx2 = endX - w;
    return `M ${startX} ${startY} C ${cx1} ${startY} ${cx2} ${endY} ${endX} ${endY}`;
  }
  console.log(visibleNodes);

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center gap-3">
        <div className="text-lg font-semibold">JSON Hierarchy Visualizer</div>
        <div className="text-sm text-gray-500">
          Drag cards to reposition. Click key to collapse.
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative border rounded-lg overflow-auto bg-white"
        style={{ width: width, height: 640 }}
      >
        <svg
          className="absolute inset-0 pointer-events-none"
          width={width}
          height={640}
        >
          <defs>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8" />
            </marker>
          </defs>

          {visibleNodes.map((node) => {
            if (!node.children || node.children.length === 0) return null;
            const from = positions[node.id];
            if (!from) return null;
            return node.children.map((childId) => {
              const to = positions[childId];
              if (!to || !isVisible(childId)) return null;
              return (
                <path
                  key={`${node.id}:${childId}`}
                  d={linePath(from, to)}
                  stroke="#94a3b8"
                  strokeWidth={2}
                  fill="none"
                  markerEnd="url(#arrow)"
                />
              );
            });
          })}
        </svg>

        {visibleNodes.map((node) => {
          const pos = positions[node.id] || { x: 0, y: 0 };
          const displayKey = node.parentId === null ? "(root)" : node.key;
          let valuePreview: string;

          if (node.type === "object") {
            const props = Object.entries(node.value)
              .map(([k, v]) => {
                if (v === null || typeof v !== "object") {
                  return `${k}: ${JSON.stringify(v)}`;
                } else if (Array.isArray(v)) {
                  return `${k}: ${v.length} items`;
                } else {
                  return `${k}: {…}`;
                }
              })
              .join(", ");
            valuePreview = `{ ${props} }`;
          } else if (node.type === "array") {
            valuePreview = `[${node.value.length}]`;
          } else {
            valuePreview = JSON.stringify(node.value);
          }

          return (
            <div
              key={node.id}
              className="absolute shadow-lg rounded-2xl border p-3 w-56 cursor-grab select-none bg-white"
              style={{ left: pos.x, top: pos.y, height: cardHeight }}
              onPointerDown={(e) => startDrag(e, node.id)}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleCollapse(node.id)}
                      className="text-sm font-medium hover:underline"
                      title="Collapse / expand children"
                    >
                      {displayKey}
                    </button>
                    <span className="text-xs text-gray-400">{node.type}</span>
                  </div>
                  <div className="text-xs text-gray-600 truncate">
                    {valuePreview}
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="text-xs text-gray-400">
                    {node.children.length}
                  </div>
                  <div className="mt-1 text-[10px] text-gray-500">drag</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <div>Usage example:</div>
        <pre className="bg-gray-100 p-2 rounded text-xs mt-2">{`<JSONVisualizer json={myObject} />`}</pre>
      </div>
    </div>
  );
}
