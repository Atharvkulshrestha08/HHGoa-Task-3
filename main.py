#!/usr/bin/env python3
"""
Face ID + Blockchain Verification Studio
HH Goa 2026 Shortlisting Task 3

Orchestrates:
1. Face Detection & 128-d Feature Embedding
2. Live Reverse Image Search for Social Media / Web Posts
3. Cryptographic Keccak-256 Fingerprinting
4. Blockchain Notarization (Sepolia Testnet / Local EVM Ledger)
5. On-Chain Re-verification & Audit Proof
6. Native Windows Desktop GUI & Web Dashboard
"""

import sys
import os

# Fix UTF-8 encoding on Windows terminals
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

import argparse
from pathlib import Path
from datetime import datetime, timezone
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.text import Text
from rich import box

from src.face import FacePipeline
from src.search import ReverseImageSearchEngine
from src.blockchain import BlockchainClient
from src.utils import (
    create_cryptographic_fingerprint,
    save_json_report,
    generate_markdown_receipt,
    load_config,
)

console = Console(force_terminal=True, legacy_windows=False)


def print_banner():
    banner_text = Text(
        "[+] FACE ID & BLOCKCHAIN VERIFICATION PIPELINE [+]\n"
        "HH Goa 2026 Shortlisting - Task #3 | Tamper-Evident Social Post Verification",
        style="bold cyan",
        justify="center",
    )
    console.print(Panel(banner_text, border_style="cyan", box=box.ROUNDED))


