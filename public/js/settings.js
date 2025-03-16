document.getElementById("change-password-form").addEventListener("submit", async function (event) {
    event.preventDefault();

    const currentPassword = document.getElementById("current-password").value;
    const newPassword = document.getElementById("new-password").value;
    const confirmPassword = document.getElementById("confirm-password").value;
    const messageDiv = document.getElementById("message");

    
    if (newPassword !== confirmPassword) {
        messageDiv.innerHTML = "<p style='color: red;'>New passwords do not match.</p>";
        return;
    }

    try {
        const response = await fetch("/admin/change-password", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                currentPassword,
                newPassword
            }),
        });

        const result = await response.json();
        console.log(result)
        if (result.success) {
            messageDiv.innerHTML = "<p style='color: green;'>Password changed successfully.</p>";
            document.getElementById("change-password-form").reset();
        } else {
            messageDiv.innerHTML = `<p style='color: red;'>${result.message}</p>`;
        }
    } catch (error) {
        console.error("Error:", error);
        messageDiv.innerHTML = "<p style='color: red;'>Something went wrong. Please try again.</p>";
    }
});
