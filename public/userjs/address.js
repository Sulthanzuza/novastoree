function deleteAddress(addressId) {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to delete this address? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
    }).then((result) => {
      if (result.isConfirmed) {
        fetch(`/user/delete-address/${addressId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error('Failed to delete address');
            }
            return response.json();
          })
          .then((data) => {
            
            removeAddressFromDOM(addressId);
            
            Swal.fire({
              title: 'Deleted!',
              text: data.message || 'Address deleted successfully.',
              icon: 'success',
              confirmButtonText: 'OK',
            });
          })
          .catch((error) => {
            console.error('Error:', error);
            Swal.fire({
              title: 'Error!',
              text: 'An error occurred while deleting the address.',
              icon: 'error',
              confirmButtonText: 'OK',
            });
          });
      }
    });
  }
  
  
  function removeAddressFromDOM(addressId) {
    
    const addressContainer = document.querySelector(`[data-address-id="${addressId}"]`);
    
    if (addressContainer) {
      
      addressContainer.remove();
      
      
      const remainingAddresses = document.querySelectorAll('.saved-personal-info');
      if (remainingAddresses.length === 0) {
        
        const addressesContainer = document.querySelector('.saved-address-container');
        const noAddressesMessage = document.createElement('p');
        noAddressesMessage.textContent = 'No addresses found.';
        addressesContainer.appendChild(noAddressesMessage);
      }
    }
  }