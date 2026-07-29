import { execFileSync } from "node:child_process";

const git = (...args) =>
  execFileSync("git", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  })
    .split(/\r?\n/u)
    .filter(Boolean);

const ignoredTracked = git("ls-files", "-ci", "--exclude-standard");
const tracked = git("ls-files");
const unsafe = tracked.filter((path) => {
  const name = path.toLowerCase().split("/").at(-1) ?? "";
  return (
    name === ".env" ||
    (name.startsWith(".env.") && name !== ".env.example") ||
    /\.(?:pem|key|p12|pfx|jks|keystore)$/u.test(name) ||
    /(?:credential|secret).*\.(?:json|ya?ml|toml)$/u.test(name)
  );
});

if (ignoredTracked.length > 0 || unsafe.length > 0) {
  console.error("Repository safety check failed.");
  for (const path of ignoredTracked)
    console.error(`Tracked ignored file: ${path}`);
  for (const path of unsafe) console.error(`Tracked secret-like file: ${path}`);
  process.exitCode = 1;
} else {
  console.log("Repository safety check passed.");
}
