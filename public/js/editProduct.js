
let cropper;
let croppedImages = [];
let removedImages = [];



document.getElementById('addVariantBtn').addEventListener('click', function () {
    const variantSection = document.getElementById('variantSection');
    const newIndex = variantSection.children.length;
    const newVariant = `
    <div class="variant-row" id="variant-${newIndex}">
        <input type="hidden" name="variants[${newIndex}][_id]"  />
        <input type="text" name="variants[${newIndex}][size]" style="margin-top:20px" class="field-input" placeholder="Variant (e.g., 50ml)" required>
        <input type="number" name="variants[${newIndex}][price]"  style="margin-top:20px" class="field-input" placeholder="Price" required>
        <input type="number" name="variants[${newIndex}][quantity]" style="margin-top:20px" class="field-input" placeholder="Quantity" required>
        <button type="button" class="remove-variant btn btn-danger btn-sm" onclick="removeVariant(${newIndex})">Remove</button>
    </div>
    <hr>
`;
    variantSection.insertAdjacentHTML('beforeend', newVariant);
});


function removeVariant(index) {
    const variantRow = document.getElementById(`variant-${index}`);
    variantRow.remove();
}


function validateInputs(price, quantity) {
    if (price < 0 || quantity < 0) {
        Swal.fire({
            icon: 'error',
            title: 'Invalid Input',
            text: 'Negative values are not allowed for price or quantity!',
            confirmButtonText: 'OK'
        });
        return false;
    }
    return true;
}

function validateImageCount() {
    const existingImageCount = document.querySelectorAll('.image-preview-container img').length;
    const totalImages = existingImageCount + croppedImages.length;

    if (totalImages < 3) {
        Swal.fire({
            icon: 'error',
            title: 'Insufficient Images',
            text: 'Please ensure at least three images are included!',
            confirmButtonText: 'OK'
        });
        return false;
    }
    return true;
}


function loadImage(event) {
    const files = event.target.files;

    if (files.length > 0) {
        const file = files[0]; 
        const reader = new FileReader();

        reader.onload = function (e) {
            const img = document.getElementById('imageToCrop');
            img.src = e.target.result;

         
            document.getElementById('cropperContainer').style.display = 'block';

            
            if (cropper) {
                cropper.destroy();
            }

         
            cropper = new Cropper(img, {
                aspectRatio: 1,
                viewMode: 2,
            });
        };

        reader.readAsDataURL(file);
    }
}


document.getElementById('cropButton').addEventListener('click', function () {
    if (cropper) {
        const canvas = cropper.getCroppedCanvas();
        const croppedImage = canvas.toDataURL('image/jpeg');

        const existingImagePreviews = document.getElementById('existingImagePreviews');
        const previewContainer = document.createElement('div');
        previewContainer.className = 'image-preview-container';

        const imageId = `image_${Date.now()}`;
        previewContainer.innerHTML = `
        <img src="${croppedImage}" alt="Cropped Image" class="upload-icon" id="${imageId}">
        <button type="button" class="remove-button" data-image="${imageId}">X</button>
    `;

        existingImagePreviews.appendChild(previewContainer);
        croppedImages.push(croppedImage);

        const removeButton = previewContainer.querySelector('.remove-button');
        removeButton.addEventListener('click', function () {
            const imageId = removeButton.getAttribute('data-image');
            const image = document.getElementById(imageId);
            image.remove();
            previewContainer.remove();

            const index = croppedImages.findIndex(img => img === croppedImage);
            if (index !== -1) {
                croppedImages.splice(index, 1);
            }
        });

        cropper.destroy();
        document.getElementById('cropperContainer').style.display = 'none';
    }
});

document.getElementById('existingImagePreviews').addEventListener('click', function (event) {
    if (event.target.classList.contains('remove-button')) {
        const removeButton = event.target;
        const previewContainer = removeButton.closest('.image-preview-container');
        const imageName = removeButton.getAttribute('data-image');

        removedImages.push(imageName);
        previewContainer.remove();
    }
});

function removeFromFormData(formData, keyToRemove) {
    const newFormData = new FormData();
    for (let [key, value] of formData.entries()) {
        if (key !== keyToRemove) {
            newFormData.append(key, value);
        }
    }
    return newFormData;
}

document.getElementById('imageUploader').addEventListener('change', function (event) {
    loadImage(event);
});
function validateVariants(variant) {
    const variantPattern = /^\d+ml$/;
    if (!variantPattern.test(variant)) {
        Swal.fire({
            icon: 'error',
            title: 'Invalid Variant',
            text: 'Variants must be a number followed by "ml" (e.g., 100ml).',
            confirmButtonText: 'OK',
        });
        return false;
    }
    return true;
}

document.querySelector('form').addEventListener('submit', function (event) {
    event.preventDefault();

    const price = parseFloat(document.getElementById('price').value);
    const quantity = parseFloat(document.getElementById('quantity').value);
    const variant = document.getElementById('variant').value;
    const variantId = document.getElementById('variantId').value;
    
    if (!validateInputs(price, quantity) || !validateVariants(variant)) {
        return;
    }

    const formData = removeFromFormData(new FormData(this), 'image');
    formData.append('removedImages', removedImages);

    croppedImages.forEach((croppedImage) => {
        const base64Data = croppedImage.split(',')[1];
        const binaryData = atob(base64Data);
        const arrayBuffer = new ArrayBuffer(binaryData.length);
        const uint8Array = new Uint8Array(arrayBuffer);

        for (let i = 0; i < binaryData.length; i++) {
            uint8Array[i] = binaryData.charCodeAt(i);
        }

        const blob = new Blob([uint8Array], { type: 'image/jpeg' });
        formData.append('image', blob, `image_${Date.now()}.jpg`);
    });
    const productId = document.getElementById("productId").value;
    fetch(`/admin/products/edit-products/${productId}`, {
        method: 'POST',
        body: formData,
    })
        .then((response) => response.json())
        .then((data) => {
            Swal.fire({
            icon: 'success',
            title: 'Success',
            text: 'Product Edited Succesfully',
            confirmButtonText: 'OK',
        });
           
            window.location.href = "/admin/products";
        })
        .catch((error) => {
            console.error('Error:', error);
            alert('An error occurred while updating the product.');
        });
});
    