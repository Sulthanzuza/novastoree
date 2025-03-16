
document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("inviteUserBtn").addEventListener("click", async function () {
        try {
            const response = await fetch('/user/referral', { method: 'GET' });

            if (!response.ok) {
                throw new Error("Failed to fetch referral code");
            }


            const data = await response.json();

            document.getElementById("referralCode").innerText = data.referralCode;

            
            $("#referralModal").modal("show");

        } catch (error) {
            console.error("Error fetching referral code:", error);
            alert("Failed to fetch referral code. Please try again."+error);
        }
    });


document.querySelector("#close").addEventListener("click", function() {
    $("#referralModal").modal("hide");

});


   
    document.getElementById("copyReferralBtn").addEventListener("click", function () {
        const referralCode = document.getElementById("referralCode").innerText;
        navigator.clipboard.writeText(referralCode).then(() => {
            Swal.fire("Referral code copied to clipboard!");
        }).catch(err => {
            console.error("Failed to copy text: ", err);
        });
    });
});