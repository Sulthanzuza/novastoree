function validateForm() {
    const firstName = document.getElementById("f-name").value.trim();
    const lastName = document.getElementById("l-name").value.trim();

    const phoneNumber = document.getElementById("number").value.trim();


    const phonePattern = /^\d{10}$/;


    if (!firstName || !lastName ||  !phoneNumber) {
      Swal.fire({
        icon: 'error',
        title: 'Incomplete Fields',
        text: 'All fields are required.',
      });
      return false;
    }





    if (!phonePattern.test(phoneNumber)) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Phone Number',
        text: 'Phone number must be exactly 10 digits.',
      });
      return false;
    }

    Swal.fire({
      icon: 'success',
      title: 'Validation Successful',
      text: 'Your changes have been saved!',
    });
    return true; 
  }