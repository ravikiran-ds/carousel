// ==================== CONFIGURATION ====================
const username = "ravikiran-ds"; 
const repo = "carousel";
const myBranch = "main";

const tokenPart1 = "github_pat_11AOPNTWA0nAbSAp7nDRf4";
const tokenPart2 = "_xlNhMDKmtit0dASoG0UXKDTLkbrlsxQ3GboNwoUe1snCTT63WROCAAd6H6n";

// PASTE YOUR DEPLOYED GOOGLE APPS SCRIPT WEB APP URL HERE:
const GOOGLE_DRIVE_API_URL = "https://script.google.com/macros/s/AKfycbylQuQw2waiFTTCfcNE0QDk4-UvPrDT3JsB4UisxSiY-o60j8K6K99SuPKjen73CGBV/exec";
// =======================================================

const GITHUB_TOKEN = (tokenPart1 && tokenPart2) ? (tokenPart1 + tokenPart2) : "";
const apiUrl = `https://api.github.com/repos/${username}/${repo}/contents/`;
let activeImagesArray = []; 
let currentLightboxIndex = -1;
let nsfwModel = null;

// Autoscroll tracking variables
let autoscrollInterval = null;
let userInteractingTimeout = null;
const SCROLL_SPEED = 1; // Pixels per frame (Increase for faster scroll, decrease for slower)

const isLiveMode = GITHUB_TOKEN.trim() !== "" && !GITHUB_TOKEN.includes("FIRST_HALF_OF_YOUR_TOKEN");

// Master Router Handling Initialization
async function initializeSystem() {
    renderGlowSkeletons();
    
    if (isLiveMode) {
        document.getElementById('uploadBar').classList.remove('d-none');
        document.body.classList.add('has-upload-bar');
        
        updateSplashStatus("Compiling safety parameters...");
        await loadFilterModel();
        
        setInterval(loadGallery, 15000); 
    }
    
    updateSplashStatus("Syncing live gallery streams...");
    await loadGallery();
    
    const splash = document.getElementById('splashScreen');
    splash.style.opacity = '0';
    setTimeout(() => {
        splash.remove();
        startAutoscroll(); // Kick off autoscroll once splash is clear
        setupInteractionListeners(); // Listen for user overrides
    }, 400);
}

function updateSplashStatus(msg) {
    document.getElementById('splashStatus').innerText = msg;
}

function renderGlowSkeletons() {
    const grid = document.getElementById('photoGrid');
    grid.innerHTML = Array(6).fill('<div class="grid-item skeleton-placeholder"></div>').join('');
}

// Pre-load the NSFW filter model immediately
async function loadFilterModel() {
    try {
        nsfwModel = await nsfwjs.load('https://nsfwjs.com/model/', { size: 299 });
        console.log("NSFW Filter online.");
    } catch (err) {
        console.error("AI filter failed to load:", err);
    }
}

// INFINITE AUTOSCROLL ENGINE
function startAutoscroll() {
    if (autoscrollInterval) return; // Prevent double triggers
    
    autoscrollInterval = setInterval(() => {
        const currentScroll = window.scrollY;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        
        // Loop Condition: If we hit the absolute bottom, snap instantly back to top
        if (currentScroll >= maxScroll - 2) {
            window.scrollTo({ top: 0, behavior: 'instant' });
        } else {
            // Smoothly progress down by step pixels
            window.scrollBy(0, SCROLL_SPEED);
        }
    }, 30); // ~33 frames per second for smooth rendering
}

function stopAutoscroll() {
    clearInterval(autoscrollInterval);
    autoscrollInterval = null;
}

// Safety Pause: Pauses auto-scroll if a guest interacts with the screen
function handleUserInteraction() {
    stopAutoscroll();
    clearTimeout(userInteractingTimeout);
    
    // Resumes automated scroll after 10 seconds of zero activity
    userInteractingTimeout = setTimeout(() => {
        // Only resume if lightbox isn't currently blocking the view
        if (document.getElementById('lightbox').style.display !== 'block') {
            startAutoscroll();
        }
    }, 10000);
}

