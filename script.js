import Cropper from 'https://unpkg.com/cropperjs@1.6.2/dist/cropper.esm.js';

// Elements
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const selectBtn = document.getElementById('select-btn');
const uploadPlaceholder = document.getElementById('upload-placeholder');
const previewContainer = document.getElementById('preview-container');
const imagePreview = document.getElementById('image-preview');
const removeBtn = document.getElementById('remove-btn');

const inputWidth = document.getElementById('input-width');
const inputHeight = document.getElementById('input-height');
const checkAspect = document.getElementById('check-aspect');
const selectFormat = document.getElementById('select-format');
const inputQuality = document.getElementById('input-quality');
const qualityLabel = document.getElementById('quality-label');
const checkMetadata = document.getElementById('check-metadata');

const sizeOriginal = document.getElementById('size-original');
const sizeEstimated = document.getElementById('size-estimated');

const settingsSection = document.getElementById('settings-section');
const heroGrid = document.querySelector('.hero-grid');

const resizeBtn = document.getElementById('resize-btn');
const downloadBtn = document.getElementById('download-btn');

const cropInitBtn = document.getElementById('crop-init-btn');
const cropActions = document.getElementById('crop-actions');
const cropConfirmBtn = document.getElementById('crop-confirm-btn');
const cropCancelBtn = document.getElementById('crop-cancel-btn');

let originalImage = null;
let originalFile = null;
let aspectRatio = 1;
let pendingSettings = null;
let cropper = null;

// Safe Event Listener Helper
function safeAddEventListener(id, event, callback) {
    const el = document.getElementById(id);
    if (el) {
        el.addEventListener(event, callback);
    }
    return el;
}

