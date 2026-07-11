/**
 * MERSSH Jewellery — About Page Script
 * Handles: mobile drawer, scroll reveal animations,
 *          animated stat counters, mobile dropdown,
 *          swipe-to-close drawer on mobile,
 *          cart drawer (view/manage existing cart items)
 */

document.addEventListener('DOMContentLoaded', () => {

    /* ─── Mobile Menu Drawer ─── */
    const mobileMenuBtn  = document.getElementById('mobileMenuBtn');
    const mobileDrawer   = document.getElementById('mobileDrawer');
    const drawerOverlay  = document.getElementById('mobileDrawerOverlay');
    const closeDrawerBtn = document.getElementById('closeMobileDrawerBtn');

    function openDrawer() {
        if (!mobileDrawer) return;
        mobileDrawer.classList.add('open');
        drawerOverlay.style.display = 'block';
        // Force reflow then add active class so transition fires
        requestAnimationFrame(() => drawerOverlay.classList.add('active'));
        document.body.style.overflow = 'hidden';
    }

    function closeDrawer() {
        if (!mobileDrawer) return;
        mobileDrawer.classList.remove('open');
        drawerOverlay.classList.remove('active');
        // Wait for opacity transition before hiding
        setTimeout(() => { drawerOverlay.style.display = 'none'; }, 320);
        document.body.style.overflow = '';
    }

    if (mobileMenuBtn)  mobileMenuBtn.addEventListener('click', openDrawer);
    if (closeDrawerBtn) closeDrawerBtn.addEventListener('click', closeDrawer);
    if (drawerOverlay)  drawerOverlay.addEventListener('click', closeDrawer);

    // Close drawer on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') { closeDrawer(); closeCart(); }
    });

    /* ─── Swipe-to-close drawer (touch) ─── */
    let touchStartX = 0;
    if (mobileDrawer) {
        mobileDrawer.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
        }, { passive: true });

        mobileDrawer.addEventListener('touchend', (e) => {
            const deltaX = e.changedTouches[0].clientX - touchStartX;
            // Swipe left ≥ 60px to close
            if (deltaX < -60) closeDrawer();
        }, { passive: true });
    }

    /* ─── Mobile Dropdown Menus ─── */
    document.querySelectorAll('.mobile-dropdown-toggle').forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            const parent  = toggle.closest('.mobile-dropdown');
            const submenu = toggle.nextElementSibling;
            if (submenu) submenu.classList.toggle('open');
            if (parent)  parent.classList.toggle('active');
        });
    });

    /* ─── Scroll Reveal ─── */
    const revealEls = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');

    // On very slow devices or reduced motion, skip animations
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
        revealEls.forEach(el => el.classList.add('visible'));
    } else {
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.10, rootMargin: '0px 0px -30px 0px' });

        revealEls.forEach(el => revealObserver.observe(el));
    }

    /* ─── Animated Stat Counters ─── */
    const statNumbers = document.querySelectorAll('.stat-number[data-target]');

    function animateCounter(el) {
        const target   = parseInt(el.getAttribute('data-target'), 10);
        const suffix   = el.getAttribute('data-suffix') || '';
        const duration = 1800;
        const start    = performance.now();

        function update(now) {
            const elapsed  = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // Ease-out cubic
            const eased   = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.floor(eased * target).toLocaleString() + suffix;
            if (progress < 1) requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
    }

    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                counterObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    statNumbers.forEach(el => counterObserver.observe(el));

    /* ─── Header Scroll Shadow ─── */
    const header = document.querySelector('.header');
    let ticking = false;

    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                if (header) {
                    header.style.boxShadow = window.scrollY > 10
                        ? '0 4px 20px rgba(0,0,0,0.10)'
                        : '0 2px 10px rgba(0,0,0,0.05)';
                }
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });

    /* ─── Stagger reveal-delay for cards ─── */
    document.querySelectorAll('.value-card').forEach((card, i) => {
        card.style.transitionDelay = `${i * 0.08}s`;
    });
    document.querySelectorAll('.process-step').forEach((step, i) => {
        step.style.transitionDelay = `${i * 0.10}s`;
    });
    document.querySelectorAll('.team-card').forEach((card, i) => {
        card.style.transitionDelay = `${i * 0.10}s`;
    });

    /* ─── Active nav link highlight ─── */
    document.querySelectorAll('.desktop-nav a, .mobile-nav-links a').forEach(link => {
        if (link.getAttribute('href') === 'about.html' ||
            link.textContent.trim() === 'ABOUT US') {
            link.classList.add('active');
        }
    });

    /* ─── Cart Drawer Manager ─── */
    let cart = JSON.parse(localStorage.getItem('merssh_cart')) || [];

    const cartIcon          = document.querySelector('.cart-icon');
    const cartDrawer        = document.getElementById('cartDrawer');
    const cartDrawerOverlay = document.getElementById('cartDrawerOverlay');
    const closeCartBtn      = document.getElementById('closeCartDrawerBtn');
    const cartItemsList     = document.getElementById('cartItemsList');
    const cartEmptyState    = document.getElementById('cartEmptyState');
    const cartDrawerFooter  = document.getElementById('cartDrawerFooter');
    const cartCountBadge    = document.querySelector('.cart-count');
    const cartDrawerCount   = document.querySelector('.cart-drawer-count');
    const cartSubtotalValue = document.querySelector('.cart-subtotal-value');
    const toastContainer    = document.getElementById('toastContainer');

    const saveCart = () => localStorage.setItem('merssh_cart', JSON.stringify(cart));

    const showToast = (message, icon = 'ph-check-circle') => {
        if (!toastContainer) return;
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `<i class="ph ${icon}"></i><span>${message}</span>`;
        toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 400);
        }, 2500);
    };

    const openCart = () => {
        if (!cartDrawer) return;
        cartDrawer.classList.add('open');
        cartDrawerOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    const closeCart = () => {
        if (!cartDrawer) return;
        cartDrawer.classList.remove('open');
        cartDrawerOverlay.classList.remove('active');
        document.body.style.overflow = '';
    };

    const updateCartDOM = () => {
        const totalQty = cart.reduce((s, i) => s + i.quantity, 0);
        const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);

        if (cartCountBadge) {
            cartCountBadge.textContent = totalQty;
            cartCountBadge.style.transform = 'scale(1.3)';
            setTimeout(() => { cartCountBadge.style.transform = 'scale(1)'; }, 200);
        }
        if (cartDrawerCount)   cartDrawerCount.textContent   = totalQty;
        if (cartSubtotalValue) cartSubtotalValue.textContent = `₹${subtotal.toLocaleString('en-IN')}`;

        if (cart.length === 0) {
            if (cartEmptyState)   cartEmptyState.style.display  = 'flex';
            if (cartItemsList)    cartItemsList.style.display    = 'none';
            if (cartDrawerFooter) cartDrawerFooter.style.display = 'none';
        } else {
            if (cartEmptyState)   cartEmptyState.style.display  = 'none';
            if (cartDrawerFooter) cartDrawerFooter.style.display = 'block';
            if (cartItemsList) {
                cartItemsList.style.display = 'flex';
                cartItemsList.innerHTML = cart.map(item => `
                    <div class="cart-item" data-id="${item.id}">
                        <div class="cart-item-img"><img src="${item.imgSrc}" alt="${item.name}"></div>
                        <div class="cart-item-details">
                            <h4>${item.name}</h4>
                            <div class="cart-item-price">₹${item.price.toLocaleString('en-IN')}</div>
                            <div class="cart-item-qty-remove">
                                <div class="quantity-selector">
                                    <button class="quantity-btn btn-minus" data-id="${item.id}"><i class="ph ph-minus"></i></button>
                                    <span class="quantity-val">${item.quantity}</span>
                                    <button class="quantity-btn btn-plus"  data-id="${item.id}"><i class="ph ph-plus"></i></button>
                                </div>
                                <button class="remove-item-btn" data-id="${item.id}"><i class="ph ph-trash"></i></button>
                            </div>
                        </div>
                    </div>
                `).join('');

                cartItemsList.querySelectorAll('.btn-minus').forEach(btn =>
                    btn.addEventListener('click', () => updateQty(btn.dataset.id, -1)));
                cartItemsList.querySelectorAll('.btn-plus').forEach(btn =>
                    btn.addEventListener('click', () => updateQty(btn.dataset.id, 1)));
                cartItemsList.querySelectorAll('.remove-item-btn').forEach(btn =>
                    btn.addEventListener('click', () => removeItem(btn.dataset.id)));
            }
        }
    };

    const updateQty = (id, delta) => {
        const item = cart.find(i => i.id === id);
        if (!item) return;
        item.quantity += delta;
        if (item.quantity <= 0) { removeItem(id); return; }
        saveCart(); updateCartDOM();
    };

    const removeItem = (id) => {
        const item = cart.find(i => i.id === id);
        cart = cart.filter(i => i.id !== id);
        saveCart(); updateCartDOM();
        if (item) showToast(`${item.name} removed from bag.`, 'ph-trash');
    };

    // Wire up cart icon → open drawer
    if (cartIcon) cartIcon.addEventListener('click', e => { e.preventDefault(); openCart(); });
    if (closeCartBtn) closeCartBtn.addEventListener('click', closeCart);
    if (cartDrawerOverlay) cartDrawerOverlay.addEventListener('click', closeCart);

    // Initialise badge on page load
    updateCartDOM();

});
