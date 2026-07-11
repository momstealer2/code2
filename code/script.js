document.addEventListener('DOMContentLoaded', () => {
    // Helper to correct relative paths if we are in a subdirectory (e.g. assets/user/)
    const isSubdir = window.location.pathname.includes('/assets/user/');
    function getCorrectedPath(path) {
        if (isSubdir && path && !path.startsWith('http') && !path.startsWith('../../')) {
            return '../../' + path;
        }
        return path;
    }

    // ==========================================
    // TOAST NOTIFICATIONS
    // ==========================================
    const toastContainer = document.getElementById('toastContainer');

    function showToast(message, iconClass = 'ph-bold ph-check-circle') {
        if (!toastContainer) return;
        
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `<i class="ph ${iconClass}"></i><span>${message}</span>`;
        toastContainer.appendChild(toast);

        // Slide out and remove after 3 seconds
        setTimeout(() => {
            toast.classList.add('fade-out');
            toast.addEventListener('animationend', () => {
                toast.remove();
            });
        }, 3000);
    }

    // ==========================================
    // MOBILE NAVIGATION DRAWER
    // ==========================================
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const closeMobileDrawerBtn = document.getElementById('closeMobileDrawerBtn');
    const mobileDrawer = document.getElementById('mobileDrawer');
    const mobileDrawerOverlay = document.getElementById('mobileDrawerOverlay');
    const mobileDropdownToggle = document.querySelector('.mobile-dropdown-toggle');
    const mobileDropdown = document.querySelector('.mobile-dropdown');

    function openMobileMenu() {
        if (mobileDrawer && mobileDrawerOverlay) {
            mobileDrawer.classList.add('open');
            mobileDrawerOverlay.classList.add('active');
            document.body.style.overflow = 'hidden'; // Disable page scrolling
        }
    }

    function closeMobileMenu() {
        if (mobileDrawer && mobileDrawerOverlay) {
            mobileDrawer.classList.remove('open');
            mobileDrawerOverlay.classList.remove('active');
            document.body.style.overflow = ''; // Re-enable page scrolling
        }
    }

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', openMobileMenu);
    }

    if (closeMobileDrawerBtn) {
        closeMobileDrawerBtn.addEventListener('click', closeMobileMenu);
    }

    if (mobileDrawerOverlay) {
        mobileDrawerOverlay.addEventListener('click', closeMobileMenu);
    }

    // Mobile menu dropdown toggle
    if (mobileDropdownToggle && mobileDropdown) {
        mobileDropdownToggle.addEventListener('click', (e) => {
            e.preventDefault();
            mobileDropdown.classList.toggle('active');
        });
    }

    // ==========================================
    // WISHLIST TOGGLE (WITH LOCAL STORAGE PERSISTENCE)
    // ==========================================
    const wishlistBtns = document.querySelectorAll('.wishlist-btn');
    const wishlistNavItem = document.querySelector('.mobile-bottom-nav .nav-item i.ph-heart');
    let wishlist = [];

    // Load wishlist from Local Storage
    function loadWishlist() {
        const storedWishlist = localStorage.getItem('merssh_wishlist');
        if (storedWishlist) {
            try {
                wishlist = JSON.parse(storedWishlist);
            } catch (error) {
                console.error('Error parsing wishlist', error);
                wishlist = [];
            }
        }
        updateWishlistUI();
    }

    // Save wishlist to Local Storage
    function saveWishlist() {
        localStorage.setItem('merssh_wishlist', JSON.stringify(wishlist));
    }

    function updateWishlistUI() {
        // Update wishlist icons on cards based on current wishlist
        wishlistBtns.forEach(btn => {
            const card = btn.closest('.product-card');
            if (!card) return;
            const productName = card.querySelector('h4').textContent;
            const id = productName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const isInWishlist = wishlist.some(item => item.id === id);
            const icon = btn.querySelector('i');

            if (isInWishlist) {
                icon.className = 'ph-fill ph-heart';
                icon.style.color = '#ff4b4b';
            } else {
                icon.className = 'ph ph-heart';
                icon.style.color = '';
            }
        });

        // Update mobile bottom nav wishlist badge
        if (wishlistNavItem) {
            if (wishlist.length > 0) {
                wishlistNavItem.classList.add('ph-fill');
                wishlistNavItem.style.color = '#ff4b4b';
            } else {
                wishlistNavItem.classList.remove('ph-fill');
                wishlistNavItem.style.color = '';
            }
        }
    }

    wishlistBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const card = btn.closest('.product-card');
            if (!card) return;

            const name = card.querySelector('h4').textContent;
            const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            
            const priceText = card.querySelector('.current-price').textContent;
            const price = parseInt(priceText.replace(/[^\d]/g, ''), 10);
            
            const oldPriceEl = card.querySelector('.old-price');
            const oldPrice = oldPriceEl ? oldPriceEl.textContent : '';

            const imageEl = card.querySelector('.product-img img');
            const imgSrc = imageEl ? imageEl.getAttribute('src') : '';

            const itemIndex = wishlist.findIndex(item => item.id === id);

            if (itemIndex === -1) {
                // Add to wishlist
                wishlist.push({ id, name, price, oldPrice, imgSrc });
                showToast(`${name} added to Wishlist!`, 'ph-bold ph-heart');
            } else {
                // Remove from wishlist
                wishlist.splice(itemIndex, 1);
                showToast(`${name} removed from Wishlist.`, 'ph-bold ph-heart-break');
            }

            saveWishlist();
            updateWishlistUI();
        });
    });

    loadWishlist();

    // ==========================================
    // SHOPPING CART DRAWER (CART MANAGER)
    // ==========================================
    const cartIcon = document.querySelector('.cart-icon');
    const closeCartDrawerBtn = document.getElementById('closeCartDrawerBtn');
    const cartDrawer = document.getElementById('cartDrawer');
    const cartDrawerOverlay = document.getElementById('cartDrawerOverlay');
    const cartItemsList = document.getElementById('cartItemsList');
    const cartEmptyState = document.getElementById('cartEmptyState');
    const cartDrawerFooter = document.getElementById('cartDrawerFooter');
    
    const cartBadge = document.querySelector('.cart-count');
    const cartDrawerCount = document.querySelector('.cart-drawer-count');
    const cartSubtotalValue = document.querySelector('.cart-subtotal-value');

    let cart = [];

    // Load cart from Local Storage
    function loadCart() {
        const storedCart = localStorage.getItem('merssh_cart');
        if (storedCart) {
            try {
                cart = JSON.parse(storedCart);
            } catch (error) {
                console.error('Error parsing cart from localStorage', error);
                cart = [];
            }
        }
        updateCartDOM();
    }

    // Save cart to Local Storage
    function saveCart() {
        localStorage.setItem('merssh_cart', JSON.stringify(cart));
    }

    function openCart() {
        if (cartDrawer && cartDrawerOverlay) {
            cartDrawer.classList.add('open');
            cartDrawerOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    function closeCart() {
        if (cartDrawer && cartDrawerOverlay) {
            cartDrawer.classList.remove('open');
            cartDrawerOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    if (cartIcon) {
        cartIcon.addEventListener('click', (e) => {
            e.preventDefault();
            openCart();
        });
    }

    if (closeCartDrawerBtn) {
        closeCartDrawerBtn.addEventListener('click', closeCart);
    }

    if (cartDrawerOverlay) {
        cartDrawerOverlay.addEventListener('click', closeCart);
    }

    // Add item to cart
    function addToCart(product) {
        const existingItem = cart.find(item => item.id === product.id);

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                ...product,
                quantity: 1
            });
        }

        saveCart();
        updateCartDOM();
        openCart();
        showToast(`${product.name} added to bag!`, 'ph-bold ph-shopping-bag-open');
    }

    // Update quantity
    function updateQuantity(productId, delta) {
        const item = cart.find(item => item.id === productId);
        if (item) {
            item.quantity += delta;
            if (item.quantity <= 0) {
                removeFromCart(productId);
                return;
            }
            saveCart();
            updateCartDOM();
        }
    }

    // Remove from cart
    function removeFromCart(productId) {
        const item = cart.find(item => item.id === productId);
        const name = item ? item.name : 'Item';
        cart = cart.filter(item => item.id !== productId);
        saveCart();
        updateCartDOM();
        showToast(`${name} removed from bag.`, 'ph-bold ph-trash');
    }

    // Update Cart UI
    function updateCartDOM() {
        // Calculate totals
        const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        // Update counts and badges
        if (cartBadge) {
            cartBadge.textContent = totalItemsCount;
            // Pulse animation on update
            cartBadge.style.transform = 'scale(1.3)';
            setTimeout(() => {
                cartBadge.style.transform = 'scale(1)';
            }, 200);
        }

        if (cartDrawerCount) {
            cartDrawerCount.textContent = totalItemsCount;
        }

        if (cartSubtotalValue) {
            cartSubtotalValue.textContent = `₹${subtotal.toLocaleString('en-IN')}`;
        }

        // Toggle empty cart layout vs list layout
        if (cart.length === 0) {
            if (cartEmptyState) cartEmptyState.style.display = 'flex';
            if (cartItemsList) cartItemsList.style.display = 'none';
            if (cartDrawerFooter) cartDrawerFooter.style.display = 'none';
        } else {
            if (cartEmptyState) cartEmptyState.style.display = 'none';
            if (cartItemsList) {
                cartItemsList.style.display = 'flex';
                
                // Render items
                cartItemsList.innerHTML = cart.map(item => `
                    <div class="cart-item" data-id="${item.id}">
                        <div class="cart-item-img">
                            <img src="${getCorrectedPath(item.imgSrc)}" alt="${item.name}">
                        </div>
                        <div class="cart-item-details">
                            <h4>${item.name}</h4>
                            <div class="cart-item-price">₹${item.price.toLocaleString('en-IN')}</div>
                            <div class="cart-item-qty-remove">
                                <div class="quantity-selector">
                                    <button class="quantity-btn btn-minus" data-id="${item.id}"><i class="ph ph-minus"></i></button>
                                    <span class="quantity-val">${item.quantity}</span>
                                    <button class="quantity-btn btn-plus" data-id="${item.id}"><i class="ph ph-plus"></i></button>
                                </div>
                                <button class="remove-item-btn" data-id="${item.id}"><i class="ph ph-trash"></i></button>
                            </div>
                        </div>
                    </div>
                `).join('');

                // Re-bind quantity adjustment and delete click listeners
                cartItemsList.querySelectorAll('.btn-minus').forEach(btn => {
                    btn.addEventListener('click', () => updateQuantity(btn.dataset.id, -1));
                });
                cartItemsList.querySelectorAll('.btn-plus').forEach(btn => {
                    btn.addEventListener('click', () => updateQuantity(btn.dataset.id, 1));
                });
                cartItemsList.querySelectorAll('.remove-item-btn').forEach(btn => {
                    btn.addEventListener('click', () => removeFromCart(btn.dataset.id));
                });
            }
            if (cartDrawerFooter) cartDrawerFooter.style.display = 'block';
        }
    }

    // Attach listeners to ADD TO CART buttons on product cards
    const addToCartBtns = document.querySelectorAll('.btn-add-cart');
    addToCartBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const card = btn.closest('.product-card');
            if (!card) return;

            const name = card.querySelector('h4').textContent;
            const priceText = card.querySelector('.current-price').textContent;
            const price = parseInt(priceText.replace(/[^\d]/g, ''), 10);
            
            // Resolve correct relative image source path
            const imageEl = card.querySelector('.product-img img');
            const imgSrc = imageEl ? imageEl.getAttribute('src') : '';
            
            // Build id from name
            const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

            addToCart({ id, name, price, imgSrc });
        });
    });

    // Handle "Start Shopping" button inside empty cart drawer
    const startShoppingBtn = document.querySelector('.btn-shop-now');
    if (startShoppingBtn) {
        startShoppingBtn.addEventListener('click', closeCart);
    }

    // ==========================================
    // DYNAMIC HERO SLIDER
    // ==========================================
    const heroSection = document.querySelector('.hero');
    const prevBtn = document.querySelector('.hero-nav-arrows button[aria-label="Previous slide"]');
    const nextBtn = document.querySelector('.hero-nav-arrows button[aria-label="Next slide"]');
    const dots = document.querySelectorAll('.hero-dots .dot');
    const heroTitle = document.querySelector('.hero-content h1');
    const heroDesc = document.querySelector('.hero-content p');

    const heroSlides = [
        {
            image: 'assets/images/hero_bg.png.jpeg',
            title: 'Elevate Your<br>Everyday <span class="accent-text">Elegance</span>',
            desc: 'Premium Anti-Tarnish Korean Jewellery<br>designed for daily elegance.'
        },
        {
            image: 'assets/images/category_necklaces.png',
            title: 'Timeless Rings<br>& Premium <span class="accent-text">Charms</span>',
            desc: 'Handcrafted styles that look stunning and stand the test of time.'
        },
        {
            image: 'assets/images/category_earrings.png',
            title: 'Chic Korean<br>Minimalist <span class="accent-text">Earrings</span>',
            desc: 'Hypoallergenic, water-safe everyday staples designed with beauty.'
        }
    ];

    let currentSlide = 0;
    let autoPlayInterval;

    function renderSlide(index) {
        if (!heroSection || !heroTitle || !heroDesc) return;
        
        const slide = heroSlides[index];

        // Apply clean, smooth transition backgrounds
        heroSection.style.backgroundImage = `linear-gradient(to right, rgba(252, 249, 246, 0.95) 0%, rgba(252, 249, 246, 0.7) 45%, transparent 70%), url('${slide.image}')`;
        heroTitle.innerHTML = slide.title;
        heroDesc.innerHTML = slide.desc;

        // Update dots state
        dots.forEach((dot, idx) => {
            if (idx === index) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });

        currentSlide = index;
    }

    function nextSlide() {
        let nextIndex = (currentSlide + 1) % heroSlides.length;
        renderSlide(nextIndex);
    }

    function prevSlide() {
        let prevIndex = (currentSlide - 1 + heroSlides.length) % heroSlides.length;
        renderSlide(prevIndex);
    }

    function startAutoPlay() {
        stopAutoPlay();
        autoPlayInterval = setInterval(nextSlide, 5000); // Change slides every 5s
    }

    function stopAutoPlay() {
        if (autoPlayInterval) {
            clearInterval(autoPlayInterval);
        }
    }

    if (prevBtn) prevBtn.addEventListener('click', () => {
        prevSlide();
        startAutoPlay(); // Reset timer on click
    });

    if (nextBtn) nextBtn.addEventListener('click', () => {
        nextSlide();
        startAutoPlay(); // Reset timer on click
    });

    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            renderSlide(index);
            startAutoPlay(); // Reset timer on click
        });
    });

    // Pause slider on mouse hover
    if (heroSection) {
        heroSection.addEventListener('mouseenter', stopAutoPlay);
        heroSection.addEventListener('mouseleave', startAutoPlay);
    }

    // ==========================================
    // LIVE COUNTDOWN TIMER
    // ==========================================
    const hoursVal = document.querySelector('.countdown .time-block:nth-child(1) .num');
    const minutesVal = document.querySelector('.countdown .time-block:nth-child(2) .num');
    const secondsVal = document.querySelector('.countdown .time-block:nth-child(3) .num');

    function updateCountdown() {
        const now = new Date();
        
        // Count down to end of today (midnight)
        const midnight = new Date();
        midnight.setHours(24, 0, 0, 0);

        const diff = midnight - now;

        if (diff <= 0) {
            // Reset to next midnight
            setTimeout(updateCountdown, 1000);
            return;
        }

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        const seconds = Math.floor((diff / 1000) % 60);

        if (hoursVal) hoursVal.textContent = String(hours).padStart(2, '0');
        if (minutesVal) minutesVal.textContent = String(minutes).padStart(2, '0');
        if (secondsVal) secondsVal.textContent = String(seconds).padStart(2, '0');
    }

    // ==========================================
    // INITIALIZATION RUNS
    // ==========================================
    loadCart();
    startAutoPlay();
    
    // Start countdown updates immediately and tick every second
    updateCountdown();
    setInterval(updateCountdown, 1000);

    // Expose APIs to window for component scripts (e.g. My Account profile page)
    window.cartManager = {
        addToCart,
        updateCartDOM,
        openCart,
        closeCart,
        loadWishlist
    };
});