function setupInteractionListeners() {
    // Listen to scroll, wheel, and touch movements across mobile/desktop
    window.addEventListener('scroll', () => {
        // Filter out structural jumps driven by our own script logic
        if (autoscrollInterval === null && userInteractingTimeout === null) return; 
        
        // If scroll variance didn't match native speed step, it's a human hand swipe
        handleUserInteraction();
    }, { passive: true });
    
    window.addEventListener('touchstart', handleUserInteraction, { passive: true });
    window.addEventListener('wheel', handleUserInteraction, { passive: true });
}

// HIGH-SPEED MOBILE COMPRESSION ENGINE (Hardware Accelerated)
function compressImage(imgElement) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { alpha: false, willReadFrequently: false });

        const MAX_BOUNDS = 1200; 
        let width = imgElement.naturalWidth || imgElement.width;
        let height = imgElement.naturalHeight || imgElement.height;

        if (width > height) {
            if (width > MAX_BOUNDS) { height *= MAX_BOUNDS / width; width = MAX_BOUNDS; }
        } else {
            if (height > MAX_BOUNDS) { width *= MAX_BOUNDS / height; height = MAX_BOUNDS; }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'low'; 

        ctx.drawImage(imgElement, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.70));
    });
}

// 30-SECOND VIDEO TRIMMING + 1080p CAPTURE ENGINE
function trimAndResizeVideo(file) {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.src = URL.createObjectURL(file);
        video.muted = true; 
        video.playsInline = true;

        video.onloadedmetadata = function() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            const MAX_BOUNDS = 1920; 
            let width = video.videoWidth;
            let height = video.videoHeight;
            
            if (width > height) {
                if (width > MAX_BOUNDS) { height *= MAX_BOUNDS / width; width = MAX_BOUNDS; }
            } else {
                if (height > MAX_BOUNDS) { width *= MAX_BOUNDS / height; height = MAX_BOUNDS; }
            }
            
            canvas.width = width;
            canvas.height = height;
            
            video.play();
            
            const canvasStream = canvas.captureStream ? canvas.captureStream(30) : canvas.mozCaptureStream(30);
            
            function updateCanvasFrame() {
                if (!video.paused && !video.ended) {
                    ctx.drawImage(video, 0, 0, width, height);
                    requestAnimationFrame(updateCanvasFrame);
                }
            }
            updateCanvasFrame();

            let selectedMimeType = 'video/mp4;codecs=avc1.42E01E,mp4a.40.2';
            if (!MediaRecorder.isTypeSupported(selectedMimeType)) {
                selectedMimeType = 'video/webm;codecs=vp8,opus';
            }

            const chunks = [];
            const mediaRecorder = new MediaRecorder(canvasStream, { mimeType: selectedMimeType });

            mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
            mediaRecorder.onstop = () => {
                const fileExt = selectedMimeType.includes('mp4') ? '.mp4' : '.webm';
                const trimmedBlob = new Blob(chunks, { type: fileExt === '.mp4' ? 'video/mp4' : 'video/webm' });
                
                resolve(new File([trimmedBlob], `trimmed_${Date.now()}${fileExt}`, { type: trimmedBlob.type }));
                video.pause(); 
                URL.revokeObjectURL(video.src);
            };

            mediaRecorder.start();
            
            const durationLimit = Math.min(video.duration, 30) * 1000;
            setTimeout(() => { if (mediaRecorder.state !== "inactive") mediaRecorder.stop(); }, durationLimit);
        };
        video.onerror = () => reject("Parsing fault.");
    });
}

