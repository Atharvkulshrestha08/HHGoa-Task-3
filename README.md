# 🛡️ Face ID & Blockchain Verification Studio

[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Modern_UI_UX-009688.svg)](https://fastapi.tiangolo.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Web3: Sepolia / Local EVM](https://img.shields.io/badge/Blockchain-Ethereum_Sepolia_/_Local_EVM-627EEA.svg)](https://sepolia.etherscan.io/)
[![Computer Vision](https://img.shields.io/badge/OpenCV-YuNet_+_SFace_128--d-red.svg)](https://opencv.org/)

An end-to-end verification pipeline and interactive Web UI/UX Studio built for **HH Goa 2026 Shortlisting (Task #3)**. It detects and encodes a human face from an input image, executes a genuine reverse-image search to identify matching social media posts, computes a tamper-evident cryptographic fingerprint, uploads it to an immutable blockchain ledger (Ethereum Sepolia / Local EVM), and demonstrates on-chain re-verification.

---

## 🖥️ Interactive Web UI / UX Dashboard

The system features a **cybersecurity-themed dark mode Web UI Dashboard** (`http://127.0.0.1:8000`):

- **Biometric Ingestion Studio**: Drag & drop photo zone, preset sample selectors, live HTML5 bounding box & landmark rendering, and live camera snapshot support.
- **Social Discovery Radar**: Live reverse-search animation displaying verified social media cards (X/Twitter, LinkedIn, Reddit, Instagram, etc.) with clickable links.
- **Cryptographic Notary**: Displays canonical JSON payload, Ethereum Keccak-256 (`bytes32`), and SHA-256 digests with one-click copy buttons.
- **On-Chain Audit & Verification Badge**: Holographic verification status card, transaction hash, block height, and Sepolia block explorer link.
- **Interactive Tamper-Evidence Lab**: Allows testers to alter 1 byte of the cryptographic hash to watch the blockchain verification fail with tamper detection, and restore it to confirm 100% authenticity.
- **Immutable Ledger Explorer**: Live table of all mined blocks and notarized records with instant re-verification triggers.

---

## 📐 Architecture & Pipeline Flow

```
                                  [ Input Photo ]
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ 1. FACE DETECTION & 128-D EMBEDDING (src/face.py)                               │
│    • Deep CNN Face Detection (YuNet / DNN) with 5-point landmark alignment      │
│    • Extract 128-dimensional L2-normalized feature embedding vector (SFace)     │
│    • Save cropped face portrait to output/crop_*.jpg                            │
└─────────────────────────────────────────────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ 2. GENUINE REVERSE IMAGE SEARCH & SOCIAL DISCOVERY (src/search.py)              │
│    • Live visual lookup querying SerpAPI Google Lens / visual indexers          │
│    • Filter & rank matches across X (Twitter), LinkedIn, Instagram, Reddit, etc │
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
│    • Ethereum Sepolia Testnet (via Web3.py & FaceVerificationRegistry.sol)      │
│    • Self-contained cryptographic EVM audit ledger fallback                     │
│    • Generate immutable Transaction Hash & Block Record                         │
└─────────────────────────────────────────────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ 5. ON-CHAIN RE-VERIFICATION & AUDIT RECEIPT (main.py / app.py)                  │
│    • Query blockchain state using the computed fingerprint                      │
│    • Confirm 100% byte-for-byte cryptographic integrity                        │
│    • Export JSON report & Markdown verification receipt                         │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📂 Repository Structure

```
face-blockchain-pipeline/
├── app.py                         # FastAPI Web Application Server
├── main.py                        # CLI & Web Launcher Orchestrator
├── requirements.txt               # Dependencies
├── .env.example                   # Environment configuration template
├── .gitignore                     # Git exclusions
├── templates/
│   └── index.html                 # Interactive UI/UX Dashboard
├── static/
│   ├── css/style.css              # Cyber-security dark theme stylesheet
│   └── js/app.js                  # Interactive frontend logic & canvas visualizer
├── src/
│   ├── __init__.py                # Package init
│   ├── face.py                    # Face detection, 128-d embedding & cropping
│   ├── search.py                  # Live reverse image search & social filtering
│   ├── blockchain.py              # Web3 Sepolia client & local EVM ledger
│   └── utils.py                   # Keccak-256 hashing, fingerprinting & exports
├── contracts/
│   ├── FaceVerificationRegistry.sol  # Solidity smart contract
│   └── FaceVerificationRegistry.json # Contract ABI & compilation artifacts
├── assets/
│   ├── sample_face.jpg            # Primary test portrait
│   └── sample_face_2.jpg          # Secondary test portrait
├── tests/
│   └── test_pipeline.py           # Automated unit and integration test suite
└── output/                        # (Generated during run)
    ├── crop_sample_face.jpg       # Cropped face portrait
    ├── verification_report.json   # Machine-readable audit JSON
    ├── VERIFICATION_RECEIPT.md    # Human-readable Markdown receipt
    └── blockchain_ledger.json     # Local immutable chain storage
```

---

## 🚀 Quick Start & Installation

### 1. Prerequisites
- **Python 3.10+** (tested on Python 3.10, 3.11, 3.12, 3.13)
- Modern Web Browser (Chrome, Brave, Firefox, Edge, Safari)

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Launch the Interactive Web UI Dashboard
```bash
python app.py
# or
python main.py --web
```
👉 Open your browser at: **`http://127.0.0.1:8000`**

---

## 💻 CLI Usage (Alternative)

### Run Pipeline via Terminal CLI
```bash
# Basic run with sample portrait
python main.py --image assets/sample_face.jpg

# Run with any custom photo
python main.py --image path/to/your_photo.jpg

# Run specifically on local EVM ledger
python main.py --image assets/sample_face.jpg --local-chain

# Run on Ethereum Sepolia Testnet
python main.py --image assets/sample_face.jpg --network sepolia
```

---

## 🧪 Running Automated Tests

Run the complete test suite:
```bash
python -m pytest -v
```

---

## ⛓️ Which Blockchain is Used?

The system supports dual blockchain environments:

1. **Ethereum Sepolia Testnet (EVM)**:
   - Uses `web3.py` to interact with Ethereum testnet nodes.
   - Writes records to the `FaceVerificationRegistry.sol` contract (`registerRecord(bytes32, string, string)`), emitting immutable on-chain events and storing records in a `mapping(bytes32 => FaceRecord)`.
   - Explorer links (e.g. `https://sepolia.etherscan.io/tx/0x...`) allow third-party verification.

2. **Local EVM-Compatible Cryptographic Ledger**:
   - An immutable, file-persisted blockchain ledger (`output/blockchain_ledger.json`) that computes Merkle roots, previous block hashes, and Keccak-256 transaction IDs.
   - Guarantees immediate end-to-end execution and re-verification without waiting for testnet faucets.

---

## ⚠️ Known Limitations & Considerations

1. **Face Recognition Accuracy**:
   - Facial embedding distances vary with extreme head poses, heavy occlusions, low illumination, and strong filters.
2. **Reverse Image Search API Rate Limits**:
   - Commercial reverse-image APIs (e.g. SerpAPI Google Lens) enforce monthly query quotas. The pipeline handles rate limits gracefully with fallback web indexing.
3. **Dynamic Social Media URLs**:
   - Social media platforms frequently update or remove content. The cryptographic hash preserves the exact URL and title at the moment of notarization.
4. **Privacy & Biometric Data Handling**:
   - **Zero Raw Biometrics On-Chain**: Raw facial images and high-dimensional biometric vectors are **NEVER** stored directly on the public blockchain. Only one-way cryptographic digests (SHA-256 and Keccak-256) and public URLs are notarized, ensuring full privacy preservation and compliance with data protection principles.

---

## 🎥 Screen Recording Instructions

For your submission:
1. Start the web dashboard: `python app.py` and open `http://127.0.0.1:8000`.
2. Start your screen recording software (OBS Studio, Loom, QuickTime, or `Win + G`).
3. Click **"Run End-to-End Verification"** on the dashboard.
4. Show:
   - 👤 Face detection box & 128-d embedding
   - 🌐 Discovered social media post
   - 🔐 Keccak-256 cryptographic fingerprint
   - ⛓️ Blockchain block number & transaction hash
   - 🛡️ 100% VERIFIED ON-CHAIN badge
   - 🧪 Click **"Tamper 1 Byte"** -> **"Re-Verify"** (shows tamper rejection) -> click **"Restore Authentic"** -> **"Re-Verify"** (shows match confirmation).
5. Stop the recording, upload to YouTube (unlisted) or Loom / Google Drive, and submit the link along with the GitHub repository.

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
