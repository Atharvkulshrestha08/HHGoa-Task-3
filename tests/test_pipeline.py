"""
Comprehensive Unit & Integration Test Suite for Face ID + Blockchain Verification Pipeline.
"""

import os
import pytest
from pathlib import Path

from src.face import FacePipeline
from src.search import ReverseImageSearchEngine, identify_platform, SearchMatch
from src.blockchain import BlockchainClient, LocalAuditLedger
from src.utils import (
    compute_file_sha256,
    compute_embedding_hash,
    create_cryptographic_fingerprint,
    keccak256,
)


def test_platform_identifier():
    assert identify_platform("https://x.com/elonmusk/status/123") == "X (Twitter)"
    assert identify_platform("https://twitter.com/sama") == "X (Twitter)"
    assert identify_platform("https://www.linkedin.com/in/satyanadella") == "LinkedIn"
    assert identify_platform("https://www.reddit.com/r/technology/comments/123") == "Reddit"
    assert identify_platform("https://www.instagram.com/p/Cxyz") == "Instagram"


def test_cryptographic_hashing():
    data = b"HH_GOA_2026_TASK_3"
    k_hash = keccak256(data)
    assert k_hash.startswith("0x")
    assert len(k_hash) == 66  # '0x' + 64 hex chars = 32 bytes

    # Test deterministic fingerprint
    fp1 = create_cryptographic_fingerprint(
        image_sha256="abc123",
        embedding_hash="def456",
        post_url="https://x.com/test",
        post_title="Test Post",
        source_platform="X (Twitter)",
        timestamp_iso="2026-08-31T12:00:00Z",
    )
    fp2 = create_cryptographic_fingerprint(
        image_sha256="abc123",
        embedding_hash="def456",
        post_url="https://x.com/test",
        post_title="Test Post",
        source_platform="X (Twitter)",
        timestamp_iso="2026-08-31T12:00:00Z",
    )
    assert fp1["keccak256"] == fp2["keccak256"]
    assert fp1["sha256"] == fp2["sha256"]


def test_face_detection_and_embedding(tmp_path):
    sample_img = Path("assets/sample_face.jpg")
    if not sample_img.exists():
        pytest.skip("Sample image not found in assets/")

    pipeline = FacePipeline(models_dir=tmp_path / "models")
    result = pipeline.detect_and_encode(str(sample_img), output_crop_dir=str(tmp_path / "output"))

    assert result.detected is True
    assert result.confidence > 0.0
    assert len(result.embedding) == 128
    assert len(result.embedding_hash) == 64
    assert Path(result.cropped_face_path).exists()


def test_local_blockchain_notarization_and_verification(tmp_path):
    ledger_file = tmp_path / "test_ledger.json"
    ledger = LocalAuditLedger(ledger_file=ledger_file)

    test_fingerprint = "0x" + "a" * 64
    test_url = "https://x.com/verified/status/987"
    test_meta = {"name": "Test Face Record", "score": 0.99}

    # Record on chain
    proof = ledger.record(test_fingerprint, test_url, test_meta)
    assert proof.tx_hash.startswith("0x")
    assert proof.block_number >= 1

    # Verify on chain
    is_valid, record = ledger.verify(test_fingerprint, proof.tx_hash)
    assert is_valid is True
    assert record["fingerprint"] == test_fingerprint
    assert record["post_url"] == test_url

    # Verify mismatch fails
    fake_hash = "0x" + "b" * 64
    is_valid_fake, _ = ledger.verify(fake_hash)
    assert is_valid_fake is False
