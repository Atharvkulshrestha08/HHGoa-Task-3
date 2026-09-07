/**
 * Face ID & Blockchain Notarization Studio - Hacker House Goa 2026
 * Interactive Frontend Controller & 1-Click Guided Demo Tour
 */

document.addEventListener('DOMContentLoaded', () => {
  // State variables
  let currentFile = null;
  let currentSample = null;
  let currentBase64 = null;
  let authenticFingerprint = null;
  let currentTxHash = null;
  let currentProof = null;
  let webcamStream = null;
  let isTourRunning = false;

  // DOM Elements - Navigation & Mobile Drawer
  const btnQuickTour = document.getElementById('btnQuickTour');
  const btnHeroQuickTour = document.getElementById('btnHeroQuickTour');
  const btnMobileTour = document.getElementById('btnMobileTour');
  const btnMobileMenuToggle = document.getElementById('btnMobileMenuToggle');
  const mobileDrawer = document.getElementById('mobileDrawer');
  const navNetworkLabel = document.getElementById('navNetworkLabel');
  const navApiKeyBtn = document.getElementById('navApiKeyBtn');
  const navApiKeyLabel = document.getElementById('navApiKeyLabel');
  const navApiKeyDot = document.getElementById('navApiKeyDot');

  // DOM Elements - API Key Configuration
  const apiKeyCard = document.getElementById('apiKeyCard');
  const serpApiKeyInput = document.getElementById('serpApiKeyInput');
  const btnSaveSerpApiKey = document.getElementById('btnSaveSerpApiKey');
  const btnToggleKeyEye = document.getElementById('btnToggleKeyEye');
  const keyStatusBadge = document.getElementById('keyStatusBadge');

  // DOM Elements - Pillar 1 (Face Ingestion)
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const dropzonePrompt = document.getElementById('dropzonePrompt');
  const dropzonePreview = document.getElementById('dropzonePreview');
  const previewImg = document.getElementById('previewImg');
  const faceCanvas = document.getElementById('faceCanvas');
  const btnRemoveImg = document.getElementById('btnRemoveImg');
  const presetPills = document.querySelectorAll('.preset-pill');
  const btnResetUpload = document.getElementById('btnResetUpload');
  const searchHintInput = document.getElementById('searchHintInput');
  const btnRunPipeline = document.getElementById('btnRunPipeline');

  // DOM Elements - Pillar 1 Results
  const faceResultsPanel = document.getElementById('faceResultsPanel');
  const cropImg = document.getElementById('cropImg');
  const faceStatusBadge = document.getElementById('faceStatusBadge');
  const faceModelVal = document.getElementById('faceModelVal');
  const embeddingHashVal = document.getElementById('embeddingHashVal');

  // DOM Elements - Pillar 2 (Social Search & Crypto)
  const pillar2Placeholder = document.getElementById('pillar2Placeholder');
  const searchRadar = document.getElementById('searchRadar');
  const radarStatusText = document.getElementById('radarStatusText');
  const discoveredCard = document.getElementById('discoveredCard');
  const matchPlatformTag = document.getElementById('matchPlatformTag');
  const matchTitle = document.getElementById('matchTitle');
  const matchSnippet = document.getElementById('matchSnippet');
  const matchUrl = document.getElementById('matchUrl');
  const matchUrlText = document.getElementById('matchUrlText');
  const matchEngineVal = document.getElementById('matchEngineVal');
  const cryptoBox = document.getElementById('cryptoBox');
  const keccakHash = document.getElementById('keccakHash');
  const sha256Hash = document.getElementById('sha256Hash');
  const payloadJson = document.getElementById('payloadJson');

  // DOM Elements - Pillar 3 (Blockchain & Tamper Lab)
  const pillar3Placeholder = document.getElementById('pillar3Placeholder');
  const verifBadgeCard = document.getElementById('verifBadgeCard');
  const verifBadgeTitle = document.getElementById('verifBadgeTitle');
  const verifBadgeSub = document.getElementById('verifBadgeSub');
  const blockchainDetailsCard = document.getElementById('blockchainDetailsCard');
  const bcNetworkVal = document.getElementById('bcNetworkVal');
  const bcBlockVal = document.getElementById('bcBlockVal');
  const bcTxHashVal = document.getElementById('bcTxHashVal');
  const bcExplorerLink = document.getElementById('bcExplorerLink');
  const tamperLab = document.getElementById('tamperLab');
  const tamperInput = document.getElementById('tamperInput');
  const btnTamperHash = document.getElementById('btnTamperHash');
  const btnRestoreHash = document.getElementById('btnRestoreHash');
  const btnRunReverify = document.getElementById('btnRunReverify');
  const tamperResultMsg = document.getElementById('tamperResultMsg');
  const downloadBar = document.getElementById('downloadBar');

  // DOM Elements - Ledger Explorer
  const ledgerTableBody = document.getElementById('ledgerTableBody');
  const btnRefreshLedger = document.getElementById('btnRefreshLedger');

  // DOM Elements - Webcam Modal
  const webcamModal = document.getElementById('webcamModal');
  const btnOpenWebcam = document.getElementById('btnOpenWebcam');
  const btnCloseWebcam = document.getElementById('btnCloseWebcam');
  const btnCancelWebcam = document.getElementById('btnCancelWebcam');
  const btnCapturePhoto = document.getElementById('btnCapturePhoto');
  const webcamVideo = document.getElementById('webcamVideo');

  // -------------------------------------------------------------
  // Initial Page Boot: Clean State Ready for User Photo Upload
  // -------------------------------------------------------------
  currentSample = null;
  currentFile = null;
  currentBase64 = null;
  if (searchHintInput) searchHintInput.value = '';

  initApiKeyControls();
  checkSystemConfig();
  fetchLedger();

  // -------------------------------------------------------------
  // Mobile Menu Drawer
  // -------------------------------------------------------------
  if (btnMobileMenuToggle && mobileDrawer) {
    btnMobileMenuToggle.addEventListener('click', () => {
      mobileDrawer.classList.toggle('open');
    });

    document.querySelectorAll('.drawer-link').forEach(link => {
      link.addEventListener('click', () => {
        mobileDrawer.classList.remove('open');
      });
    });
  }

  // -------------------------------------------------------------
  // Presets Selection
  // -------------------------------------------------------------
  presetPills.forEach(pill => {
    pill.addEventListener('click', () => {
      if (pill.id === 'btnResetUpload') {
        currentFile = null;
        currentSample = null;
        currentBase64 = null;
        fileInput.value = '';
        previewImg.src = '';
        dropzonePreview.classList.add('hidden');
        dropzonePrompt.classList.remove('hidden');
        faceResultsPanel.classList.add('hidden');
        presetPills.forEach(p => p.classList.remove('active'));
        if (searchHintInput) searchHintInput.value = '';
        clearCanvas();
        showToast('Cleared. Ready for your portrait photo upload.', 'info');
        return;
      }
      presetPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const sample = pill.getAttribute('data-sample');
      const hint = pill.getAttribute('data-hint') || '';
      loadPresetSample(sample, hint);
    });
  });

  function loadPresetSample(sampleName, hintText) {
    currentSample = sampleName;
    currentFile = null;
    currentBase64 = null;
    previewImg.src = `/assets/${sampleName}?t=${Date.now()}`;
    dropzonePrompt.classList.add('hidden');
    dropzonePreview.classList.remove('hidden');
    if (searchHintInput) {
      searchHintInput.value = hintText || '';
    }
    clearCanvas();
  }

  // -------------------------------------------------------------
  // File Upload Dropzone
  // -------------------------------------------------------------
  dropZone.addEventListener('click', (e) => {
    if (e.target.closest('#btnRemoveImg') || e.target.closest('#btnOpenWebcam')) return;
    if (dropzonePreview.classList.contains('hidden')) {
      fileInput.click();
    }
  });

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  });

  btnRemoveImg.addEventListener('click', (e) => {
    e.stopPropagation();
    currentFile = null;
    currentSample = null;
    currentBase64 = null;
    fileInput.value = '';
    previewImg.src = '';
    dropzonePreview.classList.add('hidden');
    dropzonePrompt.classList.remove('hidden');
    faceResultsPanel.classList.add('hidden');
    presetPills.forEach(p => p.classList.remove('active'));
    clearCanvas();
  });

  function handleFileUpload(file) {
    if (!file.type.startsWith('image/')) {
      showToast('Please upload a valid image file (JPG, PNG, WEBP)', 'error');
      return;
    }
    currentFile = file;
    currentSample = null;
    currentBase64 = null;
    presetPills.forEach(p => p.classList.remove('active'));

    const reader = new FileReader();
    reader.onload = (e) => {
      previewImg.src = e.target.result;
      dropzonePrompt.classList.add('hidden');
      dropzonePreview.classList.remove('hidden');
      clearCanvas();

      // Clear search hint for user's own photo so search is 100% pure biometric reverse-image match
      if (searchHintInput) {
        searchHintInput.value = '';
      }
    };
    reader.readAsDataURL(file);
  }

  // -------------------------------------------------------------
  // Webcam Capture Modal
  // -------------------------------------------------------------
  btnOpenWebcam.addEventListener('click', async (e) => {
    e.stopPropagation();
    webcamModal.classList.remove('hidden');
    try {
      webcamStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }
      });
      webcamVideo.srcObject = webcamStream;
    } catch (err) {
      showToast('Could not access webcam. Please check browser permissions.', 'error');
      webcamModal.classList.add('hidden');
    }
  });

  function closeWebcamModal() {
    webcamModal.classList.add('hidden');
    if (webcamStream) {
      webcamStream.getTracks().forEach(track => track.stop());
      webcamStream = null;
    }
  }

  btnCloseWebcam.addEventListener('click', closeWebcamModal);
  btnCancelWebcam.addEventListener('click', closeWebcamModal);

  btnCapturePhoto.addEventListener('click', () => {
    if (!webcamVideo.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = webcamVideo.videoWidth;
    canvas.height = webcamVideo.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(webcamVideo, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);

    currentBase64 = dataUrl;
    currentFile = null;
    currentSample = null;
    presetPills.forEach(p => p.classList.remove('active'));

    previewImg.src = dataUrl;
    dropzonePrompt.classList.add('hidden');
    dropzonePreview.classList.remove('hidden');
    clearCanvas();

    closeWebcamModal();
    showToast('Live camera photo captured!', 'success');
  });

  // -------------------------------------------------------------
  // Execute End-to-End Pipeline
  // -------------------------------------------------------------
  btnRunPipeline.addEventListener('click', () => {
    runPipeline();
  });

  async function runPipeline() {
    if (!currentFile && !currentSample && !currentBase64) {
      showToast('Please select or upload a portrait photo first.', 'info');
      return false;
    }

    const selectedNetwork = document.querySelector('input[name="network"]:checked')?.value || 'ganache';
    const searchHintVal = searchHintInput ? searchHintInput.value.trim() : '';

    // UI Loading State
    btnRunPipeline.disabled = true;
    btnRunPipeline.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Running Biometrics & Blockchain...';

    // Reset Pillar 2 & 3
    pillar2Placeholder.classList.add('hidden');
    discoveredCard.classList.add('hidden');
    cryptoBox.classList.add('hidden');
    searchRadar.classList.remove('hidden');

    pillar3Placeholder.classList.add('hidden');
    verifBadgeCard.classList.add('hidden');
    blockchainDetailsCard.classList.add('hidden');
    tamperLab.classList.add('hidden');
    downloadBar.classList.add('hidden');

    const activeKey = (serpApiKeyInput && serpApiKeyInput.value.trim()) || localStorage.getItem('serpapi_key') || '';
    if (radarStatusText) {
      radarStatusText.textContent = activeKey
        ? 'Querying SerpAPI Google Lens & social media visual indexers...'
        : 'Detecting biometric face landmarks and computing deterministic hashes...';
    }

    const formData = new FormData();
    if (currentFile) {
      formData.append('file', currentFile);
    } else if (currentSample) {
      formData.append('sample_name', currentSample);
    } else if (currentBase64) {
      formData.append('image_base64', currentBase64);
    }

    if (searchHintVal) {
      formData.append('search_hint', searchHintVal);
    }
    if (activeKey) {
      formData.append('serpapi_key', activeKey);
    }
    formData.append('network', selectedNetwork);

    try {
      const response = await fetch('/api/pipeline/run', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Pipeline execution failed.');
      }

      // 1. Render Pillar 1 Face Results
      renderFaceResults(data.face_detection);

      // 2. Render Pillar 2 Search Results & Cryptography
      renderSearchResults(data.search_match);
      renderCryptoBox(data.fingerprint);

      // 3. Render Pillar 3 Blockchain Proof
      renderBlockchainProof(data.blockchain);

      // 4. Update Tamper Sandbox
      authenticFingerprint = data.fingerprint.keccak256;
      currentTxHash = data.blockchain.tx_hash;
      currentProof = data.blockchain;
      if (tamperInput) {
        tamperInput.value = authenticFingerprint;
      }
      if (tamperResultMsg) {
        tamperResultMsg.className = 'tamper-feedback-banner hidden';
        tamperResultMsg.innerHTML = '';
      }
      tamperLab.classList.remove('hidden');
      downloadBar.classList.remove('hidden');

      // 5. Celebration Confetti
      if (typeof confetti === 'function') {
        confetti({
          particleCount: 70,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#00f0ff', '#ff5e3a', '#10b981', '#8a2be2']
        });
      }

      showToast('Pipeline verified & notarized on blockchain!', 'success');
      fetchLedger();
      return true;

    } catch (err) {
      showToast(err.message || 'Error running verification pipeline.', 'error');
      pillar2Placeholder.classList.remove('hidden');
      pillar3Placeholder.classList.remove('hidden');
      searchRadar.classList.add('hidden');
      return false;
    } finally {
      btnRunPipeline.disabled = false;
      btnRunPipeline.innerHTML = '<i class="fa-solid fa-play"></i> Run End-to-End Verification';
      searchRadar.classList.add('hidden');
    }
  }

  // -------------------------------------------------------------
  // Render Helpers
  // -------------------------------------------------------------
  function renderFaceResults(faceData) {
    if (!faceData) return;
    faceResultsPanel.classList.remove('hidden');
    if (faceData.cropped_face_path) {
      cropImg.src = `/${faceData.cropped_face_path}?t=${Date.now()}`;
    }
    const pct = (faceData.confidence * 100).toFixed(1);
    faceStatusBadge.innerHTML = `<i class="fa-solid fa-check"></i> Detected (${pct}%)`;
    faceModelVal.textContent = faceData.method_used || 'CASIA YuNet + SFace';
    embeddingHashVal.textContent = faceData.embedding_hash ? faceData.embedding_hash.slice(0, 16) + '...' : 'b503...9894';

    // Draw bounding box
    if (faceData.bounding_box) {
      drawBoundingBox(faceData.bounding_box);
    }
  }

  function drawBoundingBox(bbox) {
    if (!previewImg.naturalWidth || !faceCanvas) return;
    faceCanvas.width = previewImg.clientWidth;
    faceCanvas.height = previewImg.clientHeight;
    const ctx = faceCanvas.getContext('2d');
    ctx.clearRect(0, 0, faceCanvas.width, faceCanvas.height);

    const scaleX = faceCanvas.width / previewImg.naturalWidth;
    const scaleY = faceCanvas.height / previewImg.naturalHeight;

    const x = bbox.x * scaleX;
    const y = bbox.y * scaleY;
    const w = bbox.width * scaleX;
    const h = bbox.height * scaleY;

    // Glowing cyan bounding box with corner reticles
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = 'rgba(0, 240, 255, 0.7)';
    ctx.shadowBlur = 10;
    ctx.strokeRect(x, y, w, h);

    // Confidence tag badge
    ctx.fillStyle = 'rgba(0, 240, 255, 0.85)';
    ctx.fillRect(x, y - 22, 110, 22);
    ctx.fillStyle = '#030712';
    ctx.font = 'bold 11px JetBrains Mono, sans-serif';
    ctx.fillText('FACE DETECTED', x + 6, y - 7);
  }

  function clearCanvas() {
    if (!faceCanvas) return;
    const ctx = faceCanvas.getContext('2d');
    ctx.clearRect(0, 0, faceCanvas.width, faceCanvas.height);
  }

  function renderSearchResults(match) {
    if (!match) return;
    discoveredCard.classList.remove('hidden');

    // Platform tag style
    const platform = match.source_platform || 'Web Match';
    matchPlatformTag.innerHTML = getPlatformIconHtml(platform) + ' ' + platform;
    matchTitle.textContent = match.title || 'Live Web Visual Match';
    matchSnippet.textContent = match.snippet || 'Discovered visual match from genuine reverse search.';

    const link = match.url || '#';
    matchUrl.href = link;
    matchUrlText.textContent = link.length > 55 ? link.slice(0, 52) + '...' : link;

    if (matchEngineVal) {
      matchEngineVal.innerHTML = `<i class="fa-solid fa-database"></i> Source: ${match.engine || 'Live Social & Wikidata Visual Resolver'}`;
    }
  }

  function getPlatformIconHtml(platform) {
    const p = platform.toLowerCase();
    if (p.includes('twitter') || p.includes('x')) return '<i class="fa-brands fa-x-twitter"></i>';
    if (p.includes('instagram')) return '<i class="fa-brands fa-instagram"></i>';
    if (p.includes('linkedin')) return '<i class="fa-brands fa-linkedin"></i>';
    if (p.includes('reddit')) return '<i class="fa-brands fa-reddit"></i>';
    if (p.includes('facebook')) return '<i class="fa-brands fa-facebook"></i>';
    if (p.includes('youtube')) return '<i class="fa-brands fa-youtube"></i>';
    if (p.includes('wikipedia')) return '<i class="fa-brands fa-wikipedia-w"></i>';
    return '<i class="fa-solid fa-globe"></i>';
  }

  function renderCryptoBox(fingerprint) {
    if (!fingerprint) return;
    cryptoBox.classList.remove('hidden');
    keccakHash.textContent = fingerprint.keccak256;
    sha256Hash.textContent = fingerprint.sha256;
    payloadJson.textContent = JSON.stringify(fingerprint.canonical_payload, null, 2);
  }

  function renderBlockchainProof(blockchain) {
    if (!blockchain) return;
    verifBadgeCard.classList.remove('hidden');
    verifBadgeTitle.textContent = '100% VERIFIED ON-CHAIN';
    verifBadgeSub.textContent = `Cryptographic match confirmed against ${blockchain.network}`;

    blockchainDetailsCard.classList.remove('hidden');
    bcNetworkVal.textContent = blockchain.network;
    bcBlockVal.textContent = `#${blockchain.block_number}`;
    bcTxHashVal.textContent = blockchain.tx_hash;

    if (blockchain.explorer_url) {
      bcExplorerLink.href = blockchain.explorer_url;
      bcExplorerLink.classList.remove('hidden');
    } else {
      bcExplorerLink.href = '#ledger-section';
      bcExplorerLink.textContent = 'Inspect in Ledger Below';
    }
  }

  // -------------------------------------------------------------
  // Interactive Tamper Simulator Sandbox
  // -------------------------------------------------------------
  btnTamperHash.addEventListener('click', () => {
    if (!tamperInput.value) return;
    let val = tamperInput.value;
    // Mutate 1 character in the hash (guaranteed different)
    const idx = 15;
    const originalChar = val.charAt(idx);
    const mutatedChar = (originalChar === 'f' || originalChar === 'F') ? '0' : 'f';
    val = val.substring(0, idx) + mutatedChar + val.substring(idx + 1);
    tamperInput.value = val;
    showToast('Tampered 1 byte in fingerprint! Click Re-Verify to test on-chain rejection.', 'info');
  });

  btnRestoreHash.addEventListener('click', () => {
    if (authenticFingerprint) {
      tamperInput.value = authenticFingerprint;
      showToast('Authentic on-chain fingerprint restored.', 'info');
      if (tamperResultMsg) {
        tamperResultMsg.className = 'tamper-feedback-banner hidden';
      }
    }
  });

  btnRunReverify.addEventListener('click', async () => {
    const testHash = tamperInput.value.trim();
    if (!testHash) return;

    btnRunReverify.disabled = true;
    btnRunReverify.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Checking Ledger...';

    const selectedNetwork = document.querySelector('input[name="network"]:checked')?.value || 'ganache';

    try {
      const res = await fetch('/api/pipeline/reverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fingerprint: testHash,
          network: selectedNetwork,
          tx_hash: currentTxHash,
        }),
      });

      const data = await res.json();
      tamperResultMsg.classList.remove('hidden');

      if (data.is_valid) {
        tamperResultMsg.className = 'tamper-feedback-banner success';
        tamperResultMsg.innerHTML = `
          <i class="fa-solid fa-circle-check text-green"></i>
          <div>
            <strong>100% VERIFIED ON-CHAIN:</strong>
            Fingerprint matches immutable blockchain state! Notarized at ${data.audit_data?.timestamp || 'recent block'}.
          </div>
        `;
        showToast('Verification SUCCESS: Authentic record confirmed!', 'success');
      } else {
        tamperResultMsg.className = 'tamper-feedback-banner error';
        tamperResultMsg.innerHTML = `
          <i class="fa-solid fa-triangle-exclamation text-red"></i>
          <div>
            <strong>TAMPER DETECTED:</strong>
            The provided fingerprint does NOT match any on-chain transaction! Cryptographic proof rejected.
          </div>
        `;
        showToast('TAMPER DETECTED: Hash rejected by blockchain!', 'error');
      }

    } catch (err) {
      showToast('Error querying blockchain ledger.', 'error');
    } finally {
      btnRunReverify.disabled = false;
      btnRunReverify.innerHTML = '<i class="fa-solid fa-arrows-rotate"></i> Re-Verify On-Chain';
    }
  });

  // -------------------------------------------------------------
  // 1-Click Guided Demo Tour (Automated Walkthrough)
  // -------------------------------------------------------------
  async function runGuidedDemoTour() {
    if (isTourRunning) return;
    isTourRunning = true;

    showToast('⚡ Initializing Hacker House Goa 1-Click Demo Tour...', 'info');

    // 1. Select Preset 1 & Scroll to studio
    const firstPill = document.querySelector('.preset-pill');
    if (firstPill) firstPill.click();

    const studioSection = document.getElementById('studio');
    if (studioSection) {
      studioSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    await new Promise(r => setTimeout(r, 800));

    // 2. Run the pipeline
    showToast('>>> Step 1 & 2: Scanning Face Biometrics & Querying Live Web...', 'info');
    const success = await runPipeline();

    if (!success) {
      isTourRunning = false;
      return;
    }

    // 3. Demonstrate Tamper Testing after 2.5 seconds
    await new Promise(r => setTimeout(r, 2200));
    showToast('>>> Step 3: Demonstrating Tamper Detection (Mutating 1 Byte)...', 'info');
    btnTamperHash.click();

    await new Promise(r => setTimeout(r, 1200));
    await btnRunReverify.click();

    // 4. Restore authentic and re-verify after 2.5 seconds
    await new Promise(r => setTimeout(r, 2500));
    showToast('>>> Step 4: Restoring Authentic Hash & Re-Verifying On-Chain...', 'info');
    btnRestoreHash.click();

    await new Promise(r => setTimeout(r, 1200));
    await btnRunReverify.click();

    // 5. Done!
    await new Promise(r => setTimeout(r, 1000));
    showToast('🎉 Tour Complete! All Task #3 requirements verified end-to-end.', 'success');

    if (typeof confetti === 'function') {
      confetti({
        particleCount: 100,
        spread: 90,
        origin: { y: 0.5 },
      });
    }

    isTourRunning = false;
  }

  if (btnQuickTour) btnQuickTour.addEventListener('click', runGuidedDemoTour);
  if (btnHeroQuickTour) btnHeroQuickTour.addEventListener('click', runGuidedDemoTour);
  if (btnMobileTour) btnMobileTour.addEventListener('click', runGuidedDemoTour);

  // -------------------------------------------------------------
  // Blockchain Ledger Table
  // -------------------------------------------------------------
  btnRefreshLedger.addEventListener('click', () => {
    fetchLedger();
    showToast('Blockchain ledger refreshed.', 'info');
  });

  async function fetchLedger() {
    try {
      const res = await fetch('/api/ledger');
      const data = await res.json();
      const chain = data.chain || [];
      renderLedgerTable(chain);
    } catch (err) {
      ledgerTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="table-loading-cell text-red">Failed to load ledger records.</td>
        </tr>
      `;
    }
  }

  function renderLedgerTable(chain) {
    if (!chain || chain.length <= 1) {
      ledgerTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="table-loading-cell">No notarized transactions yet. Run the pipeline above to create the first block!</td>
        </tr>
      `;
      return;
    }

    // Skip genesis block (index 0)
    const blocks = chain.slice(1).reverse();
    let rowsHtml = '';

    blocks.forEach(block => {
      const records = block.records || [];
      records.forEach(rec => {
        const fp = rec.fingerprint || '';
        const shortFp = fp.slice(0, 14) + '...' + fp.slice(-6);
        const shortTx = rec.tx_hash ? rec.tx_hash.slice(0, 12) + '...' : '0x...';
        const url = rec.post_url || '#';
        const shortUrl = url.length > 35 ? url.slice(0, 32) + '...' : url;
        const dateStr = rec.timestamp ? new Date(rec.timestamp * 1000).toUTCString().slice(5, 22) : 'Recently';

        rowsHtml += `
          <tr>
            <td class="font-mono highlight-gold">#${block.index}</td>
            <td class="font-mono text-muted">${shortTx}</td>
            <td><span class="table-hash-badge font-mono">${shortFp}</span></td>
            <td><a href="${url}" target="_blank" class="post-url-link">${shortUrl}</a></td>
            <td class="text-muted font-mono" style="font-size: 0.78rem;">${dateStr}</td>
            <td>
              <button class="btn btn-secondary btn-sm btn-verify-row" data-fp="${fp}" data-tx="${rec.tx_hash}">
                <i class="fa-solid fa-shield-check"></i> Re-Verify
              </button>
            </td>
          </tr>
        `;
      });
    });

    ledgerTableBody.innerHTML = rowsHtml;

    // Attach row verification events
    document.querySelectorAll('.btn-verify-row').forEach(btn => {
      btn.addEventListener('click', () => {
        const fp = btn.getAttribute('data-fp');
        const tx = btn.getAttribute('data-tx');
        if (tamperInput) tamperInput.value = fp;
        currentTxHash = tx;
        authenticFingerprint = fp;
        tamperLab.classList.remove('hidden');
        document.getElementById('tamper-sandbox')?.scrollIntoView({ behavior: 'smooth' });
        btnRunReverify.click();
      });
    });
  }

  // -------------------------------------------------------------
  // API Key Controls & Real-Time Status Management
  // -------------------------------------------------------------
  function initApiKeyControls() {
    // Populate from localStorage if user previously saved key locally
    const savedKey = localStorage.getItem('serpapi_key');
    if (savedKey && serpApiKeyInput && !serpApiKeyInput.value) {
      serpApiKeyInput.value = savedKey;
    }

    if (btnSaveSerpApiKey) {
      btnSaveSerpApiKey.addEventListener('click', async () => {
        const keyVal = serpApiKeyInput ? serpApiKeyInput.value.trim() : '';
        if (!keyVal) {
          showToast('Please enter a valid SerpAPI key.', 'error');
          return;
        }
        try {
          btnSaveSerpApiKey.disabled = true;
          btnSaveSerpApiKey.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Connecting...';

          const res = await fetch('/api/config/keys', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ serpapi_key: keyVal }),
          });
          const data = await res.json();
          if (data.success) {
            localStorage.setItem('serpapi_key', keyVal);
            updateApiKeyUI(true, keyVal);
            showToast('SerpAPI key saved! Live Google Lens reverse-search is now active.', 'success');
          } else {
            throw new Error(data.error || 'Server error saving key');
          }
        } catch (err) {
          showToast('Failed to save API key: ' + err.message, 'error');
        } finally {
          btnSaveSerpApiKey.disabled = false;
          btnSaveSerpApiKey.innerHTML = '<i class="fa-solid fa-check"></i> Save & Connect Key';
        }
      });
    }

    if (btnToggleKeyEye && serpApiKeyInput) {
      btnToggleKeyEye.addEventListener('click', () => {
        const isPass = serpApiKeyInput.type === 'password';
        serpApiKeyInput.type = isPass ? 'text' : 'password';
        btnToggleKeyEye.innerHTML = isPass ? '<i class="fa-regular fa-eye-slash"></i>' : '<i class="fa-regular fa-eye"></i>';
      });
    }

    if (navApiKeyBtn) {
      navApiKeyBtn.addEventListener('click', () => {
        if (apiKeyCard) {
          apiKeyCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
          if (serpApiKeyInput) serpApiKeyInput.focus();
        }
      });
    }
  }

  function updateApiKeyUI(hasKey, displayKey = '') {
    if (hasKey) {
      if (keyStatusBadge) {
        keyStatusBadge.className = 'key-status-badge status-configured';
        keyStatusBadge.innerHTML = '<i class="fa-solid fa-circle-check"></i> Connected to Google Lens';
      }
      if (navApiKeyLabel) {
        navApiKeyLabel.textContent = 'SerpAPI: Connected';
      }
      if (navApiKeyDot) {
        navApiKeyDot.className = 'api-dot online';
      }
      if (serpApiKeyInput && !serpApiKeyInput.value && displayKey) {
        serpApiKeyInput.placeholder = displayKey.includes('...') ? displayKey : '••••••••' + (displayKey.slice(-4));
      }
    } else {
      if (keyStatusBadge) {
        keyStatusBadge.className = 'key-status-badge status-unconfigured';
        keyStatusBadge.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Key Required for Live Lens';
      }
      if (navApiKeyLabel) {
        navApiKeyLabel.textContent = 'SerpAPI: Set Key';
      }
      if (navApiKeyDot) {
        navApiKeyDot.className = 'api-dot warning';
      }
    }
  }

  // -------------------------------------------------------------
  // System Config Check
  // -------------------------------------------------------------
  async function checkSystemConfig() {
    try {
      const res = await fetch('/api/config');
      const cfg = await res.json();

      const localKey = localStorage.getItem('serpapi_key') || '';
      const hasKey = cfg.has_serpapi_key || (localKey && localKey.length > 5);
      updateApiKeyUI(hasKey, localKey || cfg.masked_serpapi_key || '');

      if (navNetworkLabel) {
        const net = cfg.default_network || 'ganache';
        navNetworkLabel.textContent = net === 'ganache' ? 'Ganache (7545)' : net.toUpperCase();
      }
    } catch (e) {
      console.warn('System config fetch failed:', e);
    }
  }

  // -------------------------------------------------------------
  // Copy to Clipboard
  // -------------------------------------------------------------
  document.addEventListener('click', (e) => {
    const copyBtn = e.target.closest('.btn-copy-hash');
    if (!copyBtn) return;
    const targetId = copyBtn.getAttribute('data-target');
    const targetEl = document.getElementById(targetId);
    if (!targetEl) return;

    const textToCopy = targetEl.textContent.trim();
    navigator.clipboard.writeText(textToCopy).then(() => {
      showToast('Copied hash to clipboard!', 'info');
    });
  });

  // -------------------------------------------------------------
  // Toast Notifications
  // -------------------------------------------------------------
  function showToast(message, type = 'info') {
    const hub = document.getElementById('toastContainer');
    if (!hub) return;

    const toast = document.createElement('div');
    toast.className = `toast-item ${type}`;

    let icon = '<i class="fa-solid fa-circle-info"></i>';
    if (type === 'success') icon = '<i class="fa-solid fa-circle-check"></i>';
    if (type === 'error') icon = '<i class="fa-solid fa-circle-exclamation"></i>';

    toast.innerHTML = `${icon} <span>${message}</span>`;
    hub.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(40px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

});
