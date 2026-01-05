import fs from "fs";
import path from "path";

const pathsToDelete = [
  ".cache",
  ".next",
];

console.log("🧹 Resetting dev ingestion state...");

pathsToDelete.forEach((dir) => {
  const fullPath = path.resolve(process.cwd(), dir);
  if (fs.existsSync(fullPath)) {
    fs.rmSync(fullPath, { recursive: true, force: true });
    console.log(`✔ Removed ${dir}`);
  } else {
    console.log(`• ${dir} not found (skipped)`);
  }
});

console.log("✅ Dev ingestion reset complete");
console.log("➡ Restart the dev server to re-ingest articles");