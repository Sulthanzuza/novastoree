

function confirmAction(url, actionType) {
    if (actionType === "cancel") {
        showCancelModal(url);
    } else {
        showReturnPrompt(url);
    }
}
function showCancelModal(url) {
    document.getElementById("cancelUrl").value = url;
    var cancelModal = new bootstrap.Modal(document.getElementById("cancelOrderModal"));
    cancelModal.show();
}
function showReturnPrompt(url) {
    Swal.fire({
        title: "Why are you returning this product?",
        input: "text",
        inputPlaceholder: "Enter your reason here...",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Submit",
        preConfirm: (reason) => {
            if (!reason) {
                Swal.showValidationMessage("Please enter a reason for returning the product.");
            }
            return reason;
        }
    }).then((result) => {
        if (result.isConfirmed) {
            sendActionRequest(url, result.value, "Product returned successfully!");
        }
    });
}

function downloadInvoice(orderId) {
  window.open(`/user/invoice/${orderId}`, "_blank");
}


function sendActionRequest(url, reason, successMessage) {
    fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            Swal.fire("Success!", successMessage, "success").then(() => {
                
                const actionType = url.includes('return-product') ? 'Returned' : 'Cancelled';
                updateProductStatus(url, actionType);
            });
        } else {
            Swal.fire("Error!", data.message || "Something went wrong!", "error");
        }
    })
    .catch(error => {
        console.error("Error:", error);
        Swal.fire("Error!", "Something went wrong!", "error");
    });
}

function updateProductStatus(url, newStatus) {
    console.log("Setting status to:", newStatus);
    
    
    const urlParts = url.split('/');
    const orderId = urlParts[urlParts.length - 3];
    const productId = urlParts[urlParts.length - 2];
    const variantId = urlParts[urlParts.length - 1];
    
   
    const productElements = document.querySelectorAll('.order-details');
    
    productElements.forEach(element => {
       
        const buttons = element.querySelectorAll('button');
        let productMatch = false;
        
        buttons.forEach(button => {
            const onclick = button.getAttribute('onclick');
            if (onclick && onclick.includes(orderId) && onclick.includes(productId) && onclick.includes(variantId)) {
                productMatch = true;
            }
        });
        
        if (productMatch) {
         
            const statusElement = element.querySelector('.status-text');
            if (statusElement) {
                statusElement.textContent = newStatus;
            }
            
            
            buttons.forEach(button => {
                button.remove();
            });
        }
    });
    
   
    updateDownloadInvoiceButton();
}


function updateDownloadInvoiceButton() {
    const allProducts = document.querySelectorAll('.order-details');
    let allCompleted = true;
    let hasDelivered = false;
    let allCancelledOrReturned = true;

    allProducts.forEach(product => {
        const status = product.querySelector('.status-text').textContent.trim();

   
        if (status === "Pending" || status === "Processing") {
            allCompleted = false;
        }

       
        if (status === "Delivered") {
            hasDelivered = true;
        }


        if (status !== "Return Approved" && status !== "Cancelled") {
            allCancelledOrReturned = false;
        }
    });

    const downloadButton = document.querySelector('.download-button');
    if (downloadButton) {
     
        if (allCompleted && hasDelivered && !allCancelledOrReturned) {
            downloadButton.style.display = 'block';
        } else {
            downloadButton.style.display = 'none';
        }
    }
}



function showReturnPrompt(url) {
    Swal.fire({
        title: "Why are you returning this product?",
        input: "text",
        inputPlaceholder: "Enter your reason here...",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Submit",
        preConfirm: (reason) => {
            if (!reason) {
                Swal.showValidationMessage("Please enter a reason for returning the product.");
            }
            return reason;
        }
    }).then((result) => {
        if (result.isConfirmed) {
            sendActionRequest(url, result.value, "Product return request submitted successfully!");
        }
    });
}


document.getElementById("confirmCancelBtn").addEventListener("click", function () {
    const selectedReason = document.querySelector("input[name='cancelReason']:checked");
    const cancelModal = bootstrap.Modal.getInstance(document.getElementById("cancelOrderModal"));

    if (!selectedReason) {
        Swal.fire("Error", "Please select a reason for cancellation!", "warning");
        return;
    }

    sendActionRequest(document.getElementById("cancelUrl").value, selectedReason.value, "Product cancelled successfully!");
    
    
    cancelModal.hide();
});
