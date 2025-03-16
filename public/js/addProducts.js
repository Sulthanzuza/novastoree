let cropper;
let imageCount = 0;


function loadImage(event) {
    const files = event.target.files;
    if (files.length > 0 && imageCount < 3) {
        const file = files[imageCount];
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
                preview: '.preview',
            });
        };

        reader.readAsDataURL(file);
    }
}


document.getElementById('cropButton').addEventListener('click', function () {
    if (cropper) {
        const canvas = cropper.getCroppedCanvas();
        const croppedImage = canvas.toDataURL('image/jpeg');

        const previewId = 'imagePreview' + (imageCount + 1);
        const previewContainerId = 'previewContainer' + (imageCount + 1);
        const removeButtonId = 'removeImage' + (imageCount + 1);

        document.getElementById(previewId).src = croppedImage;
        document.getElementById(previewContainerId).style.display = 'inline-block';
        document.getElementById(removeButtonId).style.display = 'inline-block';

        cropper.destroy();
        document.getElementById('cropperContainer').style.display = 'none';
        imageCount++;

        if (imageCount < 3) {
            loadImage({ target: { files: document.getElementById('imageUploader').files } });
        }
    }
});

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

function validateImages() {
    if (imageCount < 3) {
        Swal.fire({
            icon: 'error',
            title: 'Insufficient Images',
            text: 'Please upload at least three images!',
            confirmButtonText: 'OK'
        });
        return false;
    }
    return true;
}
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

document.getElementById('form').addEventListener('submit', function (e) {
    e.preventDefault();

    const price = parseFloat(document.getElementById('price').value);
    const quantity = parseFloat(document.getElementById('quantity').value);
    const variant = document.getElementById('variant').value;

    if (!validateInputs(price, quantity) || !validateImages()||  !validateVariants(variant)) {
        return;
    }

    Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Form submitted successfully!',
        confirmButtonText: 'OK'
    }).then(() => {
        this.submit();
    });
});

document.getElementById('imageUploader').addEventListener('change', function (event) {
    imageCount = 0;
    loadImage(event);
});

document.getElementById('removeImage1').addEventListener('click', function () {
    document.getElementById('imagePreview1').src = '';
    document.getElementById('previewContainer1').style.display = 'none';
    document.getElementById('removeImage1').style.display = 'none';
    imageCount--;
});

document.getElementById('removeImage2').addEventListener('click', function () {
    document.getElementById('imagePreview2').src = '';
    document.getElementById('previewContainer2').style.display = 'none';
    document.getElementById('removeImage2').style.display = 'none';
    imageCount--;
});

document.getElementById('removeImage3').addEventListener('click', function () {
    document.getElementById('imagePreview3').src = '';
    document.getElementById('previewContainer3').style.display = 'none';
    document.getElementById('removeImage3').style.display = 'none';
    imageCount--;
});
    document.getElementById('addVariant').addEventListener('click', function () {
const container = document.getElementById('variantContainer');
const newGroup = document.createElement('div');
newGroup.classList.add('variant-group');
newGroup.style.marginTop = '10px';
newGroup.innerHTML = `
    <input type="text" name="variant[]" class="field-input"  style="margin-top:20px" placeholder="Variant (e.g., 50ml)">
    <input type="number" name="price[]" class="field-input" style="margin-top:20px" placeholder="Price">
    <input type="number" name="quantity[]" class="field-input" style="margin-top:20px" placeholder="Quantity">
    <button type="button" class="remove-variant btn btn-danger btn-sm" style="margin-left: 5px;">Remove</button>
    <hr>
`;
container.appendChild(newGroup);
newGroup.querySelector('.remove-variant').addEventListener('click', function () {
    container.removeChild(newGroup);
});
});