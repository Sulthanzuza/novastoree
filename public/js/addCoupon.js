
document.addEventListener('DOMContentLoaded', () => {
    const couponForm = document.getElementById('couponForm');

   
    document.getElementById('generateCode').addEventListener('click', () => {
        const randomCode = 'COUP' + Math.floor(Math.random() * 10000);
        document.getElementById('couponCode').value = randomCode;
    });

  
    couponForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        
        const formData = new FormData(couponForm);
        const couponData = Object.fromEntries(formData.entries());

        console.log("Form Data: ", couponData); 

       
        if (!couponData.name || !couponData.code || !couponData.description ||
            !couponData.start || !couponData.expiry || !couponData.minAmount ||
            !couponData.maxAmount || !couponData.discountAmount || !couponData.limit) {
            Swal.fire('Error', 'Please fill in all fields.', 'error');
            return;
        }

        
        const activationDate = new Date(couponData.start);
        const expiryDate = new Date(couponData.expiry);
        if (expiryDate <= activationDate) {
            Swal.fire('Error', 'Expiry date must be after the activation date.', 'error');
            return;
        }

       
        if (couponData.discountAmount < 0 || couponData.discountAmount > 99 || !/^\d{1,2}$/.test(couponData.discountAmount)) {
            Swal.fire('Error', 'Discount amount should be a valid percentage between 0 and 99.', 'error');
            return;
        }

       
        if (couponData.minAmount < 0 || couponData.maxAmount < 0 || couponData.minAmount > couponData.maxAmount || couponData.limit < 0) {
            Swal.fire('Error', 'Amount fields and usage limit cannot be negative.', 'error');
            return;
        }

      
        couponData.status = couponData.status === 'true';

       
        try {
            const response = await fetch('/admin/add-coupon', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(couponData),
            });

            const result = await response.json();
            console.log('Server Response:', result);  

            if (result.success) {
                Swal.fire('Success!', 'Coupon created successfully!', 'success');
                window.location.href='/admin/coupon'
            } else {
                Swal.fire('Error', result.message || 'Failed to create coupon.', 'error');
            }
        } catch (error) {
            console.error('Fetch Error:', error);
            Swal.fire('Error', 'Something went wrong! Try again.' + error, 'error');
        }
    });
});
