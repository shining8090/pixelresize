import Cropper from 'https://unpkg.com/cropperjs@1.6.2/dist/cropper.esm.js';

// Elements
const dropZone = document.getElementById('drop-zone');
const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.accept = 'image/*';
fileInput.style.display = 'none';
document.body.appendChild(fileInput);

const selectBtn = document.getElementById('select-btn');
const uploadPlaceholder = document.getElementById('upload-placeholder');
const previewContainer = document.getElementById('preview-container');
const imagePreview = document.getElementById('image-preview');
const removeBtn = document.getElementById('remove-btn');

const settingsSection = document.getElementById('settings-section');
const ratioButtons = document.querySelectorAll('.aspect-ratio-grid button');
const selectFormat = document.getElementById('select-format');
const cropBtn = document.getElementById('resize-btn');
const downloadBtn = document.getElementById('download-btn');
const base64Btn = document.getElementById('base64-btn');
const errorMessage = document.getElementById('error-message');

let originalFile = null;
let cropper = null;
let croppedBlob = null;
let croppedBase64 = null;

// Error display
function showError(message) {
    if (errorMessage) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');
        setTimeout(() => errorMessage.classList.add('hidden'), 5000);
    } else {
        alert(message);
    }
}

// File handling
if (selectBtn) {
    selectBtn.addEventListener('click', () => fileInput.click());
}

if (dropZone) {
    dropZone.addEventListener('click', (e) => {
        if (e.target === selectBtn) return;
        if (!cropper) fileInput.click();
    });

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        if (e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
        }
    });
}

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
});

function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) {
        showError('Please upload a valid image file.');
        return;
    }

    originalFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
        if (cropper) {
            cropper.destroy();
        }

        imagePreview.src = e.target.result;
        uploadPlaceholder.style.display = 'none';
        previewContainer.style.display = 'flex';
        settingsSection.classList.remove('hidden');

        cropper = new Cropper(imagePreview, {
            viewMode: 1,
            autoCropArea: 0.8,
            responsive: true,
            restore: false,
            checkCrossOrigin: false,
            checkOrientation: false,
            modal: true,
            guides: true,
            center: true,
            highlight: true,
            cropBoxMovable: true,
            cropBoxResizable: true,
            toggleDragModeOnDblclick: true,
        });

        if (downloadBtn) downloadBtn.disabled = true;
    };
    reader.readAsDataURL(file);
}

if (removeBtn) {
    removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (cropper) {
            cropper.destroy();
            cropper = null;
        }
        originalFile = null;
        croppedBlob = null;
        croppedBase64 = null;
        imagePreview.src = '';
        uploadPlaceholder.style.display = 'block';
        previewContainer.style.display = 'none';
        settingsSection.classList.add('hidden');
        if (downloadBtn) downloadBtn.disabled = true;
        if (base64Btn) base64Btn.disabled = true;
    });
}

// Aspect Ratio
ratioButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        if (!cropper) return;
        
        ratioButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const ratio = parseFloat(btn.dataset.ratio);
        cropper.setAspectRatio(isNaN(ratio) ? NaN : ratio);
    });
});

// Crop Action
if (cropBtn) {
    cropBtn.addEventListener('click', () => {
        if (!cropper) return;

        const format = selectFormat.value;
        const canvas = cropper.getCroppedCanvas({
            imageSmoothingEnabled: true,
            imageSmoothingQuality: 'high',
        });

        canvas.toBlob((blob) => {
            croppedBlob = blob;
            croppedBase64 = canvas.toDataURL(format, 0.9);
            if (downloadBtn) downloadBtn.disabled = false;
            if (base64Btn) base64Btn.disabled = false;
            
            const originalText = cropBtn.textContent;
            cropBtn.textContent = 'Cropped Successfully!';
            setTimeout(() => cropBtn.textContent = originalText, 2000);
        }, format, 0.9);
    });
}

// Base64 Copy Action
if (base64Btn) {
    base64Btn.addEventListener('click', () => {
        if (!croppedBase64) return;

        navigator.clipboard.writeText(croppedBase64).then(() => {
            const originalText = base64Btn.textContent;
            base64Btn.textContent = 'Copied!';
            setTimeout(() => base64Btn.textContent = originalText, 2000);
        }).catch((err) => {
            console.error('Clipboard error:', err);
            showError('Failed to copy Base64 to clipboard.');
        });
    });
}

// Download Action
if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
        if (!croppedBlob) return;

        const format = selectFormat.value;
        const extension = format.split('/')[1].replace('jpeg', 'jpg');
        const url = URL.createObjectURL(croppedBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pixelresize-cropped-${Date.now()}.${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 100);
    });
}
