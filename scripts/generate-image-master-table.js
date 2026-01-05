import fs from "fs";
import path from "path";

const IMAGE_DIR = path.resolve(
  process.cwd(),
  "public/assets/images/all"
);

const OUTPUT_FILE = path.resolve(
  process.cwd(),
  "image-master-table.csv"
);

const files = fs
  .readdirSync(IMAGE_DIR)
  .filter(f => /\.(jpg|svg|png)$/i.test(f))
  .sort();

const header = [
  "id",
  "filename",
  "extension",
  "source",
  "license",
  "paid_account",
  "logo_visible",
  "trademark_present",
  "primary_category",
  "context_type",
  "brand_name",
  "allowed_generic_articles",
  "allowed_brand_articles",
  "fallback_tier",
  "notes"
];

const rows = files.map((file, index) => {
  const ext = path.extname(file).replace(".", "");
  return [
    index + 1,
    file,
    ext,
    "Unsplash",
    "Unsplash License – Commercial Use Allowed",
    "Yes",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    ""
  ].join(",");
});

const csv = [header.join(","), ...rows].join("\n");

fs.writeFileSync(OUTPUT_FILE, csv);

console.log(`✅ Image master table generated: ${OUTPUT_FILE}`);
console.log(`🖼️ Total images: ${files.length}`);
