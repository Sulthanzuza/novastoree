
document.addEventListener('DOMContentLoaded', () => {
    const couponForm = document.getElementById('couponForm');
    const couponId = couponForm.dataset.couponId;
    
   
    function formatDate(input) {
        if (!input) return '';
        const date = new Date(input);
        if (isNaN(date.getTime())) return ''; 
        return date.toISOString().split('T')[0]; 
    }

  
    document.getElementById('couponCode').readOnly = true; 
    document.getElementById('activationDate').value = formatDate(document.getElementById('activationDate').value);
    document.getElementById('expiryDate').value = formatDate(document.getElementById('expiryDate').value);

    
    couponForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        
        const formData = new FormData(couponForm);
        const couponData = Object.fromEntries(formData.entries());

        console.log("Form Data: ", couponData); 

        
        if (!couponData.code || !couponData.start || !couponData.expiry || !couponData.minAmount ||
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
            const response = await fetch(`/admin/edit-coupon/${couponId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(couponData),
            });

            const result = await response.json();
            console.log('Server Response:', result);  

            if (result.success) {
                Swal.fire('Success!', 'Coupon updated successfully!', 'success')
                    .then(() => window.location.href = '/admin/coupon');
            } else {
                Swal.fire('Error', result.message || 'Failed to update coupon.', 'error');
            }
        } catch (error) {
            console.error('Fetch Error:', error);
            Swal.fire('Error', 'Something went wrong! Try again.', 'error');
        }
    });
});