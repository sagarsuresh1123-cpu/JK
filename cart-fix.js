/* Minimal cart-only fix. Do not alter product cards or checkout flow. */
(function(){
  const style=document.createElement('style');
  style.textContent=`
    .cart-items{overflow-x:hidden}
    .cart-item{display:grid!important;grid-template-columns:70px minmax(0,1fr) 30px!important;gap:11px!important;align-items:center!important;min-width:0!important;padding:13px 0!important}
    .cart-thumb{width:70px!important;height:70px!important;min-width:70px!important;border-radius:9px;background:#f4eadf;display:grid;place-items:center;overflow:hidden}
    .cart-thumb img{width:100%!important;height:100%!important;object-fit:contain!important;display:block!important}
    .cart-item-info{min-width:0!important;overflow:hidden}
    .cart-item-name{font-size:14px!important;font-weight:600!important;line-height:1.25!important;display:block!important;white-space:normal!important;overflow-wrap:anywhere!important;word-break:break-word!important}
    .cart-item-size{font-size:11px!important;color:var(--muted)!important;margin-top:4px!important}
    .cart-qty{display:flex!important;align-items:center!important;gap:6px!important;margin-top:7px!important}
    .cart-remove{width:30px!important;height:30px!important;padding:0!important;display:grid!important;place-items:center!important}
    @media(max-width:760px){.cart-item{grid-template-columns:60px minmax(0,1fr) 28px!important;gap:10px!important}.cart-thumb{width:60px!important;height:60px!important;min-width:60px!important}}
  `;
  document.head.appendChild(style);

  window.renderCart=function(){
    const entries=cartEntries(),count=cartCount();
    $("cartCount").textContent=count;
    $("mobileBottomCount").textContent=count;
    $("mobileBottomTotal").textContent='Review';
    $("cartSubhead").textContent=`${count} item${count===1?'':'s'}`;

    if(!entries.length){
      $("cartItems").innerHTML='<div class="empty-state" style="border:0;padding:55px 15px"><div>🛒</div><h2>Your cart is empty</h2><p>Add products and they\'ll appear here.</p></div>';
      return;
    }

    $("cartItems").innerHTML=entries.map(x=>{
      const src=verifiedImageFor(x.product);
      const image=src
        ? `<img src="${esc(src)}" alt="${esc(x.product.name)}" loading="lazy" onerror="this.style.display='none'">`
        : '';
      return `<div class="cart-item">
        <div class="cart-thumb">${image}</div>
        <div class="cart-item-info">
          <div class="cart-item-name">${esc(x.product.name)}</div>
          <div class="cart-item-size">${esc(x.product.size)}</div>
          <div class="cart-qty">
            <button data-cart-dec="${x.product.id}">−</button>
            <span>${x.qty}</span>
            <button data-cart-inc="${x.product.id}">+</button>
          </div>
        </div>
        <button class="cart-remove" data-cart-remove="${x.product.id}" aria-label="Remove">×</button>
      </div>`;
    }).join('');

    document.querySelectorAll('[data-cart-inc]').forEach(b=>b.onclick=()=>addToCart(b.dataset.cartInc,1));
    document.querySelectorAll('[data-cart-dec]').forEach(b=>b.onclick=()=>addToCart(b.dataset.cartDec,-1));
    document.querySelectorAll('[data-cart-remove]').forEach(b=>b.onclick=()=>{
      delete cart[String(b.dataset.cartRemove)];
      saveCart();
      renderProducts();
      renderPopular();
      renderCart();
    });
  };

  renderCart();
})();
