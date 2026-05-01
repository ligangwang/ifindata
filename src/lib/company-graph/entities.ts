const COMPANY_SUFFIX_TOKENS = new Set([
  "ag",
  "bv",
  "co",
  "company",
  "corp",
  "corporation",
  "gmbh",
  "inc",
  "incorporated",
  "limited",
  "llc",
  "lp",
  "ltd",
  "nv",
  "plc",
  "sa",
]);

type EdgeLike = {
  targetName: string;
  relationshipType: string;
  direction: string;
  confidence: number;
};

type TickerEntityCandidate = {
  symbol: string;
  symbolLower: string;
  name: string;
  nameKey: string;
  exchangePriority: number;
};

function normalizeSuffixForms(value: string): string {
  return value
    .replace(/\bN\.V\./gi, " NV")
    .replace(/\bS\.A\./gi, " SA")
    .replace(/\bL\.L\.C\./gi, " LLC")
    .replace(/\bCo\.,?\s*Ltd\.?/gi, " Company Limited");
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function companyEntityKey(value: string): string {
  const tokens = normalizeSuffixForms(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  while (tokens.length > 1 && COMPANY_SUFFIX_TOKENS.has(tokens[tokens.length - 1] ?? "")) {
    tokens.pop();
  }

  return tokens.join(" ");
}

export function canonicalCompanyName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function candidateSearchTerms(value: string): string[] {
  const key = companyEntityKey(value);
  const tokens = key
    .split(/\s+/)
    .filter((token) => token.length >= 2);
  return Array.from(new Set([
    key.length <= 16 ? key : "",
    ...tokens.slice(0, 3),
  ].filter(Boolean)));
}

function tickerCandidateFromDoc(data: Record<string, unknown>): TickerEntityCandidate | null {
  const symbol = readString(data.symbol);
  const name = readString(data.name);
  if (!symbol || !name) {
    return null;
  }

  return {
    symbol,
    symbolLower: (readString(data.symbolLower) ?? symbol).toLowerCase(),
    name,
    nameKey: companyEntityKey(name),
    exchangePriority: typeof data.exchangePriority === "number" && Number.isFinite(data.exchangePriority)
      ? data.exchangePriority
      : 0,
  };
}

function scoreTickerCandidate(candidate: TickerEntityCandidate, targetName: string): number {
  const targetKey = companyEntityKey(targetName);
  const targetTokens = new Set(targetKey.split(/\s+/).filter(Boolean));
  let score = candidate.exchangePriority;

  if (candidate.symbolLower === targetKey) {
    score += 1000;
  }

  if (candidate.nameKey === targetKey) {
    score += 900;
  } else if (candidate.nameKey.startsWith(`${targetKey} `)) {
    score += 650;
  } else if (targetKey.startsWith(`${candidate.nameKey} `)) {
    score += 550;
  }

  const candidateTokens = candidate.nameKey.split(/\s+/).filter(Boolean);
  const overlap = candidateTokens.filter((token) => targetTokens.has(token)).length;
  score += overlap * 100;

  return score;
}

export async function resolveCompanyGraphTargetNames(
  db: FirebaseFirestore.Firestore,
  targetNames: string[],
): Promise<Map<string, string>> {
  const uniqueNames = Array.from(new Set(targetNames.map(canonicalCompanyName).filter(Boolean)));
  const searchTerms = Array.from(new Set(uniqueNames.flatMap(candidateSearchTerms))).slice(0, 80);

  if (uniqueNames.length === 0 || searchTerms.length === 0) {
    return new Map();
  }

  const candidateBySymbol = new Map<string, TickerEntityCandidate>();
  await Promise.all(searchTerms.map(async (term) => {
    const snapshot = await db
      .collection("tickers")
      .where("active", "==", true)
      .where("predictionSupported", "==", true)
      .where("searchPrefixes", "array-contains", term)
      .limit(25)
      .get();

    for (const doc of snapshot.docs) {
      const candidate = tickerCandidateFromDoc(doc.data() as Record<string, unknown>);
      if (!candidate) {
        continue;
      }

      const current = candidateBySymbol.get(candidate.symbol);
      if (!current || candidate.exchangePriority > current.exchangePriority) {
        candidateBySymbol.set(candidate.symbol, candidate);
      }
    }
  }));

  const candidates = [...candidateBySymbol.values()];
  const resolved = new Map<string, string>();

  for (const name of uniqueNames) {
    const best = candidates
      .map((candidate) => ({
        candidate,
        score: scoreTickerCandidate(candidate, name),
      }))
      .sort((left, right) => {
        const scoreDelta = right.score - left.score;
        if (scoreDelta !== 0) {
          return scoreDelta;
        }
        return right.candidate.exchangePriority - left.candidate.exchangePriority;
      })[0];

    if (best && best.score >= 650) {
      resolved.set(name, best.candidate.name);
    }
  }

  return resolved;
}

export function shortestCompanyDisplayName(...values: string[]): string {
  return values
    .map(canonicalCompanyName)
    .filter(Boolean)
    .sort((left, right) => {
      const lengthDelta = left.length - right.length;
      if (lengthDelta !== 0) {
        return lengthDelta;
      }
      return left.localeCompare(right);
    })[0] ?? "";
}

function betterDisplayName(left: string, right: string): string {
  const leftCanonical = canonicalCompanyName(left);
  const rightCanonical = canonicalCompanyName(right);
  return shortestCompanyDisplayName(leftCanonical, rightCanonical);
}

export function collapseCompanyGraphEdges<T extends EdgeLike>(edges: T[]): T[] {
  const grouped = new Map<string, T>();

  for (const edge of edges) {
    const targetKey = companyEntityKey(edge.targetName);
    if (!targetKey) {
      continue;
    }

    const nextEdge = {
      ...edge,
      targetName: canonicalCompanyName(edge.targetName),
    };
    const groupKey = targetKey;
    const current = grouped.get(groupKey);

    if (!current) {
      grouped.set(groupKey, nextEdge);
      continue;
    }

    const targetName = betterDisplayName(current.targetName, nextEdge.targetName);
    if (nextEdge.confidence > current.confidence) {
      grouped.set(groupKey, {
        ...nextEdge,
        targetName,
      });
      continue;
    }

    grouped.set(groupKey, {
      ...current,
      targetName,
    });
  }

  return [...grouped.values()];
}
