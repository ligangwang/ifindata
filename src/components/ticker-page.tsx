"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Core, ElementDefinition, StylesheetJsonBlock } from "cytoscape";
import { formatTickerSymbol, PredictionAuthorSummary, PredictionReturnSummary } from "@/components/prediction-ui";
import { useAuth } from "@/components/providers/auth-provider";
import type { CompanyGraphEdge, CompanyGraphRelationshipType, CompanyGraphTargetType } from "@/lib/company-graph/types";
import { type PredictionStatus } from "@/lib/predictions/types";

type Prediction = {
  id: string;
  userId: string;
  authorDisplayName: string | null;
  authorNickname: string | null;
  authorPhotoURL: string | null;
  authorStats?: {
    level?: number | null;
    totalPredictions?: number | null;
  } | null;
  direction: "UP" | "DOWN";
  entryPrice: number | null;
  entryDate: string | null;
  thesisTitle: string;
  thesis: string;
  status: PredictionStatus;
  createdAt: string;
  markPrice?: number | null;
  markPriceDate?: string | null;
  markReturnValue?: number | null;
  commentCount: number;
  result: {
    score: number;
  } | null;
};

type TickerResponse = {
  items: Prediction[];
  nextCursor: string | null;
  ticker: string;
};

type CompanyGraphResponse = {
  available: boolean;
  ticker: string;
  companyName: string | null;
  filing: {
    accessionNumber: string | null;
    filingDate: string | null;
    reportDate: string | null;
    filingUrl: string | null;
  } | null;
  edges: CompanyGraphEdge[];
};

type GraphNode = {
  id: string;
  label: string;
  sublabel: string;
  kind: "company" | "theme" | "peer" | "chain" | "calls" | "record";
  width: number;
  height: number;
  relationshipType?: CompanyGraphRelationshipType;
  direction?: CompanyGraphEdge["direction"];
  targetType?: CompanyGraphTargetType;
  evidenceText?: string;
  confidence?: number;
  filingDate?: string;
  positionIndex?: number;
};

function relationLabel(type: CompanyGraphRelationshipType): string {
  return type.replace(/_/g, " ");
}

function relationshipTone(type: CompanyGraphRelationshipType | undefined): {
  line: string;
  nodeBg: string;
  nodeBorder: string;
} {
  if (type === "COMPETES_WITH") {
    return {
      line: "#818cf8",
      nodeBg: "#312e81",
      nodeBorder: "#a5b4fc",
    };
  }

  if (type === "PARTNER_OF" || type === "DISTRIBUTES_FOR") {
    return {
      line: "#22d3ee",
      nodeBg: "#083344",
      nodeBorder: "#67e8f9",
    };
  }

  return {
    line: "#34d399",
    nodeBg: "#052e2b",
    nodeBorder: "#34d399",
  };
}

function directionLabel(direction: CompanyGraphEdge["direction"] | undefined): string {
  return direction ? direction.replace(/_/g, " ") : "direction unknown";
}

function arrowLabel(direction: CompanyGraphEdge["direction"] | undefined, displayTicker: string, targetName: string): string {
  if (direction === "target_to_source") {
    return `${targetName} -> ${displayTicker}`;
  }
  if (direction === "bidirectional") {
    return `${displayTicker} <-> ${targetName}`;
  }
  return `${displayTicker} -> ${targetName}`;
}

function graphKindForEdge(edge: CompanyGraphEdge): GraphNode["kind"] {
  if (edge.relationshipType === "COMPETES_WITH") {
    return "peer";
  }
  return "chain";
}

function summarizeGraphEdges(edges: CompanyGraphEdge[]): string {
  const counts = edges.reduce<Record<string, number>>((accumulator, edge) => {
    accumulator[edge.relationshipType] = (accumulator[edge.relationshipType] ?? 0) + 1;
    return accumulator;
  }, {});
  const summary = Object.entries(counts)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
    .map(([type, count]) => `${count} ${relationLabel(type as CompanyGraphRelationshipType)}`)
    .join(" - ");

  return summary || "Latest 10-K relationships";
}