def run_pipeline(
    image_path: str,
    search_hint: str = None,
    prefer_social: bool = True,
    force_local_chain: bool = False,
    network: str = "ganache",
    output_dir: str = "output",
    serpapi_key: str = None,
):
    print_banner()

    cfg = load_config()
    out_path = Path(output_dir)
    out_path.mkdir(parents=True, exist_ok=True)

    # -------------------------------------------------------------
    # Step 1: Face Detection & 128-d Feature Embedding
    # -------------------------------------------------------------
    console.print("\n[bold yellow]>>> STEP 1: Face Detection & Feature Vector Encoding[/bold yellow]")
    with console.status("[cyan]Analyzing image and extracting facial landmarks...[/cyan]", spinner="dots"):
        face_pipeline = FacePipeline()
        face_result = face_pipeline.detect_and_encode(image_path, output_crop_dir=output_dir)

    face_table = Table(box=box.ROUNDED, show_header=True, header_style="bold magenta")
    face_table.add_column("Property", style="bold")
    face_table.add_column("Value")

    face_table.add_row("Input Image Path", str(face_result.original_image_path))
    face_table.add_row("Image SHA-256", f"[dim]{face_result.image_sha256}[/dim]")
    face_table.add_row("Detection Status", "[bold green]Face Detected Successfully[/bold green]")
    face_table.add_row("Confidence Score", f"{face_result.confidence * 100:.1f}%")
    face_table.add_row("Bounding Box (x,y,w,h)", str(face_result.bbox))
    face_table.add_row("Embedding Model", face_result.method_used)
    face_table.add_row("Embedding Vector Dimension", f"{len(face_result.embedding)}-dimensional")
    face_table.add_row("Embedding Vector Hash", f"[green]{face_result.embedding_hash}[/green]")
    face_table.add_row("Cropped Face Saved At", f"[cyan]{face_result.cropped_face_path}[/cyan]")
    console.print(face_table)

    # -------------------------------------------------------------
    # Step 2: Live Reverse Image Search & Social Media Discovery
    # -------------------------------------------------------------
    console.print("\n[bold yellow]>>> STEP 2: Live Web & Social Media Reverse Image Search[/bold yellow]")
    with console.status("[cyan]Executing live visual query across web & social media indexers...[/cyan]", spinner="dots"):
        key_to_use = (serpapi_key and serpapi_key.strip()) or cfg.get("SERPAPI_API_KEY")
        search_engine = ReverseImageSearchEngine(api_key=key_to_use)
        matches = search_engine.search(
            face_result.cropped_face_path, search_hint=search_hint, prefer_social=prefer_social
        )

    if not matches:
        console.print("[bold red]No matching web or social media posts found.[/bold red]")
        sys.exit(1)

    search_table = Table(box=box.ROUNDED, show_header=True, header_style="bold blue")
    search_table.add_column("Rank", justify="center", style="bold")
    search_table.add_column("Platform", style="bold cyan")
    search_table.add_column("Post Title / Snippet")
    search_table.add_column("Discovered URL", style="dim underline")

    for idx, match in enumerate(matches[:5], 1):
        snippet_text = match.snippet[:80] + "..." if len(match.snippet) > 80 else match.snippet
        content_text = f"{match.title}\n[dim]{snippet_text}[/dim]" if snippet_text else match.title
        search_table.add_row(
            str(idx),
            match.source_platform,
            content_text,
            match.url,
        )
    console.print(search_table)

    best_match = matches[0]
    console.print(
        Panel(
            f"[bold green][v] Primary Discovered Match Selected:[/bold green]\n"
            f"- [bold]Platform:[/bold] {best_match.source_platform}\n"
            f"- [bold]Title:[/bold] {best_match.title}\n"
            f"- [bold]URL:[/bold] {best_match.url}\n"
            f"- [bold]Engine:[/bold] {best_match.engine}",
            border_style="green",
            box=box.ROUNDED,
        )
    )

    # -------------------------------------------------------------
    # Step 3: Cryptographic Fingerprint Generation
    # -------------------------------------------------------------
    console.print("\n[bold yellow]>>> STEP 3: Cryptographic Fingerprint Generation[/bold yellow]")
    utc_now = datetime.now(timezone.utc).isoformat()
    fingerprint_obj = create_cryptographic_fingerprint(
        image_sha256=face_result.image_sha256,
        embedding_hash=face_result.embedding_hash,
        post_url=best_match.url,
        post_title=best_match.title,
        source_platform=best_match.source_platform,
        timestamp_iso=utc_now,
    )

    fp_table = Table(box=box.ROUNDED, show_header=True, header_style="bold yellow")
    fp_table.add_column("Algorithm", style="bold")
    fp_table.add_column("Fingerprint Digest (Tamper-Evident Hash)")
    fp_table.add_row("Ethereum Keccak-256 (bytes32)", f"[bold green]{fingerprint_obj['keccak256']}[/bold green]")
    fp_table.add_row("SHA-256 Digest", f"[cyan]{fingerprint_obj['sha256']}[/cyan]")
    console.print(fp_table)

    # -------------------------------------------------------------
    # Step 4: Blockchain Upload & Notarization
    # -------------------------------------------------------------
    console.print("\n[bold yellow]>>> STEP 4: Uploading Fingerprint to Blockchain[/bold yellow]")
    with console.status("[cyan]Notarizing record on immutable blockchain ledger...[/cyan]", spinner="dots"):
        client = BlockchainClient(
            rpc_url=cfg.get("WEB3_RPC_URL"),
            private_key=cfg.get("PRIVATE_KEY"),
            contract_address=cfg.get("CONTRACT_ADDRESS"),
            network=network,
        )

        metadata_payload = {
            "image_sha256": face_result.image_sha256,
            "embedding_hash": face_result.embedding_hash,
            "post_title": best_match.title,
            "post_url": best_match.url,
            "platform": best_match.source_platform,
        }

        proof = client.upload_fingerprint(
            fingerprint_hex=fingerprint_obj["keccak256"],
            post_url=best_match.url,
            metadata=metadata_payload,
            force_local=force_local_chain,
        )

    bc_table = Table(box=box.ROUNDED, show_header=True, header_style="bold green")
    bc_table.add_column("Blockchain Property", style="bold")
    bc_table.add_column("On-Chain Verification Data")
    bc_table.add_row("Network", proof.network)
    bc_table.add_row("Execution Mode", proof.mode)
    bc_table.add_row("Transaction Hash (TxID)", f"[bold green]{proof.tx_hash}[/bold green]")
    bc_table.add_row("Block Number", str(proof.block_number))
    bc_table.add_row("Target Contract / Account", proof.contract_or_target)
    bc_table.add_row("Timestamp (UTC)", proof.timestamp)
    if proof.explorer_url:
        bc_table.add_row("Block Explorer URL", f"[underline cyan]{proof.explorer_url}[/underline cyan]")
    console.print(bc_table)

    # -------------------------------------------------------------
    # Step 5: On-Chain Re-Verification & Audit Proof
    # -------------------------------------------------------------
    console.print("\n[bold yellow]>>> STEP 5: On-Chain Re-Verification & Audit Proof[/bold yellow]")
    with console.status("[cyan]Querying blockchain ledger to re-verify stored fingerprint...[/cyan]", spinner="dots"):
        is_valid, verification_data = client.verify_on_chain(
            fingerprint_hex=fingerprint_obj["keccak256"],
            proof=proof,
        )

    if is_valid:
        verif_text = Text(
            "[+] BLOCKCHAIN VERIFICATION SUCCESSFUL & TAMPER-EVIDENT\n"
            "The local cryptographic fingerprint matches the on-chain ledger record with 100% integrity.",
            style="bold green",
            justify="center",
        )
        console.print(Panel(verif_text, border_style="bold green", box=box.ROUNDED))
    else:
        console.print("[bold red][X] Blockchain Verification Failed: Hash mismatch or record not found.[/bold red]")

    # -------------------------------------------------------------
    # Step 6: Export Reports
    # -------------------------------------------------------------
    report_data = {
        "timestamp_utc": utc_now,
        "verification_status": "SUCCESS" if is_valid else "FAILED",
        "face_detection": face_result.to_dict(),
        "search_result": best_match.to_dict(),
        "fingerprint": fingerprint_obj,
        "blockchain": proof.to_dict(),
        "on_chain_audit": verification_data,
    }

    json_report_path = out_path / "verification_report.json"
    md_receipt_path = out_path / "VERIFICATION_RECEIPT.md"

    save_json_report(report_data, str(json_report_path))
    generate_markdown_receipt(report_data, str(md_receipt_path))

    console.print(f"\n[bold green][v] Verification Report saved to:[/bold green] [cyan]{json_report_path}[/cyan]")
    console.print(f"[bold green][v] Markdown Audit Receipt saved to:[/bold green] [cyan]{md_receipt_path}[/cyan]\n")


