import os
import glob
import json
import argparse
import sys
import subprocess

# Try importing toml, install if missing
try:
    import toml
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "toml"])
    import toml

import requests

LOCK_FILE = "packages.lock"
PACKAGES_DIR = "packages"

def load_lock():
    lock = {}
    if os.path.exists(LOCK_FILE):
        with open(LOCK_FILE, "r") as f:
            for line in f:
                if "=" in line:
                    key, val = line.strip().split("=", 1)
                    lock[key] = val
    return lock

def save_lock(lock):
    with open(LOCK_FILE, "w") as f:
        f.write("# This file is automatically managed by update.yml\n")
        for key in sorted(lock.keys()):
            f.write(f"{key}={lock[key]}\n")

def get_latest_version(repo_url):
    # repo_url format: github:owner/repo or codeberg:owner/repo
    provider, path = repo_url.split(":", 1)
    
    if provider == "github":
        url = f"https://api.github.com/repos/{path}/releases/latest"
        try:
            r = requests.get(url)
            r.raise_for_status()
            tag = r.json()["tag_name"]
            return tag
        except Exception as e:
            print(f"Error fetching github {path}: {e}", file=sys.stderr)
            return None
            
    elif provider == "codeberg":
        url = f"https://codeberg.org/api/v1/repos/{path}/releases"
        try:
            r = requests.get(url)
            r.raise_for_status()
            data = r.json()
            if data and len(data) > 0:
                return data[0]["tag_name"]
        except Exception as e:
            print(f"Error fetching codeberg {path}: {e}", file=sys.stderr)
            return None
            
    return None

def cmd_update(args):
    lock = load_lock()
    updated = False
    
    for toml_file in glob.glob(os.path.join(PACKAGES_DIR, "*.toml")):
        pkg_name = os.path.splitext(os.path.basename(toml_file))[0]
        try:
            data = toml.load(toml_file)
        except Exception as e:
            print(f"Error parsing {toml_file}: {e}", file=sys.stderr)
            continue
            
        repo = data.get("repo")
        if not repo:
            continue
            
        print(f"Checking {pkg_name} ({repo})...")
        latest = get_latest_version(repo)
        
        if latest:
            current = lock.get(pkg_name)
            if current != latest:
                print(f"  UPDATE: {current} -> {latest}")
                lock[pkg_name] = latest
                updated = True
            else:
                print(f"  Up-to-date: {current}")
        else:
            print(f"  Failed to get version for {pkg_name}")
            
    if updated:
        save_lock(lock)
        set_output("updated", "true")
    else:
        set_output("updated", "false")

def set_output(name, value):
    if "GITHUB_OUTPUT" in os.environ:
        with open(os.environ["GITHUB_OUTPUT"], "a") as f:
            f.write(f"{name}={value}\n")
    else:
        print(f"::set-output name={name}::{value}")

def cmd_matrix(args):
    lock = load_lock()
    matrix = []
    
    # If package names provided, only build those
    # Otherwise check for changes?
    # For simplicity, we might just build what's changed or requested.
    # But for a robust build system, we usually build what changed.
    # Here we will output ALL packages in lockfile combined with TOML data
    # The workflow filter will decide what to run.
    
    # Actually, the 'build.yml' needs to know what to build.
    # If triggered by push to packages.lock, we should identify changed packages.
    # But for now, let's just generate matrix for ALL packages defined in TOML
    # and let the runner decide (or just rebuild all, which is safe but slow).
    # Optimization: Filter by git diff in the workflow, pass list here.
    
    for toml_file in glob.glob(os.path.join(PACKAGES_DIR, "*.toml")):
        pkg_name = os.path.splitext(os.path.basename(toml_file))[0]
        data = toml.load(toml_file)
        
        # Merge version from lock
        if pkg_name in lock:
            data["version"] = lock[pkg_name]
        
        # Flatten structure for matrix
        job = {
            "name": pkg_name,
            "version": data.get("version", "latest"),
            "repo": data.get("repo", ""),
            "type": data.get("type", "custom"),
            "build_cmd": data.get("build", ""),
            "install": data.get("install", {}),
            "depends": data.get("depends", {}),
            "control": data.get("control", {}),
            "description": data.get("description", ""),
            "post_build": data.get("post_build", "")
        }
        matrix.append(job)
        
    print(json.dumps({"include": matrix}))

def main():
    parser = argparse.ArgumentParser()
    subparsers = parser.add_subparsers(dest="command")
    
    update_parser = subparsers.add_parser("update")
    matrix_parser = subparsers.add_parser("matrix")
    
    args = parser.parse_args()
    
    if args.command == "update":
        cmd_update(args)
    elif args.command == "matrix":
        cmd_matrix(args)
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
