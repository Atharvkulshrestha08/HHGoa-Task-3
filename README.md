# 🛡️ Face ID & Blockchain Verification Pipeline

[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Web3: Sepolia / Local EVM](https://img.shields.io/badge/Blockchain-Ethereum_Sepolia_/_Local_EVM-627EEA.svg)](https://sepolia.etherscan.io/)
[![Computer Vision](https://img.shields.io/badge/OpenCV-YuNet_+_SFace_128--d-red.svg)](https://opencv.org/)

An end-to-end verification pipeline built for **HH Goa 2026 Shortlisting (Task #3)** that detects and encodes a human face from an input image, executes a genuine reverse-image search to identify matching social media / web posts, creates a tamper-evident cryptographic fingerprint, uploads it to an immutable blockchain ledger, and re-verifies the on-chain record.

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
│ 5. ON-CHAIN RE-VERIFICATION & AUDIT RECEIPT (main.py)                           │
│    • Query blockchain state using the computed fingerprint                      │
│    • Confirm 100% byte-for-byte cryptographic integrity                        │
│    • Export JSON report & Markdown verification receipt                         │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🌟 Key Features

1. **Robust Face Detection & 128-d Feature Embedding**:
   - Uses CASIA YuNet deep convolutional detector for landmark localization and OpenCV SFace for generating 128-dimensional facial representation embeddings.
   - Computes deterministic SHA-256 hash of the facial vector and exports normalized face crops.

2. **Genuine Live Reverse-Image Search**:
   - Connects to SerpAPI (Google Lens API engine) and visual search indexers.
   - Extracts real matching social media posts across **X (Twitter), LinkedIn, Instagram, Reddit, Facebook, Threads, YouTube, and GitHub**.
   - No hardcoded / pre-picked results.

3. **Tamper-Evident Fingerprint**:
   - Formulates a canonical payload binding the image's raw SHA-256, the 128-d embedding hash, the discovered social URL, title, and timestamp.
   - Generates a 32-byte Ethereum **Keccak-256** hash (`0x...`).

4. **Multi-Mode Blockchain Notarization**:
   - **Ethereum Sepolia Testnet**: Writes directly to the `FaceVerificationRegistry.sol` smart contract or broadcasts verifiable EVM calldata transactions.
   - **Local EVM Cryptographic Ledger**: Zero-configuration, offline-compatible Merkle ledger with mining, block hashing, and instant verification.

5. **Complete On-Chain Re-Verification**:
   - Reads the transaction/storage state from the blockchain.
   - Re-computes and compares the cryptographic fingerprint to prove immutability and tamper resistance.

---

## 📂 Repository Structure

```
face-blockchain-pipeline/
├── README.md                      # Complete system documentation
├── requirements.txt               # Python dependencies
├── .env.example                   # Environment configuration template
├── .gitignore                     # Git exclusions
├── main.py                        # CLI Orchestrator with Rich UI
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
- **Python 3.10+** (Python 3.10, 3.11, 3.12, or 3.13)
- Git

### 2. Clone the Repository
```bash
git clone https://github.com/<your-username>/face-blockchain-pipeline.git
cd face-blockchain-pipeline
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables (Optional for Testnet)
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Edit `.env` if you want to use a live SerpAPI key or Ethereum Sepolia credentials:
```env
SERPAPI_API_KEY=your_serpapi_api_key_here
WEB3_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
PRIVATE_KEY=your_testnet_private_key
CONTRACT_ADDRESS=
BLOCKCHAIN_NETWORK=sepolia
```
*(Note: If no API key or private key is provided, the pipeline seamlessly uses live visual indexers and the local EVM ledger for zero-friction demonstration).*

---

## 💻 Running the Pipeline

### Basic Run (Sample Face Image)
```bash
python main.py --image assets/sample_face.jpg
```

### Run with a Custom Image
```bash
python main.py --image path/to/your_photo.jpg
```

### Run on Local EVM Ledger explicitly
```bash
python main.py --image assets/sample_face.jpg --local-chain
```

### Run on Ethereum Sepolia Testnet
```bash
python main.py --image assets/sample_face.jpg --network sepolia
```

---

## 🧪 Running Automated Tests

Run the complete test suite to verify face detection, 128-d embedding extraction, cryptographic hashing, and blockchain notarization:
```bash
python -m pytest -v
```

---

## ⛓️ Which Blockchain is Used?

The pipeline supports **Ethereum Sepolia Testnet** and **Local EVM Cryptographic Ledger**:

1. **Ethereum Sepolia Testnet (EVM)**:
   - Uses `web3.py` to interact with Ethereum testnet nodes (via Infura, Alchemy, or public RPC endpoints).
   - Writes records to the `FaceVerificationRegistry.sol` contract (`registerRecord(bytes32, string, string)`), emitting immutable on-chain events and storing records in a `mapping(bytes32 => FaceRecord)`.
   - Explorer links (e.g. `https://sepolia.etherscan.io/tx/0x...`) allow independent third-party verification.

2. **Local EVM-Compatible Cryptographic Ledger**:
   - An immutable, file-persisted blockchain ledger (`output/blockchain_ledger.json`) that computes Merkle roots, previous block hashes, and Keccak-256 transaction IDs.
   - Guarantees immediate end-to-end execution and re-verification without waiting for testnet faucets.

---

## 📋 Smart Contract Details

The Solidity contract (`contracts/FaceVerificationRegistry.sol`) provides:
- `registerRecord(bytes32 _fingerprint, string _postUrl, string _metadataUri)`: Stores the unique fingerprint along with caller address and block timestamp.
- `verifyRecord(bytes32 _fingerprint)`: Constant view function returning whether the record exists, its associated URL, metadata URI, timestamp, and recorder address.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract FaceVerificationRegistry {
    struct FaceRecord {
        bytes32 fingerprint;
        string postUrl;
        string metadataUri;
        uint256 timestamp;
        address registeredBy;
        bool exists;
    }

    mapping(bytes32 => FaceRecord) public records;
    bytes32[] public allFingerprints;

    event RecordRegistered(bytes32 indexed fingerprint, address indexed registeredBy, string postUrl, uint256 timestamp);

    function registerRecord(bytes32 _fingerprint, string calldata _postUrl, string calldata _metadataUri) external {
        require(!records[_fingerprint].exists, "Record already exists on-chain");
        records[_fingerprint] = FaceRecord(_fingerprint, _postUrl, _metadataUri, block.timestamp, msg.sender, true);
        allFingerprints.push(_fingerprint);
        emit RecordRegistered(_fingerprint, msg.sender, _postUrl, block.timestamp);
    }

    function verifyRecord(bytes32 _fingerprint) external view returns (bool exists, string memory postUrl, string memory metadataUri, uint256 timestamp, address registeredBy) {
        FaceRecord memory rec = records[_fingerprint];
        return (rec.exists, rec.postUrl, rec.metadataUri, rec.timestamp, rec.registeredBy);
    }
}
```

---

## ⚠️ Known Limitations & Considerations

1. **Face Recognition Accuracy & Variations**:
   - Facial embedding distances vary with extreme head poses, heavy occlusions, low illumination, and strong filters.
2. **Reverse Image Search API Rate Limits**:
   - Commercial reverse-image APIs (e.g. SerpAPI Google Lens) enforce monthly query quotas. The pipeline handles rate limits gracefully with fallback web indexing.
3. **Dynamic Social Media URLs**:
   - Social media platforms frequently update or remove content. The cryptographic hash preserves the exact URL and title at the moment of notarization.
4. **Testnet Longevity**:
   - Testnet state can be pruned during Ethereum hard forks; production deployments would target Ethereum Mainnet, Base, Arbitrum, or Polygon.
5. **Privacy & Biometric Data Handling**:
   - **Zero Raw Biometrics On-Chain**: Raw facial images and high-dimensional biometric vectors are **NEVER** stored directly on the public blockchain. Only one-way cryptographic digests (SHA-256 and Keccak-256) and public URLs are notarized, ensuring full privacy preservation and compliance with data protection principles.

---

## 🎥 Screen Recording Instructions

For the submission requirement:
1. Open a terminal in the project root.
2. Start your screen recording software (e.g. OBS Studio, Loom, QuickTime, or Windows Game Bar `Win + G`).
3. Run the pipeline:
   ```bash
   python main.py --image assets/sample_face.jpg
   ```
4. Allow the terminal to display all 5 steps:
   - 👤 Step 1: Face Detection & 128-d Feature Embedding
   - 🌐 Step 2: Live Reverse Image Search & Discovered Post
   - 🔐 Step 3: Cryptographic Keccak-256 Fingerprint Generation
   - ⛓️ Step 4: Blockchain Upload & Transaction Hash
   - 🛡️ Step 5: On-Chain Re-Verification Confirmation
5. Stop the recording, upload to YouTube (unlisted), Google Drive, or Loom, and submit the link along with the GitHub repository.

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
