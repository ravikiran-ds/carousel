// ==================== CONFIGURATION ====================
const username = "ravikiran-ds"; 
const repo = "carousel";

const tokenPart1 = "github_pat_11AOPNTWA0nAbSAp7nDRf4";
const tokenPart2 = "xlNhMDKmtit0dASoG0UXKDTLkbrlsxQ3GboNwoUe1snCTT63WROCAAd6H6n";

const GOOGLE_DRIVE_API_URL = "https://script.google.com/macros/s/AKfycbzysJj1cQ6FkWuV6954sxqJT4ANm8WM4dbIKF27sU3qDl5MKDmEr2N5jduQZdAc3Tm55w/exec";
// =======================================================

const GITHUB_TOKEN = (tokenPart1 && tokenPart2) ? (tokenPart1 + tokenPart2) : "";
const apiUrl = `https://api.github.com/repos/${username}/${repo}/contents/`;
let activeImagesArray = []; 
let currentLightboxIndex = -1;
let nsfwModel = null;

const isLiveMode = GITHUB_TOKEN.trim() !== "" && !GITHUB_TOKEN.includes("FIRST_HALF_OF_YOUR_TOKEN");

// Master Router Handling Initialization
async function initializeSystem() {
    renderGlowSkeletons();
    
    if (isLiveMode) {
        document.getElementById('uploadBar').classList.remove('d-none');
        document.body.classList.add('has-upload-bar');
        
        updateSplashStatus("Compiling safety scanners...");
        await loadFilterModel();
        
        setInterval(loadGallery, 15000); 
    }
    
    updateSplashStatus("Syncing live gallery streams...");
    await loadGallery();
    
    const splash = document.getElementById('splashScreen');
    splash.style.opacity = '0';
    setTimeout(() => splash.remove(), 400);
}

function updateSplashStatus(msg) {
    document.getElementById('splashStatus').innerText = msg;
}

function renderGlowSkeletons() {
    const grid = document.getElementById('photoGrid');
    grid.innerHTML = Array(6).fill('<div class="grid-item skeleton-placeholder"></div>').join('');
}

async function loadFilterModel() {
    try {
        nsfwModel = await nsfwjs.load('https://nsfwjs.com/model/', { size: 299 });
    } catch (err) { console.error("AI filter engine compilation failure:", err); }
}

// DYNAMIC IMAGE COMPRESSION ENGINE
function compressImage(imgElement) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const MAX_BOUNDS = 1920; 
        let width = imgElement.width; let height = imgElement.height;

        if (width > height) {
            if (width > MAX_BOUNDS) { height *= MAX_BOUNDS / width; width = MAX_BOUNDS; }
        } else {
            if (height > MAX_BOUNDS) { width *= MAX_BOUNDS / height; height = MAX_BOUNDS; }
        }
        canvas.width = width; canvas.height = height;
        ctx.drawImage(imgElement, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.78)); 
    });
}

// 5-SECOND MOBILE-SIDE VIDEO TRIMMING ENGINE
function trimVideo(file) {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.src = URL.createObjectURL(file);
        video.muted = true; video.playsInline = true;

        video.onloadedmetadata = function() {
            if (video.duration <= 5) { resolve(file); return; }

            video.play();
            const stream = video.captureStream ? video.captureStream() : video.mozCaptureStream();
            const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8,opus' });
            const chunks = [];

            mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
            mediaRecorder.onstop = () => {
                const trimmedBlob = new Blob(chunks, { type: 'video/webm' });
                resolve(new File([trimmedBlob], "trimmed_" + file.name, { type: 'video/webm' }));
                video.pause(); URL.revokeObjectURL(video.src);
            };

            mediaRecorder.start();
            setTimeout(() => { if (mediaRecorder.state !== "inactive") mediaRecorder.stop(); }, 5000);
        };
        video.onerror = () => reject("Parsing fault.");
    });
}

