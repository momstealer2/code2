/**
 * MERSSH Jewellery — Best Sellers Page Script
 * Handles: mobile drawer, filter/sort, scroll reveal,
 *          cart drawer (add, update, remove, persist),
 *          wishlist toggle, scroll-to-top, swipe gestures
 */

document.addEventListener('DOMContentLoaded', () => {

    function getCorrectedPath(path) {
        if (!path) return '';
        const isRoot = !window.location.pathname.includes('/assets/');
        if (isRoot) {
            if (path.startsWith('../images/')) {
                return path.replace('../images/', 'assets/images/');
            }
        } else {
            if (path.startsWith('assets/images/')) {
                return path.replace('assets/images/', '../images/');
            }
            if (path.includes('images/')) {
                const parts = path.split('images/');
                return '../images/' + parts[1];
            }
        }
        return path;
    }

    /* ─── Mobile Menu Drawer ─── */
    const mobileMenuBtn  = document.getElementById('mobileMenuBtn');
    const mobileDrawer   = document.getElementById('mobileDrawer');
    const drawerOverlay  = document.getElementById('mobileDrawerOverlay');
    const closeDrawerBtn = document.getElementById('closeMobileDrawerBtn');

    const lockScroll   = () => { document.body.style.overflow = 'hidden'; document.body.style.touchAction = 'none'; };
    const unlockScroll = () => { document.body.style.overflow = '';       document.body.style.touchAction = ''; };

    function openDrawer() {
        if (!mobileDrawer) return;
        mobileDrawer.classList.add('open');
        drawerOverlay.style.display = 'block';
        requestAnimationFrame(() => drawerOverlay.classList.add('active'));
        lockScroll();
    }

    function closeDrawer() {
        if (!mobileDrawer) return;
        mobileDrawer.classList.remove('open');
        drawerOverlay.classList.remove('active');
        setTimeout(() => { drawerOverlay.style.display = 'none'; }, 320);
        unlockScroll();
    }

    if (mobileMenuBtn)  mobileMenuBtn.addEventListener('click', openDrawer);
    if (closeDrawerBtn) closeDrawerBtn.addEventListener('click', closeDrawer);
    if (drawerOverlay)  drawerOverlay.addEventListener('click', closeDrawer);

    /* ─── Swipe-to-close drawer ─── */
    let touchStartX = 0;
    if (mobileDrawer) {
        mobileDrawer.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
        mobileDrawer.addEventListener('touchend', e => {
            if (e.changedTouches[0].clientX - touchStartX < -60) closeDrawer();
        }, { passive: true });
    }

    /* ─── Mobile Dropdown Menus ─── */
    document.querySelectorAll('.mobile-dropdown-toggle').forEach(toggle => {
        toggle.addEventListener('click', e => {
            e.preventDefault();
            const submenu = toggle.nextElementSibling;
            const parent  = toggle.closest('.mobile-dropdown');
            if (submenu) submenu.classList.toggle('open');
            if (parent)  parent.classList.toggle('active');
            // flip caret icon
            const caret = toggle.querySelector('.ph-caret-down, .ph-caret-up');
            if (caret) {
                caret.classList.toggle('ph-caret-down');
                caret.classList.toggle('ph-caret-up');
            }
        });
    });

    /* Close drawer when a non-toggle link is clicked */
    document.querySelectorAll('.mobile-nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            if (!link.classList.contains('mobile-dropdown-toggle')) closeDrawer();
        });
    });

    /* ─── Escape key closes all drawers ─── */
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') { closeDrawer(); closeCart(); }
    });

    /* ─── Header scroll shadow + hide-on-scroll (mobile) ─── */
    const header = document.querySelector('.header');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const current = window.pageYOffset;
        if (header) {
            header.style.boxShadow = current > 80
                ? '0 10px 25px rgba(0,0,0,.08)'
                : '';
            if (window.innerWidth <= 768) {
                header.style.transform = (current > lastScroll && current > 150)
                    ? 'translateY(-100%)' : 'translateY(0)';
            }
        }
        lastScroll = current;
    }, { passive: true });

    /* Reset header transform on desktop resize */
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (window.innerWidth > 768 && header) header.style.transform = 'translateY(0)';
        }, 120);
    });

    /* ─── Scroll Reveal ─── */
    const revealEls = document.querySelectorAll('.reveal');
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
        revealEls.forEach(el => el.classList.add('visible'));
    } else {
        const revealObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });

        revealEls.forEach(el => revealObserver.observe(el));
    }

    /* ─── Smooth anchor scrolling ─── */
    const filterBar = document.getElementById('filterBar');
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', e => {
            const id = anchor.getAttribute('href');
            if (id === '#' || id.length < 2) return;
            const target = document.querySelector(id);
            if (!target) return;
            e.preventDefault();
            const offset = (header?.offsetHeight || 0) + (filterBar?.offsetHeight || 0);
            window.scrollTo({ top: target.offsetTop - offset, behavior: 'smooth' });
        });
    });

    /* ─── Lazy load images ─── */
    document.querySelectorAll('img').forEach(img => {
        img.loading  = 'lazy';
        img.decoding = 'async';
        img.draggable = false;
    });

    /* ─── Wishlist Toggle ─── */
    document.querySelectorAll('.wishlist-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('active');
            const icon = btn.querySelector('i');
            if (icon) {
                icon.classList.toggle('ph-heart');
                icon.classList.toggle('ph-fill');
                icon.classList.toggle('ph-heart-fill');
            }
        });
    });

    /* ─── Filter & Sort ─── */
    const allCards   = [...document.querySelectorAll('#productsGrid .product-card')];
    const filterTabs = [...document.querySelectorAll('.filter-tab')];
    const sortSelect = document.getElementById('sortSelect');
    const noResults  = document.getElementById('noResults');

    const getPrice  = card => Number(card.querySelector('.current-price')?.textContent.replace(/[₹,]/g, '') || 0);
    const getStars  = card => (card.querySelector('.product-stars')?.textContent.match(/★/g) || []).length;
    const getReviews= card => Number(card.querySelector('.review-count')?.textContent.replace(/[()]/g, '') || 0);

    const animateCards = () => {
        allCards.filter(c => !c.classList.contains('hidden')).forEach((card, i) => {
            card.style.opacity   = '0';
            card.style.transform = 'translateY(20px)';
            requestAnimationFrame(() => {
                setTimeout(() => {
                    card.style.transition = 'opacity .4s ease, transform .4s ease';
                    card.style.opacity    = '1';
                    card.style.transform  = 'translateY(0)';
                }, i * 40);
            });
        });
    };

    const updateNoResults = () => {
        if (noResults) noResults.style.display = allCards.every(c => c.classList.contains('hidden')) ? 'block' : 'none';
    };

    let currentFilter = 'all';

    const applyFilter = cat => {
        currentFilter = cat;
        allCards.forEach(card => {
            card.classList.toggle('hidden', cat !== 'all' && card.dataset.category !== cat);
        });
        updateNoResults();
        applySort(sortSelect?.value || 'featured');
    };

    const applySort = value => {
        const visible  = allCards.filter(c => !c.classList.contains('hidden'));
        const hidden   = allCards.filter(c => c.classList.contains('hidden'));
        const grid     = document.getElementById('productsGrid');

        switch (value) {
            case 'price-asc':  visible.sort((a, b) => getPrice(a) - getPrice(b));  break;
            case 'price-desc': visible.sort((a, b) => getPrice(b) - getPrice(a));  break;
            case 'rating':     visible.sort((a, b) => getStars(b) - getStars(a) || getReviews(b) - getReviews(a)); break;
            default: break; // featured — keep original DOM order
        }

        // Re-append in sorted order, hidden cards last
        [...visible, ...hidden].forEach(card => grid.appendChild(card));
        animateCards();
    };

    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            filterTabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');
            applyFilter(tab.dataset.filter);
        });
    });

    if (sortSelect) {
        sortSelect.addEventListener('change', () => applySort(sortSelect.value));
    }

    // Initial render
    applyFilter('all');

    /* ─── Cart Manager ─── */
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
        if (cartDrawerOverlay) cartDrawerOverlay.classList.add('active');
        lockScroll();
    };

    const closeCart = () => {
        if (!cartDrawer) return;
        cartDrawer.classList.remove('open');
        if (cartDrawerOverlay) cartDrawerOverlay.classList.remove('active');
        unlockScroll();
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
            if (cartEmptyState)   cartEmptyState.style.display   = 'flex';
            if (cartItemsList)    cartItemsList.style.display     = 'none';
            if (cartDrawerFooter) cartDrawerFooter.style.display  = 'none';
        } else {
            if (cartEmptyState)   cartEmptyState.style.display   = 'none';
            if (cartDrawerFooter) cartDrawerFooter.style.display  = 'block';
            if (cartItemsList) {
                cartItemsList.style.display = 'flex';
                cartItemsList.innerHTML = cart.map(item => `
                    <div class="cart-item" data-id="${item.id}">
                        <div class="cart-item-img"><img src="${getCorrectedPath(item.imgSrc)}" alt="${item.name}"></div>
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

    const removeItem = id => {
        const item = cart.find(i => i.id === id);
        cart = cart.filter(i => i.id !== id);
        saveCart(); updateCartDOM();
        if (item) showToast(`${item.name} removed from bag.`, 'ph-trash');
    };

    const addToCart = product => {
        const existing = cart.find(i => i.id === product.id);
        if (existing) {
            existing.quantity++;
        } else {
            cart.push({ ...product, quantity: 1 });
        }
        saveCart(); updateCartDOM();
        openCart();
        showToast(`${product.name} added to bag!`, 'ph-shopping-bag-open');
    };

    /* Wire cart icon → open drawer */
    if (cartIcon) cartIcon.addEventListener('click', e => { e.preventDefault(); openCart(); });
    if (closeCartBtn) closeCartBtn.addEventListener('click', closeCart);
    if (cartDrawerOverlay) cartDrawerOverlay.addEventListener('click', closeCart);

    /* ─── Wire ADD TO CART buttons (product grid + spotlight) ─── */
    const wireAddToCartBtns = () => {
        document.querySelectorAll('.btn-add-cart').forEach(button => {
            // Avoid double-wiring
            if (button.dataset.wired) return;
            button.dataset.wired = '1';

            button.addEventListener('click', () => {
                const card   = button.closest('.product-card, .spotlight-card');
                const name   = card
                    ? (card.querySelector('h4, h3')?.textContent.trim() || 'Product')
                    : button.dataset.name || 'Product';
                const priceEl = card?.querySelector('.current-price');
                const price  = priceEl
                    ? parseInt(priceEl.textContent.replace(/[₹,]/g, ''), 10)
                    : parseInt(button.dataset.price || '0', 10);
                const imgEl  = card?.querySelector('img');
                const imgSrc = imgEl ? imgEl.getAttribute('src') : '';
                const id     = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                addToCart({ id, name, price, imgSrc });
            });
        });
    };

    wireAddToCartBtns();

    /* Initialise badge on page load */
    updateCartDOM();

    /* ─── Scroll-to-top button ─── */
    const scrollTopBtn = document.createElement('button');
    scrollTopBtn.className = 'scroll-top-btn';
    scrollTopBtn.innerHTML = '<i class="ph ph-arrow-up"></i>';
    scrollTopBtn.setAttribute('aria-label', 'Scroll to top');
    Object.assign(scrollTopBtn.style, {
        position: 'fixed', right: '20px', bottom: '100px',
        width: '44px', height: '44px', border: 'none',
        borderRadius: '50%', background: '#0a0a0a', color: '#fff',
        fontSize: '18px', cursor: 'pointer', opacity: '0',
        visibility: 'hidden', transition: '.3s', zIndex: '999',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
    });
    document.body.appendChild(scrollTopBtn);

    const toggleScrollTop = () => {
        const show = window.scrollY > 500;
        scrollTopBtn.style.opacity    = show ? '1' : '0';
        scrollTopBtn.style.visibility = show ? 'visible' : 'hidden';
    };

    window.addEventListener('scroll', toggleScrollTop, { passive: true });
    scrollTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    /* ─── Set CSS --vh variable ─── */
    const setVh = () => document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    setVh();
    window.addEventListener('resize', setVh, { passive: true });

    /* ─── Page show / visibility change ─── */
    window.addEventListener('pageshow', () => { toggleScrollTop(); updateCartDOM(); });
    document.addEventListener('visibilitychange', () => { if (!document.hidden) toggleScrollTop(); });

    /* ─── Reduced motion: kill all transitions ─── */
    if (prefersReduced) {
        document.querySelectorAll('*').forEach(el => {
            el.style.animationDuration  = '0s';
            el.style.transitionDuration = '0s';
        });
    }

});
