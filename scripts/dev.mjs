import { spawn } from "node:child_process";
import process from "node:process";

const children = [];

function run(name, command, args) {
  const child = spawn(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env,
  });

  child.on("exit", (code, signal) => {
    const detail = signal ? `signal ${signal}` : `code ${code ?? 0}`;
    console.log(`[${name}] exited with ${detail}`);

    for (const other of children) {
      if (other !== child && !other.killed) {
        other.kill("SIGTERM");
      }
    }

    if (code && code !== 0) {
      process.exitCode = code;
    }
  });

  children.push(child);
  return child;
}

run("server", "npm", ["run", "server"]);
run("client", "npm", ["run", "dev:client"]);

const shutdown = () => {
  for (const child of children) {
    if (!child.killed) {
      child.kill("SIGTERM");
    }
  }
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
