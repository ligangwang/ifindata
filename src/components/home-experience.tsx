"use client";

import type cytoscape from "cytoscape";
import type { ElementDefinition, EventObject, EventObjectNode } from "cytoscape";
import CytoscapeComponent from "react-cytoscapejs";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";

type RelationshipType = "supplier" | "customer" | "competitor";

type GraphNode = {
  id: string;
  label: string;
  ticker: string;
  description: string;
};

type GraphEdge = {
  id: string;
  source: string;
  target: string;
  type: RelationshipType;
  confidence: number;
  sourceNote: string;
};

type GraphResponse = {
  centerCompanyId: number;
  relationshipTypes: RelationshipType[];
  nodes: GraphNode[];
  edges: GraphEdge[];
};

type Company = {
  id: number;
  name: string;
  ticker: string;
  description: string;
  metadata: Record<string, unknown>;
};

type CompanyRelationship = {
  id: number;
  sourceCompanyId: number;
  targetCompanyId: number;
  type: RelationshipType;
  confidence: number;
};

type CompanyResponse = {
  company: Company;
  relationships: CompanyRelationship[];
};

type SearchResponse = {
  companies: Company[];
};

const DEFAULT_CENTER_ID = 1;

const relationshipLabel: Record<RelationshipType, string> = {
  customer: "Customers",
  supplier: "Suppliers",
  competitor: "Competitors",
};

const graphStylesheet: Array<{ selector: string; style: Record<string, string | number> }> = [
  {
    selector: "node",
    style: {
      label: "data(label)",
      "text-valign": "center",
      "text-halign": "center",
      "font-size": 11,
      color: "#fef3c7",
      "font-family": "var(--font-sora)",
      "text-wrap": "wrap",
      "text-max-width": 90,
      width: "mapData(degree, 1, 8, 34, 58)",
      height: "mapData(degree, 1, 8, 34, 58)",
      "border-width": 1,
      "border-color": "#1d4ed8",
      "background-color": "#1e3a8a",
      "background-opacity": 0.92,
      "text-outline-width": 2,
      "text-outline-color": "#0f172a",
    },
  },
  {
    selector: 'node[isCenter = "true"]',
    style: {
      "background-color": "#0ea5e9",
      "border-color": "#67e8f9",
      width: 70,
      height: 70,
      "font-size": 13,
    },
  },
  {
    selector: "edge",
    style: {
      width: "mapData(confidence, 0.5, 1, 1.5, 5)",
      "line-color": "#3b82f6",
      "target-arrow-color": "#3b82f6",
      "target-arrow-shape": "triangle",
      "curve-style": "bezier",
      opacity: 0.85,
    },
  },
  {
    selector: 'edge[type = "supplier"]',
    style: {
      "line-color": "#14b8a6",
      "target-arrow-color": "#14b8a6",
    },
  },
  {
    selector: 'edge[type = "competitor"]',
    style: {
      "line-color": "#f97316",
      "target-arrow-color": "#f97316",
      "line-style": "dashed",
    },
  },
];

function summarizeRelationships(relationships: CompanyRelationship[]) {
  const summary: Record<RelationshipType, number> = {
    customer: 0,
    supplier: 0,
    competitor: 0,
  };

  for (const relationship of relationships) {
    summary[relationship.type] += 1;
  }

  return summary;
}

