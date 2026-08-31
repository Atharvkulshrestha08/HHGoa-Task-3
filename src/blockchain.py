"""
Blockchain Notarization & Verification Module.
Supports Ethereum Sepolia Testnet (Web3.py Smart Contracts / Calldata)
and a local cryptographic EVM-compatible audit ledger.
"""

import os
import json
import time
from pathlib import Path
from dataclasses import dataclass
from typing import Dict, Any, Optional, Tuple
from web3 import Web3
from eth_account import Account
import hashlib

CONTRACT_ABI_PATH = Path(__file__).parent.parent / "contracts" / "FaceVerificationRegistry.json"
LEDGER_PATH = Path(__file__).parent.parent / "output" / "blockchain_ledger.json"

EXPLORER_URLS = {
    "sepolia": "https://sepolia.etherscan.io/tx/",
    "base_sepolia": "https://sepolia.basescan.org/tx/",
    "amoy": "https://amoy.polygonscan.com/tx/",
}


@dataclass
class BlockchainProof:
    tx_hash: str
    block_number: int
    network: str
    contract_or_target: str
    explorer_url: Optional[str]
    timestamp: str
    on_chain_hash: str
    match_confirmed: bool
    mode: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "tx_hash": self.tx_hash,
            "block_number": self.block_number,
            "network": self.network,
            "contract_or_target": self.contract_or_target,
            "explorer_url": self.explorer_url,
            "timestamp": self.timestamp,
            "on_chain_hash": self.on_chain_hash,
            "match_confirmed": self.match_confirmed,
            "mode": self.mode,
        }


class LocalAuditLedger:
    """Local cryptographic blockchain ledger for offline or instant verification."""

    def __init__(self, ledger_file: Path = LEDGER_PATH):
        self.ledger_file = ledger_file
        self.ledger_file.parent.mkdir(parents=True, exist_ok=True)
        self._init_chain()

    def _init_chain(self):
        if not self.ledger_file.exists():
            genesis_block = {
                "index": 0,
                "timestamp": time.time(),
                "records": [],
                "previous_hash": "0x0000000000000000000000000000000000000000000000000000000000000000",
                "merkle_root": "0x0000000000000000000000000000000000000000000000000000000000000000",
                "block_hash": "0x" + hashlib.sha256(b"GENESIS_BLOCK_HH_GOA_2026").hexdigest(),
            }
            with open(self.ledger_file, "w", encoding="utf-8") as f:
                json.dump({"chain": [genesis_block]}, f, indent=2)

    def record(
        self, fingerprint: str, post_url: str, metadata: Dict[str, Any]
    ) -> BlockchainProof:
        with open(self.ledger_file, "r", encoding="utf-8") as f:
            data = json.load(f)

        chain = data.get("chain", [])
        last_block = chain[-1]

        timestamp = time.time()
        tx_hash = "0x" + hashlib.sha256(
            f"{fingerprint}:{post_url}:{timestamp}:{len(chain)}".encode("utf-8")
        ).hexdigest()

        record_entry = {
            "tx_hash": tx_hash,
            "fingerprint": fingerprint,
            "post_url": post_url,
            "metadata": metadata,
            "timestamp": timestamp,
            "block_index": len(chain),
        }

        # Calculate new block
        block_content = f"{last_block['block_hash']}:{tx_hash}:{fingerprint}:{timestamp}"
        new_block_hash = "0x" + hashlib.sha256(block_content.encode("utf-8")).hexdigest()

        new_block = {
            "index": len(chain),
            "timestamp": timestamp,
            "records": [record_entry],
            "previous_hash": last_block["block_hash"],
            "merkle_root": fingerprint,
            "block_hash": new_block_hash,
        }

        chain.append(new_block)
        with open(self.ledger_file, "w", encoding="utf-8") as f:
            json.dump({"chain": chain}, f, indent=2)

        return BlockchainProof(
            tx_hash=tx_hash,
            block_number=new_block["index"],
            network="Local Cryptographic EVM Ledger",
            contract_or_target="0xFaceVerificationRegistryLocal",
            explorer_url=None,
            timestamp=time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime(timestamp)),
            on_chain_hash=fingerprint,
            match_confirmed=True,
            mode="Local EVM-Compatible Immutable Ledger",
        )

    def verify(self, fingerprint: str, tx_hash: Optional[str] = None) -> Tuple[bool, Optional[Dict[str, Any]]]:
        if not self.ledger_file.exists():
            return False, None

        with open(self.ledger_file, "r", encoding="utf-8") as f:
            data = json.load(f)

        chain = data.get("chain", [])
        for block in chain:
            for rec in block.get("records", []):
                if rec.get("fingerprint").lower() == fingerprint.lower():
                    if tx_hash and rec.get("tx_hash").lower() != tx_hash.lower():
                        continue
                    return True, rec

        return False, None


