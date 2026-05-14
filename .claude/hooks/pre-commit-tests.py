#!/usr/bin/env python3
import sys
import json
import subprocess

data = json.load(sys.stdin)
cmd = data.get("tool_input", {}).get("command", "")

if not cmd.startswith("git commit"):
    sys.exit(0)

frontend_dir = "/home/bence/dev/registry/frontend"
result = subprocess.run(["npm", "test"], cwd=frontend_dir)

if result.returncode != 0:
    print(json.dumps({
        "continue": False,
        "stopReason": "Frontend tests failed. Fix failing tests before committing."
    }))
    sys.exit(1)
