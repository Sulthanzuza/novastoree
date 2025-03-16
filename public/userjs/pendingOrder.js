
function retryPayment(orderId, orderNumber) {
    fetch(`/user/retry-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
    })
    .then(res => res.json())
    .then(data => {
    console.log("Received data:", data);  
    if (data.success) {
        initiateRetryRazorpayPayment(data);
    } else {
        Swal.fire({ icon: "error", title: "Payment Error", text: "Failed to create retry payment order." });
    }
})
    .catch(error => {
        console.error("Error retrying payment:", error);
        Swal.fire({ icon: "error", title: "Payment Error", text: "An error occurred while retrying payment." });
    });
}

function initiateRetryRazorpayPayment(order, orderNumber) {


    const options = {
        key: order.order.key,
        amount: order.order.amount,
        currency: "INR",
        order_id: order.order.id,
        handler: async function (response) {
            try {
                const verifyResponse = await fetch('/user/verify-retry-payment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        razorpay_order_id: order.order.id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature,
                        orderNumber: order.orderNumber
                    })
                });

                const verifyData = await verifyResponse.json();

                if (verifyData.success) {
                    Swal.fire({ icon: "success", title: "Payment Successful", text: "Retry payment completed!" })
                        .then(() => window.location.href = "/user/order-success");
                } else {
                    Swal.fire({ icon: "error", title: "Payment Failed", text: "Verification failed." });
                }
            } catch (error) {
                console.error("Error verifying retry payment:", error);
                Swal.fire({ icon: "error", title: "Payment Error", text: "An error occurred while verifying retry payment." });
            }
        },
        theme: { color: "#3399cc" }
    };

    const rzp1 = new Razorpay(options);
    rzp1.open();
}

