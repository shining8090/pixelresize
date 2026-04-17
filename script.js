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
const summaryFormat = document.getElementById('summary-format');
const summaryQuality = document.getElementById('summary-quality');

const settingsSection = document.getElementById('settings-section');
const heroGrid = document.querySelector('.hero-grid');

const resizeBtn = document.getElementById('resize-btn');
const downloadBtn = document.getElementById('download-btn');

const toolTabs = document.getElementById('tool-tabs');
const toolPanes = document.querySelectorAll('.tool-pane');
const tabButtons = document.querySelectorAll('.tab-btn');

const errorMessage = document.getElementById('error-message');

// User-friendly error display
function showError(message) {
    if (errorMessage) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');
        // Auto-hide after 5 seconds
        setTimeout(() => {
            errorMessage.classList.add('hidden');
        }, 5000);
        
        // Scroll to error if not visible
        errorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
        alert(message);
    }
}

const cropInitBtn = document.getElementById('crop-init-btn');
const cropActions = document.getElementById('crop-actions');
const cropConfirmBtn = document.getElementById('crop-confirm-btn');
const cropCancelBtn = document.getElementById('crop-cancel-btn');

let originalImage = null;
let originalFile = null;
let aspectRatio = 1;
let pendingSettings = null;
let cropper = null;
let hasActiveSession = false;
let pendingToolClick = null;

