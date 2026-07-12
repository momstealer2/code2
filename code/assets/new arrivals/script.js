document.addEventListener("DOMContentLoaded", () => {
const body = document.body
const header = document.querySelector(".header")
const mobileMenuBtn = document.getElementById("mobileMenuBtn")
const mobileDrawer = document.getElementById("mobileDrawer")
const mobileOverlay = document.getElementById("mobileDrawerOverlay")
const closeDrawerBtn = document.getElementById("closeMobileDrawerBtn")
const dropdownToggle = document.querySelector(".mobile-dropdown-toggle")
const dropdownMenu = document.querySelector(".mobile-dropdown-menu")
const filterBar = document.querySelector(".filter-bar")

const lockScroll = () => {
    body.style.overflow = "hidden"
    body.style.touchAction = "none"
}

const unlockScroll = () => {
    body.style.overflow = ""
    body.style.touchAction = ""
}

const openDrawer = () => {
    mobileDrawer.classList.add("open")
    mobileOverlay.classList.add("active")
    lockScroll()
}

const closeDrawer = () => {
    mobileDrawer.classList.remove("open")
    mobileOverlay.classList.remove("active")
    unlockScroll()
}

if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener("click", openDrawer)
}

if (closeDrawerBtn) {
    closeDrawerBtn.addEventListener("click", closeDrawer)
}

if (mobileOverlay) {
    mobileOverlay.addEventListener("click", closeDrawer)
}

document.addEventListener("keydown", e => {
    if (e.key === "Escape") closeDrawer()
})

if (dropdownToggle) {
    dropdownToggle.addEventListener("click", e => {
        e.preventDefault()
        dropdownMenu.classList.toggle("open")
        dropdownToggle.querySelector("i").classList.toggle("ph-caret-up")
        dropdownToggle.querySelector("i").classList.toggle("ph-caret-down")
    })
}

document.querySelectorAll(".mobile-nav-links a").forEach(link => {
    link.addEventListener("click", () => {
        if (!link.classList.contains("mobile-dropdown-toggle")) {
            closeDrawer()
        }
    })
})

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener("click", e => {
        const id = anchor.getAttribute("href")
        if (id === "#" || id.length < 2) return
        const target = document.querySelector(id)
        if (!target) return
        e.preventDefault()
        const offset = (header?.offsetHeight || 0) + (filterBar?.offsetHeight || 0)
        window.scrollTo({
            top: target.offsetTop - offset,
            behavior: "smooth"
        })
    })
})

let lastScroll = 0

const stickyHeader = () => {
    const current = window.pageYOffset

    if (current > 80) {
        header.style.boxShadow = "0 10px 25px rgba(0,0,0,.08)"
    } else {
        header.style.boxShadow = ""
    }

    if (window.innerWidth <= 768) {
        if (current > lastScroll && current > 150) {
            header.style.transform = "translateY(-100%)"
        } else {
            header.style.transform = "translateY(0)"
        }
        lastScroll = current
    }
}

window.addEventListener("scroll", stickyHeader, { passive: true })

header.style.transition = "transform .35s ease,box-shadow .35s ease"

let resizeTimer

window.addEventListener("resize", () => {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => {
        if (window.innerWidth > 768) {
            closeDrawer()
            header.style.transform = "translateY(0)"
        }
    }, 120)
})

let startX = 0
let currentX = 0
let dragging = false

mobileDrawer.addEventListener("touchstart", e => {
    startX = e.touches[0].clientX
    dragging = true
}, { passive: true })

mobileDrawer.addEventListener("touchmove", e => {
    if (!dragging) return
    currentX = e.touches[0].clientX
    const diff = currentX - startX
    if (diff < 0) {
        mobileDrawer.style.transform = `translateX(${diff}px)`
    }
}, { passive: true })

mobileDrawer.addEventListener("touchend", () => {
    dragging = false
    const diff = currentX - startX
    mobileDrawer.style.transform = ""
    if (diff < -80) {
        closeDrawer()
    }
    startX = 0
    currentX = 0
})

stickyHeader()

// ── Drop Timer Logic ────────────────────────────────────────────────────────
const updateDropTimer = () => {
    const dropDays = document.getElementById('dropDays');
    const dropHours = document.getElementById('dropHours');
    const dropMins = document.getElementById('dropMins');
    const dropSecs = document.getElementById('dropSecs');
    
    if(!dropDays || !dropHours || !dropMins || !dropSecs) return;

    // Simulate a countdown target
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 2);
    targetDate.setHours(targetDate.getHours() + 14);
    targetDate.setMinutes(targetDate.getMinutes() + 32);

    const interval = setInterval(() => {
        const now = new Date().getTime();
        const distance = targetDate.getTime() - now;

        if (distance < 0) {
            clearInterval(interval);
            dropDays.innerHTML = "00";
            dropHours.innerHTML = "00";
            dropMins.innerHTML = "00";
            dropSecs.innerHTML = "00";
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        dropDays.innerHTML = String(days).padStart(2, '0');
        dropHours.innerHTML = String(hours).padStart(2, '0');
        dropMins.innerHTML = String(minutes).padStart(2, '0');
        dropSecs.innerHTML = String(seconds).padStart(2, '0');
    }, 1000);
};

