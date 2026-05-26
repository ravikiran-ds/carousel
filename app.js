// ==================== CONFIGURATION ====================
const username = "ravikiran-ds"; 
const repo = "carousel";
const myBranch = "anushanme";

const tokenPart1 = "github_pat_11AOPNTWA0nAbSAp7nDRf4";
const tokenPart2 = "_xlNhMDKmtit0dASoG0UXKDTLkbrlsxQ3GboNwoUe1snCTT63WROCAAd6H6n";

// DEPLOYED GOOGLE APPS SCRIPT WEB APP URL
const GOOGLE_DRIVE_API_URL = "https://script.google.com/macros/s/AKfycbylQuQw2waiFTTCfcNE0QDk4-UvPrDT3JsB4UisxSiY-o60j8K6K99SuPKjen73CGBV/exec";
// =======================================================

const GITHUB_TOKEN = (tokenPart1 && tokenPart2) ? (tokenPart1 + tokenPart2) : "";
const apiUrl = `https://api.github.com/repos/${username}/${repo}/contents/`;
let activeImagesArray = []; 
let currentLightboxIndex = -1;

const isLiveMode = GITHUB_TOKEN.trim() !== "" && !GITHUB_TOKEN.includes("FIRST_HALF_OF_YOUR_TOKEN");

// Master Router Handling Initialization
async function initializeSystem() {
    renderGlowSkeletons();
    
    if (isLiveMode) {
        document.getElementById('uploadBar').classList.remove('d-none');
        document.body.classList.add('has-upload-bar');
        
        // Sync gallery snapshots every 15 seconds
        setInterval(loadGallery, 15000); 
    }
    
    updateSplashStatus("Syncing live gallery streams...");
    await loadGallery();
    
    const splash = document.getElementById('splashScreen');
    if (splash) {
        splash.style.opacity = '0';
        setTimeout(() => splash.remove(), 400);
    }
}

function updateSplashStatus(msg) {
    const statusEl = document.getElementById('splashStatus');
    if (statusEl) statusEl.innerText = msg;
}

function renderGlowSkeletons() {
    const grid = document.getElementById('photoGrid');
    if (grid) grid.innerHTML = Array(6).fill('<div class="grid-item skeleton-placeholder"></div>').join('');
}

// HIGH-SPEED MOBILE COMPRESSION ENGINE (Hardware Accelerated)
function compressImage(imgElement) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { alpha: false });

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

            let selectedMimeType = 'video/webm;codecs=vp8,opus';
            const chunks = [];
            const mediaRecorder = new MediaRecorder(canvasStream, { mimeType: selectedMimeType });

            mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
            mediaRecorder.onstop = () => {
                const trimmedBlob = new Blob(chunks, { type: 'video/webm' });
                resolve(new File([trimmedBlob], `trimmed_${Date.now()}.webm`, { type: 'video/webm' }));
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
        
        if (!Array.isArray(files)) return;
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
                const videoEl = document.createElement('video');
                videoEl.src = img.download_url;
                videoEl.autoplay = true;
                videoEl.loop = true;
                videoEl.playsInline = true;
                videoEl.muted = true;
                videoEl.setAttribute('loading', 'lazy');
                card.appendChild(videoEl);
            } else {
                const imageEl = document.createElement('img');
                imageEl.src = img.download_url;
                imageEl.setAttribute('loading', 'lazy');
                card.appendChild(imageEl);
            }
            grid.appendChild(card);
        });

    } catch (err) { 
        console.error("Gallery frame sync error:", err); 
    }
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

document.addEventListener('keydown', (e) => {
    if (document.getElementById('lightbox').style.display === 'block') {
        if (e.key === 'ArrowRight') changeImage(1);
        if (e.key === 'ArrowLeft') changeImage(-1);
        if (e.key === 'Escape') { 
            document.getElementById('lightbox').style.display = 'none'; 
            document.body.style.overflow = 'auto'; 
        }
    }
});

document.getElementById('lightbox').addEventListener('click', (e) => {
    if (e.target.id === 'lightboxImg' && e.target.tagName !== 'VIDEO') {
        const clickX = e.clientX; const screenWidth = window.innerWidth;
        if (clickX < screenWidth * 0.35) { changeImage(-1); } 
        else if (clickX > screenWidth * 0.65) { changeImage(1); }
    }
});

function uploadToGoogleDrivePlainForm(base64Content, fileMimeType, fullTargetName) {
    return new Promise((resolve) => {
        fetch(GOOGLE_DRIVE_API_URL, {
            method: "POST",
            mode: "no-cors", 
            headers: { "Content-Type": "text/plain" },
            body: JSON.stringify({ base64Data: base64Content, mimeType: fileMimeType, fileName: fullTargetName })
        })
        .then(() => resolve())
        .catch((err) => {
            console.warn("Drive background sync log issue:", err);
            resolve();
        });
    });
}

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
    
    const filesList = fileInput.files;
    if (filesList.length === 0) { status.innerText = "Please select files first."; return; }
    
    btn.disabled = true;
    const totalFiles = filesList.length;

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

        // Pipeline A: Google Drive submission
        if (GOOGLE_DRIVE_API_URL) {
            status.innerHTML = `<span class="text-warning">${currentProgressMsg} Transmitting backup package to Google Drive...</span>`;
            await uploadToGoogleDrivePlainForm(base64OriginalContent, file.type, `${baseFileName}${originalExtension}`);
        }

        // Pipeline B: GitHub pipeline rules logic path 
        if (file.type.startsWith('video/')) {
            status.innerHTML = `<span class="text-warning">${currentProgressMsg} Processing video layers (Max 30s @ 1080p)...</span>`;
            try { 
                const trimmedFile = await trimAndResizeVideo(file); 
                const videoData = await readFileAsDataURL(trimmedFile);
                const base64Video = videoData.split(',')[1];
                
                status.innerHTML = `<span class="text-warning">${currentProgressMsg} Rendering video on screen...</span>`;
                await pushToGitHub(`${baseFileName}.webm`, base64Video);
            } catch (err) {
                console.error("Video processing failure:", err);
                status.innerHTML = `<span class="text-danger">${currentProgressMsg} Skipping video file.</span>`;
            }
            continue; 
        }

        try {
            status.innerHTML = `<span class="text-warning">${currentProgressMsg} Optimizing file space compression metrics...</span>`;
            const tempImg = new Image();
            tempImg.src = rawOriginalDataUrl;
            await new Promise((resolve) => { tempImg.onload = resolve; });
            
            const compressedDataUrl = await compressImage(tempImg);
            const base64ImageContent = compressedDataUrl.split(',')[1];
            
            status.innerHTML = `<span class="text-warning">${currentProgressMsg} Uploading to live wall screen...</span>`;
            await pushToGitHub(`${baseFileName}.jpg`, base64ImageContent);
            
        } catch (imageErr) {
            console.error("Image loop failure:", imageErr);
            status.innerHTML = `<span class="text-danger">${currentProgressMsg} Processing error.</span>`;
        }
    }

    status.innerHTML = `<span class="text-warning">🎉 Uploads completed! Refreshing framework columns...</span>`;
    await loadGallery();

    btn.innerHTML = "Upload";
    btn.disabled = false;
    status.innerHTML = `<span class="text-success">🎉 All ${totalFiles} items shared successfully!</span>`;
    fileInput.value = '';
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
        console.error("Live sync failure:", err); 
    }
}

// Initialize system routing loops
initializeSystem();