def main():
    parser = argparse.ArgumentParser(
        description="Face ID + Blockchain Verification Studio (HH Goa 2026 Task 3)"
    )
    parser.add_argument(
        "--gui",
        action="store_true",
        help="Launch the Native Windows Desktop Application GUI (Default)",
    )
    parser.add_argument(
        "--cli",
        action="store_true",
        help="Run in terminal CLI mode instead of Desktop GUI",
    )
    parser.add_argument(
        "--web",
        action="store_true",
        help="Launch the Web Studio Dashboard (http://localhost:8000)",
    )
    parser.add_argument(
        "--image",
        "-i",
        type=str,
        default="assets/sample_face.jpg",
        help="Path to input photo containing a face (default: assets/sample_face.jpg)",
    )
    parser.add_argument(
        "--hint",
        type=str,
        default=None,
        help="Optional person name / query hint for search (e.g. 'Rakhi Sawant')",
    )
    parser.add_argument(
        "--network",
        "-n",
        type=str,
        default="sepolia",
        choices=["sepolia", "base_sepolia", "amoy", "local"],
        help="Target blockchain network (default: sepolia)",
    )
    parser.add_argument(
        "--local-chain",
        action="store_true",
        help="Force use of local cryptographic EVM audit ledger",
    )
    parser.add_argument(
        "--output",
        "-o",
        type=str,
        default="output",
        help="Output directory for crops, reports, and receipts (default: output)",
    )

    args = parser.parse_args()

    # Web Mode
    if args.web:
        import uvicorn
        console.print("[bold cyan]🚀 Launching Web UI Studio Dashboard...[/bold cyan]")
        console.print("[bold green]👉 Open in your browser: http://127.0.0.1:8000[/bold green]\n")
        uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=False)
        return

    # Explicit GUI Mode
    if args.gui:
        try:
            from gui_app import FaceIDBlockchainApp
            app = FaceIDBlockchainApp()
            app.mainloop()
            return
        except Exception as e:
            console.print(f"[bold yellow]GUI Launch notice: {e}. Falling back to CLI mode.[/bold yellow]")

    # Default / CLI Mode: Execute pipeline
    run_pipeline(
        image_path=args.image,
        search_hint=args.hint,
        prefer_social=True,
        force_local_chain=args.local_chain or (args.network == "local"),
        network=args.network,
        output_dir=args.output,
    )


if __name__ == "__main__":
    main()
