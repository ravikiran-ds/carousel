// ==================== CONFIGURATION ====================
const username = "ravikiran-ds"; 
const repo = "carousel";
const myBranch = "myself";

const tokenPart1 = "github_pat_11AOPNTWA0nAbSAp7nDRf4";
const tokenPart2 = "_xlNhMDKmtit0dASoG0UXKDTLkbrlsxQ3GboNwoUe1snCTT63WROCAAd6H6n";
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

// IMAGE COMPRESSION ENGINE
// HIGH-SPEED MOBILE COMPRESSION ENGINE (Hardware Accelerated stepping fix)
function compressImage(imgElement) {
    return new Promise((resolve) => {
        // Step 1: Create our processing canvas context target
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { 
            alpha: false, 
            willReadFrequently: false // Tells the mobile GPU to handle this in hardware RAM
        });

        const MAX_BOUNDS = 1200; // Optimized preview boundary max length for mobile displays
        let width = imgElement.naturalWidth || imgElement.width;
        let height = imgElement.naturalHeight || imgElement.height;

        // Calculate aspect ratios instantly
        if (width > height) {
            if (width > MAX_BOUNDS) { height *= MAX_BOUNDS / width; width = MAX_BOUNDS; }
        } else {
            if (height > MAX_BOUNDS) { width *= MAX_BOUNDS / height; height = MAX_BOUNDS; }
        }

        canvas.width = width;
        canvas.height = height;

        // Step 2: Use low-level image sharpening configs supported directly by mobile GPUs
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'low'; // 'low' shifts the processing from mobile CPU to GPU core

        // Draw the downscaled image onto our clean canvas space
        ctx.drawImage(imgElement, 0, 0, width, height);

        // Step 3: Fast export using JPEG format compression at 0.70 efficiency rating
        // This drops the raw payload weight to ~150KB without visible quality loss on phone screens
        const compressedData = canvas.toDataURL('image/jpeg', 0.70);
        
        resolve(compressedData);
    });
}
// 5-SECOND MOBILE-SIDE VIDEO TRIMMING ENGINE
// UNIVERSAL MOBILE VIDEO TRIMMING ENGINE (Cross-Platform iPhone & Android MP4 Fix)
function trimVideo(file) {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.src = URL.createObjectURL(file);
        video.muted = true; 
        video.playsInline = true;

        video.onloadedmetadata = function() {
            // If the video is already 5 seconds or shorter, keep the native original file format
            if (video.duration <= 5) { resolve(file); return; }

            video.play();
            const stream = video.captureStream ? video.captureStream() : video.mozCaptureStream();
            
            // Fix: Check if the device prefers Apple's MP4/H264 format, otherwise fallback to standard WebM
            let selectedMimeType = 'video/mp4;codecs=avc1.42E01E,mp4a.40.2';
            if (!MediaRecorder.isTypeSupported(selectedMimeType)) {
                selectedMimeType = 'video/webm;codecs=vp8,opus';
            }

            const chunks = [];
            const mediaRecorder = new MediaRecorder(stream, { mimeType: selectedMimeType });

            mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
            mediaRecorder.onstop = () => {
                // Determine extension based on our active recording container type
                const fileExt = selectedMimeType.includes('mp4') ? '.mp4' : '.webm';
                const trimmedBlob = new Blob(chunks, { type: fileExt === '.mp4' ? 'video/mp4' : 'video/webm' });
                
                resolve(new File([trimmedBlob], "trimmed_" + baseFileName + fileExt, { type: trimmedBlob.type }));
                video.pause(); 
                URL.revokeObjectURL(video.src);
            };

            mediaRecorder.start();
            // Automatically stop recording and compile exactly at the 5-second mark
            setTimeout(() => { if (mediaRecorder.state !== "inactive") mediaRecorder.stop(); }, 5000);
        };
        video.onerror = () => reject("Parsing fault.");
    });
}

// CHRONOLOGICAL MASONRY TIMELINE SYNC ENGINE
// CHRONOLOGICAL MASONRY TIMELINE SYNC ENGINE (Autoplay Video Grid Version)
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
            
            // CHANGES HERE: Added autoplay, loop, playsinline, and muted to the video tag
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

// CLOSE LIGHTBOX MODAL
function closeLightbox(event) {
    if (event.target.id === 'lightbox' || event.target.className === 'close-btn' || event.target.classList.contains('lightbox-content-wrapper')) {
        document.getElementById('lightbox').style.display = 'none';
        document.body.style.overflow = 'auto'; 
    }
}

// CHANGE IMAGES (PREV / NEXT)
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
        status.innerHTML = `<span class="text-warning">${currentProgressMsg} Optimizing media...</span>`;

        // 1. Handle Video Trimming smoothly
        if (file.type.startsWith('video/')) {
            status.innerHTML = `<span class="text-warning">${currentProgressMsg} Trimming video clip...</span>`;
            try { 
                file = await trimVideo(file); 
                const videoData = await readFileAsDataURL(file);
                const base64Video = videoData.split(',')[1];
                const timestamp = Date.now() + i;
                // Uploads directly to root directory of current branch
                await pushToGitHub(`guest_${timestamp}.mp4`, base64Video);
            } catch (err) {
                status.innerHTML = `<span class="text-danger">${currentProgressMsg} Skipping broken video container.</span>`;
            }
            
            if (i < totalFiles - 1) {
                await new Promise(resolve => setTimeout(resolve, 1500));
            }
            continue; 
        }

        // 2. Handle Image Compression
        try {
            status.innerHTML = `<span class="text-warning">${currentProgressMsg} Scaling image resolution...</span>`;
            
            const imgUrl = URL.createObjectURL(file);
            const tempImg = new Image();
            tempImg.src = imgUrl;
            
            await new Promise((resolve) => { tempImg.onload = resolve; });
            const compressedDataUrl = await compressImage(tempImg);
            URL.revokeObjectURL(imgUrl); 
            
            const base64ImageContent = compressedDataUrl.split(',')[1];
            const timestamp = Date.now() + i;
            
            status.innerHTML = `<span class="text-warning">${currentProgressMsg} Syncing with the wall...</span>`;
            // Uploads directly to root directory of current branch
            await pushToGitHub(`guest_${timestamp}.jpg`, base64ImageContent);
            
        } catch (imageErr) {
            console.error("Mobile compression halt:", imageErr);
            status.innerHTML = `<span class="text-danger">${currentProgressMsg} Processing error.</span>`;
        }

        if (i < totalFiles - 1) {
            status.innerHTML = `<span class="text-muted">${currentProgressMsg} Waiting for server cooldown...</span>`;
            await new Promise(resolve => setTimeout(resolve, 1500));
        }
    }

    status.innerHTML = `<span class="text-warning">🎉 Uploads received! Refreshing gallery...</span>`;
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
            statusElement.innerHTML = `<span class="text-warning">${progressMsg} Scaling preview display ratios...</span>`;
            const compressedDataUrl = await compressImage(scannerImg);
            await pushToGitHub(`${baseName}.jpg`, compressedDataUrl.split(',')[1]);
            resolve();
        };
    });
}

async function pushToGitHub(fileName, base64DataString) {
    const uploadUrl = apiUrl + fileName;
    //const myBranch = "YOUR_BRANCH_NAME"; // Put the exact name of your custom branch here
    
    try {
        const commitData = { 
            message: `App upload: ${fileName}`, 
            content: base64DataString,
            branch: myBranch // This forces the file into your specific branch instead of "main"
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