// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title FaceVerificationRegistry
 * @dev Tamper-evident on-chain notarization registry for face identification and social verification.
 */
contract FaceVerificationRegistry {
    struct FaceRecord {
        bytes32 fingerprint;       // Keccak256 hash of (image + embedding + post data)
        string postUrl;            // Discovered social media post URL
        string metadataUri;        // Extended JSON metadata / IPFS hash
        uint256 timestamp;         // Block timestamp when registered
        address registeredBy;      // Wallet address of recorder
        bool exists;               // Existence flag
    }

    // Mapping from fingerprint to FaceRecord
    mapping(bytes32 => FaceRecord) public records;
    
    // Array of all registered fingerprints
    bytes32[] public allFingerprints;

    event RecordRegistered(
        bytes32 indexed fingerprint,
        address indexed registeredBy,
        string postUrl,
        uint256 timestamp
    );

    /**
     * @notice Register a new face-match fingerprint on-chain
     * @param _fingerprint 32-byte cryptographic digest
     * @param _postUrl URL of the discovered social media post
     * @param _metadataUri Optional metadata JSON URI / IPFS hash
     */
    function registerRecord(
        bytes32 _fingerprint,
        string calldata _postUrl,
        string calldata _metadataUri
    ) external {
        require(!records[_fingerprint].exists, "Record already exists on-chain");

        records[_fingerprint] = FaceRecord({
            fingerprint: _fingerprint,
            postUrl: _postUrl,
            metadataUri: _metadataUri,
            timestamp: block.timestamp,
            registeredBy: msg.sender,
            exists: true
        });

        allFingerprints.push(_fingerprint);

        emit RecordRegistered(_fingerprint, msg.sender, _postUrl, block.timestamp);
    }

    /**
     * @notice Verify if a fingerprint exists and retrieve its details
     * @param _fingerprint 32-byte cryptographic digest
     */
    function verifyRecord(bytes32 _fingerprint)
        external
        view
        returns (
            bool exists,
            string memory postUrl,
            string memory metadataUri,
            uint256 timestamp,
            address registeredBy
        )
    {
        FaceRecord memory rec = records[_fingerprint];
        return (rec.exists, rec.postUrl, rec.metadataUri, rec.timestamp, rec.registeredBy);
    }

    /**
     * @notice Returns total number of registered records
     */
    function totalRecords() external view returns (uint256) {
        return allFingerprints.length;
    }
}
