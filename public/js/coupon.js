
$(document).ready(function () {

    const couponTable = $('#couponTable').DataTable({
      paging: true,
      pageLength: 10,
      lengthMenu: [5, 10, 25, 50],
      searching: true,
      ordering: true,
      responsive: true,
    });
    

    $(document).on('click', '.delete-coupon', function() {
      const couponId = $(this).data('id');
      const row = $(this).closest('tr');
      
      Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!'
      }).then((result) => {
        if (result.isConfirmed) {
          
          $.ajax({
            url: `/admin/delete-coupon/${couponId}`,
            type: 'DELETE',
            success: function(response) {
              if (response.success) {
             
                couponTable.row(row).remove().draw();
                
                Swal.fire({
                  icon: 'success',
                  title: 'Deleted!',
                  text: 'Coupon has been deleted successfully.',
                  showConfirmButton: false,
                  timer: 1500
                });
              } else {
                Swal.fire({
                  icon: 'error',
                  title: 'Error!',
                  text: 'Failed to delete coupon. Please try again.',
                });
              }
            },
            error: function() {
              Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Something went wrong. Please try again later.',
              });
            }
          });
        }
      });
    });
    
   
    $(document).on('click', '.status-toggle', function() {
      const couponId = $(this).data('id');
      const statusBadge = $(this);
      
      $.ajax({
        url: `/admin/toggle-coupon/${couponId}`,
        type: 'PATCH',
        success: function(response) {
          if (response.success) {
          
            if (response.status) {
              statusBadge.removeClass('bg-danger').addClass('bg-success');
              statusBadge.text('Active');
            } else {
              statusBadge.removeClass('bg-success').addClass('bg-danger');
              statusBadge.text('Inactive');
            }
            
            statusBadge.data('status', response.status);
            
            Swal.fire({
              position: 'center',
              icon: 'success',
              title: response.message,
              showConfirmButton: false,
              timer: 1500
            });
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Error!',
              text: response.message || 'Failed to update status',
            });
          }
        },
        error: function(xhr) {
          Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: xhr.responseJSON?.message || 'Something went wrong',
          });
        }
      });
    });
  });