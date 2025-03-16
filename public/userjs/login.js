
document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('login-form');
    if (form) {
        form.addEventListener('submit', function (e) {
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value.trim();

       
            if (!email || !password) {
                e.preventDefault();
                Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: 'Please fill all the fields!',
                });
                return;
            }

        
            const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
            if (!email.match(emailPattern)) {
                e.preventDefault();
                Swal.fire({
                    icon: 'error',
                    title: 'Invalid email format',
                    text: 'Please enter a valid email address.',
                });
                return;
            }

        
        });
    }
});
