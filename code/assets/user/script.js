document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // TOAST NOTIFICATIONS HELPER
    // ==========================================
    function showToast(message, iconClass = 'ph-bold ph-check-circle') {
        const toastContainer = document.getElementById('toastContainer');
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
    // TAB SWITCHING SYSTEM
    // ==========================================
    const navLinks = document.querySelectorAll('.account-nav a:not(.logout-link)');
    const tabs = document.querySelectorAll('.tab-content');

    function switchTab(targetId) {
        // Remove active class from nav links
        navLinks.forEach(link => {
            if (link.getAttribute('data-target') === targetId) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        // Hide all tabs and show target tab
        tabs.forEach(tab => {
            tab.classList.remove('active');
            tab.style.display = 'none';
        });

        const targetTab = document.getElementById(targetId);
        if (targetTab) {
            targetTab.classList.add('active');
            targetTab.style.display = 'block';

            // Custom tab initializers
            if (targetId === 'wishlist') {
                renderWishlist();
            } else if (targetId === 'saved-addresses') {
                renderAddresses();
            }
        }
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('data-target');
            switchTab(targetId);
        });
    });

    // Intercept mobile bottom navigation clicks to switch tabs
    const bottomNavItems = document.querySelectorAll('.mobile-bottom-nav a.nav-item');
    bottomNavItems.forEach(item => {
        const span = item.querySelector('span');
        if (!span) return;
        
        const text = span.textContent.toLowerCase();
        item.addEventListener('click', (e) => {
            if (text === 'wishlist') {
                e.preventDefault();
                switchTab('wishlist');
                // Remove active from other bottom nav items and highlight wishlist
                bottomNavItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');
            } else if (text === 'account') {
                e.preventDefault();
                switchTab('profile-details');
                bottomNavItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');
            }
        });
    });

    // Mock Log Out handler
    const logoutLink = document.querySelector('.account-nav a.logout-link');
    if (logoutLink) {
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            showToast('Logging out... Thank you for visiting! 👋', 'ph-bold ph-sign-out');
            setTimeout(() => {
                window.location.href = '../../index.html';
            }, 1500);
        });
    }

    // ==========================================
    // PROFILE DETAILS MANAGER
    // ==========================================
    const profileForm = document.querySelector('.account-form');
    const saveProfileBtn = document.getElementById('save-profile-btn');

    // Load Profile
    function loadProfile() {
        const savedProfile = localStorage.getItem('merssh_profile');
        if (savedProfile) {
            try {
                const profile = JSON.parse(savedProfile);
                if (document.getElementById('first-name')) document.getElementById('first-name').value = profile.firstName || '';
                if (document.getElementById('last-name')) document.getElementById('last-name').value = profile.lastName || '';
                if (document.getElementById('email')) document.getElementById('email').value = profile.email || '';
                if (document.getElementById('phone')) document.getElementById('phone').value = profile.phone || '';
            } catch (error) {
                console.error('Error parsing profile data', error);
            }
        }
    }

    if (profileForm) {
        profileForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const firstName = document.getElementById('first-name').value.trim();
            const lastName = document.getElementById('last-name').value.trim();
            const email = document.getElementById('email').value.trim();
            const phone = document.getElementById('phone').value.trim();

            if (!firstName || !lastName || !email || !phone) {
                showToast('Please fill out all fields.', 'ph-bold ph-warning-circle');
                return;
            }

            // Ripple ripple animation on button
            if (saveProfileBtn) {
                saveProfileBtn.classList.add('animating');
                saveProfileBtn.disabled = true;
            }

            setTimeout(() => {
                localStorage.setItem('merssh_profile', JSON.stringify({ firstName, lastName, email, phone }));
                
                if (saveProfileBtn) {
                    saveProfileBtn.classList.remove('animating');
                    saveProfileBtn.disabled = false;
                }
                
                showToast('Profile settings saved successfully!', 'ph-bold ph-check-circle');
            }, 1000);
        });
    }

    // ==========================================
    // WISHLIST MANAGER
    // ==========================================
    function renderWishlist() {
        const wishlistTab = document.getElementById('wishlist');
        if (!wishlistTab) return;

        // Clear any existing custom rendered content
        const existingGrid = wishlistTab.querySelector('.products-carousel');
        if (existingGrid) existingGrid.remove();

        const emptyState = wishlistTab.querySelector('.empty-state');
        let wishlist = [];

        try {
            wishlist = JSON.parse(localStorage.getItem('merssh_wishlist')) || [];
        } catch (e) {
            wishlist = [];
        }

        if (wishlist.length === 0) {
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';

        // Render products grid
        const grid = document.createElement('div');
        grid.className = 'products-carousel';
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(220px, 1fr))';
        grid.style.gap = '20px';
        grid.style.marginTop = '20px';

        grid.innerHTML = wishlist.map(item => {
            // Correct the relative path since we are in assets/user/
            let imgSrc = item.imgSrc || '';
            if (imgSrc && !imgSrc.startsWith('http') && !imgSrc.startsWith('../../')) {
                imgSrc = '../../' + imgSrc;
            }

            return `
                <div class="product-card" data-id="${item.id}">
                    <button class="wishlist-btn"><i class="ph-fill ph-heart" style="color: #ff4b4b;"></i></button>
                    <div class="product-img">
                        <img src="${imgSrc}" alt="${item.name}">
                    </div>
                    <div class="product-info">
                        <h4>${item.name}</h4>
                        <div class="price">
                            <span class="current-price">₹${item.price.toLocaleString('en-IN')}</span>
                            ${item.oldPrice ? `<span class="old-price">${item.oldPrice}</span>` : ''}
                        </div>
                        <button class="btn-add-cart"><i class="ph ph-shopping-cart"></i> ADD TO CART</button>
                    </div>
                </div>
            `;
        }).join('');

        wishlistTab.appendChild(grid);

        // Bind remove from wishlist buttons
        grid.querySelectorAll('.wishlist-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const card = btn.closest('.product-card');
                const id = card.dataset.id;
                const name = card.querySelector('h4').textContent;

                let currentWishlist = [];
                try {
                    currentWishlist = JSON.parse(localStorage.getItem('merssh_wishlist')) || [];
                } catch (err) {}

                currentWishlist = currentWishlist.filter(item => item.id !== id);
                localStorage.setItem('merssh_wishlist', JSON.stringify(currentWishlist));

                showToast(`${name} removed from Wishlist.`, 'ph-bold ph-heart-break');
                
                // Re-render
                renderWishlist();

                // Synchronize with root script.js loaded wishlist UI
                if (window.cartManager && window.cartManager.loadWishlist) {
                    window.cartManager.loadWishlist();
                }
            });
        });

        // Bind add to cart buttons using exposed window.cartManager
        grid.querySelectorAll('.btn-add-cart').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                
                const card = btn.closest('.product-card');
                const id = card.dataset.id;

                let currentWishlist = [];
                try {
                    currentWishlist = JSON.parse(localStorage.getItem('merssh_wishlist')) || [];
                } catch (err) {}

                const product = currentWishlist.find(item => item.id === id);
                if (product && window.cartManager && window.cartManager.addToCart) {
                    window.cartManager.addToCart({
                        id: product.id,
                        name: product.name,
                        price: product.price,
                        imgSrc: product.imgSrc
                    });
                }
            });
        });
    }

    // ==========================================
    // ADDRESSES MANAGER
    // ==========================================
    function setupAddressForm() {
        const addressesTab = document.getElementById('saved-addresses');
        if (!addressesTab) return;

        let formWrapper = document.getElementById('address-form-wrapper');
        if (formWrapper) return; // Form already exists

        // Create form HTML block
        formWrapper = document.createElement('div');
        formWrapper.id = 'address-form-wrapper';
        formWrapper.style.display = 'none';
        formWrapper.style.marginTop = '30px';
        formWrapper.style.borderTop = '1px solid var(--border)';
        formWrapper.style.paddingTop = '24px';

        formWrapper.innerHTML = `
            <h4 id="address-form-title" style="margin-bottom: 20px; font-size: 1.1rem; font-family: var(--font-heading);">Add New Address</h4>
            <form id="address-form">
                <input type="hidden" id="address-id">
                
                <div class="form-group floating-label-group">
                    <input type="text" id="addr-label" placeholder=" " required>
                    <label for="addr-label">Address Type (e.g. Home, Office)</label>
                </div>
                <div class="form-group floating-label-group">
                    <input type="text" id="addr-name" placeholder=" " required>
                    <label for="addr-name">Full Name</label>
                </div>
                <div class="form-group floating-label-group">
                    <input type="text" id="addr-line1" placeholder=" " required>
                    <label for="addr-line1">Address (Street Address, Apartment)</label>
                </div>
                <div class="form-group floating-label-group">
                    <input type="text" id="addr-city" placeholder=" " required>
                    <label for="addr-city">City</label>
                </div>
                <div class="form-group floating-label-group">
                    <input type="text" id="addr-state" placeholder=" " required>
                    <label for="addr-state">State / Province</label>
                </div>
                <div class="form-group floating-label-group">
                    <input type="text" id="addr-zip" placeholder=" " required>
                    <label for="addr-zip">ZIP / Postal Code</label>
                </div>
                <div class="form-group floating-label-group">
                    <input type="text" id="addr-country" placeholder=" " value="India" required>
                    <label for="addr-country">Country</label>
                </div>
                
                <div style="display: flex; gap: 12px; margin-top: 10px;">
                    <button type="submit" class="btn-primary" style="padding: 12px 24px; font-size: 0.85rem; border-radius: 6px; width: auto; cursor: pointer;">SAVE ADDRESS</button>
                    <button type="button" id="cancel-address-btn" class="btn-outline" style="padding: 12px 24px; font-size: 0.85rem; border-radius: 6px; cursor: pointer;">CANCEL</button>
                </div>
            </form>
        `;

        addressesTab.appendChild(formWrapper);

        // Cancel button click
        document.getElementById('cancel-address-btn').addEventListener('click', () => {
            formWrapper.style.display = 'none';
        });

        // Form Submit
        document.getElementById('address-form').addEventListener('submit', (e) => {
            e.preventDefault();
            
            const addrId = document.getElementById('address-id').value;
            const label = document.getElementById('addr-label').value.trim();
            const name = document.getElementById('addr-name').value.trim();
            const line1 = document.getElementById('addr-line1').value.trim();
            const city = document.getElementById('addr-city').value.trim();
            const state = document.getElementById('addr-state').value.trim();
            const zip = document.getElementById('addr-zip').value.trim();
            const country = document.getElementById('addr-country').value.trim();

            let addresses = JSON.parse(localStorage.getItem('merssh_addresses')) || [];

            if (addrId) {
                // Update
                addresses = addresses.map(addr => {
                    if (addr.id === addrId) {
                        return { ...addr, label, name, line1, city, state, zip, country };
                    }
                    return addr;
                });
                showToast('Address updated successfully!');
            } else {
                // Insert New
                const newAddr = {
                    id: 'address-' + Date.now(),
                    label,
                    name,
                    line1,
                    city,
                    state,
                    zip,
                    country,
                    isDefault: addresses.length === 0 // If first address, make it default
                };
                addresses.push(newAddr);
                showToast('New address saved successfully!');
            }

            localStorage.setItem('merssh_addresses', JSON.stringify(addresses));
            formWrapper.style.display = 'none';
            renderAddresses();
        });
    }

    function renderAddresses() {
        const addressesTab = document.getElementById('saved-addresses');
        if (!addressesTab) return;

        // Ensure form wrapper is set up
        setupAddressForm();

        // Clear static html addresses first
        const staticCard = addressesTab.querySelector('.address-card:not(.dynamic)');
        if (staticCard) staticCard.remove();

        // Get container
        let grid = addressesTab.querySelector('.addresses-grid');
        if (!grid) {
            grid = document.createElement('div');
            grid.className = 'addresses-grid';
            const subtitle = addressesTab.querySelector('.account-subtitle');
            subtitle.insertAdjacentElement('afterend', grid);
        }
        grid.innerHTML = '';

        let addresses = [];
        try {
            addresses = JSON.parse(localStorage.getItem('merssh_addresses')) || [];
        } catch (e) {
            addresses = [];
        }

        // Seeding default addresses if empty
        if (addresses.length === 0) {
            addresses = [
                {
                    id: 'address-1',
                    label: 'Home',
                    isDefault: true,
                    name: 'Jane Doe',
                    line1: '123 Elegance Street, Apartment 4B',
                    city: 'Mumbai',
                    state: 'Maharashtra',
                    zip: '400001',
                    country: 'India'
                }
            ];
            localStorage.setItem('merssh_addresses', JSON.stringify(addresses));
        }

        addresses.forEach(addr => {
            const card = document.createElement('div');
            card.className = 'address-card dynamic';
            card.innerHTML = `
                <div class="address-header">
                    <h4>${addr.label}</h4>
                    ${addr.isDefault ? '<span class="badge">Default</span>' : ''}
                </div>
                <p>${addr.name}<br>${addr.line1}<br>${addr.city}, ${addr.state} ${addr.zip}<br>${addr.country}</p>
                <div class="address-actions">
                    <button class="btn-outline edit-address-btn" data-id="${addr.id}">EDIT</button>
                    <button class="btn-outline text-danger delete-address-btn" data-id="${addr.id}">DELETE</button>
                    ${!addr.isDefault ? `<button class="btn-outline set-default-btn" data-id="${addr.id}" style="border-color: var(--gold); color: var(--gold);">SET DEFAULT</button>` : ''}
                </div>
            `;
            grid.appendChild(card);
        });

        // Add New Address action button
        const addAddressBtn = addressesTab.querySelector('.btn-secondary');
        if (addAddressBtn) {
            // Remove previous listener to avoid stack duplicate
            const newBtn = addAddressBtn.cloneNode(true);
            addAddressBtn.parentNode.replaceChild(newBtn, addAddressBtn);
            
            newBtn.addEventListener('click', () => {
                const formWrapper = document.getElementById('address-form-wrapper');
                if (formWrapper) {
                    formWrapper.style.display = 'block';
                    document.getElementById('address-form-title').textContent = 'Add New Address';
                    document.getElementById('address-id').value = '';
                    document.getElementById('address-form').reset();
                    document.getElementById('addr-country').value = 'India';
                    formWrapper.scrollIntoView({ behavior: 'smooth' });
                }
            });
        }

        // Action Handlers
        grid.querySelectorAll('.edit-address-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                const addr = addresses.find(a => a.id === id);
                if (!addr) return;

                const formWrapper = document.getElementById('address-form-wrapper');
                if (formWrapper) {
                    formWrapper.style.display = 'block';
                    document.getElementById('address-form-title').textContent = 'Edit Address';
                    document.getElementById('address-id').value = addr.id;
                    document.getElementById('addr-label').value = addr.label;
                    document.getElementById('addr-name').value = addr.name;
                    document.getElementById('addr-line1').value = addr.line1;
                    document.getElementById('addr-city').value = addr.city;
                    document.getElementById('addr-state').value = addr.state;
                    document.getElementById('addr-zip').value = addr.zip;
                    document.getElementById('addr-country').value = addr.country;
                    formWrapper.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });

        grid.querySelectorAll('.delete-address-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                const addr = addresses.find(a => a.id === id);
                if (!addr) return;

                if (confirm(`Are you sure you want to delete the address "${addr.label}"?`)) {
                    const wasDefault = addr.isDefault;
                    let currentAddresses = addresses.filter(a => a.id !== id);
                    
                    if (wasDefault && currentAddresses.length > 0) {
                        currentAddresses[0].isDefault = true;
                    }

                    localStorage.setItem('merssh_addresses', JSON.stringify(currentAddresses));
                    showToast('Address deleted successfully.', 'ph-bold ph-trash');
                    renderAddresses();
                }
            });
        });

        grid.querySelectorAll('.set-default-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                addresses.forEach(a => {
                    a.isDefault = (a.id === id);
                });
                localStorage.setItem('merssh_addresses', JSON.stringify(addresses));
                showToast('Default address set.', 'ph-bold ph-check-circle');
                renderAddresses();
            });
        });
    }

    // ==========================================
    // NOTIFICATIONS SYSTEM
    // ==========================================
    const toggles = document.querySelectorAll('.toggle-item input[type="checkbox"]');
    
    function loadNotifications() {
        const savedSettings = localStorage.getItem('merssh_notifications');
        if (savedSettings) {
            try {
                const settings = JSON.parse(savedSettings);
                toggles.forEach((checkbox, index) => {
                    if (settings[index] !== undefined) {
                        checkbox.checked = settings[index];
                    }
                });
            } catch (e) {
                console.error(e);
            }
        }
    }

    toggles.forEach((checkbox, index) => {
        checkbox.addEventListener('change', () => {
            const settings = Array.from(toggles).map(cb => cb.checked);
            localStorage.setItem('merssh_notifications', JSON.stringify(settings));
            showToast('Preferences updated successfully!', 'ph-bold ph-bell');
        });
    });

    // ==========================================
    // INITIALIZATION RUNS
    // ==========================================
    loadProfile();
    loadNotifications();

    // Check if redirect parameters exist in query (e.g. from hash or tab queries)
    const currentHash = window.location.hash;
    if (currentHash === '#wishlist') {
        switchTab('wishlist');
    }
});