updateDropTimer();


// ── Filter & Sort Logic ─────────────────────────────────────────────────────
const products = [...document.querySelectorAll(".product-card")]
const filterTabs = [...document.querySelectorAll(".filter-tab")]
const sortSelect = document.getElementById("sortSelect")
const productsGrid = document.getElementById("productsGrid")
const noResults = document.getElementById("noResults")
const resultsCount = document.getElementById("resultsCount")

const getPrice = card => {
    return Number(card.querySelector(".current-price").textContent.replace(/[₹,]/g, ""))
}

const getRating = card => {
    return card.querySelector(".product-stars").textContent.match(/★/g)?.length || 0
}

const updateResultsCount = (count) => {
    if(resultsCount) {
        resultsCount.innerHTML = `Showing <strong>${count}</strong> new arrivals`;
    }
}

const updateNoResults = () => {
    const visible = products.filter(card => !card.classList.contains("hidden"))
    noResults.style.display = visible.length ? "none" : "block"
    updateResultsCount(visible.length);
}

const animateCards = () => {
    products.filter(card => !card.classList.contains("hidden")).forEach((card, index) => {
        card.style.opacity = "0"
        card.style.transform = "translateY(25px)"
        requestAnimationFrame(() => {
            setTimeout(() => {
                card.style.transition = "opacity .45s ease,transform .45s ease"
                card.style.opacity = "1"
                card.style.transform = "translateY(0)"
            }, index * 40)
        })
    })
}

const filterProducts = category => {
    products.forEach(card => {
        const match = category === "all" || card.dataset.category === category
        card.classList.toggle("hidden", !match)
        if (!match) {
            card.style.display = 'none';
        } else {
            card.style.display = 'block';
        }
    })
    updateNoResults()
    animateCards()
}

const sortProducts = value => {
    const cards = [...products]

    switch (value) {
        case "price-asc":
            cards.sort((a, b) => getPrice(a) - getPrice(b))
            break
        case "price-desc":
            cards.sort((a, b) => getPrice(b) - getPrice(a))
            break
        case "newest":
            cards.sort((a, b) => {
                const aNew = a.querySelector(".new-badge") ? 1 : 0
                const bNew = b.querySelector(".new-badge") ? 1 : 0
                return bNew - aNew
            })
            break
        case "featured":
            cards.sort((a, b) => {
                const aTrending = a.querySelector(".trending-badge") ? 1 : 0
                const bTrending = b.querySelector(".trending-badge") ? 1 : 0
                return bTrending - aTrending
            })
            break
        default:
            cards.sort((a, b) => 0)
            break
    }

    cards.forEach(card => productsGrid.appendChild(card))
    animateCards()
}

filterTabs.forEach(tab => {
    tab.addEventListener("click", () => {
        filterTabs.forEach(btn => {
            btn.classList.remove("active")
            btn.setAttribute("aria-selected", "false")
        })
        tab.classList.add("active")
        tab.setAttribute("aria-selected", "true")
        filterProducts(tab.dataset.filter)
        sortProducts(sortSelect.value)
    })
})

sortSelect.addEventListener("change", () => {
    sortProducts(sortSelect.value)
})

const observer = new MutationObserver(updateNoResults)

products.forEach(card => {
    observer.observe(card, {
        attributes: true,
        attributeFilter: ["class"]
    })
})

// Initialize filter and sort
filterProducts("all")
sortProducts("newest")


// ── View Toggle Logic ───────────────────────────────────────────────────────
const gridViewBtn = document.getElementById('gridViewBtn');
const listViewBtn = document.getElementById('listViewBtn');

if (gridViewBtn && listViewBtn && productsGrid) {
    gridViewBtn.addEventListener('click', () => {
        gridViewBtn.classList.add('active');
        listViewBtn.classList.remove('active');
        productsGrid.classList.remove('list-view');
        animateCards();
    });

    listViewBtn.addEventListener('click', () => {
        listViewBtn.classList.add('active');
        gridViewBtn.classList.remove('active');
        productsGrid.classList.add('list-view');
        animateCards();
    });
}


// ── Cart Manager ────────────────────────────────────────────────────────────
let cart = JSON.parse(localStorage.getItem('merssh_cart')) || []

