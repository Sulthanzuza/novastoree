
$(document).ready(function () {
 
    $('#customerTable').DataTable({
      paging: true,
      pageLength: 10,
      lengthMenu: [5, 10, 25, 50],
      searching: true,
      ordering: true,
      responsive: true
    });
  
    
    function updateUserStatusUI(userId, isBlocked) {
      const statusBadge = $(`#status-badge-${userId}`);
      const toggleLabel = $(`#toggle-label-${userId}`);
      const toggleButton = $(`.toggle-status[data-id="${userId}"]`);
      const toggleSwitch = $(`#status-toggle-${userId}`);
      
      
      statusBadge.removeClass('text-bg-success text-bg-danger');
      statusBadge.addClass(isBlocked ? 'text-bg-danger' : 'text-bg-success');
      statusBadge.text(isBlocked ? 'Blocked' : 'Active');
      
      
      toggleLabel.text(isBlocked ? 'Blocked' : 'Active');
      
    
      toggleButton.text(isBlocked ? 'Unblock' : 'Block');
      toggleButton.data('status', isBlocked ? 'blocked' : 'active');
      
      
      toggleSwitch.prop('checked', !isBlocked);
    }
    
   
    async function toggleUserStatus(userId, isBlocked) {
      try {
        
        Swal.fire({
          title: isBlocked ? 'Blocking...' : 'Unblocking...',
          text: 'Please wait while we process your request',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });
        
        const response = await $.ajax({
          url: '/admin/status',
          method: 'PATCH',
          contentType: 'application/json',
          data: JSON.stringify({
            id: userId,
            isBlocked: isBlocked
          })
        });
        
        if (response.success) {
          
          updateUserStatusUI(userId, isBlocked);
          
       
          Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: response.message,
            timer: 2000,
            showConfirmButton: false
          });
          
          return true;
        } else {
        
          Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: response.message || 'Failed to update status'
          });
          
          return false;
        }
      } catch (error) {
        console.error('Error updating status:', error);
        
   
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: 'Something went wrong'
        });
        
        return false;
      }
    }
    
  
    $(document).on('change', '.user-status-toggle', async function() {
      const toggleSwitch = $(this);
      const userId = toggleSwitch.data('id');
      const newState = !toggleSwitch.prop('checked');
      
   
      toggleSwitch.prop('disabled', true);
      
   
      const success = await toggleUserStatus(userId, newState);
      
     
      if (!success) {
        toggleSwitch.prop('checked', !newState);
      }
      
      
      toggleSwitch.prop('disabled', false);
    });
    
  
    $(document).on('click', '.toggle-status', async function(event) {
      event.preventDefault();
      
      const button = $(this);
      const userId = button.data('id');
      const currentStatus = button.data('status');
      const newStatus = currentStatus === 'active';
      
   
      button.prop('disabled', true);
      
  
      await toggleUserStatus(userId, newStatus);
      
      
      button.prop('disabled', false);
    });
  });