"""
Utility functions for hashing, fingerprinting, formatting, and file I/O.
"""

import os
import json
import hashlib
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from pathlib import Path
from dotenv import load_dotenv

# Try importing Crypto.Hash.keccak, fallback to sha3_256 / hashlib
try:
    from Crypto.Hash import keccak
    def keccak256(data: bytes) -> str:
        k = keccak.new(digest_bits=256)
        k.update(data)
        return "0x" + k.hexdigest()
except ImportError:
    try:
        from eth_hash.auto import keccak as eth_keccak
        def keccak256(data: bytes) -> str:
            return "0x" + eth_keccak(data).hex()
    except ImportError:
        def keccak256(data: bytes) -> str:
            # Fallback to standard SHA3-256 if keccak unavailable
            return "0x" + hashlib.sha3_256(data).hexdigest()


def compute_file_sha256(filepath: str) -> str:
    """Compute SHA-256 hash of a file's binary content."""
    hasher = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()


def compute_embedding_hash(embedding: List[float]) -> str:
    """Compute SHA-256 hash of normalized face embedding vector."""
    # Round to 6 decimal places for stable serialization
    rounded = [round(float(x), 6) for x in embedding]
    serialized = json.dumps(rounded, separators=(",", ":"))
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()


def create_cryptographic_fingerprint(
    image_sha256: str,
    embedding_hash: str,
    post_url: str,
    post_title: str,
    source_platform: str,
    timestamp_iso: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Construct a deterministic cryptographic fingerprint combining image,
    face embedding, and discovered social media metadata.
    """
    if not timestamp_iso:
        timestamp_iso = datetime.now(timezone.utc).isoformat()

    canonical_payload = {
        "image_sha256": image_sha256,
        "embedding_hash": embedding_hash,
        "post_url": post_url.strip(),
        "post_title": post_title.strip(),
        "source_platform": source_platform.strip(),
        "timestamp": timestamp_iso,
    }

    # Canonical sorted JSON string
    serialized_str = json.dumps(canonical_payload, sort_keys=True, separators=(",", ":"))
    raw_bytes = serialized_str.encode("utf-8")

    # 32-byte Ethereum Keccak-256 hash
    keccak_hash = keccak256(raw_bytes)
    sha256_hash = hashlib.sha256(raw_bytes).hexdigest()

    return {
        "canonical_payload": canonical_payload,
        "serialized_payload": serialized_str,
        "keccak256": keccak_hash,
        "sha256": sha256_hash,
        "bytes32_hex": keccak_hash,  # standard for Solidity bytes32
    }


def save_json_report(data: Dict[str, Any], output_path: str) -> str:
    """Save dictionary to formatted JSON file."""
    p = Path(output_path)
    p.parent.mkdir(parents=True, exist_ok=True)
    with open(p, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    return str(p.resolve())


def generate_markdown_receipt(data: Dict[str, Any], output_path: str) -> str:
    """Generate human-readable Markdown verification receipt."""
    p = Path(output_path)
    p.parent.mkdir(parents=True, exist_ok=True)

    status = data.get("verification_status", "UNKNOWN")
    status_badge = "✅ VERIFIED & TAMPER-EVIDENT" if status == "SUCCESS" else "⚠️ VERIFICATION ISSUE"

    content = f"""# 🛡️ Face ID & Blockchain Verification Receipt

> **Status:** {status_badge}  
> **Timestamp (UTC):** `{data.get("timestamp_utc", "N/A")}`  
> **Blockchain Network:** `{data.get("blockchain", {}).get("network", "N/A")}`

---

## 1. 👤 Face Identification Details
- **Source Image Path:** `{data.get("face_detection", {}).get("image_path", "N/A")}`
- **Source Image SHA-256:** `{data.get("face_detection", {}).get("image_sha256", "N/A")}`
- **Face Confidence:** `{data.get("face_detection", {}).get("confidence", "N/A")}`
- **Face Bounding Box:** `{data.get("face_detection", {}).get("bounding_box", "N/A")}`
- **Embedding Dimension:** `{data.get("face_detection", {}).get("embedding_dimension", 128)}-d`
- **Embedding Vector Hash:** `{data.get("face_detection", {}).get("embedding_hash", "N/A")}`
- **Cropped Face Saved At:** `{data.get("face_detection", {}).get("cropped_face_path", "N/A")}`

---

## 2. 🌐 Discovered Social Media Post (Genuine Search)
- **Search Engine:** `{data.get("search_result", {}).get("engine", "N/A")}`
- **Platform:** `{data.get("search_result", {}).get("source_platform", "N/A")}`
- **Post Title / Caption:** {data.get("search_result", {}).get("title", "N/A")}
- **Post URL:** [{data.get("search_result", {}).get("url", "N/A")}]({data.get("search_result", {}).get("url", "#")})
- **Snippet:** _{data.get("search_result", {}).get("snippet", "N/A")}_

---

## 3. 🔐 Cryptographic Fingerprint
- **Keccak-256 (Bytes32):** `{data.get("fingerprint", {}).get("keccak256", "N/A")}`
- **SHA-256 Digest:** `{data.get("fingerprint", {}).get("sha256", "N/A")}`
- **Canonical Payload:**
```json
{json.dumps(data.get("fingerprint", {}).get("canonical_payload", {}), indent=2)}
```

---

## 4. ⛓️ Blockchain Proof & On-Chain Audit
- **Transaction Hash:** `{data.get("blockchain", {}).get("tx_hash", "N/A")}`
- **Block Number:** `{data.get("blockchain", {}).get("block_number", "N/A")}`
- **Contract / Recipient:** `{data.get("blockchain", {}).get("contract_or_target", "N/A")}`
- **Block Explorer URL:** {f"[{data.get('blockchain', {}).get('explorer_url')}]({data.get('blockchain', {}).get('explorer_url')})" if data.get("blockchain", {}).get("explorer_url") else "`N/A (Local Chain)`"}
- **On-Chain Hash Retrieved:** `{data.get("blockchain", {}).get("on_chain_hash", "N/A")}`
- **Cryptographic Match:** `{data.get("blockchain", {}).get("match_confirmed", False)}`

---
*Generated by Face ID + Blockchain Verification Pipeline | HH Goa 2026*
"""
    with open(p, "w", encoding="utf-8") as f:
        f.write(content)
    return str(p.resolve())


def load_config() -> Dict[str, str]:
    """Load configuration from environment variables and .env file."""
    load_dotenv(override=False)
    return {
        "SERPAPI_API_KEY": os.getenv("SERPAPI_API_KEY", ""),
        "BING_SEARCH_API_KEY": os.getenv("BING_SEARCH_API_KEY", ""),
        "WEB3_RPC_URL": os.getenv("WEB3_RPC_URL", "https://rpc.sepolia.org"),
        "PRIVATE_KEY": os.getenv("PRIVATE_KEY", ""),
        "CONTRACT_ADDRESS": os.getenv("CONTRACT_ADDRESS", ""),
        "BLOCKCHAIN_NETWORK": os.getenv("BLOCKCHAIN_NETWORK", "local"),  # 'sepolia', 'base_sepolia', 'local'
    }
