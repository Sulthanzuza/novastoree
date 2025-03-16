function validateForm() {
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (newPassword.length < 6) {
      Swal.fire('Error', 'Password must be at least 6 characters long.', 'error');
      return false;
    }

    if (newPassword !== confirmPassword) {
      Swal.fire('Error', 'New Password and Confirm Password do not match.', 'error');
      return false;
    }

    return true;
  }

