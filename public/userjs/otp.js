

let resendTimer = 45; 
const resendOtpButton = document.getElementById('resendOtpButton');
let countdownInterval;


function startCountdown() {
    resendOtpButton.disabled = true; 
    countdownInterval = setInterval(function () {
        if (resendTimer > 0) {
            resendOtpButton.textContent = `Resend OTP in ${resendTimer--} seconds`;
        } else {
            resendOtpButton.disabled = false; 
            resendOtpButton.textContent = 'Resend OTP';
            clearInterval(countdownInterval); 
        }
    }, 1000);
}


startCountdown();


document.getElementById('otp-form').addEventListener('submit', async function (event) {
    event.preventDefault();

    const otp = this.otp.value; 

    
    const submitButton = this.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.innerHTML = 'Verifying...';

    const response = await fetch('/user/otp', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ otp })
    });

    const result = await response.json();

    submitButton.disabled = false;
    submitButton.innerHTML = 'Verify OTP';

    if (result.success) {
       
        Swal.fire({
            title: 'Success!',
            text: result.message,
            icon: 'success',
            confirmButtonText: 'OK'
        }).then(() => {
           
            window.location.href = '/user/reset'; 
        });
    } else {
        
        Swal.fire({
            title: 'Error!',
            text: result.message,
            icon: 'error',
            confirmButtonText: 'Try Again'
        });
    }
});


resendOtpButton.addEventListener('click', async function () {
  
    resendOtpButton.disabled = true;
    resendOtpButton.textContent = 'Sending OTP...';

    const response = await fetch('/user/otp/reset', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    });

    const result = await response.json();

    resendOtpButton.disabled = false;

    if (result.success) {
       
        resendTimer = 45; 
        startCountdown(); 
        Swal.fire({
            title: 'Success!',
            text: result.message,
            icon: 'success',
            confirmButtonText: 'OK'
        });
    } else {
      
        resendOtpButton.textContent = 'Resend OTP';
        Swal.fire({
            title: 'Error!',
            text: result.message,
            icon: 'error',
            confirmButtonText: 'OK'
        });
    }
});