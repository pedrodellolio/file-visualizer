import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
  type ReactNode,
} from "react";

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
  arrayKey?: string;
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

  if (type === "object") {
    for (const k of Object.keys(value)) {
      const v = value[k];
      const vType =
        v === null
          ? "null"
          : Array.isArray(v)
          ? "array"
          : (typeof v as NodeKind);

      if (vType === "object") {
        const childNodes = buildNodes(v, k, id, depth + 1);
        const childNode = childNodes[childNodes.length - 1];
        childNode.arrayKey = k;
        node.children.push(childNode.id);
        nodes.push(...childNodes);
      } else if (vType === "array") {
        // Push children of array directly as children of parent node
        for (let i = 0; i < v.length; i++) {
          const childNodes = buildNodes(v[i], `[${i}]`, id, depth + 1);
          const childNode = childNodes[childNodes.length - 1];
          childNode.arrayKey = k;
          node.children.push(childNode.id);
          nodes.push(...childNodes);
        }
      }
      // atomic values stay inside parent card
    }
  } else if (type === "array") {
    // Skip array node itself
    for (let i = 0; i < value.length; i++) {
      const childNodes = buildNodes(value[i], `[${i}]`, parentId, depth);
      nodes.push(...childNodes);
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
      const x = d * laneWidth + 20 + yCounters[d] * 50; // add extra horizontal offset
      const y = yCounters[d] * (cardHeight + 100) + 20;
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
    const startX = fromPos.x + 230;
    const startY = fromPos.y + cardHeight / 2 + 38;
    const endX = toPos.x + 0;
    const endY = toPos.y + cardHeight / 2;
    const cx1 = startX + w;
    const cx2 = endX - w;
    return `M ${startX} ${startY} C ${cx1} ${startY} ${cx2} ${endY} ${endX} ${endY}`;
  }

  function orthoLinePath(
    fromPos: { x: number; y: number },
    toPos: { x: number; y: number }
  ): string {
    const startX = fromPos.x + 230;
    const startY = fromPos.y + cardHeight / 2 + 38;
    const endX = toPos.x;
    const endY = toPos.y + cardHeight / 2;

    const midX = (startX + endX) / 2; // horizontal first, then vertical

    return `M ${startX} ${startY} L ${midX} ${startY} L ${midX} ${endY} L ${endX} ${endY}`;
  }

  return (
    <div className="w-full h-screen flex justify-center items-center">
      <div
        ref={containerRef}
        className="relative shadow-sm rounded-md overflow-auto bg-base-200"
        style={{ width: width, minHeight: 640 }}
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
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--color-base-100)" />
            </marker>
          </defs>

          {visibleNodes.map((node) => {
            if (!node.children || node.children.length === 0) return null;
            const from = positions[node.id];
            if (!from) return null;

            return node.children.map((childId) => {
              const to = positions[childId];
              const childNode = nodesById.get(childId);
              if (!to || !isVisible(childId) || !childNode) return null;

              const pathD = orthoLinePath(from, to);

              // Midpoint for text
              const midX = (from.x + to.x) / 2 + 110;
              const midY = (from.y + to.y) / 2 + 20; // float above line

              return (
                <g key={`${node.id}:${childId}`}>
                  <path
                    d={pathD}
                    stroke="var(--color-base-100)"
                    strokeWidth={2}
                    fill="none"
                    markerEnd="url(#arrow)"
                  />
                  {childNode.arrayKey && (
                    <text
                      x={midX}
                      y={midY}
                      fontSize="12"
                      fill="var(--color-accent)"
                      textAnchor="start"
                    >
                      {childNode.arrayKey}
                    </text>
                  )}
                </g>
              );
            });
          })}
        </svg>

        {visibleNodes.map((node) => {
          const pos = positions[node.id] || { x: 0, y: 0 };
          const displayKey = node.parentId === null ? "(root)" : `${node.key}`;
          let valuePreview: ReactNode[];
          const liClass = "border-t mt-2 pt-2";
          if (node.type === "object") {
            valuePreview = Object.entries(node.value).map(([k, v]) => {
              if (v === null || typeof v !== "object") {
                return (
                  <li key={k} className={liClass}>{`${k}: ${JSON.stringify(
                    v
                  )}`}</li>
                );
              } else if (Array.isArray(v)) {
                return (
                  <li
                    key={k}
                    className={liClass}
                  >{`${k}: [${v.length} items]`}</li>
                );
              } else {
                return <li key={k} className={liClass}>{`${k}: {…}`}</li>;
              }
            });
          } else if (node.type === "array") {
            valuePreview = [
              <li
                key={node.key}
                className={liClass}
              >{`[${node.value.length}]`}</li>,
            ];
          } else {
            valuePreview = [
              <li key={node.key} className={liClass}>
                {JSON.stringify(node.value)}
              </li>,
            ];
          }

          return (
            <div
              key={node.id}
              className="absolute rounded-md p-3 w-56 h-auto cursor-grab select-none bg-base-300"
              style={{
                left: pos.x,
                top: pos.y,
                backfaceVisibility: "hidden",
                transform: "translateZ(0)",
              }}
              onPointerDown={(e) => startDrag(e, node.id)}
            >
              <div className="flex items-start justify-between gap-2 ">
                <div className="w-full">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleCollapse(node.id)}
                      className="text-sm font-medium hover:underline text-accent"
                      title="Collapse / expand children"
                    >
                      {displayKey}
                    </button>
                    <span className="text-xs text-gray-400">{node.type}</span>
                  </div>
                  <ul className="text-xs text-gray-600">{valuePreview}</ul>
                </div>
                <div className="flex flex-col items-end">
                  <div className="text-xs text-gray-400">
                    {node.children.length}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
