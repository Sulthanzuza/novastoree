
document.getElementById("couponForm").addEventListener("submit", async function(event) {
    event.preventDefault(); 

    
    const name = document.getElementById("couponName").value.trim();
    const description = document.getElementById("description").value.trim();
    
	const startDate = new Date(document.getElementById("activationDate").value);
	const expiryDate = new Date(document.getElementById("expiryDate").value);

	const discount = parseFloat(document.getElementById("discountAmount").value);
	const type = document.getElementById("usageType").value;
	const status = document.getElementById("status").value;

	
	if (!name || !description || !type || !status || isNaN(discount)) { 
		Swal.fire("Error", "All fields must be filled!", "error");
		return;
	}


	if (expiryDate <= startDate) {
		Swal.fire("Error", "Expiry date must be later than activation date!", "error");
		return;
	}

	
	if ( isNaN(discount)) { 
		Swal.fire("Error", "Amount and Discount must be valid numbers!", "error");
		return;
	}

	
	if (discount < 0) { 
		Swal.fire("Error", "Numbers cannot be negative!", "error");
		return;
	}

	
	const validTypes = ["products", "category"]; 
	if (!validTypes.includes(type)) {
		Swal.fire("Error", "Invalid offer type!", "error");
		return;
	}

	const formData = {
	    name,
	    description,
	    type,
	    start: startDate.toISOString(),
	    expiry: expiryDate.toISOString(),
	    status,
	    discount,
	    
	};

	try {
	   
	    const response = await fetch('/admin/add-offer', {
	        method: 'POST',
	        headers: {
	            'Content-Type': 'application/json',
	        },
	        body: JSON.stringify(formData),
	    });

	    const result = await response.json();

	    
	    if (result.success) {
	        Swal.fire("Success", result.message, "success").then(() => {
	            window.location.href = '/admin/offer'; 
	        });
	    } else {
	        Swal.fire("Error", result.message, "error");
	    }
	    
	} catch (error) {
	    console.error('Error:', error);
	    Swal.fire("Error", "Server Error", "error");
	}
});