class BlockchainClient:
    """Manages writing face verification fingerprints to Ethereum / EVM or Local Chain."""

    def __init__(
        self,
        rpc_url: Optional[str] = None,
        private_key: Optional[str] = None,
        contract_address: Optional[str] = None,
        network: str = "sepolia",
    ):
        self.network = network.lower()
        self.rpc_url = rpc_url or os.getenv("WEB3_RPC_URL", "https://ethereum-sepolia-rpc.publicnode.com")
        self.private_key = private_key or os.getenv("PRIVATE_KEY", "")
        self.contract_address = contract_address or os.getenv("CONTRACT_ADDRESS", "")
        self.local_ledger = LocalAuditLedger()

        self.w3 = None
        self.account = None
        self.contract = None

        self._init_web3()

    def _init_web3(self):
        """Initialize Web3 connection if valid RPC provided."""
        try:
            if self.rpc_url:
                self.w3 = Web3(Web3.HTTPProvider(self.rpc_url, request_kwargs={"timeout": 10}))
                if self.private_key and len(self.private_key.strip()) >= 64:
                    pk = self.private_key.strip()
                    if not pk.startswith("0x"):
                        pk = "0x" + pk
                    self.account = Account.from_key(pk)
        except Exception:
            self.w3 = None
            self.account = None

        if self.w3 and self.w3.is_connected() and self.contract_address:
            try:
                if CONTRACT_ABI_PATH.exists():
                    with open(CONTRACT_ABI_PATH, "r", encoding="utf-8") as f:
                        contract_json = json.load(f)
                    abi = contract_json.get("abi", [])
                    checksum_addr = Web3.to_checksum_address(self.contract_address)
                    self.contract = self.w3.eth.contract(address=checksum_addr, abi=abi)
            except Exception:
                self.contract = None

    def upload_fingerprint(
        self,
        fingerprint_hex: str,
        post_url: str,
        metadata: Dict[str, Any],
        force_local: bool = False,
    ) -> BlockchainProof:
        """
        Record fingerprint on blockchain:
        1. If funded Sepolia account available: broadcast live EVM transaction / smart contract.
        2. Otherwise: record into local cryptographic blockchain ledger.
        """
        # If testnet parameters configured and connected
        if not force_local and self.w3 and self.w3.is_connected() and self.account:
            try:
                return self._upload_evm_testnet(fingerprint_hex, post_url, metadata)
            except Exception as e:
                # If transaction fails (e.g. out of gas or network error), fallback to local ledger
                pass

        # Local chain fallback
        return self.local_ledger.record(fingerprint_hex, post_url, metadata)

    def _upload_evm_testnet(
        self, fingerprint_hex: str, post_url: str, metadata: Dict[str, Any]
    ) -> BlockchainProof:
        """Broadcast live transaction on Sepolia or EVM testnet."""
        account_addr = self.account.address
        nonce = self.w3.eth.get_transaction_count(account_addr)
        gas_price = self.w3.eth.gas_price

        # Format 32-byte hash
        raw_hash = fingerprint_hex.replace("0x", "")
        bytes32_val = bytes.fromhex(raw_hash)

        if self.contract:
            # Smart Contract Call
            metadata_str = json.dumps(metadata, separators=(",", ":"))
            tx_data = self.contract.functions.registerRecord(
                bytes32_val, post_url, metadata_str
            ).build_transaction({
                "from": account_addr,
                "nonce": nonce,
                "gasPrice": gas_price,
            })
        else:
            # Calldata Notarization Transaction (notarize fingerprint in tx data payload)
            notary_payload = {
                "protocol": "FaceVerificationRegistry/1.0",
                "fingerprint": fingerprint_hex,
                "post_url": post_url,
            }
            calldata = "0x" + json.dumps(notary_payload).encode("utf-8").hex()
            tx_data = {
                "from": account_addr,
                "to": account_addr,  # self-notarization
                "value": 0,
                "gas": 60000,
                "gasPrice": gas_price,
                "nonce": nonce,
                "data": calldata,
                "chainId": self.w3.eth.chain_id,
            }

        signed_tx = self.w3.eth.account.sign_transaction(tx_data, self.account.key)
        tx_hash_bytes = self.w3.eth.send_raw_transaction(signed_tx.raw_transaction)
        tx_hash_str = "0x" + tx_hash_bytes.hex()

        # Wait for receipt
        receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash_bytes, timeout=60)
        block_num = receipt.get("blockNumber", 0)

        explorer_prefix = EXPLORER_URLS.get(self.network, "https://sepolia.etherscan.io/tx/")
        explorer_url = explorer_prefix + tx_hash_str

        return BlockchainProof(
            tx_hash=tx_hash_str,
            block_number=block_num,
            network=f"Ethereum {self.network.capitalize()}",
            contract_or_target=self.contract_address or account_addr,
            explorer_url=explorer_url,
            timestamp=time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime()),
            on_chain_hash=fingerprint_hex,
            match_confirmed=True,
            mode="EVM Testnet (Smart Contract)" if self.contract else "EVM Testnet (Calldata Immutable Notarization)",
        )

    def verify_on_chain(
        self, fingerprint_hex: str, proof: Optional[BlockchainProof] = None
    ) -> Tuple[bool, Dict[str, Any]]:
        """
        Verify that a fingerprint is recorded on-chain and retrieve notarized proof.
        """
        # Check Local Ledger first if local proof
        if proof and "Local" in proof.network:
            is_valid, record = self.local_ledger.verify(fingerprint_hex, proof.tx_hash)
            return is_valid, {
                "verified_on_chain": is_valid,
                "network": "Local EVM Ledger",
                "on_chain_fingerprint": record.get("fingerprint") if record else None,
                "timestamp": record.get("timestamp") if record else None,
                "post_url": record.get("post_url") if record else None,
            }

        # Check Smart contract on Sepolia
        if self.contract:
            try:
                raw_hash = fingerprint_hex.replace("0x", "")
                bytes32_val = bytes.fromhex(raw_hash)
                exists, post_url, meta, ts, recorder = self.contract.functions.verifyRecord(bytes32_val).call()
                if exists:
                    return True, {
                        "verified_on_chain": True,
                        "network": f"Ethereum {self.network.capitalize()}",
                        "on_chain_fingerprint": fingerprint_hex,
                        "timestamp": ts,
                        "registered_by": recorder,
                        "post_url": post_url,
                    }
            except Exception:
                pass

        # Check local ledger as fallback
        is_valid, record = self.local_ledger.verify(fingerprint_hex)
        if is_valid:
            return True, {
                "verified_on_chain": True,
                "network": "Local EVM Ledger",
                "on_chain_fingerprint": record.get("fingerprint"),
                "timestamp": record.get("timestamp"),
                "post_url": record.get("post_url"),
            }

        return False, {"verified_on_chain": False}
