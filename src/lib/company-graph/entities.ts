const COMPANY_SUFFIX_TOKENS = new Set([
  "ag",
  "bv",
  "co",
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

function cleanName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function normalizedTokens(value: string): string[] {
  return cleanName(value)
    .toLowerCase()
    .replace(/\bN\.V\./gi, " nv")
    .replace(/\bS\.A\./gi, " sa")
    .replace(/\bL\.L\.C\./gi, " llc")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function stripLegalSuffixes(tokens: string[]): string[] {
  const nextTokens = [...tokens];

  while (nextTokens.length > 1 && COMPANY_SUFFIX_TOKENS.has(nextTokens[nextTokens.length - 1] ?? "")) {
    nextTokens.pop();
  }

  if (nextTokens.length > 1 && nextTokens[nextTokens.length - 1] === "company") {
    nextTokens.pop();
  }

  return nextTokens;
}

function acronymKey(tokens: string[]): string | null {
  if (tokens.length < 2) {
    return null;
  }

  const acronym = tokens.map((token) => token[0]).join("");
  return acronym.length >= 3 ? acronym : null;
}

function entityKeys(value: string): Set<string> {
  const tokens = normalizedTokens(value);
  const strippedTokens = stripLegalSuffixes(tokens);
  const acronymTokens = tokens.filter((token) => token !== "limited" && token !== "ltd");
  const keys = new Set<string>();
  const strippedKey = strippedTokens.join(" ");
  const acronym = acronymKey(acronymTokens);

  if (strippedKey) {
    keys.add(strippedKey);
  }
  if (acronym) {
    keys.add(acronym);
  }

  return keys;
}

function hasSharedKey(left: Set<string>, right: Set<string>): boolean {
  for (const key of left) {
    if (right.has(key)) {
      return true;
    }
  }
  return false;
}

function displayName(value: string): string {
  const tokens = cleanName(value).split(/\s+/).filter(Boolean);

  while (tokens.length > 1) {
    const last = tokens[tokens.length - 1]?.toLowerCase().replace(/\./g, "");
    if (!last || !COMPANY_SUFFIX_TOKENS.has(last)) {
      break;
    }
    tokens.pop();
  }

  if (tokens.length > 1 && tokens[tokens.length - 1]?.toLowerCase() === "company") {
    tokens.pop();
  }

  return tokens.join(" ") || cleanName(value);
}

function shortestDisplayName(...values: string[]): string {
  return values
    .map(displayName)
    .filter(Boolean)
    .sort((left, right) => {
      const lengthDelta = left.length - right.length;
      if (lengthDelta !== 0) {
        return lengthDelta;
      }
      if (left.toLowerCase() === right.toLowerCase()) {
        const upperDelta = Number(right === right.toUpperCase()) - Number(left === left.toUpperCase());
        if (upperDelta !== 0) {
          return upperDelta;
        }
      }
      return left.localeCompare(right);
    })[0] ?? "";
}

export function collapseCompanyGraphEntityEdges<T extends EdgeLike>(edges: T[]): T[] {
  const groups: Array<{ direction: string; keys: Set<string>; relationshipType: string; edge: T }> = [];

  for (const edge of edges) {
    const keys = entityKeys(edge.targetName);
    const existing = groups.find((group) =>
      group.relationshipType === edge.relationshipType &&
      group.direction === edge.direction &&
      hasSharedKey(group.keys, keys)
    );
    const targetName = displayName(edge.targetName);
    const nextEdge = {
      ...edge,
      targetName,
    };

    if (!existing) {
      groups.push({
        direction: edge.direction,
        keys,
        relationshipType: edge.relationshipType,
        edge: nextEdge,
      });
      continue;
    }

    for (const key of keys) {
      existing.keys.add(key);
    }

    const displayTargetName = shortestDisplayName(existing.edge.targetName, targetName);
    existing.edge = edge.confidence > existing.edge.confidence
      ? {
          ...nextEdge,
          targetName: displayTargetName,
        }
      : {
          ...existing.edge,
          targetName: displayTargetName,
        };
  }

  return groups.map((group) => group.edge);
}
