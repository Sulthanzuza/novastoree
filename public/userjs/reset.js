
document.getElementById('reset-form').addEventListener('submit', async function (event) {
    event.preventDefault();

    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    
    if (!newPassword || !confirmPassword) {
        return Swal.fire({
            title: 'Error!',
            text: 'All fields are required!',
            icon: 'error',
            confirmButtonText: 'OK'
        });
    }

    
    if (newPassword !== confirmPassword) {
        return Swal.fire({
            title: 'Error!',
            text: 'Passwords do not match!',
            icon: 'error',
            confirmButtonText: 'OK'
        });
    }

    
    try {
        const response = await fetch('/user/reset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: newPassword }) 
        });

        const result = await response.json();

        if (result.success) {
            Swal.fire({
                title: 'Success!',
                text: result.message,
                icon: 'success',
                confirmButtonText: 'OK'
            }).then(() => {
                window.location.href = '/user/login'; 
            });
        } else {
            Swal.fire({
                title: 'Error!',
                text: result.message,
                icon: 'error',
                confirmButtonText: 'Try Again'
            });
        }
    } catch (error) {
        Swal.fire({
            title: 'Error!',
            text: 'Something went wrong!',
            icon: 'error',
            confirmButtonText: 'OK'
        });
    }
});