const modal = document.getElementById("toolSwitchModal");
const continueBtn = document.getElementById("continueBtn");
const confirmBtn = document.getElementById("confirmSwitchBtn");

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
    dropZone.addEventListener('click', (e) => {
        if (e.target === selectBtn) return; // prevent conflict with button
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

    // Existing handleFile function...
    function handleFile(file) {
        if (!file) return;
        
        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/bmp', 'image/gif'];
        if (!validTypes.includes(file.type)) {
            showError('Unsupported file format. Please upload a JPG, PNG, WebP, AVIF, or BMP image.');
            return;
        }

        // Validate file size (e.g., 50MB limit)
        const maxSize = 50 * 1024 * 1024;
        if (file.size > maxSize) {
            showError('File is too large. Please upload an image smaller than 50MB.');
            return;
        }

        originalFile = file;
        if (downloadBtn) downloadBtn.disabled = true;
        const reader = new FileReader();
        
        reader.onerror = () => {
            showError('Failed to read the file. Please try again.');
        };

        reader.onload = (e) => {
            const img = new Image();
            
            img.onerror = () => {
                showError('Failed to load the image. The file might be corrupted.');
            };

            img.onload = () => {
                try {
                    originalImage = img;
                    hasActiveSession = true;
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
                    
                    // Clear any previous errors
                    if (errorMessage) errorMessage.classList.add('hidden');
                } catch (err) {
                    console.error('Error handling image load:', err);
                    showError('An unexpected error occurred while processing the image.');
                }
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
            hasActiveSession = false;
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
            updateSummary();
        });
    }

    if (inputHeight) {
        inputHeight.addEventListener('input', () => {
            if (checkAspect && checkAspect.checked && aspectRatio) {
                if (inputWidth) inputWidth.value = Math.round(inputHeight.value * aspectRatio);
            }
            if (downloadBtn) downloadBtn.disabled = true;
            updateEstimatedSize();
            updateSummary();
        });
    }

    if (inputQuality) {
        inputQuality.addEventListener('input', () => {
            if (qualityLabel) qualityLabel.textContent = `${inputQuality.value}%`;
            if (downloadBtn) downloadBtn.disabled = true;
            updateEstimatedSize();
            updateSummary();
        });
    }

    if (checkMetadata) {
        checkMetadata.addEventListener('change', () => {
            if (downloadBtn) downloadBtn.disabled = true;
            updateEstimatedSize();
            updateSummary();
        });
    }

    if (selectFormat) {
        selectFormat.addEventListener('change', () => {
            const format = selectFormat.value;
            const qualityGroup = inputQuality ? inputQuality.closest('.control-group') : null;
            
            // Update summary format display
            if (summaryFormat) {
                summaryFormat.textContent = format.split('/')[1].toUpperCase().replace('JPEG', 'JPG');
            }

            if (qualityGroup) {
                const label = qualityGroup.querySelector('label');
                const activeTab = document.querySelector('.tab-btn.active')?.dataset.tab;
                
                if (format === 'image/jpeg' || format === 'image/webp' || format === 'image/avif' || activeTab === 'compress') {
                    qualityGroup.style.display = 'block';
                    if (label) {
                        const formatName = format.split('/')[1].toUpperCase().replace('JPEG', 'JPG');
                        label.textContent = `${formatName} Quality`;
                    }
                } else {
                    qualityGroup.style.display = 'none';
                }
            }
            
            if (downloadBtn) downloadBtn.disabled = true;
            updateEstimatedSize();
            updateSummary();
        });
    }

    // Processing Logic
    let debounceTimer;
    async function updateEstimatedSize() {
        if (!originalImage || !inputQuality || !sizeEstimated) return;

        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            const w = (inputWidth && parseInt(inputWidth.value)) || originalImage.width;
            const h = (inputHeight && parseInt(inputHeight.value)) || originalImage.height;
            
            canvas.width = w;
            canvas.height = h;
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(originalImage, 0, 0, w, h);
            
            const format = (selectFormat && selectFormat.value) || 'image/jpeg';
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
                showError('Please upload an image first.');
                return;
            }
            try {
                updateEstimatedSize();
                if (downloadBtn) downloadBtn.disabled = false;
                // Success feedback could be a toast, but for now let's just enable download
            } catch (err) {
                console.error('Resize error:', err);
                showError('Failed to apply changes. Please check your settings.');
            }
        });
    }

    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            if (!originalImage) {
                showError('Please upload an image first.');
                return;
            }

            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                let w = (inputWidth && parseInt(inputWidth.value)) || originalImage.width;
                let h = (inputHeight && parseInt(inputHeight.value)) || originalImage.height;

                if (isNaN(w) || w <= 0) w = originalImage.width;
                if (isNaN(h) || h <= 0) h = originalImage.height;
                
                canvas.width = w;
                canvas.height = h;
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(originalImage, 0, 0, w, h);
                
                const format = (selectFormat && selectFormat.value) || 'image/jpeg';
                const quality = (inputQuality && parseInt(inputQuality.value) / 100) || 0.85;
                const extension = format.split('/')[1].replace('jpeg', 'jpg');

                canvas.toBlob((blob) => {
                    if (!blob) {
                        showError('Failed to generate image. Please try a different format or quality setting.');
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
                showError('An error occurred while generating the image. Your browser might not support this format.');
            }
        });
    }

    // Transformation Buttons
    const rotateBtn = document.getElementById('rotate-btn');
    const rotateLeftBtn = document.getElementById('rotate-left-btn');
    const flipHBtn = document.getElementById('flip-h-btn');
    const flipVBtn = document.getElementById('flip-v-btn');
    const base64Btn = document.getElementById('base64-btn');

    if (rotateLeftBtn) {
        rotateLeftBtn.addEventListener('click', () => {
            if (!originalImage) return;
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = originalImage.height;
            canvas.height = originalImage.width;
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(-Math.PI / 2);
            ctx.drawImage(originalImage, -originalImage.width / 2, -originalImage.height / 2);
            updateOriginalImage(canvas.toDataURL(originalFile ? originalFile.type : 'image/png'));
        });
    }

    if (rotateBtn) {
        rotateBtn.addEventListener('click', () => {
            if (!originalImage) return;
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = originalImage.height;
            canvas.height = originalImage.width;
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(Math.PI / 2);
            ctx.drawImage(originalImage, -originalImage.width / 2, -originalImage.height / 2);
            updateOriginalImage(canvas.toDataURL(originalFile ? originalFile.type : 'image/png'));
        });
    }

    if (flipHBtn) {
        flipHBtn.addEventListener('click', () => {
            if (!originalImage) return;
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = originalImage.width;
            canvas.height = originalImage.height;
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(originalImage, 0, 0);
            updateOriginalImage(canvas.toDataURL(originalFile ? originalFile.type : 'image/png'));
        });
    }

    if (flipVBtn) {
        flipVBtn.addEventListener('click', () => {
            if (!originalImage) return;
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = originalImage.width;
            canvas.height = originalImage.height;
            ctx.translate(0, canvas.height);
            ctx.scale(1, -1);
            ctx.drawImage(originalImage, 0, 0);
            updateOriginalImage(canvas.toDataURL(originalFile ? originalFile.type : 'image/png'));
        });
    }

    if (base64Btn) {
        base64Btn.addEventListener('click', () => {
            if (!originalImage) return;
            
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                let w = (inputWidth && parseInt(inputWidth.value)) || originalImage.width;
                let h = (inputHeight && parseInt(inputHeight.value)) || originalImage.height;

                if (isNaN(w) || w <= 0) w = originalImage.width;
                if (isNaN(h) || h <= 0) h = originalImage.height;
                
                canvas.width = w;
                canvas.height = h;
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(originalImage, 0, 0, w, h);
                
                const format = (selectFormat && selectFormat.value) || 'image/jpeg';
                const quality = (inputQuality && parseInt(inputQuality.value) / 100) || 0.85;
                
                const base64 = canvas.toDataURL(format, quality);
                
                navigator.clipboard.writeText(base64).then(() => {
                    const originalText = base64Btn.textContent;
                    base64Btn.textContent = 'Copied!';
                    setTimeout(() => base64Btn.textContent = originalText, 2000);
                }).catch((err) => {
                    console.error('Clipboard error:', err);
                    showError('Failed to copy Base64 to clipboard. Your browser might not support this feature.');
                });
            } catch (err) {
                console.error('Base64 error:', err);
                showError('An error occurred while generating the Base64 string.');
            }
        });
    }

    function updateOriginalImage(dataUrl) {
        const img = new Image();
        img.onload = () => {
            originalImage = img;
            aspectRatio = img.width / img.height;
            if (imagePreview) imagePreview.src = dataUrl;
            if (inputWidth) inputWidth.value = img.width;
            if (inputHeight) inputHeight.value = img.height;
            if (cropper) {
                cropper.replace(dataUrl);
            }
            updateEstimatedSize();
        };
        img.src = dataUrl;
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
        if (pendingSettings.format && selectFormat) {
            selectFormat.value = pendingSettings.format;
            // Trigger change event to update quality slider visibility
            selectFormat.dispatchEvent(new Event('change'));
        }
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
        // Create backdrop if it doesn't exist
        let backdrop = document.getElementById('menu-backdrop');
        if (!backdrop) {
            backdrop = document.createElement('div');
            backdrop.id = 'menu-backdrop';
            backdrop.className = 'menu-backdrop';
            document.body.appendChild(backdrop);
        }

        const toggleMenu = (forceClose = false) => {
            const isOpen = forceClose ? true : mobileMenuToggle.classList.contains('open');
            if (isOpen || forceClose) {
                mobileMenuToggle.classList.remove('open');
                navLinks.classList.remove('active');
                backdrop.classList.remove('active');
                document.body.style.overflow = '';
                mobileMenuToggle.setAttribute('aria-expanded', 'false');
            } else {
                mobileMenuToggle.classList.add('open');
                navLinks.classList.add('active');
                backdrop.classList.add('active');
                document.body.style.overflow = 'hidden';
                mobileMenuToggle.setAttribute('aria-expanded', 'true');
            }
        };

        mobileMenuToggle.addEventListener('click', () => toggleMenu());
        backdrop.addEventListener('click', () => toggleMenu(true));

        // Close menu when clicking a link
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => toggleMenu(true));
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
            if (mobileMenuToggle) mobileMenuToggle.classList.remove('open');

            if (this.id === 'home-link') {
                e.preventDefault();
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            }
        });
    });


    // Tool card behavior: Scroll to #upload and trigger uploader
    document.querySelectorAll('.tool-card a').forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            
            // Check if it's a tool link with params
            if (href && href.startsWith('/?tool=')) {
                e.preventDefault();
                
                // Parse URL to handle it internally without reload if on home page
                const url = new URL(href, window.location.origin);
                const tool = url.searchParams.get('tool');
                const format = url.searchParams.get('format');
                const preset = url.searchParams.get('preset');
                
                // Track state for external tool links
                if (hasActiveSession) {
                    pendingToolClick = { tool, format, preset, element: link };
                    if (modal) modal.classList.add("active");
                } else {
                    applyToolRequest(tool, format, preset);
                }
                
                // Push state to browser history without reloading
                window.history.pushState({}, '', href);
                return;
            }

            // Fallback for other external links
            if (href && !href.startsWith('#') && href !== '/') return;

            e.preventDefault();
            
            if (hasActiveSession) {
                pendingToolClick = { element: link };
                if (modal) modal.classList.add("active");
            } else {
                handleToolClick(link);
            }
        });
    });

    function applyToolRequest(tool, format, preset) {
        // 1. Activate correct tab
        let tabToClick = null;
        if (tool === 'resize') tabToClick = document.querySelector('.tab-btn[data-tab="resize"]');
        else if (tool === 'compress') tabToClick = document.querySelector('.tab-btn[data-tab="compress"]');
        else if (tool === 'crop') tabToClick = document.querySelector('.tab-btn[data-tab="crop"]');
        else if (tool === 'convert') tabToClick = document.querySelector('.tab-btn[data-tab="convert"]');
        else if (tool === 'target') tabToClick = document.querySelector('.tab-btn[data-tab="target"]');
        else if (tool === 'transform') tabToClick = document.querySelector('.tab-btn[data-tab="transform"]');
        
        if (tabToClick) tabToClick.click();

        // 2. Set format if specified
        if (format) {
            const formatValue = format === 'webp' ? 'image/webp' : 
                                format === 'png' ? 'image/png' : 'image/jpeg';
            if (selectFormat) {
                selectFormat.value = formatValue;
                // Update format summary
                updateSummary();
            }
            
            // If there's a format chip, sync it
            const chip = document.querySelector(`.chip-btn[data-format="${formatValue}"]`);
            if (chip) {
                document.querySelectorAll('.chip-grid[data-target="select-format"] .chip-btn').forEach(b => b.classList.remove('active'));
                chip.classList.add('active');
            }
        }

        // 3. Set presets
        if (preset === 'passport') {
            if (inputWidth) inputWidth.value = 600; 
            if (inputHeight) inputHeight.value = 600;
            updateEstimatedSize();
            updateSummary();
        } else if (preset === 'discord') {
            if (inputWidth) inputWidth.value = 256;
            if (inputHeight) inputHeight.value = 256;
            updateEstimatedSize();
            updateSummary();
        }

        // 4. Scroll to uploader
        const uploadSection = document.getElementById('upload');
        if (uploadSection) {
            uploadSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        // 5. Trigger upload if no image
        if (!originalImage) {
            setTimeout(() => {
                if (fileInput) fileInput.click();
            }, 600);
        } else {
            updateEstimatedSize();
        }
    }

    function handleToolClick(link) {
        const h3 = link.querySelector('h3');
        if (!h3) return;
        const title = h3.textContent;
        
        // This is the old text-based fallback, applyToolRequest is better for query params
        // but keep this for internal stability if old IDs are used elsewhere
        if (title.includes('PNG to JPG') || title.includes('WebP to JPG')) {
            pendingSettings = { format: 'image/jpeg' };
        } else if (title.includes('JPG to PNG')) {
            pendingSettings = { format: 'image/png' };
        } else if (title.includes('JPG to WebP') || title.includes('GIF to WebP')) {
            pendingSettings = { format: 'image/webp' };
        } else if (title === 'Image Compressor') {
            const tab = document.querySelector('.tab-btn[data-tab="compress"]');
            if (tab) tab.click();
        } else if (title.includes('Crop')) {
            const tab = document.querySelector('.tab-btn[data-tab="crop"]');
            if (tab) tab.click();
        } else if (title.includes('Passport')) {
            const tab = document.querySelector('.tab-btn[data-tab="resize"]');
            if (tab) tab.click();
            if (inputWidth) inputWidth.value = 600;
            if (inputHeight) inputHeight.value = 600;
        } else if (title.includes('Discord')) {
            const tab = document.querySelector('.tab-btn[data-tab="resize"]');
            if (tab) tab.click();
            if (inputWidth) inputWidth.value = 256;
            if (inputHeight) inputHeight.value = 256;
        }
        
        const uploadSection = document.getElementById('upload');
        if (uploadSection) {
            uploadSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        if (!originalImage) {
            setTimeout(() => {
                if (fileInput) fileInput.click();
            }, 600);
        } else {
            if (pendingSettings) {
                applyPendingSettings();
                pendingSettings = null;
            }
            updateEstimatedSize();
        }
    }

    // Modal Event Listeners
    if (continueBtn) {
        continueBtn.addEventListener('click', () => {
            if (modal) modal.classList.remove("active");
            pendingToolClick = null;
        });
    }

    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            if (modal) modal.classList.remove("active");
            
            // Reset current tool state
            if (removeBtn) removeBtn.click();
            
            if (pendingToolClick) {
                if (pendingToolClick.tool) {
                    applyToolRequest(pendingToolClick.tool, pendingToolClick.format, pendingToolClick.preset);
                } else {
                    handleToolClick(pendingToolClick.element);
                }
                pendingToolClick = null;
            }
        });
    }

    // Handle URL parameters on load
    window.addEventListener('DOMContentLoaded', () => {
        const params = new URLSearchParams(window.location.search);
        const tool = params.get('tool');
        const format = params.get('format');
        const preset = params.get('preset');
        
        if (tool) {
            setTimeout(() => {
                applyToolRequest(tool, format, preset);
            }, 100);
        }
    });

    function updateSummary() {
        if (summaryFormat && selectFormat) {
            summaryFormat.textContent = selectFormat.value.split('/')[1].toUpperCase().replace('JPEG', 'JPG');
        }
        if (summaryQuality && inputQuality) {
            summaryQuality.textContent = `${inputQuality.value}%`;
        }
    }

    // Tab Switching Logic
    const tabNames = {
        resize: 'Apply Resize',
        compress: 'Apply Compression',
        crop: 'Apply Crop Settings',
        convert: 'Apply Convert',
        target: 'Apply Target Size',
        transform: 'Apply Transform'
    };

    if (tabButtons) {
        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                
                // Update buttons
                tabButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Update panes
                toolPanes.forEach(pane => {
                    pane.classList.remove('active');
                    if (pane.id === `pane-${tab}`) pane.classList.add('active');
                });

                // Update action button text
                if (resizeBtn) resizeBtn.textContent = tabNames[tab] || 'Apply Changes';

                // Handle special tab entry behaviors
                if (tab === 'compress') {
                    const qualityGroup = inputQuality ? inputQuality.closest('.control-group') : null;
                    if (qualityGroup) qualityGroup.style.display = 'block';
                }
                
                if (tab === 'crop') {
                    // Auto-start crop if not already started? 
                    // Maybe better to let user click "Start Cropping"
                } else {
                    destroyCropper();
                }
            });
        });
    }

    // Chip Buttons Logic
    document.querySelectorAll('#format-chips .chip-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#format-chips .chip-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (selectFormat) {
                selectFormat.value = btn.dataset.format;
                selectFormat.dispatchEvent(new Event('change'));
            }
        });
    });

    document.querySelectorAll('#crop-ratios .chip-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#crop-ratios .chip-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (cropper) {
                const ratio = parseFloat(btn.dataset.ratio);
                cropper.setAspectRatio(isNaN(ratio) ? NaN : ratio);
            }
        });
    });

    document.querySelectorAll('#target-presets .chip-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#target-presets .chip-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const targetKB = parseInt(btn.dataset.target);
            reachTargetSize(targetKB);
        });
    });

    async function reachTargetSize(targetKB) {
        if (!originalImage) return;
        const targetBytes = targetKB * 1024;
        let low = 0.01;
        let high = 1.0;
        let bestQuality = 0.85;
        
        // Binary search for quality (8 iterations is enough for 1% precision)
        for (let i = 0; i < 8; i++) {
            const mid = (low + high) / 2;
            const blob = await new Promise(resolve => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const w = (inputWidth && parseInt(inputWidth.value)) || originalImage.width;
                const h = (inputHeight && parseInt(inputHeight.value)) || originalImage.height;
                canvas.width = w;
                canvas.height = h;
                ctx.drawImage(originalImage, 0, 0, w, h);
                canvas.toBlob(resolve, selectFormat.value || 'image/jpeg', mid);
            });
            
            if (blob && blob.size > targetBytes) {
                high = mid;
            } else if (blob) {
                low = mid;
                bestQuality = mid;
            } else {
                break;
            }
        }
        
        if (inputQuality) {
            inputQuality.value = Math.round(bestQuality * 100);
            if (qualityLabel) qualityLabel.textContent = `${inputQuality.value}%`;
            updateEstimatedSize();
            updateSummary();
        }
    }