const cartCountBadge = document.querySelector('.cart-count')
const cartDrawer = document.getElementById('cartDrawer')
const cartDrawerOverlay = document.getElementById('cartDrawerOverlay')
const closeCartBtn = document.getElementById('closeCartDrawerBtn')
const cartItemsList = document.getElementById('cartItemsList')
const cartEmptyState = document.getElementById('cartEmptyState')
const cartDrawerFooter = document.getElementById('cartDrawerFooter')
const cartDrawerCount = document.querySelector('.cart-drawer-count')
const cartSubtotalValue = document.querySelector('.cart-subtotal-value')
const cartIcon = document.querySelector('.cart-icon')
const toastContainer = document.getElementById('toastContainer')

const saveCart = () => localStorage.setItem('merssh_cart', JSON.stringify(cart))

const showToast = (message, icon = 'ph-check-circle') => {
    if (!toastContainer) return
    const toast = document.createElement('div')
    toast.className = 'toast'
    toast.innerHTML = `<i class="ph ${icon}"></i><span>${message}</span>`
    toastContainer.appendChild(toast)
    setTimeout(() => {
        toast.classList.add('fade-out')
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        setTimeout(() => toast.remove(), 400)
    }, 2500)
}

const openCart = () => {
    if (!cartDrawer) return
    cartDrawer.classList.add('open')
    cartDrawerOverlay.classList.add('active')
    document.body.style.overflow = 'hidden'
}

const closeCart = () => {
    if (!cartDrawer) return
    cartDrawer.classList.remove('open')
    cartDrawerOverlay.classList.remove('active')
    document.body.style.overflow = ''
}

const updateCartDOM = () => {
    const totalQty = cart.reduce((s, i) => s + i.quantity, 0)
    const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0)

    if (cartCountBadge) {
        cartCountBadge.textContent = totalQty
        cartCountBadge.style.transform = 'scale(1.3)'
        setTimeout(() => { cartCountBadge.style.transform = 'scale(1)' }, 200)
    }
    if (cartDrawerCount) cartDrawerCount.textContent = totalQty
    if (cartSubtotalValue) cartSubtotalValue.textContent = `₹${subtotal.toLocaleString('en-IN')}`

    if (cart.length === 0) {
        if (cartEmptyState) cartEmptyState.style.display = 'block'
        if (cartItemsList) cartItemsList.style.display = 'none'
        if (cartDrawerFooter) cartDrawerFooter.style.display = 'none'
    } else {
        if (cartEmptyState) cartEmptyState.style.display = 'none'
        if (cartDrawerFooter) cartDrawerFooter.style.display = 'block'
        if (cartItemsList) {
            cartItemsList.style.display = 'flex'
            cartItemsList.style.flexDirection = 'column'
            cartItemsList.innerHTML = cart.map(item => `
        <div class="cart-item" data-id="${item.id}">
          <div class="cart-item-img"><img src="${item.imgSrc}" alt="${item.name}" style="width:100%;height:100%;object-fit:cover;"></div>
          <div class="cart-item-details" style="flex:1;">
            <h4 style="margin-bottom:4px;font-size:0.85rem;font-weight:500;">${item.name}</h4>
            <div class="cart-item-price" style="color:var(--gold);font-weight:600;margin-bottom:8px;font-size:0.82rem;">₹${item.price.toLocaleString('en-IN')}</div>
            <div class="cart-item-qty-remove" style="display:flex;justify-content:space-between;align-items:center;">
              <div class="quantity-selector" style="display:flex;align-items:center;border:1px solid var(--border);border-radius:4px;">
                <button class="quantity-btn btn-minus" data-id="${item.id}" style="border:none;background:none;padding:4px 8px;cursor:pointer;"><i class="ph ph-minus"></i></button>
                <span class="quantity-val" style="font-size:0.8rem;width:20px;text-align:center;">${item.quantity}</span>
                <button class="quantity-btn btn-plus"  data-id="${item.id}" style="border:none;background:none;padding:4px 8px;cursor:pointer;"><i class="ph ph-plus"></i></button>
              </div>
              <button class="remove-item-btn" data-id="${item.id}" style="border:none;background:none;color:var(--text-light);cursor:pointer;display:flex;align-items:center;gap:4px;font-size:0.75rem;"><i class="ph ph-trash" style="font-size:1rem;"></i> REMOVE</button>
            </div>
          </div>
        </div>
      `).join('')

            cartItemsList.querySelectorAll('.btn-minus').forEach(btn =>
                btn.addEventListener('click', () => { updateQty(btn.dataset.id, -1) }))
            cartItemsList.querySelectorAll('.btn-plus').forEach(btn =>
                btn.addEventListener('click', () => { updateQty(btn.dataset.id, 1) }))
            cartItemsList.querySelectorAll('.remove-item-btn').forEach(btn =>
                btn.addEventListener('click', () => { removeItem(btn.dataset.id) }))
        }
    }
}

