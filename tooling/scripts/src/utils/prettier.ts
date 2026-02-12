import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import prettier from "prettier";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../../../");
const prettierConfigPath = path.resolve(rootDir, "tooling/prettier/index.js");

type FormatOptions = {
  parser?: string;
  includePattern?: string;
};

export async function formatFiles(filesOrDirs: string[], options: FormatOptions = {}) {
  const { parser = "typescript", includePattern = ".ts" } = options;
  const prettierConfig = await prettier.resolveConfig(prettierConfigPath);

  // Collect all files to format
  const filesToFormat: string[] = [];

  for (const item of filesOrDirs) {
    if (fs.statSync(item).isDirectory()) {
      fs.readdirSync(item).forEach((file) => {
        if (file.endsWith(includePattern)) {
          filesToFormat.push(path.resolve(item, file));
        }
      });
    } else {
      filesToFormat.push(item);
    }
  }

  // Format each file
  const formatPromises = filesToFormat.map(async (file) => {
    try {
      const content = fs.readFileSync(file, "utf8");
      const formatted = await prettier.format(content, {
        parser,
        ...prettierConfig,
      });
      fs.writeFileSync(file, formatted);
      console.log(`✅ formatted: ${file.split("packages/").pop() ?? file}`);
    } catch (error) {
      console.error(`❌ ${file}`);
      console.error(error);
    }
  });

  await Promise.all(formatPromises);
}
