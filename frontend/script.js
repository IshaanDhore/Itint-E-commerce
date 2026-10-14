document.addEventListener('DOMContentLoaded', () => {
    // API Base URL (configurable via window.API_BASE_URL or defaults to relative /api)
    const API_BASE = window.API_BASE_URL || '/api';

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Check for payment status in URL query params on page load
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success')) {
        showOrderConfirmation({
            orderId: urlParams.get('order_id') || 'Completed',
            message: 'Your payment was successful! We have received your order.'
        });
        window.history.replaceState(null, '', window.location.pathname);
    } else if (urlParams.get('needs_refund')) {
        showOrderConfirmation({
            title: 'Order Status: Stock Limited',
            orderId: urlParams.get('order_id') || 'Pending Review',
            message: 'Payment received, but items went out of stock during processing. Our support team will process a full refund to your original payment method.',
            isWarning: true
        });
        window.history.replaceState(null, '', window.location.pathname);
    } else if (urlParams.get('canceled')) {
        showToast('Payment was cancelled. Your items remain saved in your cart.');
        window.history.replaceState(null, '', window.location.pathname);
    }

    // Quantity Selector on product card
    const minusBtn = document.querySelector('.qty-btn.minus');
    const plusBtn = document.querySelector('.qty-btn.plus');
    const qtyInput = document.querySelector('.qty-input');

    if (minusBtn && plusBtn && qtyInput) {
        minusBtn.addEventListener('click', () => {
            const currentValue = parseInt(qtyInput.value, 10) || 1;
            if (currentValue > 1) {
                qtyInput.value = currentValue - 1;
            }
        });

        plusBtn.addEventListener('click', () => {
            const currentValue = parseInt(qtyInput.value, 10) || 1;
            if (currentValue < 10) {
                qtyInput.value = currentValue + 1;
            }
        });
    }

    // Cart elements
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

    // Modals
    const checkoutModal = document.getElementById('checkout-modal');
    const checkoutOverlay = document.getElementById('checkout-overlay');
    const closeCheckoutBtn = document.getElementById('close-checkout');
    const checkoutForm = document.getElementById('checkout-form');
    const checkoutErrorMsg = document.getElementById('checkout-error-msg');

    const confirmationOverlay = document.getElementById('confirmation-overlay');
    const confirmationModal = document.getElementById('confirmation-modal');
    const confirmationTitle = document.getElementById('confirmation-title');
    const confirmationDesc = document.getElementById('confirmation-desc');
    const confirmationDetails = document.getElementById('confirmation-details');
    const continueShoppingBtn = document.getElementById('continue-shopping-btn');

    let PRICE_PER_ITEM = 18.00;
    let productId = 1;
    let productName = "Signature Cherry Tint";

    // Validate cart loaded from localStorage (positive integer IDs and quantities)
    function loadValidCart() {
        try {
            const stored = JSON.parse(localStorage.getItem('itint_cart'));
            if (!Array.isArray(stored)) return [];
            return stored.filter(item => (
                item &&
                typeof item === 'object' &&
                Number.isInteger(Number(item.id)) &&
                Number(item.id) > 0 &&
                Number.isInteger(Number(item.qty)) &&
                Number(item.qty) > 0
            )).map(item => ({
                id: Number(item.id),
                name: String(item.name || 'Signature Cherry Tint').slice(0, 100),
                price: typeof item.price === 'number' && item.price > 0 ? item.price : PRICE_PER_ITEM,
                qty: Math.min(Math.max(1, parseInt(item.qty, 10)), 10)
            }));
        } catch {
            return [];
        }
    }

    let cart = loadValidCart();

    function saveCart() {
        localStorage.setItem('itint_cart', JSON.stringify(cart));
    }

    function showToast(message) {
        if (!toast) return;
        toast.replaceChildren();
        const iconSpan = document.createElement('span');
        iconSpan.textContent = '✓ ';
        iconSpan.style.color = 'var(--accent-color)';
        iconSpan.style.fontWeight = 'bold';
        const textSpan = document.createElement('span');
        textSpan.textContent = message;
        toast.appendChild(iconSpan);
        toast.appendChild(textSpan);
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3500);
    }

    function setCheckoutError(message) {
        if (!checkoutErrorMsg) return;
        if (message) {
            checkoutErrorMsg.textContent = message;
            checkoutErrorMsg.classList.add('show');
        } else {
            checkoutErrorMsg.textContent = '';
            checkoutErrorMsg.classList.remove('show');
        }
    }

    function showOrderConfirmation({ title, message, orderId, isWarning = false }) {
        if (!confirmationModal || !confirmationOverlay) return;
        if (title && confirmationTitle) confirmationTitle.textContent = title;
        if (message && confirmationDesc) confirmationDesc.textContent = message;

        if (confirmationDetails) {
            confirmationDetails.replaceChildren();
            if (orderId) {
                const row = document.createElement('div');
                const label = document.createElement('span');
                label.textContent = 'Reference ID:';
                const val = document.createElement('strong');
                val.textContent = orderId;
                row.appendChild(label);
                row.appendChild(val);
                confirmationDetails.appendChild(row);
            }
        }

        confirmationOverlay.classList.add('show');
        confirmationModal.classList.add('show');
    }

    function closeOrderConfirmation() {
        if (!confirmationModal || !confirmationOverlay) return;
        confirmationOverlay.classList.remove('show');
        confirmationModal.classList.remove('show');
    }

    if (continueShoppingBtn) {
        continueShoppingBtn.addEventListener('click', closeOrderConfirmation);
    }
    if (confirmationOverlay) {
        confirmationOverlay.addEventListener('click', closeOrderConfirmation);
    }

    // Fetch product details from backend dynamically
    async function loadProduct() {
        try {
            const response = await fetch(`${API_BASE}/products`);
            if (!response.ok) return;
            const products = await response.json();
            if (Array.isArray(products) && products.length > 0) {
                const product = products[0];
                PRICE_PER_ITEM = parseFloat(product.price) || 18.00;
                productId = product.id;
                productName = product.name;
                const priceEl = document.querySelector('.price');
                if (priceEl) {
                    priceEl.textContent = `$${PRICE_PER_ITEM.toFixed(2)}`;
                }
                updateCartUI();
            }
        } catch (error) {
            console.warn("Using offline catalog defaults:", error);
        }
    }
    loadProduct();

    function openCart() {
        if (cartDrawer && cartOverlay) {
            cartDrawer.classList.add('open');
            cartOverlay.classList.add('show');
        }
    }

    function closeCart() {
        if (cartDrawer && cartOverlay) {
            cartDrawer.classList.remove('open');
            cartOverlay.classList.remove('show');
        }
    }

    // Secure DOM-based cart rendering (No innerHTML template strings)
    function updateCartUI() {
        let totalQty = 0;
        let totalPrice = 0;

        if (!cartItemsContainer) return;
        cartItemsContainer.replaceChildren();

        if (cart.length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.className = 'empty-cart-msg';
            emptyMsg.textContent = 'Your cart is empty.';
            cartItemsContainer.appendChild(emptyMsg);
        } else {
            cart.forEach((item, index) => {
                totalQty += item.qty;
                const itemPrice = item.price || PRICE_PER_ITEM;
                const itemTotal = item.qty * itemPrice;
                totalPrice += itemTotal;

                const itemEl = document.createElement('div');
                itemEl.className = 'cart-item';

                const imgDiv = document.createElement('div');
                imgDiv.className = 'cart-item-img';
                imgDiv.textContent = 'itint';

                const infoDiv = document.createElement('div');
                infoDiv.className = 'cart-item-info';

                const title = document.createElement('h4');
                title.textContent = item.name || 'Signature Cherry Tint';

                const qtyControls = document.createElement('div');
                qtyControls.className = 'cart-qty-controls';

                const minus = document.createElement('button');
                minus.type = 'button';
                minus.className = 'cart-qty-btn minus';
                minus.textContent = '-';
                minus.addEventListener('click', () => {
                    if (cart[index].qty > 1) {
                        cart[index].qty -= 1;
                    } else {
                        cart.splice(index, 1);
                    }
                    updateCartUI();
                });

                const qtySpan = document.createElement('span');
                qtySpan.className = 'cart-item-qty';
                qtySpan.textContent = String(item.qty);

                const plus = document.createElement('button');
                plus.type = 'button';
                plus.className = 'cart-qty-btn plus';
                plus.textContent = '+';
                plus.addEventListener('click', () => {
                    if (cart[index].qty < 10) {
                        cart[index].qty += 1;
                        updateCartUI();
                    }
                });

                qtyControls.appendChild(minus);
                qtyControls.appendChild(qtySpan);
                qtyControls.appendChild(plus);

                const priceDiv = document.createElement('div');
                priceDiv.className = 'cart-item-price';
                priceDiv.textContent = `$${itemTotal.toFixed(2)}`;

                infoDiv.appendChild(title);
                infoDiv.appendChild(qtyControls);
                infoDiv.appendChild(priceDiv);

                itemEl.appendChild(imgDiv);
                itemEl.appendChild(infoDiv);
                cartItemsContainer.appendChild(itemEl);
            });
        }

        if (cartCount) cartCount.textContent = String(totalQty);
        if (cartTotalPrice) cartTotalPrice.textContent = `$${totalPrice.toFixed(2)}`;
        saveCart();
    }

    // Initial render
    updateCartUI();

    if (cartIcon) cartIcon.addEventListener('click', openCart);
    if (closeCartBtn) closeCartBtn.addEventListener('click', closeCart);
    if (cartOverlay) cartOverlay.addEventListener('click', closeCart);

    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', () => {
            const qty = parseInt(qtyInput ? qtyInput.value : '1', 10) || 1;
            const existingIndex = cart.findIndex(item => item.id === productId);

            if (existingIndex > -1) {
                cart[existingIndex].qty = Math.min(10, cart[existingIndex].qty + qty);
            } else {
                cart.push({
                    id: productId,
                    name: productName,
                    price: PRICE_PER_ITEM,
                    qty: qty
                });
            }

            updateCartUI();
            showToast(`Added ${qty} item(s) to cart`);
            openCart();
        });
    }

    function openCheckoutModal() {
        setCheckoutError('');
        if (checkoutModal && checkoutOverlay) {
            checkoutModal.classList.add('show');
            checkoutOverlay.classList.add('show');
        }
    }

    function closeCheckoutModal() {
        if (checkoutModal && checkoutOverlay) {
            checkoutModal.classList.remove('show');
            checkoutOverlay.classList.remove('show');
        }
    }

    if (closeCheckoutBtn) closeCheckoutBtn.addEventListener('click', closeCheckoutModal);
    if (checkoutOverlay) checkoutOverlay.addEventListener('click', closeCheckoutModal);

    // Geolocation with user consent & backend proxy
    const useLocationBtn = document.getElementById('use-current-location');
    if (useLocationBtn) {
        useLocationBtn.addEventListener('click', () => {
            const consent = confirm("itint would like to access your device's location to automatically fill your delivery address. Do you want to proceed?");
            if (!consent) return;

            const originalText = useLocationBtn.textContent;
            useLocationBtn.textContent = 'Locating...';

            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(async (position) => {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;

                    const mapContainer = document.getElementById('map-container');
                    if (mapContainer) {
                        mapContainer.replaceChildren();
                        const iframe = document.createElement('iframe');
                        iframe.width = '100%';
                        iframe.height = '100%';
                        iframe.frameBorder = '0';
                        iframe.scrolling = 'no';
                        iframe.src = `https://www.openstreetmap.org/export/embed.html?bbox=${lon-0.01},${lat-0.01},${lon+0.01},${lat+0.01}&layer=mapnik&marker=${lat},${lon}`;
                        mapContainer.appendChild(iframe);
                    }

                    try {
                        const response = await fetch(`${API_BASE}/reverse-geocode?lat=${lat}&lon=${lon}`);
                        if (response.ok) {
                            const data = await response.json();
                            if (data && data.address) {
                                const addr = data.address;
                                const street = [addr.house_number, addr.road].filter(Boolean).join(' ') || addr.neighbourhood || '';
                                document.getElementById('address-street').value = street;
                                document.getElementById('address-city').value = addr.city || addr.town || addr.village || addr.county || '';
                                document.getElementById('address-state').value = addr.state || '';
                                document.getElementById('address-zip').value = addr.postcode || '';
                                document.getElementById('address-country').value = addr.country || '';
                            }
                        } else {
                            console.warn("Reverse geocode proxy returned non-200:", response.status);
                        }
                    } catch (err) {
                        console.error('Error in address reverse geocode:', err);
                    }
                    useLocationBtn.textContent = 'Location Found';
                }, (error) => {
                    console.warn('Geolocation error:', error);
                    alert('Unable to retrieve your location. Please enter your address manually.');
                    useLocationBtn.textContent = originalText;
                });
            } else {
                alert('Geolocation is not supported by your browser.');
                useLocationBtn.textContent = originalText;
            }
        });
    }

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (cart.length === 0) {
                alert("Your cart is empty!");
                return;
            }
            closeCart();
            openCheckoutModal();
        });
    }

    if (checkoutForm) {
        checkoutForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            setCheckoutError('');

            const email = (document.getElementById('checkout-email').value || '').trim();
            const phone = (document.getElementById('checkout-phone').value || '').trim();
            const street = (document.getElementById('address-street').value || '').trim();
            const city = (document.getElementById('address-city').value || '').trim();
            const state = (document.getElementById('address-state').value || '').trim();
            const zip = (document.getElementById('address-zip').value || '').trim();
            const country = (document.getElementById('address-country').value || '').trim();

            if (!email || !phone || !street || !city || !state || !zip || !country) {
                setCheckoutError('Please fill in all contact and address fields.');
                return;
            }

            const submitBtn = checkoutForm.querySelector('.submit-checkout-btn');
            const submitBtnText = submitBtn.querySelector('.btn-text');
            const originalBtnText = submitBtnText ? submitBtnText.textContent : 'Proceed to Payment';

            if (submitBtnText) submitBtnText.textContent = "Processing...";
            submitBtn.disabled = true;

            try {
                const response = await fetch(`${API_BASE}/checkout`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        items: cart.map(item => ({
                            product_id: item.id,
                            quantity: item.qty
                        })),
                        customer_email: email,
                        phone_number: phone,
                        shipping_address: {
                            street: street,
                            city: city,
                            state: state,
                            zip: zip,
                            country: country
                        }
                    })
                });

                const data = await response.json();

                if (!response.ok || data.error) {
                    const errorMsg = data.error || 'Failed to initialize checkout session.';
                    setCheckoutError(errorMsg);
                    if (submitBtnText) submitBtnText.textContent = originalBtnText;
                    submitBtn.disabled = false;
                    return;
                }

                if (data.order_id) {
                    closeCheckoutModal();

                    const options = {
                        "key": data.key_id,
                        "amount": data.amount,
                        "currency": data.currency || "INR",
                        "name": "itint",
                        "description": "Liptint Purchase by Aline",
                        "order_id": data.order_id,
                        "handler": async function (rzpResponse) {
                            try {
                                const verifyRes = await fetch(`${API_BASE}/verify-payment`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        razorpay_payment_id: rzpResponse.razorpay_payment_id,
                                        razorpay_order_id: rzpResponse.razorpay_order_id,
                                        razorpay_signature: rzpResponse.razorpay_signature
                                    })
                                });

                                const verifyData = await verifyRes.json();

                                if (verifyRes.ok && verifyData.status === 'success') {
                                    cart = [];
                                    saveCart();
                                    updateCartUI();
                                    showOrderConfirmation({
                                        title: 'Order Confirmed!',
                                        message: `Thank you for your order! A confirmation receipt has been sent to ${email}.`,
                                        orderId: rzpResponse.razorpay_payment_id
                                    });
                                } else if (verifyData.status === 'needs_refund') {
                                    cart = [];
                                    saveCart();
                                    updateCartUI();
                                    showOrderConfirmation({
                                        title: 'Payment Received — Out of Stock',
                                        message: verifyData.message || 'Payment received, but items went out of stock. A full refund will be processed.',
                                        orderId: rzpResponse.razorpay_payment_id,
                                        isWarning: true
                                    });
                                } else {
                                    alert(verifyData.error || "Payment verification failed. Please contact support.");
                                }
                            } catch (verifyErr) {
                                console.error("Payment verification network error:", verifyErr);
                                alert("A network error occurred while verifying your payment. Please check your order status.");
                            }
                        },
                        "prefill": {
                            "email": email,
                            "contact": phone
                        },
                        "theme": {
                            "color": "#d2042d"
                        },
                        "modal": {
                            "ondismiss": function() {
                                showToast("Payment cancelled. Your items remain in your cart.");
                                if (submitBtnText) submitBtnText.textContent = originalBtnText;
                                submitBtn.disabled = false;
                            }
                        }
                    };

                    const rzp = new Razorpay(options);
                    rzp.on('payment.failed', function (failResp) {
                        alert(`Payment failed: ${failResp.error.description || 'Transaction declined.'}`);
                        if (submitBtnText) submitBtnText.textContent = originalBtnText;
                        submitBtn.disabled = false;
                    });
                    rzp.open();
                }
            } catch (error) {
                console.error("Checkout submission error:", error);
                setCheckoutError("Unable to connect to the store server. Please try again.");
                if (submitBtnText) submitBtnText.textContent = originalBtnText;
                submitBtn.disabled = false;
            }
        });
    }
});
