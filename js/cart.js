/**
 * SISTEMA DE PEDIDOS Y CARRITO WHATSAPP
 * Restaurante El Castillo - Pompeya Alto, Meta
 * Teléfono WhatsApp: +57 313 289 3218
 */

const WHATSAPP_PHONE = "573132893218";
const CART_STORAGE_KEY = "castillo_cart_items";

const CastilloCart = {
    items: [],

    init() {
        this.loadCart();
        this.injectUI();
        this.render();
        this.attachEventListeners();
    },

    loadCart() {
        try {
            const saved = localStorage.getItem(CART_STORAGE_KEY);
            this.items = saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error("Error al cargar carrito:", e);
            this.items = [];
        }
    },

    saveCart() {
        try {
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(this.items));
        } catch (e) {
            console.error("Error al guardar carrito:", e);
        }
    },

    formatCurrency(amount) {
        return "$" + Number(amount).toLocaleString("es-CO");
    },

    addItem(product) {
        // product: { id, name, price, img }
        const existingIndex = this.items.findIndex(item => item.id === product.id);
        if (existingIndex > -1) {
            this.items[existingIndex].qty += (product.qty || 1);
        } else {
            this.items.push({
                id: product.id,
                name: product.name,
                price: Number(product.price),
                img: product.img || "imgs/castillo.avif",
                qty: product.qty || 1
            });
        }
        this.saveCart();
        this.render();
        this.showToast(`¡${product.name} agregado al pedido! 🛒`);
        this.bounceCartButton();
    },

    updateQty(id, delta) {
        const item = this.items.find(i => i.id === id);
        if (!item) return;

        item.qty += delta;
        if (item.qty <= 0) {
            this.removeItem(id);
            return;
        }
        this.saveCart();
        this.render();
    },

    removeItem(id) {
        const item = this.items.find(i => i.id === id);
        const name = item ? item.name : "Producto";
        this.items = this.items.filter(i => i.id !== id);
        this.saveCart();
        this.render();
        this.showToast(`${name} eliminado del pedido 🗑️`);
    },

    clearCart() {
        if (this.items.length === 0) return;
        if (confirm("¿Estás seguro de vaciar todo tu pedido?")) {
            this.items = [];
            this.saveCart();
            this.render();
            this.showToast("Carrito vaciado");
        }
    },

    getTotalCount() {
        return this.items.reduce((sum, item) => sum + item.qty, 0);
    },

    getTotalAmount() {
        return this.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
    },

    openCart() {
        const modal = document.getElementById("castillo-cart-drawer");
        const overlay = document.getElementById("castillo-cart-overlay");
        if (modal && overlay) {
            modal.classList.add("active");
            overlay.classList.add("active");
            document.body.style.overflow = "hidden";
        }
    },

    closeCart() {
        const modal = document.getElementById("castillo-cart-drawer");
        const overlay = document.getElementById("castillo-cart-overlay");
        if (modal && overlay) {
            modal.classList.remove("active");
            overlay.classList.remove("active");
            document.body.style.overflow = "";
        }
    },

    bounceCartButton() {
        const btn = document.getElementById("floating-cart-btn");
        if (btn) {
            btn.classList.add("cart-bounce");
            setTimeout(() => btn.classList.remove("cart-bounce"), 600);
        }
    },

    showToast(message) {
        let toast = document.getElementById("castillo-toast");
        if (!toast) {
            toast = document.createElement("div");
            toast.id = "castillo-toast";
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.classList.add("show");
        clearTimeout(this.toastTimeout);
        this.toastTimeout = setTimeout(() => {
            toast.classList.remove("show");
        }, 2800);
    },

    quickOrder(name, price) {
        const message = `👋 ¡Hola *Restaurante El Castillo*!\n\nDeseo pedir de inmediato:\n• *1x ${name}* (${this.formatCurrency(price)})\n\n¿Tienen disponibilidad en este momento? Por favor me indican el tiempo de entrega y medios de pago. ¡Muchas gracias!`;
        const url = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
        window.open(url, "_blank");
    },

    sendOrderWhatsApp() {
        if (this.items.length === 0) {
            alert("Tu carrito está vacío. Agrega platos antes de enviar el pedido.");
            return;
        }

        const nameInput = document.getElementById("client-name");
        const typeInput = document.getElementById("order-type");
        const notesInput = document.getElementById("order-notes");

        const clientName = nameInput ? nameInput.value.trim() : "";
        const orderType = typeInput ? typeInput.value : "Domicilio";
        const notes = notesInput ? notesInput.value.trim() : "";

        if (!clientName) {
            alert("Por favor escribe tu nombre para que podamos identificar tu pedido.");
            if (nameInput) nameInput.focus();
            return;
        }

        let message = `👋 *¡HOLA RESTAURANTE EL CASTILLO!*\nQuiero realizar el siguiente pedido:\n\n`;
        message += `📋 *DETALLE DEL PEDIDO:*\n`;

        this.items.forEach(item => {
            const subtotal = item.price * item.qty;
            message += `• ${item.qty}x ${item.name} (${this.formatCurrency(item.price)}) = *${this.formatCurrency(subtotal)}*\n`;
        });

        const total = this.getTotalAmount();
        message += `\n💰 *TOTAL A PAGAR:* *${this.formatCurrency(total)} COP*\n\n`;

        message += `👤 *DATOS DEL CLIENTE:*\n`;
        message += `• *Nombre:* ${clientName}\n`;
        message += `• *Modalidad:* ${orderType}\n`;
        if (notes) {
            message += `• *Dirección / Observaciones:* ${notes}\n`;
        }
        message += `\n📍 *Ubicación del Restaurante:* Pompeya Alto, Meta (Vía Villavicencio - Puerto López)\n`;
        message += `\n¡Quedo atento a la confirmación de mi pedido! Muchas gracias.`;

        const url = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
        window.open(url, "_blank");
    },

    injectUI() {
        // Create Floating Cart Button & Modal Overlay if not already present
        if (!document.getElementById("floating-cart-btn")) {
            const floatBtn = document.createElement("button");
            floatBtn.id = "floating-cart-btn";
            floatBtn.className = "floating-cart-btn";
            floatBtn.setAttribute("aria-label", "Ver Carrito de Pedidos");
            floatBtn.innerHTML = `
                <span class="cart-icon">🛒</span>
                <span class="cart-label">Mi Pedido</span>
                <span class="cart-count-badge" id="cart-badge-count">0</span>
            `;
            floatBtn.onclick = () => this.openCart();
            document.body.appendChild(floatBtn);
        }

        // Floating direct WhatsApp support button
        if (!document.getElementById("floating-whatsapp-btn")) {
            const waBtn = document.createElement("a");
            waBtn.id = "floating-whatsapp-btn";
            waBtn.className = "floating-whatsapp-btn";
            waBtn.href = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent("Hola Restaurante El Castillo, deseo información sobre el menú y horarios de atención.")}`;
            waBtn.target = "_blank";
            waBtn.rel = "noopener noreferrer";
            waBtn.setAttribute("aria-label", "Contactar por WhatsApp");
            waBtn.innerHTML = `
                <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" width="36" height="36">
                <span class="wa-tooltip">¿Dudas? Escríbenos</span>
            `;
            document.body.appendChild(waBtn);
        }

        // Cart Drawer and Backdrop Overlay
        if (!document.getElementById("castillo-cart-drawer")) {
            const overlay = document.createElement("div");
            overlay.id = "castillo-cart-overlay";
            overlay.className = "cart-overlay";
            overlay.onclick = () => this.closeCart();
            document.body.appendChild(overlay);

            const drawer = document.createElement("div");
            drawer.id = "castillo-cart-drawer";
            drawer.className = "cart-drawer";
            drawer.innerHTML = `
                <div class="cart-header">
                    <div class="cart-header-title">
                        <span class="cart-icon-title">🛒</span>
                        <h3>Tu Pedido El Castillo</h3>
                    </div>
                    <button class="cart-close-btn" onclick="CastilloCart.closeCart()">&times;</button>
                </div>

                <div class="cart-body" id="cart-items-container">
                    <!-- Items dinámicos -->
                </div>

                <div class="cart-footer" id="cart-footer-section">
                    <div class="cart-total-row">
                        <span>Total a Pagar:</span>
                        <span class="cart-total-value" id="cart-total-display">$0</span>
                    </div>

                    <div class="cart-form">
                        <div class="form-group">
                            <label for="client-name">Tu Nombre: *</label>
                            <input type="text" id="client-name" placeholder="Ej: Carlos Gómez" required>
                        </div>

                        <div class="form-group">
                            <label for="order-type">Tipo de Pedido:</label>
                            <select id="order-type">
                                <option value="Domicilio">🛵 Domicilio</option>
                                <option value="Para Llevar / Recoger">🛍️ Para Llevar / Pasar a Recoger</option>
                                <option value="En Mesa (Restaurante)">🍽️ En el Restaurante (Mesa)</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="order-notes">Dirección / Indicaciones:</label>
                            <textarea id="order-notes" rows="2" placeholder="Ej: Vía Pompeya km 2, casa con portón blanco. Salsa extra de ajo."></textarea>
                        </div>
                    </div>

                    <button class="btn-checkout-whatsapp" onclick="CastilloCart.sendOrderWhatsApp()">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WA" width="22" height="22">
                        Enviar Pedido a WhatsApp
                    </button>

                    <button class="btn-clear-cart" onclick="CastilloCart.clearCart()">
                        Vaciar Pedido
                    </button>
                </div>
            `;
            document.body.appendChild(drawer);
        }
    },

    render() {
        const count = this.getTotalCount();
        const total = this.getTotalAmount();

        // Update badges
        const badge = document.getElementById("cart-badge-count");
        if (badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? "inline-flex" : "none";
        }

        const navBadges = document.querySelectorAll(".nav-cart-badge");
        navBadges.forEach(b => {
            b.textContent = count;
            b.style.display = count > 0 ? "inline-block" : "none";
        });

        // Update Drawer Content
        const container = document.getElementById("cart-items-container");
        const footer = document.getElementById("cart-footer-section");
        const totalDisplay = document.getElementById("cart-total-display");

        if (totalDisplay) {
            totalDisplay.textContent = this.formatCurrency(total);
        }

        if (!container) return;

        if (this.items.length === 0) {
            container.innerHTML = `
                <div class="cart-empty-state">
                    <div class="empty-icon">🥟</div>
                    <h4>Tu carrito está vacío</h4>
                    <p>Explora nuestras empanadas artesanales y platos típicos del Llano para armar tu pedido.</p>
                    <button class="btn-explore-menu" onclick="CastilloCart.closeCart()">Ver Menú</button>
                </div>
            `;
            if (footer) footer.style.display = "none";
        } else {
            if (footer) footer.style.display = "block";
            let html = '<div class="cart-items-list">';
            this.items.forEach(item => {
                const subtotal = item.price * item.qty;
                html += `
                    <div class="cart-item-row">
                        <img src="${item.img}" alt="${item.name}" class="cart-item-thumb">
                        <div class="cart-item-details">
                            <h4 class="cart-item-title">${item.name}</h4>
                            <div class="cart-item-price-unit">${this.formatCurrency(item.price)} c/u</div>
                            <div class="cart-item-subtotal">Subtotal: <strong>${this.formatCurrency(subtotal)}</strong></div>
                        </div>
                        <div class="cart-item-actions">
                            <div class="qty-control">
                                <button type="button" onclick="CastilloCart.updateQty('${item.id}', -1)" title="Reducir">-</button>
                                <span class="qty-num">${item.qty}</span>
                                <button type="button" onclick="CastilloCart.updateQty('${item.id}', 1)" title="Aumentar">+</button>
                            </div>
                            <button type="button" class="btn-remove-item" onclick="CastilloCart.removeItem('${item.id}')" title="Eliminar plato">&times;</button>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
            container.innerHTML = html;
        }
    },

    attachEventListeners() {
        // Close with Escape key
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                this.closeCart();
            }
        });
    }
};

// Auto-initialize when DOM is ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => CastilloCart.init());
} else {
    CastilloCart.init();
}

// Expose globally
window.CastilloCart = CastilloCart;
