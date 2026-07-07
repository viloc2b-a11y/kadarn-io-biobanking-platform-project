#!/usr/bin/env python
"""Convert a local document to Markdown using Microsoft MarkItDown.

This script is intentionally small: Kadarn's Next.js route owns upload handling
and temporary-file cleanup; this process only normalizes one local file.
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone


def main() -> int:
    parser = argparse.ArgumentParser(description="Convert a document to Markdown.")
    parser.add_argument("file_path")
    parser.add_argument("--filename", required=True)
    parser.add_argument("--mime-type", default="")
    args = parser.parse_args()

    try:
        from markitdown import MarkItDown
    except ImportError:
        print(
            json.dumps(
                {
                    "error": "MarkItDown is not installed. Install with: pip install markitdown",
                    "code": "MARKITDOWN_NOT_INSTALLED",
                }
            ),
            file=sys.stderr,
        )
        return 2

    try:
        result = MarkItDown(enable_plugins=False).convert(args.file_path)
        markdown = result.text_content or ""
    except Exception as exc:  # MarkItDown raises format-specific errors.
        print(
            json.dumps(
                {
                    "error": f"MarkItDown conversion failed: {exc}",
                    "code": "MARKITDOWN_CONVERSION_FAILED",
                }
            ),
            file=sys.stderr,
        )
        return 1

    payload = {
        "filename": args.filename,
        "mimeType": args.mime_type or None,
        "markdown": markdown,
        "characterCount": len(markdown),
        "convertedAt": datetime.now(timezone.utc).isoformat(),
        "converter": "markitdown",
    }
    print(json.dumps(payload))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