function secGraphNodes(displayTicker: string, graphEdges: CompanyGraphEdge[]): GraphNode[] {
  const selectedEdges = graphEdges.slice(0, 10);
  return [
    {
      id: "company",
      label: displayTicker,
      sublabel: summarizeGraphEdges(graphEdges),
      kind: "company",
      width: 122,
      height: 78,
    },
    ...selectedEdges.map((edge, index) => ({
      id: `sec-${edge.id}`,
      label: edge.targetName,
      sublabel: `${relationLabel(edge.relationshipType)} - ${directionLabel(edge.direction)} - ${Math.round(edge.confidence * 100)}% confidence`,
      kind: graphKindForEdge(edge),
      width: edge.targetName.length > 18 ? 154 : 132,
      height: 58,
      relationshipType: edge.relationshipType,
      direction: edge.direction,
      targetType: edge.targetType,
      evidenceText: edge.evidenceText,
      confidence: edge.confidence,
      filingDate: edge.filingDate,
      positionIndex: index,
    })),
  ];
}

function relationNodes(displayTicker: string, predictions: Prediction[], graphEdges: CompanyGraphEdge[]): GraphNode[] {
  if (graphEdges.length > 0) {
    return secGraphNodes(displayTicker, graphEdges);
  }

  const bullishCount = predictions.filter((prediction) => prediction.direction === "UP").length;
  const bearishCount = predictions.filter((prediction) => prediction.direction === "DOWN").length;
  const liveCount = predictions.filter((prediction) => ["CREATED", "OPEN", "CLOSING"].includes(prediction.status)).length;
  const settledCount = predictions.filter((prediction) => prediction.status === "SETTLED").length;
  const uniqueAnalystCount = new Set(predictions.map((prediction) => prediction.userId).filter(Boolean)).size;

  return [
    {
      id: "theme",
      label: "Market themes",
      sublabel: "AI, margins, demand, macro",
      kind: "theme",
      width: 136,
      height: 54,
    },
    {
      id: "peers",
      label: "Peer set",
      sublabel: "Competitors and substitutes",
      kind: "peer",
      width: 128,
      height: 52,
    },
    {
      id: "supply",
      label: "Value chain",
      sublabel: "Suppliers, customers, channels",
      kind: "chain",
      width: 132,
      height: 52,
    },
    {
      id: "calls",
      label: "Public calls",
      sublabel: `${bullishCount} bullish - ${bearishCount} bearish`,
      kind: "calls",
      width: 128,
      height: 52,
    },
    {
      id: "activity",
      label: "Track record",
      sublabel: `${liveCount} live - ${settledCount} settled - ${uniqueAnalystCount} analysts`,
      kind: "record",
      width: 128,
      height: 52,
    },
    {
      id: "company",
      label: displayTicker,
      sublabel: "Company node",
      kind: "company",
      width: 112,
      height: 76,
    },
  ];
}

function relationEdges(nodes: GraphNode[], displayTicker: string): ElementDefinition[] {
  return nodes
    .filter((node) => node.id !== "company")
    .map((node) => {
      const isTargetToSource = node.direction === "target_to_source";
      const isBidirectional = node.direction === "bidirectional";
      const relationshipText = node.relationshipType ? relationLabel(node.relationshipType) : node.kind === "calls" ? "tracked by" : "related to";
      const tone = relationshipTone(node.relationshipType);
      return {
        data: {
          id: `company-${node.id}`,
          source: isTargetToSource ? node.id : "company",
          target: isTargetToSource ? "company" : node.id,
          label: relationshipText,
          tooltip: node.relationshipType
            ? `${relationshipText} - ${arrowLabel(node.direction, displayTicker, node.label)} - ${Math.round((node.confidence ?? 0) * 100)}% confidence`
            : relationshipText,
          lineColor: node.relationshipType ? tone.line : "#155e75",
        },
        classes: [
          node.relationshipType ? "relationship" : "context",
          isBidirectional ? "bidirectional" : "",
        ].filter(Boolean).join(" "),
      };
    });
}

function graphPosition(id: string, locked: boolean, node?: GraphNode): { x: number; y: number } {
  if (locked) {
    if (id === "theme") {
      return { x: 230, y: 140 };
    }
    if (id === "activity") {
      return { x: 530, y: 260 };
    }
    return { x: 380, y: 200 };
  }

  if (id.startsWith("sec-")) {
    const index = node?.positionIndex ?? 0;
    const angle = (index / Math.max(6, 10)) * Math.PI * 2 - Math.PI / 2;
    const radiusX = 265;
    const radiusY = 150;
    return {
      x: 380 + Math.cos(angle) * radiusX,
      y: 210 + Math.sin(angle) * radiusY,
    };
  }

  const positions: Record<string, { x: number; y: number }> = {
    activity: { x: 150, y: 300 },
    calls: { x: 150, y: 150 },
    company: { x: 380, y: 210 },
    peers: { x: 620, y: 180 },
    supply: { x: 390, y: 335 },
    theme: { x: 380, y: 70 },
  };

  return positions[id] ?? positions.company;
}

