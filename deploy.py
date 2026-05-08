import os
import ftplib
import sys
import datetime
import time
from pathlib import Path

def load_env_file(filepath):
    """Simple manual .env loader to avoid external dependencies like python-dotenv."""
    if not os.path.exists(filepath):
        return
    with open(filepath, 'r') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            if '=' in line:
                try:
                    key, value = line.split('=', 1)
                    os.environ[key.strip()] = value.strip().strip('"').strip("'")
                except ValueError:
                    continue

# Load credentials from .env.production
load_env_file(".env.production")

# Configuration
FTP_HOST = os.getenv("FTP_HOST")
FTP_USER = os.getenv("FTP_USER")
FTP_PASS = os.getenv("FTP_PASS")
FTP_PORT = int(os.getenv("FTP_PORT", 21))

# Deployment Tasks: (local_path, remote_path)
DEPLOY_TASKS = [
    (Path(__file__).parent / "dist", "htdocs"),
    (Path(__file__).parent / "backend/api", "htdocs/api"),
    (Path(__file__).parent / "backend/vendor", "htdocs/vendor"),
    (Path(__file__).parent / "backend/config", "htdocs/config"),
]

MAX_FILE_SIZE = 15 * 1024 * 1024 # 15MB limit
SKIP_DIRS = {'node_modules', '.git', '__pycache__'}
SKIP_EXTENSIONS = {'.wasm'} 
SKIP_FILES = {'.env', '.env.production', '.env.local', 'env.local', '.DS_Store', '.gitignore'}

# Stats tracking
stats = {
    "succeeded": [],
    "failed": [],
    "skipped": [],
    "unchanged": []
}

class SafeFTP:
    def __init__(self):
        self.instance = None

    def connect(self):
        print(f"[*] Connecting to {FTP_HOST}:{FTP_PORT}...")
        try:
            ftp = ftplib.FTP()
            ftp.connect(FTP_HOST, FTP_PORT, timeout=60)
            ftp.login(FTP_USER, FTP_PASS)
            ftp.set_pasv(True)
            self.instance = ftp
            return True
        except Exception as e:
            print(f"[!] Connection failed: {e}")
            return False

    def get_instance(self):
        if not self.instance:
            self.connect()
        return self.instance

    def reconnect(self):
        if self.instance:
            try: self.instance.quit()
            except: pass
        self.instance = None
        return self.connect()

    def navigate(self, remote_path):
        ftp = self.get_instance()
        if not ftp: return False
        
        try:
            ftp.cwd('/')
            if not remote_path or remote_path == '.':
                return True
            
            parts = remote_path.strip('/').split('/')
            for part in parts:
                if not part: continue
                try:
                    ftp.cwd(part)
                except ftplib.error_perm:
                    ftp.mkd(part)
                    ftp.cwd(part)
            return True
        except:
            if self.reconnect():
                return self.navigate(remote_path)
            return False

safe_ftp = SafeFTP()

def get_remote_files_dict(ftp):
    """Returns a dictionary of {filename: (size, mtime)} for the current directory."""
    files = {}
    try:
        for name, facts in ftp.mlsd():
            if facts.get('type') == 'file':
                size = int(facts.get('size', 0))
                mtime_str = facts.get('modify')
                mtime = None
                if mtime_str:
                    try:
                        mtime = datetime.datetime.strptime(mtime_str[:14], "%Y%m%d%H%M%S").timestamp()
                    except: pass
                files[name] = (size, mtime)
    except:
        try:
            for name in ftp.nlst():
                files[name] = (None, None)
        except: pass
    return files

def upload_recursive(local_dir, current_remote_path):
    """Recursively uploads a local directory content."""
    if not local_dir.exists():
        print(f"[!] Warning: Local directory {local_dir} does not exist. Skipping.")
        return

    ftp = safe_ftp.get_instance()
    if not ftp or not safe_ftp.navigate(current_remote_path):
        print(f"[!] Navigation error to {current_remote_path}")
        return

    remote_files = get_remote_files_dict(ftp)

    for item in local_dir.iterdir():
        if item.name in SKIP_DIRS or item.name in SKIP_FILES:
            continue
            
        rel_path = f"{current_remote_path}/{item.name}"

        if item.is_dir():
            print(f"[*] Processing directory: {item.name}")
            upload_recursive(item, rel_path)
        else:
            if item.suffix in SKIP_EXTENSIONS:
                stats["skipped"].append((rel_path, "Excluded extension"))
                continue

            local_stat = item.stat()
            if local_stat.st_size > MAX_FILE_SIZE:
                stats["skipped"].append((rel_path, "Exceeds size limit"))
                continue

            if item.name in remote_files:
                remote_size, remote_mtime = remote_files[item.name]
                if remote_size == local_stat.st_size:
                    if remote_mtime is None or remote_mtime >= local_stat.st_mtime - 1:
                        stats["unchanged"].append(rel_path)
                        continue
                
            print(f"[*] Uploading {item.name} ({local_stat.st_size / 1024:.1f} KB)...")
            
            success = False
            for attempt in range(3):
                try:
                    ftp = safe_ftp.get_instance()
                    # Ensure we are in the right place before each attempt
                    safe_ftp.navigate(current_remote_path)
                    with open(item, "rb") as f:
                        ftp.storbinary(f"STOR {item.name}", f, blocksize=1024)
                    success = True
                    break
                except Exception as e:
                    print(f"[!] Attempt {attempt+1} failed for {item.name}: {e}")
                    safe_ftp.reconnect()
                    time.sleep(2)

            if success:
                stats["succeeded"].append(rel_path)
            else:
                stats["failed"].append((rel_path, "Permanent failure"))

def print_summary():
    print("\n" + "="*50)
    print("DEPLOYMENT SUMMARY")
    print("="*50)
    print(f"Succeeded: {len(stats['succeeded'])}")
    print(f"Unchanged: {len(stats['unchanged'])}")
    print(f"Skipped:   {len(stats['skipped'])}")
    print(f"Failed:    {len(stats['failed'])}")
    print("="*50)

if __name__ == "__main__":
    if not all([FTP_HOST, FTP_USER, FTP_PASS]):
        print("[!] Error: FTP credentials not found in .env.production")
        sys.exit(1)

    try:
        if not safe_ftp.connect():
            sys.exit(1)
        
        for local_path, remote_path in DEPLOY_TASKS:
            print(f"\n[*] Task: Syncing {local_path} to {remote_path}")
            upload_recursive(local_path, remote_path)
        
        if safe_ftp.instance:
            safe_ftp.instance.quit()
        print_summary()
    except Exception as e:
        print(f"\n[!] Deployment failed: {e}")
        sys.exit(1)
