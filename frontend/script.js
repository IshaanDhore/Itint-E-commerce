document.addEventListener('DOMContentLoaded', () => {
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // Check for payment status
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success')) {
        alert("Payment successful! Thank you for your order.");
        window.history.replaceState(null, '', window.location.pathname);
    } else if (urlParams.get('canceled')) {
        alert("Payment canceled. Please try again when you are ready.");
        window.history.replaceState(null, '', window.location.pathname);
    }

    // Quantity Selector
    const minusBtn = document.querySelector('.qty-btn.minus');
    const plusBtn = document.querySelector('.qty-btn.plus');
    const qtyInput = document.querySelector('.qty-input');

    if (minusBtn && plusBtn && qtyInput) {
        minusBtn.addEventListener('click', () => {
            let currentValue = parseInt(qtyInput.value);
            if (currentValue > 1) {
                qtyInput.value = currentValue - 1;
            }
        });

        plusBtn.addEventListener('click', () => {
            let currentValue = parseInt(qtyInput.value);
            if (currentValue < 10) { // arbitrary max limit
                qtyInput.value = currentValue + 1;
            }
        });
    }

    // Cart Drawer Functionality
    const addToCartBtn = document.getElementById('add-to-cart');
    const cartCount = document.querySelector('.cart-count');
    const toast = document.getElementById('toast');
    
    const cartIcon = document.querySelector('.cart-icon');
    const cartDrawer = document.getElementById('cart-drawer');
    const cartOverlay = document.getElementById('cart-overlay');
    const closeCartBtn = document.getElementById('close-cart');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalPrice = document.getElementById('cart-total-price');
    const checkoutBtn = document.querySelector('.checkout-btn');
    
    let cart = JSON.parse(localStorage.getItem('itint_cart')) || [];
    let PRICE_PER_ITEM = 18.00;
    let productId = null;
    let productName = "Signature Cherry Tint";

    function saveCart() {
        localStorage.setItem('itint_cart', JSON.stringify(cart));
    }

    // Fetch product details from backend
    async function loadProduct() {
        try {
            const response = await fetch('http://localhost:8000/api/products');
            const products = await response.json();
            if (products.length > 0) {
                const product = products[0]; // Assuming one product for now
                PRICE_PER_ITEM = product.price;
                productId = product.id;
                productName = product.name;
                document.querySelector('.price').textContent = `$${parseFloat(PRICE_PER_ITEM).toFixed(2)}`;
                updateCartUI(); // Update UI in case prices changed
            }
        } catch (error) {
            console.error("Error fetching product:", error);
        }
    }
    loadProduct();

    function openCart() {
        cartDrawer.classList.add('open');
        cartOverlay.classList.add('show');
    }

    function closeCart() {
        cartDrawer.classList.remove('open');
        cartOverlay.classList.remove('show');
    }

    function updateCartUI() {
        let totalQty = 0;
        let totalPrice = 0;
        
        cartItemsContainer.innerHTML = ''; // clear current
        
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<div class="empty-cart-msg">Your cart is empty.</div>';
        } else {
            cart.forEach((item, index) => {
                totalQty += item.qty;
                const itemPrice = item.price || PRICE_PER_ITEM;
                const itemTotal = item.qty * itemPrice;
                totalPrice += itemTotal;
                
                const itemEl = document.createElement('div');
                itemEl.classList.add('cart-item');
                itemEl.innerHTML = `
                    <div class="cart-item-img">itint</div>
                    <div class="cart-item-info">
                        <h4>${item.name || 'Signature Cherry Tint'}</h4>
                        <div class="cart-qty-controls">
                            <button class="cart-qty-btn minus" data-index="${index}">-</button>
                            <span class="cart-item-qty">${item.qty}</span>
                            <button class="cart-qty-btn plus" data-index="${index}">+</button>
                        </div>
                        <div class="cart-item-price">$${itemTotal.toFixed(2)}</div>
                    </div>
                `;
                cartItemsContainer.appendChild(itemEl);
            });

            // Add event listeners to the new buttons
            document.querySelectorAll('.cart-qty-btn.minus').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const idx = e.target.getAttribute('data-index');
                    if (cart[idx].qty > 1) {
                        cart[idx].qty -= 1;
                    } else {
                        cart.splice(idx, 1); // Delete if qty reaches 0
                    }
                    updateCartUI();
                });
            });

            document.querySelectorAll('.cart-qty-btn.plus').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const idx = e.target.getAttribute('data-index');
                    cart[idx].qty += 1;
                    updateCartUI();
                });
            });
        }
        
        cartCount.textContent = totalQty;
        cartTotalPrice.textContent = `$${totalPrice.toFixed(2)}`;
        saveCart();
    }
    
    // Initial UI update from localStorage
    updateCartUI();

    cartIcon.addEventListener('click', openCart);
    closeCartBtn.addEventListener('click', closeCart);
    cartOverlay.addEventListener('click', closeCart);

    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', () => {
            const qty = parseInt(qtyInput.value) || 1;
            
            // Add to cart array, handling multiple products
            const existingItemIndex = cart.findIndex(item => item.id === (productId || 1));
            
            if (existingItemIndex > -1) {
                cart[existingItemIndex].qty += qty;
            } else {
                cart.push({ 
                    id: productId || 1, 
                    name: productName, 
                    price: PRICE_PER_ITEM,
                    qty: qty 
                });
            }
            
            updateCartUI();
            
            // Show toast
            toast.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-color)" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg> <span>Added ${qty} item(s) to cart</span>`;
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
            }, 3000);
            
            // Open the drawer
            openCart();
        });
    }

    const checkoutModal = document.getElementById('checkout-modal');
    const checkoutOverlay = document.getElementById('checkout-overlay');
    const closeCheckoutBtn = document.getElementById('close-checkout');
    const checkoutForm = document.getElementById('checkout-form');

    function openCheckoutModal() {
        checkoutModal.classList.add('show');
        checkoutOverlay.classList.add('show');
    }

    function closeCheckoutModal() {
        checkoutModal.classList.remove('show');
        checkoutOverlay.classList.remove('show');
    }

    if (closeCheckoutBtn) closeCheckoutBtn.addEventListener('click', closeCheckoutModal);
    if (checkoutOverlay) checkoutOverlay.addEventListener('click', closeCheckoutModal);

    const useLocationBtn = document.getElementById('use-current-location');
    if (useLocationBtn) {
        useLocationBtn.addEventListener('click', () => {
            const originalHtml = useLocationBtn.innerHTML;
            useLocationBtn.innerHTML = 'Locating...';
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(async (position) => {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;
                    
                    const mapContainer = document.getElementById('map-container');
                    mapContainer.innerHTML = `<iframe width="100%" height="100%" frameborder="0" scrolling="no" marginheight="0" marginwidth="0" src="https://www.openstreetmap.org/export/embed.html?bbox=${lon-0.01},${lat-0.01},${lon+0.01},${lat+0.01}&amp;layer=mapnik&amp;marker=${lat},${lon}"></iframe>`;

                    try {
                        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
                        const data = await response.json();
                        
                        if (data && data.address) {
                            const addr = data.address;
                            document.getElementById('address-street').value = (addr.road || '') + ' ' + (addr.house_number || '');
                            document.getElementById('address-city').value = addr.city || addr.town || addr.village || addr.county || '';
                            document.getElementById('address-state').value = addr.state || '';
                            document.getElementById('address-zip').value = addr.postcode || '';
                            document.getElementById('address-country').value = addr.country || '';
                        }
                    } catch (err) {
                        console.error('Error fetching address:', err);
                    }
                    useLocationBtn.innerHTML = 'Location Found';
                }, () => {
                    alert('Unable to retrieve your location');
                    useLocationBtn.innerHTML = originalHtml;
                });
            } else {
                alert('Geolocation is not supported by your browser');
                useLocationBtn.innerHTML = originalHtml;
            }
        });
    }

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (cart.length === 0) {
                alert("Your cart is empty!");
                return;
            }
            closeCart(); // close the cart drawer
            openCheckoutModal(); // open checkout form
        });
    }

    if (checkoutForm) {
        checkoutForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('checkout-email').value;
            const phone = document.getElementById('checkout-phone').value;
            const street = document.getElementById('address-street').value;
            const city = document.getElementById('address-city').value;
            const state = document.getElementById('address-state').value;
            const zip = document.getElementById('address-zip').value;
            const country = document.getElementById('address-country').value;
            
            const location = `${street}, ${city}, ${state} ${zip}, ${country}`;

            const submitBtn = checkoutForm.querySelector('.submit-checkout-btn');
            submitBtn.querySelector('.btn-text').textContent = "Processing...";
            submitBtn.disabled = true;

            try {
                // You can now send phone and location to the backend if supported.
                // For now, we still send customer_email and can pass others if needed.
                const response = await fetch('http://localhost:8000/api/checkout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        items: cart.map(item => ({
                            product_id: item.id,
                            quantity: item.qty
                        })),
                        customer_email: email,
                        customer_phone: phone,
                        customer_location: location
                    })
                });

                const data = await response.json();
                
                if (data.order_id) {
                    closeCheckoutModal(); // Hide modal before opening razorpay
                    
                    var options = {
                        "key": data.key_id,
                        "amount": data.amount,
                        "currency": data.currency,
                        "name": "itint",
                        "description": "Lip Tint Purchase",
                        "order_id": data.order_id,
                        "handler": async function (response){
                            // verify payment
                            const verifyRes = await fetch('http://localhost:8000/api/verify-payment', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    razorpay_payment_id: response.razorpay_payment_id,
                                    razorpay_order_id: response.razorpay_order_id,
                                    razorpay_signature: response.razorpay_signature
                                })
                            });
                            const verifyData = await verifyRes.json();
                            if (verifyData.status === 'success') {
                                localStorage.removeItem('itint_cart');
                                window.location.href = '?success=true';
                            } else {
                                alert("Payment verification failed!");
                            }
                        },
                        "prefill": {
                            "email": email,
                            "contact": phone
                        },
                        "theme": {
                            "color": "#e07a5f"
                        },
                        "modal": {
                            "ondismiss": function(){
                                submitBtn.textContent = "Proceed to Payment";
                                submitBtn.disabled = false;
                            }
                        }
                    };
                    var rzp1 = new Razorpay(options);
                    rzp1.open();
                } else if (data.error) {
                    alert(data.error);
                    submitBtn.textContent = "Proceed to Payment";
                    submitBtn.disabled = false;
                }
            } catch (error) {
                console.error("Error during checkout:", error);
                alert("Something went wrong. Please try again.");
                submitBtn.textContent = "Proceed to Payment";
                submitBtn.disabled = false;
            }
        });
    }
});
