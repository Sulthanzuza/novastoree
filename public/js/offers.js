$(document).ready(function () {

    const dataTable = $('#offerTable').DataTable({
      paging: true,
      pageLength: 10,
      lengthMenu: [5, 10, 25, 50],
      searching: true,
      ordering: true,
      responsive: true
    });
  
  
    $('.delete-btn').on('click', function () {
      const offerId = $(this).data('id');
      const row = $(this).closest('tr');
  
      Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this action!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'No, cancel!',
        reverseButtons: true
      }).then((result) => {
        if (result.isConfirmed) {
     
          Swal.fire({
            title: 'Deleting...',
            text: 'Please wait while we process your request',
            allowOutsideClick: false,
            didOpen: () => {
              Swal.showLoading();
            }
          });
  
          
          $.ajax({
            url: `/admin/delete-offer/${offerId}`,
            method: 'DELETE',
            success: function (response) {
              if (response.success) {
             
                dataTable.row(row).remove().draw();
                
                Swal.fire({
                  icon: 'success',
                  title: 'Deleted!',
                  text: response.message,
                  timer: 1500
                });
              } else {
                Swal.fire({
                  icon: 'error',
                  title: 'Failed!',
                  text: response.message || 'Failed to delete offer.',
                });
              }
            },
            error: function (xhr) {
              const errorMsg = xhr.responseJSON?.message || 'Error deleting offer.';
              Swal.fire({
                icon: 'error',
                title: 'Error!',
                text: errorMsg,
              });
            }
          });
        }
      });
    });
  
    
    $(document).on('change', '.status-toggle', function () {
      const toggleSwitch = $(this);
      const offerId = toggleSwitch.data('id');
      const statusLabel = $(`#status-label-${offerId}`);
      const currentState = toggleSwitch.prop('checked');
      
  
      toggleSwitch.prop('disabled', true);
      
      $.ajax({
        url: `/admin/toggle-offer-status/${offerId}`,
        method: 'PATCH',
        contentType: 'application/json',
        data: JSON.stringify({ status: currentState }),
        success: function (response) {
          if (response.success) {
       
            statusLabel.text(response.newStatus ? 'Active' : 'Inactive');
            statusLabel.removeClass('text-success text-danger');
            statusLabel.addClass(response.newStatus ? 'text-success' : 'text-danger');
            
  
            toggleSwitch.prop('checked', response.newStatus);
            
        
            const Toast = Swal.mixin({
              toast: true,
              position: 'top-end',
              showConfirmButton: false,
              timer: 3000,
              timerProgressBar: true
            });
            
            Toast.fire({
              icon: 'success',
              title: response.message
            });
          } else {
  
            toggleSwitch.prop('checked', !currentState);
            
            Swal.fire({
              icon: 'error',
              title: 'Failed!',
              text: response.message || 'Failed to update status.',
            });
          }
        },
        error: function (xhr) {
          
          toggleSwitch.prop('checked', !currentState);
          
          const errorMsg = xhr.responseJSON?.message || 'Error updating status.';
          Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: errorMsg,
          });
        },
        complete: function () {
       
          toggleSwitch.prop('disabled', false);
        }
      });
    });
  });
  