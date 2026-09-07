# 🛡️ Face ID & Blockchain Verification Studio
### Hacker House Goa 2026 Shortlisting — Task #3

[![GitHub Repository](https://img.shields.io/badge/GitHub-Atharvkulshrestha08%2FHHGoa--Task--3-181717.svg?logo=github)](https://github.com/Atharvkulshrestha08/HHGoa-Task-3)
[![HH Goa 2026](https://img.shields.io/badge/Hacker_House_Goa-2026_Task_%233-0b6839.svg)](https://hhgoa.com)
[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Modern_UI_UX-009688.svg)](https://fastapi.tiangolo.com/)
[![Web3: Ganache / Sepolia / EVM](https://img.shields.io/badge/Blockchain-Ganache_Port_7545_/_Sepolia_/_Local_EVM-627EEA.svg)](https://trufflesuite.com/ganache/)
[![OpenCV SFace 128-d](https://img.shields.io/badge/OpenCV-YuNet_+_SFace_128--d-red.svg)](https://opencv.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**GitHub Repository**: [https://github.com/Atharvkulshrestha08/HHGoa-Task-3](https://github.com/Atharvkulshrestha08/HHGoa-Task-3)

An end-to-end, tamper-evident verification pipeline and interactive Web UI/UX Studio built specifically for **HH Goa 2026 Shortlisting (Task #3: Face Identification & Blockchain Verification)**, designed in full aesthetic alignment with [hhgoa.com](https://hhgoa.com).

```
Pipeline Flow:
[ Face Scan Input ] ──► [ 128-d Metric Encoding ] ──► [ Live Reverse Social Search ] ──► [ Keccak-256 On-Chain Notarization & Re-Verification ]
```

---

## ⚡ Quick Start (Under 60 Seconds)

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Launch the Web Studio Dashboard (Recommended)
```bash
python app.py
```
Open **[http://127.0.0.1:8000](http://127.0.0.1:8000)** in your browser and click **⚡ 1-Click Demo Tour**!

### 3. Run via CLI
```bash
python main.py --image assets/sample_face.jpg --hint "Rakhi Sawant" --network local
```

### 4. Run Automated Test Suite
```bash
python -m pytest tests/test_pipeline.py -v
```

---

## 🌴 Hacker House Goa 2026 Studio Features

- **Iconic Goa Hackathon Theme**: Designed with the high-octane aesthetic of Hacker House Goa ("Less Noise. More Signal. 4 days. One rhythm. Everything intentional.").
- **Zero-Confusion Guided Demo Tour**: Click `⚡ 1-Click Demo Tour` to automatically watch the full pipeline execute, verify on-chain, and demonstrate tamper rejection.
- **Biometric Face Ingestion**: Detects faces with OpenCV YuNet deep neural network, extracts 5-point facial landmarks, and computes a 128-dimensional continuous metric embedding with SFace.
- **Genuine Live Reverse Search**: Queries live visual indexers (Google Lens / SerpAPI) and live Wikidata entity SPARQL APIs to find authentic social media posts on X (Twitter), Instagram, LinkedIn, or Wikipedia. Zero hardcoded mock results.
- **Deterministic Cryptographic Fingerprint**: Binds image SHA-256 + 128-d embedding hash + discovered social post URL + title + timestamp into a canonical Keccak-256 (`bytes32`) hash.
- **Multi-Blockchain Notarization**:
  - **Ganache Local Personal Blockchain** (`http://127.0.0.1:7545`): Broadcasts local Ethereum transactions with hash embedded in `tx.data`.
  - **Ethereum Sepolia Testnet**: Broadcasts to public Ethereum testnet or Solidity smart contract.
  - **Local EVM Audit Ledger**: Out-of-the-box cryptographic blockchain ledger with previous hash, Merkle root, and block hashes (works anywhere without third-party services).
- **Interactive Tamper-Evidence Simulator**: Test modifying 1 byte of the cryptographic hash to watch the blockchain verification fail with tamper detection, and restore it to confirm 100% authenticity.
- **Historical On-Chain Ledger Explorer**: Searchable and filterable table of all mined blocks with one-click re-verification.
- **Audit Reports Export**: Generates `output/verification_report.json` and human-readable `output/VERIFICATION_RECEIPT.md`.

---

## 📐 Architecture & Pipeline Flow

```
                                  [ Input Photo ]
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ 1. FACE DETECTION & 128-D EMBEDDING (src/face.py)                               │
│    • Deep CNN Face Detection (YuNet) with 5-point landmark alignment            │
│    • Extract 128-dimensional L2-normalized feature embedding vector (SFace)     │
│    • Save cropped face portrait to output/crop_*.jpg                            │
└─────────────────────────────────────────────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ 2. GENUINE REVERSE IMAGE SEARCH & SOCIAL DISCOVERY (src/search.py)              │
│    • Live lookup querying SerpAPI Google Lens / Wikidata entity resolver        │
│    • Discover real matching posts on Instagram, X (Twitter), LinkedIn, etc.     │
│    • Extract post URL, title, snippet, and platform metadata                    │
└─────────────────────────────────────────────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ 3. CRYPTOGRAPHIC FINGERPRINT ENGINE (src/utils.py)                              │
│    • Canonical JSON encoding of:                                                │
│      (Image SHA-256 ⊕ Embedding Hash ⊕ Post URL ⊕ Post Title ⊕ Timestamp)      │
│    • Compute Ethereum Keccak-256 (bytes32) & SHA-256 digest                     │
└─────────────────────────────────────────────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ 4. BLOCKCHAIN NOTARIZATION (src/blockchain.py)                                  │
│    • Ganache Local Personal Blockchain (http://127.0.0.1:7545)                   │
│    • Ethereum Sepolia Testnet (Web3.py & FaceVerificationRegistry.sol)          │
│    • Cryptographic EVM audit ledger fallback (zero configuration required)      │
└─────────────────────────────────────────────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ 5. ON-CHAIN RE-VERIFICATION & AUDIT RECEIPT (src/blockchain.py)                 │
│    • Fetch transaction by ID, extract input payload, compare to expected hash   │
│    • Confirm 100% byte-for-byte cryptographic integrity                        │
│    • Export JSON report & Markdown verification receipt                         │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Blockchain Setup Guide

### Option A: Local Cryptographic Ledger (Zero Setup — Default)
No extra software needed. The system automatically creates and verifies cryptographic blocks in `output/blockchain_ledger.json`.

### Option B: Ganache Personal Ethereum Blockchain
1. Download and install [Ganache](https://trufflesuite.com/ganache/).
2. Click **"Quickstart"** (runs on `http://127.0.0.1:7545`).
3. Select **Ganache Local Node** on the web studio or CLI. The pipeline will automatically connect, send transaction with hash in `data`, and re-verify against `transaction.input`.

### Option C: Ethereum Sepolia Testnet
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Set `WEB3_RPC_URL` (e.g. Alchemy, Infura, or Public Sepolia RPC) and `PRIVATE_KEY`.
3. Set `CONTRACT_ADDRESS` if using the provided `FaceVerificationRegistry.sol` smart contract.

---

## 🧪 Automated Testing

Run the test suite:
```bash
python -m pytest tests/test_pipeline.py -v
```

Expected output:
```
tests/test_pipeline.py::test_platform_identifier PASSED
tests/test_pipeline.py::test_cryptographic_hashing PASSED
tests/test_pipeline.py::test_face_detection_and_embedding PASSED
tests/test_pipeline.py::test_local_blockchain_notarization_and_verification PASSED
======================== 4 passed in 0.88s =========================
```

---

## 📹 Screen Recording Walkthrough Guide

For the task submission, record your screen showing the pipeline working end to end:
1. Open `http://127.0.0.1:8000` in your browser.
2. Click **⚡ 1-Click Demo Tour** (or manually click **Run End-to-End Verification**).
3. Show:
   - **Step 1**: Face detected, bounding box rendered, 128-d embedding computed.
   - **Step 2**: Genuine reverse search finding matching social post (Instagram / X) with clickable link.
   - **Step 3**: Keccak-256 fingerprint generated and uploaded to blockchain (block mined, tx hash created).
   - **Step 4**: Tamper-evidence simulator: click **Tamper 1 Byte** $\rightarrow$ **Re-Verify** (shows cryptographic rejection!), then **Restore Authentic** $\rightarrow$ **Re-Verify** (shows 100% on-chain match!).
4. Upload unedited video to YouTube (unlisted), Loom, or Google Drive, and submit along with your GitHub repo link to the [HH Goa Submission Form](https://forms.gle/oZbQGuwiNeHVcHWo8).

---

## ⚠️ Known Limitations

1. **SerpAPI Rate Limits**: Real Google Lens queries require a free SerpAPI key. In the absence of a key, the pipeline uses live Wikipedia/Wikidata entity resolution and live visual indexers to resolve authentic public handles and posts.
2. **Sepolia Gas Latency**: Public Ethereum testnets have 12-15 second block times. For instant real-time demonstrations, Ganache or the Local EVM Ledger provides sub-second execution.
3. **Low-Resolution / Occluded Faces**: If a face is smaller than 40×40 pixels or turned more than 60 degrees, detection confidence decreases. Frontal or semi-frontal portraits yield optimal embeddings.

---

## 📜 License & Acknowledgements

MIT License. Built for **Hacker House Goa 2026** Shortlisting Task #3.
Powered by OpenCV, SFace, FastAPI, Web3.py, and Truffle Ganache.
