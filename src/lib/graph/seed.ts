import type { Company, Relationship } from "@/lib/graph/types";

const nowIso = new Date().toISOString();

export const seededCompanies: Company[] = [
  {
    id: 1,
    name: "TSMC",
    ticker: "TSM",
    description:
      "Taiwan Semiconductor Manufacturing Company is the leading advanced chip foundry and a critical manufacturing partner for global fabless semiconductor companies.",
    metadata: { industry: "Semiconductors", region: "Taiwan", marketCapBand: "mega" },
  },
  {
    id: 2,
    name: "Apple",
    ticker: "AAPL",
    description:
      "Apple designs consumer electronics and custom silicon, relying on external foundries for high-volume advanced-node manufacturing.",
    metadata: { industry: "Consumer Electronics", region: "US", marketCapBand: "mega" },
  },
  {
    id: 3,
    name: "NVIDIA",
    ticker: "NVDA",
    description:
      "NVIDIA designs GPUs and accelerated computing platforms for AI, data centers, gaming, and automotive workloads.",
    metadata: { industry: "Semiconductors", region: "US", marketCapBand: "mega" },
  },
  {
    id: 4,
    name: "AMD",
    ticker: "AMD",
    description:
      "AMD develops CPUs and GPUs for data centers, PCs, and embedded markets, competing across multiple compute categories.",
    metadata: { industry: "Semiconductors", region: "US", marketCapBand: "large" },
  },
  {
    id: 5,
    name: "Qualcomm",
    ticker: "QCOM",
    description:
      "Qualcomm designs mobile and edge semiconductors with a strong IP licensing model and a broad smartphone OEM footprint.",
    metadata: { industry: "Semiconductors", region: "US", marketCapBand: "large" },
  },
  {
    id: 6,
    name: "Broadcom",
    ticker: "AVGO",
    description:
      "Broadcom supplies networking and infrastructure semiconductors and enterprise software for cloud and telecom customers.",
    metadata: { industry: "Semiconductors", region: "US", marketCapBand: "mega" },
  },
  {
    id: 7,
    name: "SK hynix",
    ticker: "000660.KS",
    description:
      "SK hynix is a major memory semiconductor manufacturer supplying DRAM and NAND for AI and data center demand.",
    metadata: { industry: "Memory", region: "South Korea", marketCapBand: "large" },
  },
  {
    id: 8,
    name: "Micron",
    ticker: "MU",
    description:
      "Micron develops memory and storage chips used in servers, PCs, mobile devices, and AI accelerator systems.",
    metadata: { industry: "Memory", region: "US", marketCapBand: "large" },
  },
];

export const seededRelationships: Relationship[] = [
  {
    id: 1,
    sourceCompanyId: 1,
    targetCompanyId: 2,
    type: "customer",
    weight: 0.95,
    confidence: 0.95,
    source: "manual_seed",
    createdAt: nowIso,
  },
  {
    id: 2,
    sourceCompanyId: 1,
    targetCompanyId: 3,
    type: "customer",
    weight: 0.98,
    confidence: 0.98,
    source: "manual_seed",
    createdAt: nowIso,
  },
  {
    id: 3,
    sourceCompanyId: 1,
    targetCompanyId: 4,
    type: "customer",
    weight: 0.9,
    confidence: 0.93,
    source: "manual_seed",
    createdAt: nowIso,
  },
  {
    id: 4,
    sourceCompanyId: 1,
    targetCompanyId: 5,
    type: "customer",
    weight: 0.86,
    confidence: 0.9,
    source: "manual_seed",
    createdAt: nowIso,
  },
  {
    id: 5,
    sourceCompanyId: 1,
    targetCompanyId: 6,
    type: "customer",
    weight: 0.8,
    confidence: 0.87,
    source: "manual_seed",
    createdAt: nowIso,
  },
  {
    id: 6,
    sourceCompanyId: 3,
    targetCompanyId: 4,
    type: "competitor",
    weight: 0.92,
    confidence: 0.94,
    source: "manual_seed",
    createdAt: nowIso,
  },
  {
    id: 7,
    sourceCompanyId: 4,
    targetCompanyId: 3,
    type: "competitor",
    weight: 0.92,
    confidence: 0.94,
    source: "manual_seed",
    createdAt: nowIso,
  },
  {
    id: 8,
    sourceCompanyId: 7,
    targetCompanyId: 3,
    type: "supplier",
    weight: 0.77,
    confidence: 0.83,
    source: "manual_seed",
    createdAt: nowIso,
  },
  {
    id: 9,
    sourceCompanyId: 8,
    targetCompanyId: 3,
    type: "supplier",
    weight: 0.74,
    confidence: 0.82,
    source: "manual_seed",
    createdAt: nowIso,
  },
  {
    id: 10,
    sourceCompanyId: 7,
    targetCompanyId: 4,
    type: "supplier",
    weight: 0.72,
    confidence: 0.8,
    source: "manual_seed",
    createdAt: nowIso,
  },
  {
    id: 11,
    sourceCompanyId: 8,
    targetCompanyId: 4,
    type: "supplier",
    weight: 0.7,
    confidence: 0.79,
    source: "manual_seed",
    createdAt: nowIso,
  },
];
