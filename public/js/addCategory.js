async function validateCategoryName(name) {
    const response = await fetch(`/admin/check-category?name=${name}`);
    return response.ok;
  }


  document.getElementById('categoryIcon').addEventListener('change', function () {
    const file = this.files[0];
    const fileName = file ? file.name : 'No file chosen';
    document.getElementById('fileName').textContent = fileName;


    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        const imagePreview = document.getElementById('imagePreview');
        imagePreview.src = e.target.result;
        document.getElementById('imagePreviewContainer').style.display = 'block';
      };
      reader.readAsDataURL(file);
    } else {
      document.getElementById('imagePreviewContainer').style.display = 'none';
    }
  });


  document.getElementById('removeIcon').addEventListener('click', function () {
    document.getElementById('categoryIcon').value = '';
    document.getElementById('fileName').textContent = 'No file chosen';
    document.getElementById('imagePreviewContainer').style.display = 'none';
  });


  function resetForm() {
    document.getElementById('categoryForm').reset();
    document.getElementById('fileName').textContent = 'No file chosen';
    document.getElementById('imagePreviewContainer').style.display = 'none';
  }


  document.getElementById('categoryForm').addEventListener('submit', async function (event) {
    event.preventDefault();
    const form = this;


    const categoryName = form.name.value.trim();
    const description = form.description.value.trim();
    const icon = form.icon.files[0];


    if (!categoryName || !description || !icon) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'All fields are required.',
      });
      return;
    }


    if (!categoryName) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'Category name is required.',
      });
      return;
    }

    if (!description) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'Description is required.',
      });
      return;
    }


    const isDuplicate = !(await validateCategoryName(categoryName));
    if (isDuplicate) {
      Swal.fire({
        icon: 'error',
        title: 'Duplicate Category',
        text: 'Category name already exists.',
      });
      return;
    }


    if (!icon) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'Please select a category icon.',
      });
      return;
    }


    const formData = new FormData(form);

    try {
      const response = await fetch('/admin/add-category', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: result.message,
        });
        resetForm();
        window.location.href = '/admin/category'
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: result.message,
        });
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to add category. Please try again.',
      });
    }
  });