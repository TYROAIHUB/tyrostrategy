import { useState, useCallback, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  ReactFlow,
  MiniMap,
  Background,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeTypes,
  type NodeProps,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
  MarkerType,
  Handle,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { graphlib, layout } from "@dagrejs/dagre";
import { motion } from "framer-motion";
import {
  ArrowLeftRight,
  ArrowUpDown,
  LayoutGrid,
  ZoomIn,
  ZoomOut,
  Maximize,
  Filter,
  Crosshair,
} from "lucide-react";
import { useDataStore } from "@/stores/dataStore";
import PageHeader from "@/components/layout/PageHeader";
import SlidingPanel from "@/components/shared/SlidingPanel";
import HedefDetail from "@/components/hedefler/HedefDetail";
import { useSidebarTheme } from "@/hooks/useSidebarTheme";
import { progressColor } from "@/lib/colorUtils";
import { getStatusLabel } from "@/lib/constants";
import type { Hedef, Source, EntityStatus } from "@/types";

// ─── Source colors (matching T-Map) ───────────────────────────────
const SOURCE_COLORS: Record<Source, { bg: string; border: string; text: string }> = {
  "Türkiye": { bg: "#E1F5EE", border: "#10b981", text: "#065f46" },
  Kurumsal: { bg: "#EEEDFE", border: "#8b5cf6", text: "#5b21b6" },
  International: { bg: "#FAECE7", border: "#f97316", text: "#9a3412" },
};

// ─── Status dot hex colors for inline usage ───────────────────────
const STATUS_DOT_HEX: Record<EntityStatus, string> = {
  "On Track": "#10b981",
  Achieved: "#3b82f6",
  Behind: "#ef4444",
  "At Risk": "#f59e0b",
  "Not Started": "#94a3b8",
};

// ─── Node dimensions ─────────────────────────────────────────────
const PARENT_WIDTH = 280;
const PARENT_HEIGHT = 110;
const CHILD_WIDTH = 240;
const CHILD_HEIGHT = 100;

// ─── Node data type ──────────────────────────────────────────────
interface AlignmentNodeData {
  hedef: Hedef;
  actionCount: number;
  nodeType: "parent" | "child" | "standalone";
  [key: string]: unknown;
}

// ─── Custom Node Component ───────────────────────────────────────
function AlignmentNode({ data }: NodeProps<Node<AlignmentNodeData>>) {
  const { t } = useTranslation();
  const { hedef, actionCount, nodeType } = data;
  const sc = SOURCE_COLORS[hedef.source];
  const isParent = nodeType === "parent";
  const isStandalone = nodeType === "standalone";

  const containerStyle: React.CSSProperties = isParent
    ? {
        width: PARENT_WIDTH,
        height: PARENT_HEIGHT,
        background: "linear-gradient(135deg, #1e3a5f 0%, #2d4a7c 100%)",
        border: "2px solid #1e3a5f",
        borderRadius: 14,
        color: "#fff",
        padding: "12px 16px",
      }
    : {
        width: CHILD_WIDTH,
        height: CHILD_HEIGHT,
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(8px)",
        borderLeft: `4px solid ${sc.border}`,
        border: isStandalone ? "1.5px solid #cbd5e1" : undefined,
        borderLeftWidth: isStandalone ? undefined : "4px",
        borderLeftStyle: isStandalone ? undefined : "solid",
        borderLeftColor: isStandalone ? undefined : sc.border,
        borderRadius: 12,
        color: "#1e293b",
        padding: "10px 14px",
        opacity: isStandalone ? 0.8 : 1,
      };

  // Fix: for child nodes, reset border and only use borderLeft
  if (!isParent && !isStandalone) {
    containerStyle.border = "1px solid #e2e8f0";
    containerStyle.borderLeft = `4px solid ${sc.border}`;
  }

  return (
    <div
      style={containerStyle}
      className="flex flex-col justify-between cursor-pointer shadow-md hover:shadow-lg transition-shadow"
    >
      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-slate-400 !border-0" />
      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-slate-400 !border-0" />
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-slate-400 !border-0" id="top" />
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-slate-400 !border-0" id="bottom" />

      {/* Title */}
      <div className="flex items-center gap-1.5 min-w-0">
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: STATUS_DOT_HEX[hedef.status] }}
        />
        <span
          className="text-[12px] font-bold truncate leading-tight"
          style={isParent ? { color: "#fff" } : undefined}
          title={hedef.name}
        >
          {hedef.name}
        </span>
      </div>

      {/* Source + Status */}
      <div className="flex items-center gap-2 mt-1">
        <span
          className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
          style={{
            backgroundColor: isParent ? "rgba(255,255,255,0.2)" : sc.bg,
            color: isParent ? "#fff" : sc.text,
          }}
        >
          {hedef.source}
        </span>
        <span
          className="text-[9px] font-semibold flex items-center gap-1"
          style={{ color: isParent ? "rgba(255,255,255,0.8)" : "#64748b" }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full inline-block"
            style={{ backgroundColor: STATUS_DOT_HEX[hedef.status] }}
          />
          {getStatusLabel(hedef.status, t)}
        </span>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-2 mt-1.5">
        <div
          className="flex-1 h-1.5 rounded-full overflow-hidden"
          style={{ backgroundColor: isParent ? "rgba(255,255,255,0.2)" : "#e2e8f0" }}
        >
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(hedef.progress, 100)}%`,
              backgroundColor: isParent ? "#60a5fa" : progressColor(hedef.progress),
            }}
          />
        </div>
        <span
          className="text-[10px] font-bold tabular-nums"
          style={{ color: isParent ? "rgba(255,255,255,0.9)" : "#475569" }}
        >
          %{hedef.progress}
        </span>
      </div>

      {/* Action count */}
      <div
        className="text-[9px] font-medium mt-1"
        style={{ color: isParent ? "rgba(255,255,255,0.6)" : "#94a3b8" }}
      >
        {actionCount} {t("tAlignment.actions")}
      </div>
    </div>
  );
}

// ─── Layout helper ───────────────────────────────────────────────
type Direction = "LR" | "TB";

function getLayoutedElements(
  nodes: Node<AlignmentNodeData>[],
  edges: Edge[],
  direction: Direction = "LR",
): { nodes: Node<AlignmentNodeData>[]; edges: Edge[] } {
  const g = new graphlib.Graph();
  g.setGraph({
    rankdir: direction,
    nodesep: 80,
    ranksep: 120,
    marginx: 40,
    marginy: 40,
  });
  g.setDefaultEdgeLabel(() => ({}));

  for (const node of nodes) {
    const w = node.data.nodeType === "parent" ? PARENT_WIDTH : CHILD_WIDTH;
    const h = node.data.nodeType === "parent" ? PARENT_HEIGHT : CHILD_HEIGHT;
    g.setNode(node.id, { width: w, height: h });
  }

  for (const edge of edges) {
    g.setEdge(edge.source, edge.target);
  }

  layout(g);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = g.node(node.id);
    const w = node.data.nodeType === "parent" ? PARENT_WIDTH : CHILD_WIDTH;
    const h = node.data.nodeType === "parent" ? PARENT_HEIGHT : CHILD_HEIGHT;
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - w / 2,
        y: nodeWithPosition.y - h / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

// ─── Build graph data from hedefler ──────────────────────────────
function buildGraphData(
  hedefler: Hedef[],
  aksiyonCountMap: Map<string, number>,
  direction: Direction,
  sourceFilter: string,
  statusFilter: string,
): { nodes: Node<AlignmentNodeData>[]; edges: Edge[] } {
  // Filter hedefler
  let filtered = hedefler;
  if (sourceFilter !== "all") {
    filtered = filtered.filter((h) => h.source === sourceFilter);
  }
  if (statusFilter !== "all") {
    filtered = filtered.filter((h) => h.status === statusFilter);
  }

  const filteredIds = new Set(filtered.map((h) => h.id));
  const childIds = new Set(filtered.filter((h) => h.parentObjectiveId).map((h) => h.parentObjectiveId!));

  // Classify nodes
  const nodes: Node<AlignmentNodeData>[] = filtered.map((hedef) => {
    const hasChildren = filtered.some((h) => h.parentObjectiveId === hedef.id);
    const isChild = !!hedef.parentObjectiveId;
    let nodeType: "parent" | "child" | "standalone";

    if (!isChild && hasChildren) {
      nodeType = "parent";
    } else if (isChild) {
      nodeType = "child";
    } else {
      nodeType = "standalone";
    }

    return {
      id: hedef.id,
      type: "alignmentNode",
      position: { x: 0, y: 0 },
      data: {
        hedef,
        actionCount: aksiyonCountMap.get(hedef.id) ?? 0,
        nodeType,
      },
    };
  });

  // Build edges
  const edges: Edge[] = [];
  const parentChildGroups = new Map<string, string[]>();

  for (const hedef of filtered) {
    if (hedef.parentObjectiveId && filteredIds.has(hedef.parentObjectiveId)) {
      // Parent → Child edge
      edges.push({
        id: `e-${hedef.parentObjectiveId}-${hedef.id}`,
        source: hedef.parentObjectiveId,
        target: hedef.id,
        sourceHandle: direction === "LR" ? undefined : "bottom",
        targetHandle: direction === "LR" ? undefined : "top",
        type: "default",
        animated: true,
        style: { stroke: "#94a3b8", strokeWidth: 1.5 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#94a3b8", width: 16, height: 16 },
      });

      // Group siblings
      if (!parentChildGroups.has(hedef.parentObjectiveId)) {
        parentChildGroups.set(hedef.parentObjectiveId, []);
      }
      parentChildGroups.get(hedef.parentObjectiveId)!.push(hedef.id);
    }
  }

  // Sibling ↔ Sibling edges (dashed)
  for (const [, siblings] of parentChildGroups) {
    for (let i = 0; i < siblings.length - 1; i++) {
      edges.push({
        id: `s-${siblings[i]}-${siblings[i + 1]}`,
        source: siblings[i],
        target: siblings[i + 1],
        type: "default",
        style: { stroke: "#cbd5e1", strokeWidth: 1, strokeDasharray: "5,5" },
      });
    }
  }

  return getLayoutedElements(nodes, edges, direction);
}

// ─── Inner component (needs ReactFlowProvider) ──────────────────
function TAlignmentInner() {
  const { t } = useTranslation();
  const sidebarTheme = useSidebarTheme();
  const accentColor = sidebarTheme.accentColor;

  const hedefler = useDataStore((s) => s.hedefler);
  const aksiyonlar = useDataStore((s) => s.aksiyonlar);

  const [direction, setDirection] = useState<Direction>("LR");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedHedef, setSelectedHedef] = useState<Hedef | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const { fitView, zoomIn, zoomOut } = useReactFlow();

  // Action count map
  const aksiyonCountMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of aksiyonlar) {
      map.set(a.hedefId, (map.get(a.hedefId) ?? 0) + 1);
    }
    return map;
  }, [aksiyonlar]);

  // Build graph
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => buildGraphData(hedefler, aksiyonCountMap, direction, sourceFilter, statusFilter),
    [hedefler, aksiyonCountMap, direction, sourceFilter, statusFilter],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync when data/filters change
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Fit view on initial load and when layout changes
  useEffect(() => {
    const timer = setTimeout(() => fitView({ padding: 0.15, duration: 400 }), 100);
    return () => clearTimeout(timer);
  }, [direction, sourceFilter, statusFilter, fitView]);

  const nodeTypes: NodeTypes = useMemo(
    () => ({ alignmentNode: AlignmentNode }),
    [],
  );

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const hedef = hedefler.find((h) => h.id === node.id);
      if (hedef) {
        setSelectedHedef(hedef);
        setPanelOpen(true);
      }
    },
    [hedefler],
  );

  const handleAutoLayout = useCallback(() => {
    const result = getLayoutedElements(nodes as Node<AlignmentNodeData>[], edges, direction);
    setNodes(result.nodes);
    setEdges(result.edges);
    setTimeout(() => fitView({ padding: 0.15, duration: 400 }), 50);
  }, [nodes, edges, direction, setNodes, setEdges, fitView]);

  // Source filter options
  const sourceOptions = [
    { key: "all", label: t("common.all") },
    { key: "Türkiye", label: "Türkiye" },
    { key: "Kurumsal", label: "Kurumsal" },
    { key: "International", label: "International" },
  ];

  // Status filter options
  const statusOptions: { key: string; label: string }[] = [
    { key: "all", label: t("common.all") },
    { key: "On Track", label: t("status.onTrack") },
    { key: "Achieved", label: t("status.achieved") },
    { key: "Behind", label: t("status.behind") },
    { key: "At Risk", label: t("status.atRisk") },
    { key: "Not Started", label: t("status.notStarted") },
  ];

  const pillBtnClass = (active: boolean) =>
    `px-3 py-1.5 text-[12px] font-semibold rounded-full transition-all cursor-pointer border ${
      active
        ? "text-white shadow-sm"
        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
    }`;

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title={t("pages.tAlignment.title")}
        subtitle={t("pages.tAlignment.subtitle")}
      />

      {/* Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-wrap items-center gap-2 mb-3 px-1"
      >
        {/* Direction toggle */}
        <div className="flex items-center gap-1 bg-white rounded-full border border-slate-200 p-0.5">
          <button
            onClick={() => setDirection("LR")}
            className={pillBtnClass(direction === "LR")}
            style={direction === "LR" ? { backgroundColor: accentColor, borderColor: accentColor } : undefined}
          >
            <ArrowLeftRight size={13} className="inline mr-1 -mt-0.5" />
            {t("tAlignment.horizontal")}
          </button>
          <button
            onClick={() => setDirection("TB")}
            className={pillBtnClass(direction === "TB")}
            style={direction === "TB" ? { backgroundColor: accentColor, borderColor: accentColor } : undefined}
          >
            <ArrowUpDown size={13} className="inline mr-1 -mt-0.5" />
            {t("tAlignment.vertical")}
          </button>
        </div>

        {/* Source filter */}
        <div className="flex items-center gap-1.5">
          <Filter size={14} className="text-slate-400" />
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="text-[12px] font-medium bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-slate-300"
          >
            {sourceOptions.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-[12px] font-medium bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-slate-300"
        >
          {statusOptions.map((o) => (
            <option key={o.key} value={o.key}>
              {o.label}
            </option>
          ))}
        </select>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Zoom controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => zoomIn({ duration: 200 })}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn size={15} />
          </button>
          <button
            onClick={() => zoomOut({ duration: 200 })}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut size={15} />
          </button>
          <button
            onClick={() => fitView({ padding: 0.15, duration: 400 })}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
            title={t("tAlignment.fitView")}
          >
            <Maximize size={15} />
          </button>
        </div>

        {/* Auto layout */}
        <button
          onClick={handleAutoLayout}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold rounded-lg border transition-all cursor-pointer hover:shadow-sm"
          style={{
            backgroundColor: `${accentColor}10`,
            borderColor: `${accentColor}30`,
            color: accentColor,
          }}
        >
          <LayoutGrid size={13} />
          {t("tAlignment.autoLayout")}
        </button>
      </motion.div>

      {/* ReactFlow container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="rounded-2xl border border-slate-200 overflow-hidden bg-white"
        style={{ height: "calc(100vh - 240px)", minHeight: 500 }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          nodeTypes={nodeTypes}
          style={{ width: "100%", height: "100%" }}
          onInit={(instance) => { setTimeout(() => instance.fitView({ padding: 0.2, duration: 300 }), 200); }}
          minZoom={0.1}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e2e8f0" />
          <MiniMap
            nodeColor={(node) => {
              const data = node.data as AlignmentNodeData;
              if (data.nodeType === "parent") return "#1e3a5f";
              return SOURCE_COLORS[data.hedef.source]?.border ?? "#94a3b8";
            }}
            maskColor="rgba(0,0,0,0.08)"
            style={{ borderRadius: 12, border: "1px solid #e2e8f0" }}
          />
        </ReactFlow>
      </motion.div>

      {/* Sliding Panel */}
      <SlidingPanel
        isOpen={panelOpen}
        onClose={() => {
          setPanelOpen(false);
          setSelectedHedef(null);
        }}
        title={t("detail.objectiveDetail")}
        icon={<Crosshair size={18} />}
        maxWidth={520}
      >
        {selectedHedef && (
          <HedefDetail
            hedef={selectedHedef}
            onEdit={() => {}}
            onSelectHedef={(h) => {
              setSelectedHedef(h);
            }}
          />
        )}
      </SlidingPanel>
    </div>
  );
}

// ─── Page wrapper with provider ──────────────────────────────────
export default function TAlignmentPage() {
  return (
    <ReactFlowProvider>
      <TAlignmentInner />
    </ReactFlowProvider>
  );
}
