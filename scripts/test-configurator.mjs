import { readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";

const tests = readdirSync(new URL("./", import.meta.url)).filter(name => name.endsWith(".test.ts")).sort();
for (const test of tests) {
  const result = spawnSync(process.execPath, ["--import", "tsx", `scripts/${test}`], { stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
console.log(`Passed ${tests.length} configurator test suites.`);
