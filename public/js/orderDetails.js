

  
document.addEventListener('DOMContentLoaded', function () {

    document.querySelectorAll('.approve-btn, .reject-btn').forEach(button => {
      button.addEventListener('click', async function () {
        const orderId = this.getAttribute('data-order-id');
        const productId = this.getAttribute('data-product-id');
        const action = this.getAttribute('data-action');
        const productRow = this.closest('tr');
  
        try {
          const response = await fetch(`/admin/orderdetails/${orderId}/product/${productId}/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action })
          });
  
          const result = await response.json();
          if (result.success) {
            
            const statusCell = productRow.querySelector('td:last-child');
            if (action === 'approve') {
              statusCell.innerHTML = '<p class="text-success">Return Approved</p>';
            } else {
              statusCell.innerHTML = '<p class="text-danger">Returned (Rejected)</p>';
            }
            
            Swal.fire({
              icon: 'success',
              title: 'Success',
              text: result.message,
            });
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: result.message,
            });
          }
        } catch (error) {
          console.error("Error:", error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Something went wrong, try again!',
          });
        }
      });
    });
     
    
    document.querySelectorAll('form[action*="/product/"]').forEach(form => {
      form.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        const selectElement = this.querySelector('.product-status');
        const currentStatus = selectElement.dataset.currentStatus;
        const newStatus = selectElement.value;
        const submitButton = this.querySelector('button[type="submit"]');
        const productRow = this.closest('tr');
        
        
        const validTransitions = {
          'Pending': ['Processing'],
          'Processing': ['Shipped'],
          'Shipped': ['Delivered'],
          'Delivered': [], 
          'Cancelled': [], 
          'Returned': []
        };
  
        if (!validTransitions[currentStatus]?.includes(newStatus)) {
          return Swal.fire({
            icon: 'error',
            title: 'Invalid Status Change',
            text: `Cannot change status from ${currentStatus} to ${newStatus}.`,
            confirmButtonText: 'OK'
          });
        }
  
       
        submitButton.disabled = true;
        submitButton.textContent = 'Updating...';
  
        try {
          const response = await fetch(this.action, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
          });
  
          const result = await response.json();
  
          if (result.success) {
            
            selectElement.dataset.currentStatus = newStatus;
            
           
            updateStatusOptions(selectElement, newStatus);
            
            Swal.fire({
              icon: 'success',
              title: 'Success',
              text: result.message,
              confirmButtonText: 'OK'
            });
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: result.message,
              confirmButtonText: 'OK'
            });
          }
        } catch (error) {
          console.error("Error updating status:", error);
          Swal.fire({
            icon: 'error',
            title: 'Server Error',
            text: 'Something went wrong. Please try again.',
            confirmButtonText: 'OK'
          });
        } finally {
          
          submitButton.disabled = false;
          submitButton.textContent = 'Set Status';
        }
      });
    });
  
    
    function updateStatusOptions(selectElement, currentStatus) {
      selectElement.innerHTML = ''; 
      
      const option = document.createElement('option');
      option.value = currentStatus;
      option.textContent = currentStatus;
      option.selected = true;
      selectElement.appendChild(option);
      
      
      if (currentStatus === 'Pending') {
        const processingOption = document.createElement('option');
        processingOption.value = 'Processing';
        processingOption.textContent = 'Processing';
        selectElement.appendChild(processingOption);
      } else if (currentStatus === 'Processing') {
        const shippedOption = document.createElement('option');
        shippedOption.value = 'Shipped';
        shippedOption.textContent = 'Shipped';
        selectElement.appendChild(shippedOption);
      } else if (currentStatus === 'Shipped') {
        const deliveredOption = document.createElement('option');
        deliveredOption.value = 'Delivered';
        deliveredOption.textContent = 'Delivered';
        selectElement.appendChild(deliveredOption);
      }
      
     
      if (currentStatus === 'Delivered' || currentStatus === 'Cancelled' || currentStatus === 'Return Approved') {
        selectElement.disabled = true;
        const button = selectElement.closest('form').querySelector('button');
        button.disabled = true;
      }
    }
  
   
    const orderForm = document.getElementById('order-status-form');
    if (orderForm) {
      orderForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        const orderStatusSelect = this.querySelector('#order-status');
        const currentStatus = orderStatusSelect.dataset.currentStatus;
        const newStatus = orderStatusSelect.value;
        const submitButton = this.querySelector('button[type="submit"]');
  
        
        const productStatuses = [...document.querySelectorAll('.product-status')].map(select => select.value);
        if (!productStatuses.every(status => status === newStatus)) {
          return Swal.fire({
            icon: 'error',
            title: 'Product Status Mismatch',
            text: 'All products must have the same status before updating the order status.',
            confirmButtonText: 'OK'
          });
        }
  
        
        submitButton.disabled = true;
        submitButton.textContent = 'Updating...';
  
        try {
          const response = await fetch(this.action, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
          });
  
          const result = await response.json();
  
          if (result.success) {
            
            orderStatusSelect.dataset.currentStatus = newStatus;
            
            Swal.fire({
              icon: 'success',
              title: 'Success',
              text: result.message,
              confirmButtonText: 'OK'
            });
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: result.message,
              confirmButtonText: 'OK'
            });
          }
        } catch (error) {
          console.error("Error updating order status:", error);
          Swal.fire({
            icon: 'error',
            title: 'Server Error',
            text: 'Something went wrong. Please try again.',
            confirmButtonText: 'OK'
          });
        } finally {
        
          submitButton.disabled = false;
          submitButton.textContent = 'Set Status';
        }
      }); 
    }
  });
  
  
  function updateProductImages(orderId) {
    fetch(`/admin/order/${orderId}/products`)
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          
          const carouselInner = document.querySelector('.carousel-inner');
          const carouselIndicators = document.querySelector('.carousel-indicators');
          
          if (carouselInner && data.products.length > 0) {
           
          }
        }
      })
      .catch(error => console.error('Error fetching updated product images:', error));
  }
  