function graphElements(nodes: GraphNode[], locked: boolean): ElementDefinition[] {
  return [
    ...nodes.map((node) => {
      const tone = relationshipTone(node.relationshipType ?? (node.kind === "peer" ? "COMPETES_WITH" : undefined));
      return {
        data: {
          ...node,
          label: node.label,
          detail: node.sublabel,
          nodeBg: tone.nodeBg,
          nodeBorder: tone.nodeBorder,
        },
        position: graphPosition(node.id, locked, node),
        classes: node.kind,
      };
    }),
    ...relationEdges(nodes, nodes.find((node) => node.id === "company")?.label ?? "Company"),
  ];
}

function KnowledgeGraph({
  displayTicker,
  predictions,
  companyGraph,
  locked,
}: {
  displayTicker: string;
  predictions: Prediction[];
  companyGraph: CompanyGraphResponse | null;
  locked: boolean;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cytoscapeRef = useRef<Core | null>(null);
  const nodes = useMemo(() => {
    const allNodes = relationNodes(displayTicker, predictions, locked ? [] : companyGraph?.edges ?? []);
    return locked
      ? allNodes.filter((node) => node.id === "company" || node.id === "theme" || node.id === "activity")
      : allNodes;
  }, [companyGraph?.edges, displayTicker, locked, predictions]);
  const [selectedNodeId, setSelectedNodeId] = useState("company");
  const selectedNodeIdRef = useRef("company");
  const selectedNode = nodes.find((node) => node.id === selectedNodeId) ?? nodes.find((node) => node.id === "company") ?? nodes[0];

  useEffect(() => {
    selectedNodeIdRef.current = selectedNodeId;
  }, [selectedNodeId]);

  useEffect(() => {
    if (!nodes.some((node) => node.id === selectedNodeId)) {
      setSelectedNodeId("company");
    }
  }, [nodes, selectedNodeId]);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    let cancelled = false;
    let cy: Core | null = null;

    const stylesheet: StylesheetJsonBlock[] = [
      {
        selector: "node",
        style: {
          "background-color": "#0f172a",
          "border-color": "#334155",
          "border-width": 2,
          color: "#e0f2fe",
          "font-family": "Inter, sans-serif",
          "font-size": 12,
          "font-weight": 700,
          height: "data(height)",
          label: "data(label)",
          "min-zoomed-font-size": 8,
          shape: "round-rectangle",
          "text-halign": "center",
          "text-max-width": "112px",
          "text-outline-color": "#020617",
          "text-outline-width": "3px",
          "text-valign": "center",
          "text-wrap": "wrap",
          width: "data(width)",
        },
      },
      {
        selector: "node.company",
        style: {
          "background-color": "#064e3b",
          "border-color": "#5eead4",
          color: "#ecfeff",
        },
      },
      {
        selector: "node.theme, node.record",
        style: {
          "background-color": "#083344",
          "border-color": "#22d3ee",
        },
      },
      {
        selector: "node.calls",
        style: {
          "background-color": "#052e2b",
          "border-color": "#34d399",
        },
      },
      {
        selector: "node.chain, node.peer",
        style: {
          "background-color": "data(nodeBg)",
          "border-color": "data(nodeBorder)",
        },
      },
      {
        selector: "edge",
        style: {
          "curve-style": "bezier",
          "line-color": "data(lineColor)",
          "line-opacity": 0.72,
          "target-arrow-color": "data(lineColor)",
          "source-arrow-color": "data(lineColor)",
          width: 2,
        },
      },
      {
        selector: "edge.relationship",
        style: {
          "target-arrow-shape": "triangle",
        },
      },
      {
        selector: "edge.bidirectional",
        style: {
          "source-arrow-shape": "triangle",
        },
      },
      {
        selector: "edge.edge-hover",
        style: {
          color: "#e0f2fe",
          "font-size": 11,
          "font-weight": 700,
          label: "data(tooltip)",
          "line-opacity": 1,
          "text-background-color": "#020617",
          "text-background-opacity": 0.86,
          "text-background-padding": "4px",
          "text-border-color": "#164e63",
          "text-border-opacity": 0.85,
          "text-border-width": 1,
          "text-rotation": "autorotate",
          "text-wrap": "wrap",
          width: 3,
        },
      },
      {
        selector: "node:selected",
        style: {
          "border-color": "#a7f3d0",
          "border-width": 4,
        },
      },
    ];

    void import("cytoscape").then((module) => {
      if (cancelled || !containerRef.current) {
        return;
      }

      const cytoscape = module.default;
      cy = cytoscape({
        autoungrabify: locked,
        boxSelectionEnabled: false,
        container: containerRef.current,
        elements: graphElements(nodes, locked),
        layout: {
          name: "preset",
          animate: false,
          fit: true,
          padding: 55,
        },
        maxZoom: 2.2,
        minZoom: 0.65,
        style: stylesheet,
        wheelSensitivity: 0.18,
      });

      cytoscapeRef.current = cy;
      const initialSelectedNodeId = nodes.some((node) => node.id === selectedNodeIdRef.current)
        ? selectedNodeIdRef.current
        : "company";
      cy.getElementById(initialSelectedNodeId).select();
      cy.on("tap", "node", (event) => {
        const id = event.target.id();
        setSelectedNodeId(id);
        cy?.nodes().unselect();
        event.target.select();
      });
      cy.on("tap", "edge", (event) => {
        const targetNode = event.target.target().id() === "company" ? event.target.source() : event.target.target();
        const id = targetNode.id();
        setSelectedNodeId(id);
        cy?.nodes().unselect();
        targetNode.select();
      });
      cy.on("mouseover", "edge", (event) => {
        event.target.addClass("edge-hover");
      });
      cy.on("mouseout", "edge", (event) => {
        event.target.removeClass("edge-hover");
      });
    });

    return () => {
      cancelled = true;
      cytoscapeRef.current = null;
      cy?.destroy();
    };
  }, [locked, nodes]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70">
      <div className="grid min-h-[420px] gap-0 lg:grid-cols-[1fr_300px]">
        <div className="relative h-[420px] min-h-[360px]">
          <div
            ref={containerRef}
            className="absolute inset-0 h-full w-full"
            aria-label={`${displayTicker} company knowledge graph`}
          />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(8,145,178,0.18),transparent_48%)]" />
          <div className="pointer-events-none absolute left-4 top-4 rounded-xl border border-white/10 bg-slate-950/80 p-3 text-xs text-slate-300 shadow-xl">
            <p className="mb-2 font-semibold uppercase tracking-wide text-slate-500">Color key</p>
            <div className="grid gap-1.5">
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-sm border border-cyan-200 bg-emerald-900" />
                Filing company
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-sm border border-emerald-300 bg-emerald-950" />
                Supply chain
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-sm border border-cyan-200 bg-cyan-950" />
                Partner/channel
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-sm border border-indigo-300 bg-indigo-950" />
                Competitor
              </span>
            </div>
          </div>
        </div>
        <aside className="border-t border-white/10 bg-slate-950/80 p-5 lg:border-l lg:border-t-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">Selected node</p>
          <h3 className="mt-3 font-[var(--font-sora)] text-2xl font-semibold text-cyan-100">{selectedNode.label}</h3>
          <p className="mt-3 text-sm leading-6 text-slate-300">{selectedNode.sublabel}</p>
          <div className="mt-5 rounded-xl border border-white/10 bg-slate-900/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Graph type</p>
            <p className="mt-2 text-sm text-slate-200">
              {companyGraph?.available && !locked
                ? "SEC latest 10-K relationships with filing evidence."
                : "Company relationships, market themes, and public YouAnalyst activity."}
            </p>
          </div>
          {selectedNode.evidenceText ? (
            <div className="mt-4 rounded-xl border border-white/10 bg-slate-900/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Evidence</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">{selectedNode.evidenceText}</p>
              {selectedNode.filingDate ? (
                <p className="mt-3 text-xs text-slate-500">10-K filed {selectedNode.filingDate}</p>
              ) : null}
            </div>
          ) : null}
          {locked ? (
            <div className="mt-4 rounded-xl border border-cyan-400/30 bg-cyan-500/10 p-4">
              <h3 className="font-[var(--font-sora)] text-base font-semibold text-cyan-100">Company graph preview</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Sign in to explore the full company graph, related calls, watchlists, and relationship context.
              </p>
              <Link
                href="/auth"
                className="mt-4 inline-flex rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
              >
                Sign in to explore more
              </Link>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

export function TickerPage({ ticker }: { ticker: string }) {
  const { user, loading: authLoading, getIdToken } = useAuth();
  const [payload, setPayload] = useState<TickerResponse | null>(null);
  const [companyGraph, setCompanyGraph] = useState<CompanyGraphResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [graphError, setGraphError] = useState<string | null>(null);
  const [adminStatus, setAdminStatus] = useState<{ userId: string; isAdmin: boolean } | null>(null);
  const [extractingGraph, setExtractingGraph] = useState(false);
  const [graphActionMessage, setGraphActionMessage] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const displayTicker = formatTickerSymbol(payload?.ticker ?? ticker);
  const graphLocked = authLoading || !user;
  const canExtractGraph = Boolean(user && adminStatus?.userId === user.uid && adminStatus.isAdmin);

  useEffect(() => {
    let cancelled = false;

    setPayload(null);
    setCompanyGraph(null);
    setError(null);
    setGraphError(null);
    setLoadingMore(false);

    void fetch(`/api/ticker/${ticker}?limit=25`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Unable to load ticker predictions.");
        }

        return (await response.json()) as TickerResponse;
      })
      .then((nextPayload) => {
        if (!cancelled) {
          setPayload(nextPayload);
        }
      })
      .catch((nextError) => {
        if (!cancelled) {
          setError(nextError instanceof Error ? nextError.message : "Unable to load ticker.");
        }
      });

    void fetch(`/api/company-graph/${ticker}`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Unable to load company graph.");
        }

        return (await response.json()) as CompanyGraphResponse;
      })
      .then((nextGraph) => {
        if (!cancelled) {
          setCompanyGraph(nextGraph);
        }
      })
      .catch((nextError) => {
        if (!cancelled) {
          setGraphError(nextError instanceof Error ? nextError.message : "Unable to load company graph.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [ticker]);

  useEffect(() => {
    if (authLoading || !user) {
      setAdminStatus(null);
      return;
    }

    let cancelled = false;
    const userId = user.uid;

    async function loadAdminStatus() {
      try {
        const token = await getIdToken(true);
        if (!token) {
          if (!cancelled) {
            setAdminStatus({ userId, isAdmin: false });
          }
          return;
        }

        const response = await fetch("/api/admin/me", {
          headers: {
            authorization: `Bearer ${token}`,
          },
        });
        const payload = (await response.json().catch(() => ({}))) as { isAdmin?: boolean };

        if (!cancelled) {
          setAdminStatus({ userId, isAdmin: response.ok && payload.isAdmin === true });
        }
      } catch {
        if (!cancelled) {
          setAdminStatus({ userId, isAdmin: false });
        }
      }
    }

    void loadAdminStatus();

    return () => {
      cancelled = true;
    };
  }, [authLoading, getIdToken, user]);

  async function refreshCompanyGraph() {
    if (extractingGraph) {
      return;
    }

    setExtractingGraph(true);
    setGraphActionMessage(null);
    setGraphError(null);

    try {
      const token = await getIdToken(true);
      if (!token) {
        throw new Error("Sign in with an admin account to generate SEC graph data.");
      }

      const response = await fetch("/api/admin/company-graph/extract", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ticker: payload?.ticker ?? ticker,
          force: false,
        }),
      });
      const body = (await response.json().catch(() => ({}))) as { error?: string; edges?: CompanyGraphEdge[]; cached?: boolean };

      if (!response.ok) {
        throw new Error(body.error ?? "Unable to generate SEC graph.");
      }

      const graphResponse = await fetch(`/api/company-graph/${encodeURIComponent(payload?.ticker ?? ticker)}`);
      if (graphResponse.ok) {
        setCompanyGraph((await graphResponse.json()) as CompanyGraphResponse);
      }
      setGraphActionMessage(body.cached ? "SEC graph is already current." : `SEC graph generated with ${body.edges?.length ?? 0} edges.`);
    } catch (nextError) {
      setGraphError(nextError instanceof Error ? nextError.message : "Unable to generate SEC graph.");
    } finally {
      setExtractingGraph(false);
    }
  }

  async function loadMorePredictions() {
    if (!payload?.nextCursor || loadingMore) {
      return;
    }

    setLoadingMore(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        limit: "25",
        cursorCreatedAt: payload.nextCursor,
      });
      const response = await fetch(`/api/ticker/${ticker}?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Unable to load more predictions.");
      }

      const nextPayload = (await response.json()) as TickerResponse;
      setPayload((current) => current
        ? {
            ...nextPayload,
            items: [...current.items, ...nextPayload.items],
          }
        : nextPayload);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to load more predictions.");
    } finally {
      setLoadingMore(false);
    }
  }

  if (!payload) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-8 text-sm text-slate-300">
        {error ?? "Loading ticker..."}
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <section className="rounded-2xl border border-cyan-500/25 bg-slate-900/70 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">Company</p>
            <h1 className="mt-2 font-[var(--font-sora)] text-4xl font-semibold text-cyan-100">{displayTicker}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              Public calls, watchlists, and relationship context for {displayTicker}.
            </p>
          </div>
          <Link
            href={`/predictions/new?ticker=${encodeURIComponent(payload.ticker)}`}
            className="w-full rounded-lg bg-cyan-500 px-4 py-2 text-center text-sm font-semibold text-slate-950 hover:bg-cyan-400 sm:w-auto"
          >
            Make your call
          </Link>
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-white/15 bg-slate-950/55 p-5">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="font-[var(--font-sora)] text-xl font-semibold text-cyan-100">Knowledge graph</h2>
            <p className="text-sm text-slate-400">
              {companyGraph?.available && !graphLocked
                ? `Latest 10-K relationships around ${displayTicker}.`
                : `Map company relationships, market themes, and YouAnalyst activity around ${displayTicker}.`}
            </p>
          </div>
          {canExtractGraph ? (
            <button
              type="button"
              onClick={refreshCompanyGraph}
              disabled={extractingGraph}
              className="w-full rounded-lg border border-cyan-400/40 px-4 py-2 text-sm font-semibold text-cyan-100 hover:border-cyan-300 hover:bg-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {extractingGraph ? "Generating..." : companyGraph?.available ? "Check latest 10-K" : "Generate SEC graph"}
            </button>
          ) : null}
        </div>
        {graphActionMessage ? <p className="mb-3 text-sm text-emerald-200">{graphActionMessage}</p> : null}
        {graphError ? <p className="mb-3 text-sm text-amber-200">{graphError}</p> : null}
        <KnowledgeGraph
          displayTicker={displayTicker}
          predictions={payload.items}
          companyGraph={companyGraph}
          locked={graphLocked}
        />
      </section>

      <section className="mt-4 rounded-2xl border border-white/15 bg-slate-950/55 p-5">
        <h2 className="mb-3 font-[var(--font-sora)] text-xl font-semibold text-cyan-100">Predictions</h2>
        <div className="grid gap-2">
          {payload.items.map((prediction) => (
            <article
              key={prediction.id}
              className="rounded-xl border border-white/10 p-4 hover:border-cyan-300/60"
            >
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <Link
                  href={`/ticker/${payload.ticker}`}
                  className="flex w-fit items-center gap-1 text-base font-semibold text-cyan-200 hover:text-cyan-100"
                  aria-label={`${prediction.direction === "UP" ? "Up" : "Down"} prediction for ${payload.ticker}`}
                >
                  <span aria-hidden="true">{prediction.direction === "UP" ? "\u2191" : "\u2193"}</span>
                  <span>{displayTicker}</span>
                </Link>
              </div>
              <PredictionReturnSummary prediction={prediction} href={`/predictions/${prediction.id}`} status={prediction.status} />
              <PredictionAuthorSummary author={prediction} />
            </article>
          ))}

          {payload.items.length === 0 ? (
            <p className="rounded-xl border border-dashed border-white/20 p-5 text-sm text-slate-300">
              No predictions for {displayTicker} yet.
            </p>
          ) : null}
        </div>

        {payload.nextCursor ? (
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={loadMorePredictions}
              disabled={loadingMore}
              className="rounded-lg border border-cyan-400/40 px-4 py-2 text-sm font-semibold text-cyan-100 hover:border-cyan-300 hover:bg-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadingMore ? "Loading..." : "Load more"}
            </button>
          </div>
        ) : null}

        {error && payload.items.length > 0 ? (
          <p className="mt-3 text-center text-sm text-rose-200">{error}</p>
        ) : null}
      </section>
    </main>
  );
}
