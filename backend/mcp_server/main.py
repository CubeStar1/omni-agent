import sys
from pathlib import Path

backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from mcp_server.server import run_server


def main():
    try:
        run_server()
        return 0
    except KeyboardInterrupt:
        print("Server stopped by user", file=sys.stderr)
        return 0
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())