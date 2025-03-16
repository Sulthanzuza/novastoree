
document.getElementById('address-form').addEventListener('submit', async (e) => {
    e.preventDefault(); 
  
   
    const formData = {
      fullName: document.getElementById('name').value,
      phoneNumber: document.getElementById('number').value,
      houseAddress: document.getElementById('address').value,
      streetAddress: document.getElementById('street-address').value,
      city: document.getElementById('city').value,
      state: document.getElementById('state').value,
      zipCode: document.getElementById('zip-code').value,
      country: document.getElementById('country').value,
    };
  
   
    for (let key in formData) {
      if (formData[key].trim() === '') {
        Swal.fire({
          icon: 'error',
          title: 'Validation Error',
          text: `Please fill in the ${key.replace(/([A-Z])/g, ' $1').toLowerCase()} field.`,
        });
        return; 
      }
    }
  
    
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(formData.phoneNumber)) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Phone Number',
        text: 'Phone number must be exactly 10 digits.',
      });
      return;
    }
  
   
    const zipRegex = /^[0-9]{6}$/;
    if (!zipRegex.test(formData.zipCode)) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Zip Code',
        text: 'Zip code must be exactly 6 digits.',
      });
      return;
    }
  
    try {
      const response = await fetch(`/user/edit-address/{{address._id}}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
  
      const result = await response.json();
  
      if (response.ok) {
    
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: result.message || 'Address updated successfully.',
        }).then(() => {
        
          window.location.href = '/user/address'; 
        });
      } else {
  
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: result.message || 'Error updating address.',
        });
      }
    } catch (error) {
      console.error('Request failed', error);
      Swal.fire({
        icon: 'error',
        title: 'Unexpected Error',
        text: 'An unexpected error occurred. Please try again.',
      });
    }
  });
  
  