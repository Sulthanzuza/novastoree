
document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll('.wishlist-btn').forEach(button => {
      button.addEventListener('click', async function () {
        const productId = this.getAttribute('data-product');
        const variantId = this.getAttribute('data-variant');
        const icon = this.querySelector('i');

        const response = await fetch('/user/wishlist/add-product', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: productId, variantId: variantId })
        });

        const result = await response.json();
        if (result.success) {
          Swal.fire({
            icon: 'success',
            title: result.message,
            confirmButtonText: 'OK'
          });


          icon.classList.toggle('bi-heart-fill');
          icon.classList.toggle('bi-heart');
          icon.style.color = result.message.includes('Added') ? 'red' : 'black';
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: result.message,
            confirmButtonText: 'OK'
          });
        }
      });
    });
  });