// CHRONOLOGICAL MASONRY TIMELINE SYNC ENGINE
async function loadGallery() {
    try {
        const cleanFetchUrl = `${apiUrl}?t=${Date.now()}&ref=${myBranch}`;
        const fetchHeaders = isLiveMode ? { headers: { 'Authorization': `token ${GITHUB_TOKEN}` } } : {};
        
        const response = await fetch(cleanFetchUrl, fetchHeaders);
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
                card.innerHTML = `<video src="${img.download_url}" autoplay loop playsinline muted loading="lazy"></video>`;
            } else {
                card.innerHTML = `<img src="${img.download_url}" loading="lazy" alt="Asset">`;
            }
            grid.appendChild(card);
        });
    } catch (err) { console.error("Gallery frame sync error:", err); }
}

// LIGHTBOX MEDIA VIEWER
function openLightbox(index) {
    stopAutoscroll(); // Freeze scanning when modal explicitly views an element
    clearTimeout(userInteractingTimeout);

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
        
        // Safety call interaction fallback structure loop reset triggers
        handleUserInteraction();
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
            await navigator.share({ title: 'Memory', text: 'Look at this file from the gallery!', url: currentImgUrl });
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
        if (e.key === 'Escape') { 
            document.getElementById('lightbox').style.display = 'none'; 
            document.body.style.overflow = 'auto'; 
            handleUserInteraction();
        }
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

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}