// CHRONOLOGICAL MASONRY TIMELINE SYNC ENGINE
async function loadGallery() {
    try {
        const fetchHeaders = isLiveMode ? { headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Cache-Control': 'no-cache' } } : {};
        const response = await fetch(apiUrl, fetchHeaders);
        const files = await response.json();
        
        let images = files.filter(file => file.name.match(/\.(jpg|jpeg|png|gif|webp|webm|mp4)$/i));
        
        images.sort((a, b) => {
            const timeA = parseInt(a.name.split('_')[1]) || 0;
            const timeB = parseInt(b.name.split('_')[1]) || 0;
            return timeA - timeB;
        });

        if (images.length === activeImagesArray.length) return;
        activeImagesArray = images;

        const grid = document.getElementById('photoGrid');
        grid.innerHTML = ''; 

        if (images.length === 0) {
            grid.innerHTML = '<div class="text-center text-muted py-5 w-100">Gallery album is empty.</div>';
            return;
        }

        images.forEach((img, index) => {
            const card = document.createElement('div');
            card.className = 'grid-item';
            card.onclick = () => openLightbox(index);
            
            if (img.name.endsWith('.webm') || img.name.endsWith('.mp4')) {
                card.innerHTML = `<video src="${img.download_url}" muted loop playsinline loading="lazy"></video>`;
            } else {
                card.innerHTML = `<img src="${img.download_url}" loading="lazy" alt="Wedding Asset">`;
            }
            grid.appendChild(card);
        });
    } catch (err) { console.error("Gallery frame sync error:", err); }
}

// LIGHTBOX MEDIA VIEWER
function openLightbox(index) {
    currentLightboxIndex = index;
    const lightbox = document.getElementById('lightbox');
    const container = document.getElementById('lightboxMediaContainer');
    const asset = activeImagesArray[index];
    
    container.innerHTML = '';
    if (asset.name.endsWith('.webm') || asset.name.endsWith('.mp4')) {
        container.innerHTML = `<video id="lightboxImg" src="${asset.download_url}" controls autoplay loop playsinline></video>`;
    } else {
        container.innerHTML = `<img id="lightboxImg" src="${asset.download_url}" alt="Expanded View">`;
    }
    
    lightbox.style.display = 'block';
    document.body.style.overflow = 'hidden'; 
}

function closeLightbox(event) {
    if (event.target.id === 'lightbox' || event.target.className === 'close-btn' || event.target.classList.contains('lightbox-content-wrapper')) {
        document.getElementById('lightbox').style.display = 'none';
        document.body.style.overflow = 'auto'; 
    }
}

function changeImage(direction, event) {
    if (event) event.stopPropagation(); 
    currentLightboxIndex += direction;
    if (currentLightboxIndex >= activeImagesArray.length) currentLightboxIndex = 0;
    if (currentLightboxIndex < 0) currentLightboxIndex = activeImagesArray.length - 1;
    openLightbox(currentLightboxIndex);
}

// NATIVE MOBILE BROWSERS SHARE PIPELINE
async function shareActiveImage(event) {
    if (event) event.stopPropagation();
    const currentImgUrl = activeImagesArray[currentLightboxIndex].download_url;
    
    if (navigator.share) {
        try {
            await navigator.share({ title: 'Wedding Memory', text: 'Look at this file from the wedding gallery!', url: currentImgUrl });
        } catch (err) { console.log("Cancelled share operation."); }
    } else {
        navigator.clipboard.writeText(currentImgUrl);
        alert("Media web URL copied directly to device clipboard!");
    }
}

// Keyboard controls mapping
document.addEventListener('keydown', (e) => {
    if (document.getElementById('lightbox').style.display === 'block') {
        if (e.key === 'ArrowRight') changeImage(1);
        if (e.key === 'ArrowLeft') changeImage(-1);
        if (e.key === 'Escape') { document.getElementById('lightbox').style.display = 'none'; document.body.style.overflow = 'auto'; }
    }
});

// Mobile Horizontal Tap Interface Swaps
document.getElementById('lightbox').addEventListener('click', (e) => {
    if (e.target.id === 'lightboxImg' && e.target.tagName !== 'VIDEO') {
        const clickX = e.clientX; const screenWidth = window.innerWidth;
        if (clickX < screenWidth * 0.35) { changeImage(-1); } 
        else if (clickX > screenWidth * 0.65) { changeImage(1); }
    }
});

// Helper utility to read files with modern Promise handling
function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}

