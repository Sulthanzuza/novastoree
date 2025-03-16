
  
  function debounce(func, timeout = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
  }
  

  document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('search-input');
    

    const processSearch = debounce(() => {
      const query = searchInput.value.trim();
      if (query.length > 0) {
        searchProducts(query);
      } else {
      
        window.location.reload();
      }
    }, 500);
    
    
    searchInput.addEventListener('input', processSearch);
  });
  
  function searchProducts(query) {
    const loadingSpinner = document.getElementById('loading-spinner');
    const productsContainer = document.getElementById('products-container');
    const noResults = document.getElementById('no-results');
    
    
    loadingSpinner.classList.remove('d-none');
    noResults.classList.add('d-none');
    
    fetch(`/admin/products/search?q=${encodeURIComponent(query)}`)
      .then(response => response.json())
      .then(data => {
        
        loadingSpinner.classList.add('d-none');
        
        if (data.success) {
         
          productsContainer.innerHTML = '';
          
          if (data.products.length === 0) {
            
            noResults.classList.remove('d-none');
          } else {
           
            data.products.forEach(product => {
              const productCard = createProductCard(product);
              productsContainer.appendChild(productCard);
            });
          }
        } else {
          showToast('Error searching products', 'error');
        }
      })
      .catch(error => {
        console.error('Error:', error);
        loadingSpinner.classList.add('d-none');
        showToast('Error searching products', 'error');
      });
  }
  
  function createProductCard(product) {
    const article = document.createElement('article');
    article.className = 'product-card';
    article.id = `product-${product._id}`;
    
    article.innerHTML = `
      <img src="/uploads/${product.image ? product.image[0] : 'default.jpg'}" alt="${product.name}" class="product-image" />
      <div class="product-details">
        <h2 class="product-name">${product.name}</h2>
        <h2 class="product-name">${product.category || ''}</h2>
        
        <div class="product-actions">
          <button class="edit-button" onclick="window.location.href='products/edit-products/${product._id}'">Edit</button>
          <button class="delete-button" onclick="confirmDelete('${product._id}')">Delete</button>
        </div>
      </div>
    `;
    
    return article;
  }
  
 function confirmDelete(productId) {
  Swal.fire({
    title: 'Are you sure?',
    text: 'You won\'t be able to revert this!',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, delete it!',
    cancelButtonText: 'Cancel',
    reverseButtons: true
  }).then((result) => {
    if (result.isConfirmed) {
      deleteProduct(productId);
      Swal.fire(
        'Deleted!',
        'The product has been deleted.',
        'success'
      );
    } else if (result.dismiss === Swal.DismissReason.cancel) {
      Swal.fire(
       
        'The product was not deleted.',
       
      );
    }
  });
}
function fetchProducts(page) {
  const loadingSpinner = document.getElementById('loading-spinner');
  const productsContainer = document.getElementById('products-container');

  loadingSpinner.classList.remove('d-none');

  fetch(`/admin/products?page=${page}`)
    .then(response => response.text())
    .then(html => {
      loadingSpinner.classList.add('d-none');
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const newProducts = doc.querySelector('.products-list').innerHTML;
      const pagination = doc.querySelector('.pagination').innerHTML;

 
      productsContainer.innerHTML = newProducts;

      
      document.querySelector('.pagination').innerHTML = pagination;
    })
    .catch(error => {
      console.error('Error:', error);
      showToast('Failed to load products', 'error');
    });
}


  
  function deleteProduct(productId) {
    fetch(`/admin/products/delete-products/${productId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        
        const productElement = document.getElementById(`product-${productId}`);
        
       
        productElement.style.transition = "opacity 0.5s ease";
        productElement.style.opacity = "0";
        
        
        setTimeout(() => {
          productElement.remove();
          showToast(data.message, 'success');
        }, 500);
      } else {
        showToast('Error deleting product', 'error');
      }
    })
    .catch(error => {
      console.error('Error:', error);
      showToast('Error deleting product', 'error');
    });
  }
  
  function showToast(message, type) {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    
    toast.className = `alert ${type === 'success' ? 'alert-success' : 'alert-danger'} alert-dismissible fade show`;
    toast.role = 'alert';
    toast.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    toastContainer.appendChild(toast);
    
    
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        toast.remove();
      }, 150);
    }, 3000);
  }
