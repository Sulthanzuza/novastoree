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

    try {
      const response = await fetch('/user/add-address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        Swal.fire({
          title: 'Success!',
          text: 'Address added successfully.',
          icon: 'success',
          confirmButtonText: 'OK',
        }).then(() => {
          window.location.href = '/user/address'; 
        });
      } else {
        Swal.fire({
          title: 'Error!',
          text: result.error || 'Failed to add address.',
          icon: 'error',
          confirmButtonText: 'Try Again',
        });
      }
    } catch (error) {
      console.error('Request failed', error);
      Swal.fire({
        title: 'Error!',
        text: 'An unexpected error occurred. Please try again.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
    }
  });