
$(document).ready(function() {
   
    $('#customerTable').DataTable({
      paging: true,
      searching: true,
      ordering: true,
      info: true,
      autoWidth: false,
      responsive: true,
      order: [[2, 'desc']] 
    });

   
    const button = document.querySelector('button');
    if (result.success) {
      button.dataset.isBlocked = currentStatus === 'true' ? 'blocked' : 'active';
      button.textContent = button.dataset.isBlocked === 'false' ? 'Block' : 'Unblock';
      button.closest('tr').querySelector('.status-badge').textContent = button.dataset.isBlocked;
      button.closest('tr').querySelector('.status-badge').className =
        button.dataset.isBlocked === 'false' ? 'badge text-bg-success' : 'badge text-bg-danger';
    }
  });
  
  document.addEventListener('DOMContentLoaded', function() {
    const dateElements = document.querySelectorAll('.formatted-date');
    
    dateElements.forEach(function(element) {
      const date = new Date(element.textContent);
      const formattedDate = `${("0" + date.getDate()).slice(-2)}-${("0" + (date.getMonth() + 1)).slice(-2)}-${date.getFullYear().toString().slice(-2)}`;
      element.textContent = formattedDate;
    });
  });