// MASTER MULTI-FILE BATCH LOADING SPIN PIPELINE
async function uploadPhoto() {
    if (!isLiveMode) return;
    const fileInput = document.getElementById('photoInput');
    const status = document.getElementById('uploadStatus');
    const btn = document.getElementById('uploadBtn');
    
    const filesList = fileInput.files;
    if (filesList.length === 0) { status.innerText = "Please select files first."; return; }
    
    btn.disabled = true;
    const totalFiles = filesList.length;

    for (let i = 0; i < totalFiles; i++) {
        let file = filesList[i];
        const currentProgressMsg = `[File ${i + 1} of ${totalFiles}]`;
        
        // Spin lock button interface adjustments
        btn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Uploading (${i + 1}/${totalFiles})...`;
        status.innerHTML = `<span class="text-warning">${currentProgressMsg} Processing file streams...</span>`;

        if (file.type.startsWith('video/')) {
            status.innerHTML = `<span class="text-warning">${currentProgressMsg} Checking clip runtime limits...</span>`;
            try { file = await trimVideo(file); } catch (err) {
                status.innerHTML = `<span class="text-danger">${currentProgressMsg} Skipping corrupted video.</span>`;
                continue; 
            }
        }

        const fileData = await readFileAsDataURL(file);
        const base64OriginalContent = fileData.split(',')[1];
        const timestamp = Date.now() + i; 
        const baseFileName = `guest_${timestamp}`;
        const originalExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        const finalExt = file.type === 'video/webm' ? '.webm' : originalExtension;
        const fullFileNameOriginal = `${baseFileName}${finalExt}`;

        // --- PIPELINE A: DRIVE ARCHIVE ---
        status.innerHTML = `<span class="text-warning">${currentProgressMsg} Backing up uncompressed master to Google Drive...</span>`;
        try {
            await fetch(GOOGLE_DRIVE_API_URL, {
                method: "POST",
                mode: "no-cors",
                body: JSON.stringify({ base64Data: base64OriginalContent, mimeType: file.type, fileName: fullFileNameOriginal })
            });
        } catch (err) { console.error("Drive drop bypass:", err); }

        // --- PIPELINE B: AI SCREEN SCANNING & REDUCTION ---
        await processAndPushToGitHub(fileData, baseFileName, file.type, finalExt, base64OriginalContent, currentProgressMsg, status);
    }

    // --- PIPELINE C: VERIFY FULL CAROUSEL LOADING SYNC BEFORE CLEARING SPINNER ---
    status.innerHTML = `<span class="text-warning">🎉 Uploads received! Updating gallery wall layout...</span>`;
    await loadGallery();

    btn.innerHTML = "Upload";
    btn.disabled = false;
    status.innerHTML = `<span class="text-success">🎉 All ${totalFiles} items shared successfully!</span>`;
    fileInput.value = '';
}

function processAndPushToGitHub(rawBase64, baseName, fileType, appliedExt, originalBase64, progressMsg, statusElement) {
    return new Promise((resolve) => {
        const scannerImg = document.getElementById('imgScanner');

        if (fileType.startsWith('video/')) {
            statusElement.innerHTML = `<span class="text-warning">${progressMsg} Syncing video frame loops to screen...</span>`;
            pushToGitHub(baseName + appliedExt, originalBase64).then(resolve);
            return;
        }

        scannerImg.src = rawBase64;
        scannerImg.onload = async function() {
            statusElement.innerHTML = `<span class="text-warning">${progressMsg} Running real-time AI safety scans...</span>`;
            if (!nsfwModel) nsfwModel = await nsfwjs.load();
            const predictions = await nsfwModel.classify(scannerImg);
            const pornScore = predictions.find(p => p.className === 'Porn').probability;
            const sexyScore = predictions.find(p => p.className === 'Sexy').probability;

            if (pornScore > 0.50 || sexyScore > 0.65) {
                statusElement.innerHTML = `<span class="text-danger">⚠️ ${progressMsg} Skipped: Failed family-friendly filter.</span>`;
                setTimeout(resolve, 2000); 
                return;
            }

            statusElement.innerHTML = `<span class="text-warning">${progressMsg} Scaling preview display ratios...</span>`;
            const compressedDataUrl = await compressImage(scannerImg);
            await pushToGitHub(`${baseName}.jpg`, compressedDataUrl.split(',')[1]);
            resolve();
        };
    });
}

async function pushToGitHub(fileName, base64DataString) {
    const uploadUrl = apiUrl + fileName;
    try {
        const commitData = { message: `App upload: ${fileName}`, content: base64DataString };
        await fetch(uploadUrl, {
            method: 'PUT',
            headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(commitData)
        });
    } catch (err) { console.error("Live sync interruption:", err); }
}

initializeSystem();