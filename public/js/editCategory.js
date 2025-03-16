

async function loadCategoryDetails(categoryId) {
    try {
        const response = await fetch(`/admin/get-category/${categoryId}`);
        const category = await response.json();

        if (response.ok) {
           
            document.getElementById('categoryName').value = category.name;
            document.getElementById('description').value = category.description;

            
            if (category.icon) {
                const imagePreview = document.getElementById('imagePreview');
                imagePreview.src = `/uploads/${category.icon}`;
                document.getElementById('imagePreviewContainer').style.display = 'block';
            }

        
            document.getElementById('categoryForm').dataset.categoryId = categoryId;
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: category.message || 'Failed to load category details.',
            });
        }
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load category details.',
        });
    }
}


document.getElementById('categoryIcon').addEventListener('change', function (event) {
    const file = event.target.files[0];
    const imagePreview = document.getElementById('imagePreview');
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');

    
    if (file) {
        const reader = new FileReader();
        reader.onload = function () {
            imagePreview.src = reader.result;
            imagePreviewContainer.style.display = 'block'; 
        };
        reader.readAsDataURL(file); 
    } else {
        imagePreviewContainer.style.display = 'none'; 
    }
});


async function deleteCategory(categoryId) {
    try {
        const confirmation = await Swal.fire({
            icon: 'warning',
            title: 'Are you sure?',
            text: 'This action will delete the category permanently.',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!',
        });

        if (confirmation.isConfirmed) {
            const response = await fetch(`/admin/delete-category/${categoryId}`, {
                method: 'DELETE',
            });

            const result = await response.json();

            if (response.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'Deleted!',
                    text: result.message || 'Category deleted successfully.',
                });
                resetForm();
                
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: result.message || 'Failed to delete category.',
                });
            }
        }
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to delete category.',
        });
    }
}


document.getElementById('editCategoryForm').addEventListener('submit', async function (event) {
    event.preventDefault();
    const form = this;
    const url =window.location.pathname.split('/');
    const categoryId = url[url.length-1] 
    const formData = new FormData(form);
    

    try {
        const response = await fetch(`/admin/edit-category/${categoryId}`, {
  method: 'POST',
  body: formData,
});

        const result = await response.json();

        if (response.ok) {
            Swal.fire({
                icon: 'success',
                title: 'Success',
                text: result.message || 'Category updated successfully.',
            });
            form.reset()
            window.location.href="/admin/category"
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: result.message || 'Failed to update category.',
            });
        }
    } catch (error) {
        console.log(error)
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to update category.',
        });
    }
});