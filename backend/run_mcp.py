import sys
from pathlib import Path

backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from mcp_server.main import main

if __name__ == "__main__":
    sys.exit(main())