export function HomeExperience() {
  const {
    user,
    loading: authLoading,
    configured: authConfigured,
    error: authError,
    signInWithGoogle,
    signInWithEmail,
    createAccountWithEmail,
    signOut,
  } = useAuth();
  const [centerCompanyId, setCenterCompanyId] = useState<number>(DEFAULT_CENTER_ID);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number>(DEFAULT_CENTER_ID);
  const [graphData, setGraphData] = useState<GraphResponse | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<CompanyResponse | null>(null);
  const [graphLoading, setGraphLoading] = useState(true);
  const [graphError, setGraphError] = useState<string | null>(null);
  const [hoverText, setHoverText] = useState<string>("Hover edges to inspect relationship confidence.");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Company[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [createMode, setCreateMode] = useState(false);
  const [emailSubmitting, setEmailSubmitting] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMenuOpen, setAuthMenuOpen] = useState(false);
  const [relationshipFilter, setRelationshipFilter] = useState<Record<RelationshipType, boolean>>({
    customer: true,
    supplier: false,
    competitor: false,
  });
  const avatarMenuRef = useRef<HTMLDivElement | null>(null);

  const activeTypes = useMemo(
    () =>
      (Object.entries(relationshipFilter) as Array<[RelationshipType, boolean]>)
        .filter(([, enabled]) => enabled)
        .map(([type]) => type),
    [relationshipFilter],
  );

  const nodeById = useMemo(() => {
    const map = new Map<number, GraphNode>();
    if (!graphData) {
      return map;
    }

    for (const node of graphData.nodes) {
      map.set(Number(node.id), node);
    }

    return map;
  }, [graphData]);

  const graphElements = useMemo<ElementDefinition[]>(() => {
    if (!graphData) {
      return [];
    }

    const nodes: ElementDefinition[] = graphData.nodes.map((node) => ({
      data: {
        id: node.id,
        label: node.label,
        ticker: node.ticker,
        isCenter: node.id === String(centerCompanyId) ? "true" : "false",
      },
      classes: "company-node",
    }));

    const edges: ElementDefinition[] = graphData.edges.map((edge) => ({
      data: {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type,
        confidence: edge.confidence,
        sourceNote: edge.sourceNote,
      },
    }));

    return [...nodes, ...edges];
  }, [graphData, centerCompanyId]);

  useEffect(() => {
    let cancelled = false;
    const graphTypeParam = activeTypes.length > 0 ? activeTypes.join(",") : "customer";

    async function loadGraph() {
      setGraphLoading(true);
      setGraphError(null);

      try {
        const response = await fetch(
          `/api/graph/${centerCompanyId}?types=${encodeURIComponent(graphTypeParam)}&maxNodes=20`,
        );

        if (!response.ok) {
          throw new Error("Unable to load graph.");
        }

        const payload = (await response.json()) as GraphResponse;
        if (!cancelled) {
          setGraphData(payload);
        }
      } catch (error) {
        if (!cancelled) {
          setGraphError(error instanceof Error ? error.message : "Graph failed to load.");
          setGraphData(null);
        }
      } finally {
        if (!cancelled) {
          setGraphLoading(false);
        }
      }
    }

    void loadGraph();

    return () => {
      cancelled = true;
    };
  }, [centerCompanyId, activeTypes]);

  useEffect(() => {
    let cancelled = false;
    const graphTypeParam = activeTypes.length > 0 ? activeTypes.join(",") : "customer";

    async function loadCompany() {
      try {
        const response = await fetch(
          `/api/company/${selectedCompanyId}?types=${encodeURIComponent(graphTypeParam)}`,
        );

        if (!response.ok) {
          throw new Error("Unable to load company details.");
        }

        const payload = (await response.json()) as CompanyResponse;
        if (!cancelled) {
          setSelectedCompany(payload);
        }
      } catch {
        if (!cancelled) {
          setSelectedCompany(null);
        }
      }
    }

    void loadCompany();

    return () => {
      cancelled = true;
    };
  }, [selectedCompanyId, activeTypes]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    let cancelled = false;
    setSearchLoading(true);

    const timeout = setTimeout(() => {
      void fetch(`/api/company/search?q=${encodeURIComponent(searchQuery.trim())}&limit=8`)
        .then(async (response) => {
          if (!response.ok) {
            throw new Error("Search failed.");
          }

          const payload = (await response.json()) as SearchResponse;
          if (!cancelled) {
            setSearchResults(payload.companies);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setSearchResults([]);
          }
        })
        .finally(() => {
          if (!cancelled) {
            setSearchLoading(false);
          }
        });
    }, 220);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [searchQuery]);

  useEffect(() => {
    if (!graphData) {
      return;
    }

    const ids = new Set(graphData.nodes.map((node) => Number(node.id)));
    if (!ids.has(selectedCompanyId)) {
      setSelectedCompanyId(centerCompanyId);
    }
  }, [graphData, selectedCompanyId, centerCompanyId]);

  useEffect(() => {
    if (!authModalOpen) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setAuthModalOpen(false);
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [authModalOpen]);

  useEffect(() => {
    if (!authMenuOpen) {
      return;
    }

    function handleOutsideClick(event: MouseEvent) {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(event.target as Node)) {
        setAuthMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setAuthMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    window.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [authMenuOpen]);

  useEffect(() => {
    if (user && authModalOpen) {
      setAuthModalOpen(false);
      setPassword("");
    }
  }, [user, authModalOpen]);

  const summary = selectedCompany ? summarizeRelationships(selectedCompany.relationships) : null;
  const selectedNode = nodeById.get(selectedCompanyId);
  const userInitial = user?.displayName?.trim()?.charAt(0)?.toUpperCase() ??
    user?.email?.trim()?.charAt(0)?.toUpperCase() ??
    "U";

  function handleFilterToggle(type: RelationshipType) {
    setRelationshipFilter((previous) => {
      const enabledCount = Object.values(previous).filter(Boolean).length;
      if (previous[type] && enabledCount === 1) {
        return previous;
      }

      return {
        ...previous,
        [type]: !previous[type],
      };
    });
  }

  async function handleSignIn() {
    try {
      await signInWithGoogle();
    } catch {
      // Error state is handled by the auth provider.
    }
  }

  async function handleSignOut() {
    try {
      setAuthMenuOpen(false);
      await signOut();
    } catch {
      // Error state is handled by the auth provider.
    }
  }

  async function handleEmailAuth(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedEmail = email.trim();
    if (!normalizedEmail || !password) {
      return;
    }

    setEmailSubmitting(true);
    try {
      if (createMode) {
        await createAccountWithEmail(normalizedEmail, password);
      } else {
        await signInWithEmail(normalizedEmail, password);
      }
      setPassword("");
    } catch {
      // Error state is handled by the auth provider.
    } finally {
      setEmailSubmitting(false);
    }
  }

  return (
    <main className="graph-page min-h-screen text-amber-50">
      <div className="mx-auto flex w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 rounded-3xl border border-sky-300/25 bg-slate-950/70 p-4 backdrop-blur sm:p-5">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
              <input
                aria-label="Search company"
                className="w-full rounded-2xl border border-sky-300/30 bg-slate-950/70 px-4 py-3 text-base text-amber-50 outline-none transition-colors placeholder:text-slate-400 focus:border-sky-300"
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search company..."
                value={searchQuery}
              />
              {searchQuery.trim() ? (
                <div className="absolute z-20 mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950/95 p-2 shadow-2xl">
                  {searchLoading ? (
                    <p className="px-3 py-2 text-sm text-slate-300">Searching...</p>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((company) => (
                      <button
                        key={company.id}
                        className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-slate-800"
                        onClick={() => {
                          setCenterCompanyId(company.id);
                          setSelectedCompanyId(company.id);
                          setSearchQuery("");
                          setSearchResults([]);
                        }}
                        type="button"
                      >
                        <span>{company.name}</span>
                        <span className="text-xs text-sky-200">{company.ticker}</span>
                      </button>
                    ))
                  ) : (
                    <p className="px-3 py-2 text-sm text-slate-300">No companies found.</p>
                  )}
                </div>
              ) : null}
              </div>

              <div className="flex items-center gap-2">
                {authConfigured ? (
                  user ? (
                    <div className="relative" ref={avatarMenuRef}>
                      <button
                        aria-expanded={authMenuOpen}
                        aria-haspopup="menu"
                        className="flex items-center gap-2 rounded-full border border-slate-600 bg-slate-900/70 px-1 py-1 text-slate-100 transition-colors hover:border-slate-400"
                        onClick={() => {
                          setAuthMenuOpen((previous) => !previous);
                        }}
                        type="button"
                      >
                        <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-slate-600 bg-slate-900 text-xs font-semibold text-sky-100">
                          {user.photoURL ? (
                            <img
                              alt={user.displayName || user.email || "User avatar"}
                              className="h-full w-full object-cover"
                              referrerPolicy="no-referrer"
                              src={user.photoURL}
                            />
                          ) : (
                            <span>{userInitial}</span>
                          )}
                        </div>
                      </button>

                      {authMenuOpen ? (
                        <div
                          className="absolute right-0 z-30 mt-2 min-w-44 rounded-xl border border-slate-700 bg-slate-950/95 p-1 shadow-2xl"
                          role="menu"
                        >
                          <p className="truncate px-3 py-2 text-xs text-slate-400">
                            {user.displayName || user.email || "Signed in"}
                          </p>
                          <button
                            className="flex w-full rounded-lg px-3 py-2 text-left text-sm text-slate-100 transition-colors hover:bg-slate-800"
                            onClick={() => {
                              void handleSignOut();
                            }}
                            role="menuitem"
                            type="button"
                          >
                            Sign out
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <button
                      className="rounded-xl border border-sky-300/40 bg-sky-500/15 px-3 py-2 text-xs text-sky-100 transition-colors hover:border-sky-200"
                      disabled={authLoading}
                      onClick={() => {
                        setAuthModalOpen(true);
                      }}
                      type="button"
                    >
                      {authLoading ? "Checking auth..." : "Sign in"}
                    </button>
                  )
                ) : (
                  <span className="rounded-xl border border-amber-300/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                    Firebase Auth not configured
                  </span>
                )}
              </div>

            </div>

            {authError ? (
              <p className="text-sm text-rose-200" role="status">
                {authError}
              </p>
            ) : null}

            <div>
              <h1 className="font-[family:var(--font-sora)] text-3xl font-semibold text-amber-100 sm:text-4xl">
                TSMC Customer Ecosystem
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-200 sm:text-base">
                TSMC manufactures chips for these companies. Click any company to explore.
              </p>
            </div>
          </div>
        </header>

        <section className="grid flex-1 gap-6 lg:grid-cols-[1.7fr_1fr]">
          <article className="rounded-3xl border border-sky-300/20 bg-slate-950/70 p-3 shadow-[0_30px_80px_rgba(2,6,23,0.7)] sm:p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                {(Object.keys(relationshipLabel) as RelationshipType[]).map((type) => {
                  const enabled = relationshipFilter[type];
                  return (
                    <button
                      key={type}
                      className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                        enabled
                          ? "border-sky-200 bg-sky-300/20 text-sky-100"
                          : "border-slate-600 bg-slate-900/50 text-slate-300 hover:border-slate-500"
                      }`}
                      onClick={() => handleFilterToggle(type)}
                      type="button"
                    >
                      {relationshipLabel[type]}
                    </button>
                  );
                })}
              </div>
              <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
                1-hop graph · max 20 nodes
              </span>
            </div>

            <div className="mb-3 rounded-xl border border-sky-900/70 bg-slate-900/60 px-3 py-2 text-xs text-sky-100">
              {hoverText}
            </div>

            <div className="graph-canvas rounded-2xl border border-slate-700/80 bg-slate-950/85">
              {graphLoading ? (
                <div className="flex h-full items-center justify-center text-slate-300">Loading graph...</div>
              ) : graphError ? (
                <div className="flex h-full items-center justify-center text-rose-300">{graphError}</div>
              ) : (
                <CytoscapeComponent
                  cy={(cy: cytoscape.Core) => {
                    cy.off("tap", "node");
                    cy.off("mouseover", "edge");
                    cy.off("mouseout", "edge");

                    cy.on("tap", "node", (event: EventObjectNode) => {
                      const nodeId = Number(event.target.id());
                      if (!Number.isFinite(nodeId)) {
                        return;
                      }

                      setSelectedCompanyId(nodeId);
                      setCenterCompanyId(nodeId);
                    });

                    cy.on("mouseover", "edge", (event: EventObject) => {
                      const edge = event.target.data();
                      const confidencePct = Math.round(Number(edge.confidence) * 100);
                      setHoverText(
                        `${String(edge.type).toUpperCase()} · ${confidencePct}% confidence · source: ${String(edge.sourceNote)}`,
                      );
                    });

                    cy.on("mouseout", "edge", () => {
                      setHoverText("Hover edges to inspect relationship confidence.");
                    });
                  }}
                  elements={graphElements}
                  layout={{
                    name: "cose",
                    animate: true,
                    animationDuration: 380,
                    padding: 24,
                    fit: true,
                  }}
                  minZoom={0.4}
                  maxZoom={2.2}
                  stylesheet={graphStylesheet}
                  style={{ width: "100%", height: "100%" }}
                  wheelSensitivity={0.18}
                />
              )}
            </div>
          </article>

          <aside className="rounded-3xl border border-sky-300/20 bg-slate-950/70 p-5">
            <p className="text-xs tracking-[0.2em] text-slate-400 uppercase">Selected Company</p>
            <h2 className="mt-3 font-[family:var(--font-sora)] text-3xl font-semibold text-amber-100">
              {selectedCompany?.company.name ?? selectedNode?.label ?? "TSMC"}
            </h2>
            <p className="mt-1 text-sm text-sky-200">
              {selectedCompany?.company.ticker ?? selectedNode?.ticker ?? "TSM"}
            </p>

            <p className="mt-4 text-sm leading-7 text-slate-200">
              {selectedCompany?.company.description ??
                selectedNode?.description ??
                "Select a company node to inspect its role in the semiconductor ecosystem."}
            </p>

            <div className="mt-6 grid gap-3">
              {(Object.keys(relationshipLabel) as RelationshipType[]).map((type) => (
                <div key={type} className="rounded-2xl border border-slate-700 bg-slate-900/70 p-3">
                  <p className="text-xs tracking-[0.15em] text-slate-400 uppercase">{relationshipLabel[type]}</p>
                  <p className="mt-1 font-[family:var(--font-sora)] text-2xl text-amber-100">
                    {summary ? summary[type] : "-"}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-blue-300/35 bg-blue-500/10 p-4 text-sm leading-7 text-blue-100">
              Click any node to center the graph on that company and keep exploring one hop at a time.
            </div>
          </aside>
        </section>
      </div>

      {authConfigured && !user && authModalOpen ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setAuthModalOpen(false);
            }
          }}
          role="dialog"
        >
          <div className="w-full max-w-md rounded-3xl border border-sky-300/30 bg-slate-950 p-5 shadow-2xl sm:p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-[family:var(--font-sora)] text-2xl text-amber-100">Sign in to IFinData</h2>
              <button
                aria-label="Close sign-in modal"
                className="rounded-lg border border-slate-700 px-2 py-1 text-xs text-slate-200 hover:border-slate-500"
                onClick={() => {
                  setAuthModalOpen(false);
                }}
                type="button"
              >
                Close
              </button>
            </div>

            <p className="mt-2 text-sm text-slate-300">Use Google or email/password to continue.</p>

            <button
              className="mt-4 w-full rounded-xl border border-sky-300/40 bg-sky-500/15 px-4 py-2 text-sm text-sky-100 transition-colors hover:border-sky-200"
              disabled={authLoading || emailSubmitting}
              onClick={() => {
                void handleSignIn();
              }}
              type="button"
            >
              {authLoading ? "Checking auth..." : "Continue with Google"}
            </button>

            <div className="my-4 flex items-center gap-2 text-xs text-slate-500">
              <span className="h-px flex-1 bg-slate-700" />
              <span>or with email</span>
              <span className="h-px flex-1 bg-slate-700" />
            </div>

            <form className="grid gap-2" onSubmit={handleEmailAuth}>
              <input
                aria-label="Email"
                autoComplete="email"
                className="rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-amber-50 outline-none placeholder:text-slate-400 focus:border-sky-300"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email"
                type="email"
                value={email}
              />
              <input
                aria-label="Password"
                autoComplete={createMode ? "new-password" : "current-password"}
                className="rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-amber-50 outline-none placeholder:text-slate-400 focus:border-sky-300"
                minLength={6}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password"
                type="password"
                value={password}
              />
              <div className="mt-1 flex items-center gap-2">
                <button
                  className="rounded-xl border border-slate-500 bg-slate-800 px-3 py-2 text-xs text-slate-100 transition-colors hover:border-slate-300"
                  disabled={emailSubmitting || authLoading}
                  type="submit"
                >
                  {emailSubmitting ? "Working..." : createMode ? "Create account" : "Sign in"}
                </button>
                <button
                  className="rounded-xl border border-sky-300/40 bg-sky-500/15 px-3 py-2 text-xs text-sky-100 transition-colors hover:border-sky-200"
                  onClick={() => {
                    setCreateMode((previous) => !previous);
                  }}
                  type="button"
                >
                  {createMode ? "Use sign in" : "Create account mode"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

    </main>
  );
}
