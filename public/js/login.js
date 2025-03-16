
document.addEventListener("DOMContentLoaded", function () {
    document.getElementById('form').addEventListener('submit', formValidate);
});

function formValidate(e) {
    e.preventDefault(); 

    var email = document.getElementById('email').value;
    var password = document.getElementById('password').value;
    

    if (email === "" || password === "") {
        Swal.fire({
            title: 'Error!',
            text: "All fields need to be filled",
            icon: 'error',
            confirmButtonText: 'OK'
        });
        return false; 
    }

    

    e.target.submit(); 
    return true; 
}

function isValidCredentials(email, password) {
     const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
return emailRegex.test(email);


    if (!isValidCredentials(email, password)) {
        Swal.fire({
            title: 'Error!',
            text: message,
            icon: 'error',
            confirmButtonText: 'OK'
        });
        return false; 
    }
    return true;
}