// Trigger file select
if (selectBtn) {
    selectBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.click();
    });
}

    if (dropZone) {
        dropZone.addEventListener('click', () => {
            if (!originalImage) fileInput.click();
        });

        // Drag and Drop
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
            if (e.dataTransfer.files.length > 0) {
                handleFile(e.dataTransfer.files[0]);
            }
        });
    }

    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFile(e.target.files[0]);
            }
        });
    }

    function handleFile(file) {
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file.');
            return;
        }

        originalFile = file;
        if (downloadBtn) downloadBtn.disabled = true;
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                originalImage = img;
                aspectRatio = img.width / img.height;
                
                // Set initial values
                if (inputWidth) inputWidth.value = img.width;
                if (inputHeight) inputHeight.value = img.height;
                if (sizeOriginal) sizeOriginal.textContent = formatBytes(file.size);
                
                // Show preview
                if (imagePreview) imagePreview.src = e.target.result;
                if (uploadPlaceholder) uploadPlaceholder.style.display = 'none';
                if (previewContainer) previewContainer.style.display = 'flex';
                
                if (settingsSection) settingsSection.classList.remove('hidden');
                if (heroGrid) heroGrid.classList.remove('single-col');
                
                if (downloadBtn) downloadBtn.disabled = true;
                applyPendingSettings();
                updateEstimatedSize();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    if (removeBtn) {
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            destroyCropper();
            originalImage = null;
            originalFile = null;
            if (fileInput) fileInput.value = '';
            if (uploadPlaceholder) uploadPlaceholder.style.display = 'block';
            if (previewContainer) previewContainer.style.display = 'none';
            if (settingsSection) settingsSection.classList.add('hidden');
            if (heroGrid) heroGrid.classList.add('single-col');
            if (sizeOriginal) sizeOriginal.textContent = '0 KB';
            if (sizeEstimated) sizeEstimated.textContent = '0 KB';
        });
    }

    // Crop Logic
    if (cropInitBtn) {
        cropInitBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!originalImage) return;

            cropper = new Cropper(imagePreview, {
                aspectRatio: NaN,
                viewMode: 1,
                autoCropArea: 0.8,
                ready() {
                    cropInitBtn.style.display = 'none';
                    cropActions.style.display = 'flex';
                }
            });
        });
    }

    if (cropConfirmBtn) {
        cropConfirmBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!cropper) return;

            const croppedCanvas = cropper.getCroppedCanvas();
            const croppedDataUrl = croppedCanvas.toDataURL(originalFile.type);
            
            const img = new Image();
            img.onload = () => {
                originalImage = img;
                aspectRatio = img.width / img.height;
                if (inputWidth) inputWidth.value = img.width;
                if (inputHeight) inputHeight.value = img.height;
                if (imagePreview) imagePreview.src = croppedDataUrl;
                
                destroyCropper();
                updateEstimatedSize();
            };
            img.src = croppedDataUrl;
        });
    }

    if (cropCancelBtn) {
        cropCancelBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            destroyCropper();
        });
    }

    function destroyCropper() {
        if (cropper) {
            cropper.destroy();
            cropper = null;
        }
        if (cropInitBtn) cropInitBtn.style.display = 'block';
        if (cropActions) cropActions.style.display = 'none';
    }

    // Controls Logic
    if (inputWidth) {
        inputWidth.addEventListener('input', () => {
            if (checkAspect && checkAspect.checked && aspectRatio) {
                if (inputHeight) inputHeight.value = Math.round(inputWidth.value / aspectRatio);
            }
            if (downloadBtn) downloadBtn.disabled = true;
            updateEstimatedSize();
        });
    }

    if (inputHeight) {
        inputHeight.addEventListener('input', () => {
            if (checkAspect && checkAspect.checked && aspectRatio) {
                if (inputWidth) inputWidth.value = Math.round(inputHeight.value * aspectRatio);
            }
            if (downloadBtn) downloadBtn.disabled = true;
            updateEstimatedSize();
        });
    }

    if (inputQuality) {
        inputQuality.addEventListener('input', () => {
            if (qualityLabel) qualityLabel.textContent = `${inputQuality.value}%`;
            if (downloadBtn) downloadBtn.disabled = true;
            updateEstimatedSize();
        });
    }

    if (selectFormat) {
        selectFormat.addEventListener('change', () => {
            if (downloadBtn) downloadBtn.disabled = true;
            updateEstimatedSize();
        });
    }

    // Processing Logic
    let debounceTimer;
    async function updateEstimatedSize() {
        if (!originalImage || !inputWidth || !inputHeight || !selectFormat || !inputQuality || !sizeEstimated) return;

        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            const w = parseInt(inputWidth.value) || originalImage.width;
            const h = parseInt(inputHeight.value) || originalImage.height;
            
            canvas.width = w;
            canvas.height = h;
            ctx.drawImage(originalImage, 0, 0, w, h);
            
            const format = selectFormat.value;
            const quality = parseInt(inputQuality.value) / 100;
            
            canvas.toBlob((blob) => {
                if (blob) {
                    sizeEstimated.textContent = formatBytes(blob.size);
                }
            }, format, quality);
        }, 150);
    }

    if (resizeBtn) {
        resizeBtn.addEventListener('click', () => {
            if (!originalImage) {
                alert('Please upload an image first.');
                return;
            }
            updateEstimatedSize();
            if (downloadBtn) downloadBtn.disabled = false;
            alert('Settings applied! You can now download your image.');
        });
    }

    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            if (!originalImage) {
                alert('Please upload an image first.');
                return;
            }

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            let w = parseInt(inputWidth.value);
            let h = parseInt(inputHeight.value);

            if (isNaN(w) || w <= 0) w = originalImage.width;
            if (isNaN(h) || h <= 0) h = originalImage.height;
            
            canvas.width = w;
            canvas.height = h;
            ctx.drawImage(originalImage, 0, 0, w, h);
            
            const format = selectFormat.value;
            const quality = parseInt(inputQuality.value) / 100;
            const extension = format.split('/')[1].replace('jpeg', 'jpg');

            try {
                canvas.toBlob((blob) => {
                    if (!blob) {
                        alert('Failed to generate image. Please try a different format.');
                        return;
                    }
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `pixelresize-${Date.now()}.${extension}`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    
                    // Use a small timeout before revoking to ensure the browser handles the click
                    setTimeout(() => URL.revokeObjectURL(url), 100);
                }, format, quality);
            } catch (err) {
                console.error('Download error:', err);
                alert('An error occurred while generating the image.');
            }
        });
    }

    function formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    function applyPendingSettings() {
        if (!pendingSettings) return;
        if (pendingSettings.format && selectFormat) selectFormat.value = pendingSettings.format;
        if (pendingSettings.quality && inputQuality) {
            inputQuality.value = pendingSettings.quality;
            if (qualityLabel) qualityLabel.textContent = `${pendingSettings.quality}%`;
        }
        pendingSettings = null;
    }

    // Mobile Menu Toggle
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const navLinks = document.getElementById('nav-links');

    if (mobileMenuToggle && navLinks) {
        mobileMenuToggle.addEventListener('click', () => {
            mobileMenuToggle.classList.toggle('active');
            navLinks.classList.toggle('active');
        });

        // Close menu when clicking a link
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenuToggle.classList.remove('active');
                navLinks.classList.remove('active');
            });
        });
    }

    // Page Load Behavior: Force start from the top
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }

    const scrollToTop = () => {
        window.scrollTo(0, 0);
        // Fallback for some browsers
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
    };

    // Initial scroll attempt
    scrollToTop();

    // Scroll when fully loaded
    window.addEventListener('load', scrollToTop);

    // Scroll when navigating back (bfcache)
    window.addEventListener('pageshow', (event) => {
        scrollToTop();
    });

    // Navigation Bar Behavior
    document.querySelectorAll('.nav-links a').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            // Close mobile menu if open
            if (navLinks) navLinks.classList.remove('active');
            if (mobileMenuToggle) mobileMenuToggle.classList.remove('active');

            if (this.id === 'home-link' || this.id === 'tools-link') {
                // Trigger popunder ad on Home and Tools links
                triggerPopunder();
                
                if (this.id === 'home-link') {
                    e.preventDefault();
                    window.scrollTo({
                        top: 0,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    function triggerPopunder() {
        const scriptUrl = "https://pl28859112.effectivegatecpm.com/4f/18/7c/4f187c00a745c0a4440f2e3ee94a3621.js";
        
        // Remove existing script to avoid duplication and allow re-execution if needed
        const existingScript = document.querySelector(`script[src="${scriptUrl}"]`);
        if (existingScript) {
            existingScript.remove();
        }

        const script = document.createElement('script');
        script.src = scriptUrl;
        script.async = true;
        document.body.appendChild(script);
    }

    // Tool card behavior: Scroll to #upload and trigger upload
    document.querySelectorAll('.tool-card a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            const h3 = link.querySelector('h3');
            if (!h3) return;
            const title = h3.textContent;
            
            // Set pending settings based on tool
            if (title.includes('PNG to JPG') || title.includes('WebP to JPG')) {
                pendingSettings = { format: 'image/jpeg' };
            } else if (title.includes('JPG to PNG')) {
                pendingSettings = { format: 'image/png' };
            } else if (title.includes('JPG to WebP')) {
                pendingSettings = { format: 'image/webp' };
            } else if (title.includes('PNG to AVIF')) {
                pendingSettings = { format: 'image/avif' };
            } else if (title.includes('PNG to BMP')) {
                pendingSettings = { format: 'image/bmp' };
            } else if (title === 'Image Compressor') {
                pendingSettings = { quality: 60 };
            } else if (title === 'Metadata Remover') {
                if (checkMetadata) checkMetadata.checked = true;
            } else {
                pendingSettings = null;
            }
            
            // Smoothly scroll to #upload section
            const uploadSection = document.getElementById('upload');
            if (uploadSection) {
                uploadSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }

            // If no image is uploaded, trigger upload box
            if (!originalImage) {
                setTimeout(() => {
                    if (fileInput) fileInput.click();
                }, 600); // Wait for scroll to finish mostly
            } else {
                // If image is already uploaded, apply settings immediately
                applyPendingSettings();
                updateEstimatedSize();
                
                // If crop tool, trigger crop
                if (title === 'Image Crop Tool') {
                    if (cropInitBtn) cropInitBtn.click();
                }
            }
        });
    });

