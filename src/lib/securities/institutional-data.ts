import { FieldPath } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { normalizeTicker } from "@/lib/predictions/types";
import type { InstitutionalHolding, InstitutionalHoldingChange } from "@/lib/securities/thirteen-f";

const DEFAULT_TICKER_SCAN_LIMIT = 1200;
const DEFAULT_MANAGER_DISPLAY_LIMIT = 100;

type InstitutionalManagerDocument = {
  cik?: unknown;
  name?: unknown;
  latestAccessionNumber?: unknown;
  latestReportDate?: unknown;
  latestQuarter?: unknown;
  updatedAt?: unknown;
};

export type InstitutionalTickerPosition = {
  managerCik: string;
  managerName: string;
  ticker: string;
  nameOfIssuer: string;
  quarter: string;
  reportDate: string;
  filingDate: string;
  accessionNumber: string;
  shares: number;
  valueUsd: number;
  positionCount: number;
  changeStatus: InstitutionalHoldingChange["status"] | null;
  shareChange: number | null;
  valueChangeUsd: number | null;
  percentChange: number | null;
  updatedAt: string;
};

export type InstitutionalTickerSummary = {
  ticker: string;
  totalManagers: number;
  totalValueUsd: number;
  totalShares: number;
  latestReportDate: string | null;
  positions: InstitutionalTickerPosition[];
};

export type InstitutionalManagerSummary = {
  manager: {
    cik: string;
    name: string;
    latestAccessionNumber: string | null;
    latestReportDate: string | null;
    latestQuarter: string | null;
    updatedAt: string | null;
  };
  holdings: Array<InstitutionalHolding & {
    changeStatus: InstitutionalHoldingChange["status"] | null;
    shareChange: number | null;
    valueChangeUsd: number | null;
    percentChange: number | null;
  }>;
};

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeManagerCik(value: string): string | null {
  const digits = value.trim().replace(/\D/g, "");
  if (!digits || digits.length > 10) {
    return null;
  }

  return digits.padStart(10, "0");
}

function isNewerHolding(left: InstitutionalHolding, right: InstitutionalHolding | undefined): boolean {
  if (!right) {
    return true;
  }

  return `${left.reportDate}_${left.updatedAt}` > `${right.reportDate}_${right.updatedAt}`;
}

function isNewerChange(left: InstitutionalHoldingChange, right: InstitutionalHoldingChange | undefined): boolean {
  if (!right) {
    return true;
  }

  return `${left.reportDate}_${left.updatedAt}` > `${right.reportDate}_${right.updatedAt}`;
}

function latestChangeByManager(changes: InstitutionalHoldingChange[]): Map<string, InstitutionalHoldingChange> {
  const byManager = new Map<string, InstitutionalHoldingChange>();

  for (const change of changes) {
    const current = byManager.get(change.managerCik);
    if (
      isNewerChange(change, current) ||
      (change.reportDate === current?.reportDate && Math.abs(change.valueChangeUsd) > Math.abs(current.valueChangeUsd))
    ) {
      byManager.set(change.managerCik, change);
    }
  }

  return byManager;
}

function latestChangeByPosition(changes: InstitutionalHoldingChange[]): Map<string, InstitutionalHoldingChange> {
  const byPosition = new Map<string, InstitutionalHoldingChange>();

  for (const change of changes) {
    const current = byPosition.get(change.positionKey);
    if (isNewerChange(change, current)) {
      byPosition.set(change.positionKey, change);
    }
  }

  return byPosition;
}

