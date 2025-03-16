
function deletecategory(categoryId) {
    console.log("Deleting category:", categoryId);
    
    Swal.fire({
        title: 'Are you sure?',
        text: 'You won\'t be able to revert this!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'No, keep it',
        reverseButtons: true
    }).then((result) => {
        if (result.isConfirmed) {
            
            Swal.fire({
                title: 'Deleting...',
                text: 'Please wait',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });
            
            fetch(`/admin/delete-category/${categoryId}`, { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    Swal.fire(
                        'Deleted!',
                        'The category has been deleted.',
                        'success'
                    );
                   
                    const row = document.querySelector(`button[onclick="deletecategory('${categoryId}')"]`).closest('tr');
                    row.remove();
                } else {
                    Swal.fire(
                        'Failed!',
                        data.message || 'Failed to delete category. Please try again.',
                        'error'
                    );
                }
            })
            .catch((err) => {
                console.error(err);
                Swal.fire(
                    'Error!',
                    'An error occurred. Please check the console for details.',
                    'error'
                );
            });
        }
    });
}