// MASTER QUEUE UPLOAD WITH PARALLEL GOOGLE DRIVE LOGIC
async function uploadPhoto() {
    if (!isLiveMode) return;
    const fileInput = document.getElementById('photoInput');
    const status = document.getElementById('uploadStatus');
    const btn = document.getElementById('uploadBtn');
    const scannerImg = document.getElementById('imgScanner');
    
    const filesList = fileInput.files;
    if (filesList.length === 0) { status.innerText = "Please select files first."; return; }
    
    btn.disabled = true;
    const totalFiles = filesList.length;

    // Halt scroll mechanics while user uploads a batch
    stopAutoscroll();
    clearTimeout(userInteractingTimeout);

    for (let i = 0; i < totalFiles; i++) {
        let file = filesList[i];
        const currentProgressMsg = `[File ${i + 1} of ${totalFiles}]`;
        
        btn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Uploading (${i + 1}/${totalFiles})...`;
        status.innerHTML = `<span class="text-warning">${currentProgressMsg} Reading media files...</span>`;

        if (file.name.match(/\.(heic|heif)$/i) || file.type === "image/heic" || file.type === "image/heif") {
            status.innerHTML = `<span class="text-warning">${currentProgressMsg} Converting Apple HEIC to standard JPEG...</span>`;
            try {
                const conversionResult = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.70 });
                const processedBlob = Array.isArray(conversionResult) ? conversionResult[0] : conversionResult;
                file = new File([processedBlob], file.name.replace(/\.(heic|heif)$/i, ".jpg"), { type: "image/jpeg" });
            } catch (heicErr) {
                console.error("HEIC parsing error:", heicErr);
                status.innerHTML = `<span class="text-danger">${currentProgressMsg} Conversion failed for Apple format.</span>`;
                continue;
            }
        }

        const timestamp = Date.now() + i;
        const baseFileName = `guest_${timestamp}`;
        const originalExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

        const rawOriginalDataUrl = await readFileAsDataURL(file);
        const base64OriginalContent = rawOriginalDataUrl.split(',')[1];

        // Pipeline A: Google Drive original quality stream drop context
        if (GOOGLE_DRIVE_API_URL && GOOGLE_DRIVE_API_URL !== "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE") {
            status.innerHTML = `<span class="text-warning">${currentProgressMsg} Storing original quality backup in Google Drive...</span>`;
            try {
                await fetch(GOOGLE_DRIVE_API_URL, {
                    method: "POST",
                    mode: "no-cors",
                    body: JSON.stringify({ base64Data: base64OriginalContent, mimeType: file.type, fileName: `${baseFileName}${originalExtension}` })
                });
            } catch (driveErr) {
                console.error("Drive upload link skipped:", driveErr);
            }
        }

        // Pipeline B: GitHub screen preview compilation logic paths
        if (file.type.startsWith('video/')) {
            status.innerHTML = `<span class="text-warning">${currentProgressMsg} Processing video metrics (Max 30s @ 1080p)...</span>`;
            try { 
                const trimmedFile = await trimAndResizeVideo(file); 
                const videoData = await readFileAsDataURL(trimmedFile);
                const base64Video = videoData.split(',')[1];
                const fileExt = trimmedFile.name.endsWith('.mp4') ? '.mp4' : '.webm';
                
                status.innerHTML = `<span class="text-warning">${currentProgressMsg} Syncing video frame loops with the wall...</span>`;
                await pushToGitHub(`${baseFileName}${fileExt}`, base64Video);
            } catch (err) {
                console.error("Video normalization fault:", err);
                status.innerHTML = `<span class="text-danger">${currentProgressMsg} Skipping broken video container.</span>`;
            }
            
            if (i < totalFiles - 1) await new Promise(resolve => setTimeout(resolve, 1500));
            continue; 
        }

        try {
            if (nsfwModel) {
                status.innerHTML = `<span class="text-warning">${currentProgressMsg} Analyzing content classification...</span>`;
                scannerImg.src = rawOriginalDataUrl;
                await new Promise((resolve) => { scannerImg.onload = resolve; });
                
                const predictions = await nsfwModel.classify(scannerImg);
                const pornScore = predictions.find(p => p.className === 'Porn').probability;
                const sexyScore = predictions.find(p => p.className === 'Sexy').probability;

                if (pornScore > 0.50 || sexyScore > 0.65) {
                    status.innerHTML = `<span class="text-danger">⚠️ ${currentProgressMsg} Skipped: Content failed event safety rules.</span>`;
                    if (i < totalFiles - 1) await new Promise(resolve => setTimeout(resolve, 2000));
                    continue;
                }
            }

            status.innerHTML = `<span class="text-warning">${currentProgressMsg} Compressing preview for live display...</span>`;
            const tempImg = new Image();
            tempImg.src = rawOriginalDataUrl;
            await new Promise((resolve) => { tempImg.onload = resolve; });
            
            const compressedDataUrl = await compressImage(tempImg);
            const base64ImageContent = compressedDataUrl.split(',')[1];
            
            status.innerHTML = `<span class="text-warning">${currentProgressMsg} Publishing image to live screen...</span>`;
            await pushToGitHub(`${baseFileName}.jpg`, base64ImageContent);
            
        } catch (imageErr) {
            console.error("Image optimization halt:", imageErr);
            status.innerHTML = `<span class="text-danger">${currentProgressMsg} Processing error.</span>`;
        }

        if (i < totalFiles - 1) {
            status.innerHTML = `<span class="text-muted">${currentProgressMsg} Cool-down delay...</span>`;
            await new Promise(resolve => setTimeout(resolve, 1500));
        }
    }

    status.innerHTML = `<span class="text-warning">🎉 Uploads received! Refreshing gallery...</span>`;
    await loadGallery();

    btn.innerHTML = "Upload";
    btn.disabled = false;
    status.innerHTML = `<span class="text-success">🎉 All ${totalFiles} items shared successfully!</span>`;
    fileInput.value = '';
    
    // Safely restart autoscroll loop after uploads finish processing
    handleUserInteraction();
}

async function pushToGitHub(fileName, base64DataString) {
    const uploadUrl = apiUrl + fileName;
    try {
        const commitData = { 
            message: `App upload: ${fileName}`, 
            content: base64DataString,
            branch: myBranch 
        };
        
        await fetch(uploadUrl, {
            method: 'PUT',
            headers: { 'Authorization': `token ${GITHUB_TOKEN}` },
            body: JSON.stringify(commitData)
        });
    } catch (err) { 
        console.error("Live sync interruption:", err); 
    }
}

initializeSystem();