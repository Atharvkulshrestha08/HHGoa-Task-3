/**
 * Face ID + Blockchain Verification Studio - Frontend Application
 */

document.addEventListener('DOMContentLoaded', () => {
  // State variables
  let currentFile = null;
  let currentSample = 'sample_face.jpg';
  let currentBase64 = null;
  let currentFingerprint = null;
  let currentProof = null;
  let webcamStream = null;

  // DOM Elements
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const dropzoneEmpty = document.getElementById('dropzoneEmpty');
  const dropzonePreview = document.getElementById('dropzonePreview');
  const previewImg = document.getElementById('previewImg');
  const faceCanvas = document.getElementById('faceCanvas');
  const btnRemoveImg = document.getElementById('btnRemoveImg');
  const samplePills = document.querySelectorAll('.sample-pill');
  const btnRunPipeline = document.getElementById('btnRunPipeline');
  
  // Results Elements
  const faceResultsPanel = document.getElementById('faceResultsPanel');
  const cropImg = document.getElementById('cropImg');
  const faceStatusBadge = document.getElementById('faceStatusBadge');
  const faceModelVal = document.getElementById('faceModelVal');
  const embeddingHashVal = document.getElementById('embeddingHashVal');

  // Pillar 2 Elements
  const pillar2Placeholder = document.getElementById('pillar2Placeholder');
  const searchRadar = document.getElementById('searchRadar');
  const discoveredCard = document.getElementById('discoveredCard');
  const matchPlatformTag = document.getElementById('matchPlatformTag');
  const matchTitle = document.getElementById('matchTitle');
  const matchSnippet = document.getElementById('matchSnippet');
  const matchUrl = document.getElementById('matchUrl');
  const matchUrlText = document.getElementById('matchUrlText');
  const cryptoBox = document.getElementById('cryptoBox');
  const keccakHash = document.getElementById('keccakHash');
  const sha256Hash = document.getElementById('sha256Hash');
  const payloadJson = document.getElementById('payloadJson');

  // Pillar 3 Elements
  const pillar3Placeholder = document.getElementById('pillar3Placeholder');
  const verifBadgeCard = document.getElementById('verifBadgeCard');
  const verifBadgeTitle = document.getElementById('verifBadgeTitle');
  const verifBadgeSub = document.getElementById('verifBadgeSub');
  const blockchainDetailsCard = document.getElementById('blockchainDetailsCard');
  const bcNetworkVal = document.getElementById('bcNetworkVal');
  const bcBlockVal = document.getElementById('bcBlockVal');
  const bcTxHashVal = document.getElementById('bcTxHashVal');
  const bcExplorerLink = document.getElementById('bcExplorerLink');
  const explorerRow = document.getElementById('explorerRow');
  const tamperLab = document.getElementById('tamperLab');
  const tamperInput = document.getElementById('tamperInput');
  const btnTamperHash = document.getElementById('btnTamperHash');
  const btnRestoreHash = document.getElementById('btnRestoreHash');
  const btnRunReverify = document.getElementById('btnRunReverify');
  const tamperResultMsg = document.getElementById('tamperResultMsg');
  const downloadBar = document.getElementById('downloadBar');

  // Ledger Elements
  const ledgerTableBody = document.getElementById('ledgerTableBody');
  const btnRefreshLedger = document.getElementById('btnRefreshLedger');
  const btnViewLedger = document.getElementById('btnViewLedger');

  // Webcam Modal Elements
  const webcamModal = document.getElementById('webcamModal');
  const btnOpenWebcam = document.getElementById('btnOpenWebcam');
  const btnCloseWebcam = document.getElementById('btnCloseWebcam');
  const btnCancelWebcam = document.getElementById('btnCancelWebcam');
  const btnCapturePhoto = document.getElementById('btnCapturePhoto');
  const webcamVideo = document.getElementById('webcamVideo');

  // Initial Load: Check presets & Ledger
  loadInitialSample('sample_face.jpg');
  fetchLedger();

  // -------------------------------------------------------------
  // Preset Selection
  // -------------------------------------------------------------
  samplePills.forEach(pill => {
    pill.addEventListener('click', () => {
      samplePills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const sample = pill.getAttribute('data-sample');
      loadInitialSample(sample);
    });
  });

  function loadInitialSample(sampleName) {
    currentSample = sampleName;
    currentFile = null;
    currentBase64 = null;
    previewImg.src = `/assets/${sampleName}?t=${Date.now()}`;
    dropzoneEmpty.classList.add('hidden');
    dropzonePreview.classList.remove('hidden');
    clearCanvas();
  }

  // -------------------------------------------------------------
  // Drag & Drop Upload
  // -------------------------------------------------------------
  dropZone.addEventListener('click', (e) => {
    if (e.target.closest('#btnRemoveImg') || e.target.closest('#btnOpenWebcam')) return;
    if (dropzonePreview.classList.contains('hidden')) {
      fileInput.click();
    }
  });

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
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
    dropzoneEmpty.classList.remove('hidden');
    faceResultsPanel.classList.add('hidden');
    samplePills.forEach(p => p.classList.remove('active'));
    clearCanvas();
  });

  function handleFile(file) {
    if (!file.type.startsWith('image/')) {
      showToast('Please upload a valid image file (JPG, PNG, WEBP)', 'error');
      return;
    }
    currentFile = file;
    currentSample = null;
    samplePills.forEach(p => p.classList.remove('active'));
    
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImg.src = e.target.result;
      dropzoneEmpty.classList.add('hidden');
      dropzonePreview.classList.remove('hidden');
      clearCanvas();
    };
    reader.readAsDataURL(file);
  }

  // -------------------------------------------------------------
  // Webcam Capture
  // -------------------------------------------------------------
  btnOpenWebcam.addEventListener('click', async () => {
    webcamModal.classList.remove('hidden');
    try {
      webcamStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }
      });
      webcamVideo.srcObject = webcamStream;
    } catch (err) {
      showToast('Could not access webcam. Please check permissions.', 'error');
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
    samplePills.forEach(p => p.classList.remove('active'));

    previewImg.src = dataUrl;
    dropzoneEmpty.classList.add('hidden');
    dropzonePreview.classList.remove('hidden');
    clearCanvas();

    closeWebcamModal();
    showToast('Live camera portrait captured!', 'success');
  });

  // -------------------------------------------------------------
  // Run End-to-End Pipeline
  // -------------------------------------------------------------
  btnRunPipeline.addEventListener('click', async () => {
    if (!currentFile && !currentSample && !currentBase64) {
      showToast('Please select or upload an image first.', 'warning');
      return;
    }

    const selectedNetwork = document.querySelector('input[name="network"]:checked').value;

    // UI Loading State
    btnRunPipeline.disabled = true;
    btnRunPipeline.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing Pipeline...';
    
    pillar2Placeholder.classList.add('hidden');
    discoveredCard.classList.add('hidden');
    cryptoBox.classList.add('hidden');
    searchRadar.classList.remove('hidden');

    pillar3Placeholder.classList.add('hidden');
    verifBadgeCard.classList.add('hidden');
    blockchainDetailsCard.classList.add('hidden');
    tamperLab.classList.add('hidden');
    downloadBar.classList.add('hidden');

    const searchHintVal = document.getElementById('searchHintInput')?.value?.trim() || '';

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
    formData.append('network', selectedNetwork);
    formData.append('force_local', selectedNetwork === 'local');

    try {
      const response = await fetch('/api/pipeline/run', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Pipeline execution failed');
      }

      // Step 1: Face Detection Updates
      faceResultsPanel.classList.remove('hidden');
      cropImg.src = data.cropped_image_url + '?t=' + Date.now();
      faceStatusBadge.innerText = `Detected (${(data.face_detection.confidence * 100).toFixed(1)}%)`;
      faceModelVal.innerText = data.face_detection.method_used;
      embeddingHashVal.innerText = data.face_detection.embedding_hash.substring(0, 10) + '...' + data.face_detection.embedding_hash.substring(58);

      // Draw bounding box on canvas
      drawBoundingBox(data.face_detection.bounding_box);

      // Step 2: Search Matches Updates
      searchRadar.classList.add('hidden');
      discoveredCard.classList.remove('hidden');
      matchPlatformTag.innerHTML = getPlatformIcon(data.best_match.source_platform) + ' ' + data.best_match.source_platform;
      matchTitle.innerText = data.best_match.title;
      matchSnippet.innerText = data.best_match.snippet || 'Visual match indexed across public web nodes.';
      matchUrl.href = data.best_match.url;
      matchUrlText.innerText = data.best_match.url;

      // Step 3: Fingerprint Updates
      cryptoBox.classList.remove('hidden');
      currentFingerprint = data.fingerprint.keccak256;
      keccakHash.innerText = currentFingerprint;
      sha256Hash.innerText = data.fingerprint.sha256;
      payloadJson.innerText = JSON.stringify(data.fingerprint.canonical_payload, null, 2);

      // Step 4 & 5: Blockchain & Verification Proof
      currentProof = data.blockchain;
      verifBadgeCard.classList.remove('hidden');
      blockchainDetailsCard.classList.remove('hidden');
      tamperLab.classList.remove('hidden');
      downloadBar.classList.remove('hidden');

      bcNetworkVal.innerText = data.blockchain.network;
      bcBlockVal.innerText = '#' + data.blockchain.block_number;
      bcTxHashVal.innerText = data.blockchain.tx_hash;

      if (data.blockchain.explorer_url) {
        explorerRow.classList.remove('hidden');
        bcExplorerLink.href = data.blockchain.explorer_url;
      } else {
        explorerRow.classList.add('hidden');
      }

      // Tamper Simulator input
      tamperInput.value = currentFingerprint;
      tamperResultMsg.classList.add('hidden');

      showToast('End-to-End Blockchain Verification Successful!', 'success');
      fetchLedger();

    } catch (err) {
      console.error(err);
      searchRadar.classList.add('hidden');
      pillar2Placeholder.classList.remove('hidden');
      pillar3Placeholder.classList.remove('hidden');
      showToast(`Error: ${err.message}`, 'error');
    } finally {
      btnRunPipeline.disabled = false;
      btnRunPipeline.innerHTML = '<i class="fa-solid fa-play"></i> Run End-to-End Verification';
    }
  });

  // -------------------------------------------------------------
  // Tamper Simulator Controls
  // -------------------------------------------------------------
  btnTamperHash.addEventListener('click', () => {
    if (!tamperInput.value) return;
    let val = tamperInput.value;
    // Mutate the last character
    let lastChar = val.slice(-1);
    let newChar = (lastChar === '0') ? '1' : '0';
    tamperInput.value = val.slice(0, -1) + newChar;
    showToast('Altered 1 character of the cryptographic hash!', 'warning');
  });

  btnRestoreHash.addEventListener('click', () => {
    if (currentFingerprint) {
      tamperInput.value = currentFingerprint;
      tamperResultMsg.classList.add('hidden');
      showToast('Restored authentic cryptographic fingerprint.', 'info');
    }
  });

  btnRunReverify.addEventListener('click', async () => {
    const inputHash = tamperInput.value.trim();
    if (!inputHash) return;

    btnRunReverify.disabled = true;
    btnRunReverify.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Checking Chain...';

    try {
      const resp = await fetch('/api/pipeline/reverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fingerprint: inputHash,
          tx_hash: currentProof ? currentProof.tx_hash : null,
        })
      });

      const res = await resp.json();
      tamperResultMsg.classList.remove('hidden');
      
      if (res.is_valid) {
        tamperResultMsg.className = 'tamper-result-msg valid';
        tamperResultMsg.innerHTML = '<i class="fa-solid fa-circle-check"></i> <b>MATCH CONFIRMED:</b> On-chain ledger record is authentic and verified.';
      } else {
        tamperResultMsg.className = 'tamper-result-msg tampered';
        tamperResultMsg.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> <b>TAMPER DETECTED:</b> Cryptographic hash does NOT exist on the blockchain ledger.';
      }
    } catch (e) {
      showToast('Re-verification query failed', 'error');
    } finally {
      btnRunReverify.disabled = false;
      btnRunReverify.innerHTML = '<i class="fa-solid fa-arrows-rotate"></i> Re-Verify On-Chain';
    }
  });

  // -------------------------------------------------------------
  // Blockchain Ledger Table
  // -------------------------------------------------------------
  async function fetchLedger() {
    try {
      const res = await fetch('/api/ledger');
      const data = await res.json();
      const chain = data.chain || [];

      if (chain.length === 0 || (chain.length === 1 && chain[0].records.length === 0)) {
        ledgerTableBody.innerHTML = `
          <tr>
            <td colspan="6" class="text-center text-muted">No blockchain transactions mined yet. Run a verification to record on-chain.</td>
          </tr>
        `;
        return;
      }

      let html = '';
      chain.forEach((block) => {
        if (!block.records || block.records.length === 0) return;
        block.records.forEach((rec) => {
          const tsStr = new Date(rec.timestamp * 1000).toUTCString();
          const shortTx = rec.tx_hash ? `${rec.tx_hash.substring(0, 10)}...${rec.tx_hash.substring(58)}` : 'N/A';
          const shortFp = rec.fingerprint ? `${rec.fingerprint.substring(0, 10)}...${rec.fingerprint.substring(58)}` : 'N/A';
          
          html += `
            <tr>
              <td><span class="badge-success">Block #${block.index}</span></td>
              <td><code class="font-mono text-muted">${shortTx}</code></td>
              <td><code class="font-mono" style="color: var(--primary-color)">${shortFp}</code></td>
              <td><a href="${rec.post_url}" target="_blank" class="discovered-link">${rec.post_url.substring(0, 32)}...</a></td>
              <td><span class="text-muted">${tsStr}</span></td>
              <td>
                <button class="btn btn-secondary btn-sm btn-table-reverify" data-fp="${rec.fingerprint}">
                  <i class="fa-solid fa-check-double"></i> Verify
                </button>
              </td>
            </tr>
          `;
        });
      });

      ledgerTableBody.innerHTML = html;

      // Bind re-verify buttons in table
      document.querySelectorAll('.btn-table-reverify').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const fp = btn.getAttribute('data-fp');
          const checkResp = await fetch('/api/pipeline/reverify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fingerprint: fp })
          });
          const checkData = await checkResp.json();
          if (checkData.is_valid) {
            showToast(`Record ${fp.substring(0, 12)}... is 100% authentic on-chain!`, 'success');
          } else {
            showToast('Record validation failed', 'error');
          }
        });
      });

    } catch (err) {
      console.error(err);
    }
  }

  btnRefreshLedger.addEventListener('click', fetchLedger);
  btnViewLedger.addEventListener('click', () => {
    document.getElementById('ledgerSection').scrollIntoView({ behavior: 'smooth' });
  });

  // -------------------------------------------------------------
  // Helpers: Canvas Bounding Box & Landmarks
  // -------------------------------------------------------------
  function drawBoundingBox(bbox) {
    if (!bbox) return;
    const imgW = previewImg.naturalWidth || previewImg.width;
    const imgH = previewImg.naturalHeight || previewImg.height;
    
    faceCanvas.width = previewImg.clientWidth;
    faceCanvas.height = previewImg.clientHeight;

    const scaleX = previewImg.clientWidth / imgW;
    const scaleY = previewImg.clientHeight / imgH;

    const ctx = faceCanvas.getContext('2d');
    ctx.clearRect(0, 0, faceCanvas.width, faceCanvas.height);

    const bx = bbox.x * scaleX;
    const by = bbox.y * scaleY;
    const bw = bbox.width * scaleX;
    const bh = bbox.height * scaleY;

    // Glowing Bounding Box
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 10;
    ctx.strokeRect(bx, by, bw, bh);

    // Corner Accents
    const cornerLen = 12;
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3.5;

    // Top-left
    ctx.beginPath();
    ctx.moveTo(bx, by + cornerLen);
    ctx.lineTo(bx, by);
    ctx.lineTo(bx + cornerLen, by);
    ctx.stroke();

    // Top-right
    ctx.beginPath();
    ctx.moveTo(bx + bw - cornerLen, by);
    ctx.lineTo(bx + bw, by);
    ctx.lineTo(bx + bw, by + cornerLen);
    ctx.stroke();

    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(bx, by + bh - cornerLen);
    ctx.lineTo(bx, by + bh);
    ctx.lineTo(bx + cornerLen, by + bh);
    ctx.stroke();

    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(bx + bw - cornerLen, by + bh);
    ctx.lineTo(bx + bw, by + bh);
    ctx.lineTo(bx + bw, by + bh - cornerLen);
    ctx.stroke();
  }

  function clearCanvas() {
    const ctx = faceCanvas.getContext('2d');
    ctx.clearRect(0, 0, faceCanvas.width, faceCanvas.height);
  }

  function getPlatformIcon(platform) {
    const p = (platform || '').toLowerCase();
    if (p.includes('twitter') || p.includes('x')) return '<i class="fa-brands fa-x-twitter"></i>';
    if (p.includes('linkedin')) return '<i class="fa-brands fa-linkedin"></i>';
    if (p.includes('instagram')) return '<i class="fa-brands fa-instagram"></i>';
    if (p.includes('reddit')) return '<i class="fa-brands fa-reddit"></i>';
    if (p.includes('facebook')) return '<i class="fa-brands fa-facebook"></i>';
    if (p.includes('github')) return '<i class="fa-brands fa-github"></i>';
    if (p.includes('youtube')) return '<i class="fa-brands fa-youtube"></i>';
    return '<i class="fa-solid fa-globe"></i>';
  }

  // -------------------------------------------------------------
  // Clipboard & Toast
  // -------------------------------------------------------------
  document.querySelectorAll('.btn-copy').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const elem = document.getElementById(targetId);
      if (elem) {
        navigator.clipboard.writeText(elem.innerText);
        showToast('Copied to clipboard!', 'info');
      }
    });
  });

  function showToast(msg, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast';
    
    let icon = '<i class="fa-solid fa-circle-info" style="color: var(--primary-color)"></i>';
    if (type === 'success') icon = '<i class="fa-solid fa-circle-check" style="color: var(--success-color)"></i>';
    if (type === 'error') icon = '<i class="fa-solid fa-triangle-exclamation" style="color: var(--danger-color)"></i>';
    if (type === 'warning') icon = '<i class="fa-solid fa-triangle-exclamation" style="color: var(--warning-color)"></i>';

    toast.innerHTML = `${icon} <span>${msg}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }
});