const updateQty = (id, delta) => {
    const item = cart.find(i => i.id === id)
    if (!item) return
    item.quantity += delta
    if (item.quantity <= 0) { removeItem(id); return }
    saveCart(); updateCartDOM()
}

const removeItem = (id) => {
    const item = cart.find(i => i.id === id)
    cart = cart.filter(i => i.id !== id)
    saveCart(); updateCartDOM()
    if (item) showToast(`${item.name} removed from bag.`, 'ph-trash')
}

const addToCart = (product) => {
    const existing = cart.find(i => i.id === product.id)
    if (existing) { existing.quantity++ } else { cart.push({ ...product, quantity: 1 }) }
    saveCart(); updateCartDOM()
    openCart()
    showToast(`${product.name} added to bag!`, 'ph-shopping-bag-open')
}

// Wire cart icon click → open drawer
if (cartIcon) cartIcon.addEventListener('click', e => { e.preventDefault(); openCart() })
if (closeCartBtn) closeCartBtn.addEventListener('click', closeCart)
if (cartDrawerOverlay) cartDrawerOverlay.addEventListener('click', closeCart)


// Wire ADD TO CART buttons
document.querySelectorAll('.btn-add-cart').forEach(button => {
    button.addEventListener('click', () => {
        const card = button.closest('.product-card')
        const name = card.querySelector('h4').textContent
        const price = parseInt(card.querySelector('.current-price').textContent.replace(/[₹,]/g, ''))
        const imgEl = card.querySelector('img')
        const imgSrc = imgEl ? imgEl.getAttribute('src') : ''
        const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
        addToCart({ id, name, price, imgSrc })
    })
})

// Initialise badge on page load
updateCartDOM()

const revealElements = document.querySelectorAll(".reveal")

const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add("visible")
            revealObserver.unobserve(entry.target)
        }
    })
}, {
    threshold: .15,
    rootMargin: "0px 0px -50px 0px"
})

revealElements.forEach(el => revealObserver.observe(el))

document.querySelectorAll("img").forEach(img => {
    img.loading = "lazy"
    img.decoding = "async"
    img.draggable = false
})

const activeNav = () => {
    const sections = [...document.querySelectorAll("section,[id]")]
    const scrollY = window.pageYOffset + 200

    sections.forEach(section => {
        if (!section.id) return

        const top = section.offsetTop
        const height = section.offsetHeight

        if (scrollY >= top && scrollY < top + height) {
            document.querySelectorAll('a[href^="#"]').forEach(link => {
                link.classList.toggle("active", link.getAttribute("href") === "#" + section.id)
            })
        }
    })
}

window.addEventListener("scroll", activeNav, { passive: true })

const scrollTopBtn = document.createElement("button")
scrollTopBtn.className = "scroll-top-btn"
scrollTopBtn.innerHTML = '<i class="ph ph-arrow-up"></i>'

Object.assign(scrollTopBtn.style, {
    position: "fixed",
    right: "20px",
    bottom: "100px",
    width: "46px",
    height: "46px",
    border: "none",
    borderRadius: "50%",
    background: "#0a0a0a",
    color: "#fff",
    fontSize: "18px",
    cursor: "pointer",
    opacity: "0",
    visibility: "hidden",
    transition: ".3s",
    zIndex: "999"
})

document.body.appendChild(scrollTopBtn)

const toggleScrollTop = () => {
    if (window.scrollY > 500) {
        scrollTopBtn.style.opacity = "1"
        scrollTopBtn.style.visibility = "visible"
    } else {
        scrollTopBtn.style.opacity = "0"
        scrollTopBtn.style.visibility = "hidden"
    }
}

window.addEventListener("scroll", toggleScrollTop, { passive: true })

scrollTopBtn.addEventListener("click", () => {
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    })
})

let resizeTimeout

window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout)
    resizeTimeout = setTimeout(() => {
        document.documentElement.style.setProperty("--vh", `${window.innerHeight * .01}px`)
    }, 150)
})

document.documentElement.style.setProperty("--vh", `${window.innerHeight * .01}px`)

document.addEventListener("visibilitychange", () => {
    if (document.hidden) return
    toggleScrollTop()
    activeNav()
})

window.addEventListener("pageshow", () => {
    toggleScrollTop()
    activeNav()
})

window.addEventListener("load", () => {
    document.body.classList.add("loaded")
    toggleScrollTop()
    activeNav()
})

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")

if (prefersReducedMotion.matches) {
    document.querySelectorAll("*").forEach(el => {
        el.style.scrollBehavior = "auto"
        el.style.animationDuration = "0s"
        el.style.transitionDuration = "0s"
    })
}

// ── Quick View Logic ────────────────────────────────────────────────────────
document.querySelectorAll('.quick-view-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const card = btn.closest('.product-card');
        const name = card.querySelector('h4').textContent;
        showToast(`Quick view opened for ${name}`, 'ph-eye');
    });
});
});