export async function getInstitutionalTickerSummary(
  rawTicker: string,
  limit = DEFAULT_TICKER_SCAN_LIMIT,
): Promise<InstitutionalTickerSummary> {
  const ticker = normalizeTicker(rawTicker);
  const db = getAdminFirestore();
  const [holdingsSnapshot, changesSnapshot] = await Promise.all([
    db.collection("institutional_holdings").where("ticker", "==", ticker).limit(limit).get(),
    db.collection("institutional_holding_changes").where("ticker", "==", ticker).limit(limit).get(),
  ]);
  const latestByManager = new Map<string, InstitutionalHolding>();

  for (const doc of holdingsSnapshot.docs) {
    const holding = doc.data() as InstitutionalHolding;
    if (holding.ticker !== ticker) {
      continue;
    }

    const current = latestByManager.get(holding.managerCik);
    if (isNewerHolding(holding, current)) {
      latestByManager.set(holding.managerCik, holding);
    }
  }

  const changes = changesSnapshot.docs
    .map((doc) => doc.data() as InstitutionalHoldingChange)
    .filter((change) => change.ticker === ticker);
  const changeByManager = latestChangeByManager(changes);
  const positions = [...latestByManager.values()]
    .map<InstitutionalTickerPosition>((holding) => {
      const managerHoldings = holdingsSnapshot.docs
        .map((doc) => doc.data() as InstitutionalHolding)
        .filter((candidate) => (
          candidate.managerCik === holding.managerCik &&
          candidate.ticker === ticker &&
          candidate.reportDate === holding.reportDate
        ));
      const aggregateShares = managerHoldings.reduce((total, item) => total + item.shares, 0);
      const aggregateValueUsd = managerHoldings.reduce((total, item) => total + item.valueUsd, 0);
      const change = changeByManager.get(holding.managerCik) ?? null;

      return {
        managerCik: holding.managerCik,
        managerName: holding.managerName,
        ticker,
        nameOfIssuer: holding.nameOfIssuer,
        quarter: holding.quarter,
        reportDate: holding.reportDate,
        filingDate: holding.filingDate,
        accessionNumber: holding.accessionNumber,
        shares: aggregateShares,
        valueUsd: aggregateValueUsd,
        positionCount: managerHoldings.length,
        changeStatus: change?.status ?? null,
        shareChange: change?.shareChange ?? null,
        valueChangeUsd: change?.valueChangeUsd ?? null,
        percentChange: change?.percentChange ?? null,
        updatedAt: holding.updatedAt,
      };
    })
    .sort((left, right) => right.valueUsd - left.valueUsd)
    .slice(0, 100);

  return {
    ticker,
    totalManagers: positions.length,
    totalValueUsd: positions.reduce((total, position) => total + position.valueUsd, 0),
    totalShares: positions.reduce((total, position) => total + position.shares, 0),
    latestReportDate: positions.reduce<string | null>((latest, position) => (
      !latest || position.reportDate > latest ? position.reportDate : latest
    ), null),
    positions,
  };
}

export async function getInstitutionalManagerSummary(rawCik: string): Promise<InstitutionalManagerSummary | null> {
  const managerCik = normalizeManagerCik(rawCik);
  if (!managerCik) {
    return null;
  }

  const db = getAdminFirestore();
  const managerSnapshot = await db.collection("institutional_managers").doc(managerCik).get();
  const managerData = managerSnapshot.data() as InstitutionalManagerDocument | undefined;
  const latestQuarter = readString(managerData?.latestQuarter);
  if (!managerSnapshot.exists || !latestQuarter) {
    return null;
  }

  const docPrefix = `${latestQuarter}_${managerCik}_`;
  const [holdingsSnapshot, changesSnapshot] = await Promise.all([
    db
      .collection("institutional_holdings")
      .where(FieldPath.documentId(), ">=", docPrefix)
      .where(FieldPath.documentId(), "<", `${docPrefix}\uf8ff`)
      .orderBy(FieldPath.documentId())
      .limit(DEFAULT_TICKER_SCAN_LIMIT)
      .get(),
    db
      .collection("institutional_holding_changes")
      .where(FieldPath.documentId(), ">=", docPrefix)
      .where(FieldPath.documentId(), "<", `${docPrefix}\uf8ff`)
      .orderBy(FieldPath.documentId())
      .limit(DEFAULT_TICKER_SCAN_LIMIT)
      .get(),
  ]);
  const changeByPosition = latestChangeByPosition(
    changesSnapshot.docs.map((doc) => doc.data() as InstitutionalHoldingChange),
  );
  const holdings = holdingsSnapshot.docs
    .map((doc) => doc.data() as InstitutionalHolding)
    .sort((left, right) => right.valueUsd - left.valueUsd)
    .slice(0, DEFAULT_MANAGER_DISPLAY_LIMIT)
    .map((holding) => {
      const change = changeByPosition.get(holding.positionKey) ?? null;
      return {
        ...holding,
        changeStatus: change?.status ?? null,
        shareChange: change?.shareChange ?? null,
        valueChangeUsd: change?.valueChangeUsd ?? null,
        percentChange: change?.percentChange ?? null,
      };
    });

  return {
    manager: {
      cik: managerCik,
      name: readString(managerData?.name) ?? managerCik,
      latestAccessionNumber: readString(managerData?.latestAccessionNumber),
      latestReportDate: readString(managerData?.latestReportDate),
      latestQuarter,
      updatedAt: readString(managerData?.updatedAt),
    },
    holdings,
  };
}
