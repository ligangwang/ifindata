import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

type IndexField = {
  fieldPath: string;
  order?: "ASCENDING" | "DESCENDING";
  arrayConfig?: "CONTAINS";
};

type CompositeIndex = {
  collectionGroup: string;
  queryScope: "COLLECTION" | "COLLECTION_GROUP";
  fields: IndexField[];
};

type FirestoreIndexesFile = {
  indexes: CompositeIndex[];
};

function runCommand(command: string, args: string[]): { code: number; output: string } {
  const result = spawnSync(command, args, { encoding: "utf-8" });
  return {
    code: result.status ?? 1,
    output: `${result.stdout ?? ""}${result.stderr ?? ""}`,
  };
}

function normalizeOrder(order: "ASCENDING" | "DESCENDING"): "ascending" | "descending" {
  return order === "ASCENDING" ? "ascending" : "descending";
}

function buildFieldConfig(field: IndexField): string {
  if (field.order) {
    return `field-path=${field.fieldPath},order=${normalizeOrder(field.order)}`;
  }

  if (field.arrayConfig === "CONTAINS") {
    return `field-path=${field.fieldPath},array-config=contains`;
  }

  throw new Error(`Unsupported index field config for ${field.fieldPath}`);
}

function applyIndex(projectId: string, index: CompositeIndex): void {
  const args = [
    "firestore",
    "indexes",
    "composite",
    "create",
    `--project=${projectId}`,
    `--collection-group=${index.collectionGroup}`,
    `--query-scope=${index.queryScope}`,
  ];

  for (const field of index.fields) {
    args.push(`--field-config=${buildFieldConfig(field)}`);
  }

  const result = runCommand("gcloud", args);
  if (result.code === 0) {
    console.log(`Created index: ${index.collectionGroup} (${index.fields.length} fields)`);
    return;
  }

  if (/ALREADY_EXISTS|already exists/i.test(result.output)) {
    console.log(`Index already exists: ${index.collectionGroup}`);
    return;
  }

  throw new Error(result.output.trim() || `Failed to create index for ${index.collectionGroup}`);
}

function main() {
  const projectId = process.env.FIRESTORE_PROJECT_ID ?? process.env.GOOGLE_CLOUD_PROJECT;
  if (!projectId) {
    throw new Error("FIRESTORE_PROJECT_ID or GOOGLE_CLOUD_PROJECT must be set");
  }

  const filePath = resolve(process.cwd(), "firestore.indexes.json");
  const fileData = readFileSync(filePath, "utf-8");
  const parsed = JSON.parse(fileData) as FirestoreIndexesFile;

  const indexes = parsed.indexes ?? [];
  if (indexes.length === 0) {
    console.log("No composite indexes defined. Skipping.");
    return;
  }

  console.log(`Applying ${indexes.length} Firestore composite index(es) to ${projectId}...`);
  for (const index of indexes) {
    applyIndex(projectId, index);
  }

  console.log("Firestore index apply complete.");
}

try {
  main();
} catch (error) {
  console.error("Failed to apply Firestore indexes:", error);
  process.exitCode = 1;
}
