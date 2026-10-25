/* JK Traders — customer storefront */
const FALLBACK_CATEGORIES = [
  ["Rice & Grains","🌾"],["Dals & Pulses","🫘"],["Spices & Masalas","🌶️"],["Atta & Flours","🥣"],
  ["Dry Fruits & Nuts","🥜"],["Oils & Ghee","🫙"],["Snacks & Biscuits","🍪"],["Beverages","☕"],
  ["Papad & Sandige","🥨"],["Household","🧴"],["Sugar & Jaggery","🍯"],["Salt & Sugar","🧂"],["Others","🧺"]
];
const WHATSAPP = "919880079461";
let client = null;
let products = [];
let cart = JSON.parse(localStorage.getItem("jk_cart_v2") || "{}") || {};
let selectedCategory = "All";
let fulfilment = "delivery";

const $ = id => document.getElementById(id);
const money = n => new Intl.NumberFormat("en-IN", {style:"currency", currency:"INR", maximumFractionDigits:2}).format(Number(n||0));
const esc = s => String(s ?? "").replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"}[c]));

function normalizeProduct(p){
  return {...p, category:p.category || p.cat || "Others", size:p.size || "As listed", price:Number(p.price||0), active:p.active !== false};
}
function iconFor(category,name){
  const found = FALLBACK_CATEGORIES.find(c => c[0].toLowerCase() === String(category).toLowerCase());
  if(found) return found[1];
  const n = String(name||"").toLowerCase();
  if(/rice|wheat|ragi|jowar|millet/.test(n)) return "🌾";
  if(/dal|puls|chana|moong|urad|toor/.test(n)) return "🫘";
  if(/oil|ghee/.test(n)) return "🫙";
  if(/salt/.test(n)) return "🧂";
  if(/tea|coffee/.test(n)) return "☕";
  if(/biscuit|cookie|snack/.test(n)) return "🍪";
  if(/masala|spice|chilli|pepper|turmeric/.test(n)) return "🌶️";
  if(/flour|atta/.test(n)) return "🥣";
  if(/soap|clean|detergent/.test(n)) return "🧴";
  return "🧺";
}
function visualFor(p){return `<div class="product-visual"><span class="visual-icon">${esc(iconFor(p.category,p.name))}</span></div>`;}
function saveCart(){localStorage.setItem("jk_cart_v2", JSON.stringify(cart));}
function cartEntries(){return Object.values(cart).map(x=>({...x, product:products.find(p=>String(p.id)===String(x.id)) || x.product})).filter(x=>x.product);}
function cartCount(){return cartEntries().reduce((s,x)=>s+x.qty,0);}
function cartTotal(){return cartEntries().reduce((s,x)=>s+(Number(x.product.price)||0)*x.qty,0);}

async function loadProducts(){
  try{
    if(!window.JK_SUPABASE_URL || window.JK_SUPABASE_URL === "YOUR_SUPABASE_PROJECT_URL") throw new Error("Supabase config missing");
    client = supabase.createClient(window.JK_SUPABASE_URL, window.JK_SUPABASE_ANON_KEY);
    const {data,error} = await client.from("products").select("*").eq("active",true).order("name");
    if(error) throw error;
    products = (data||[]).map(normalizeProduct);
  }catch(e){
    console.error(e);
    products = [];
    $("productGrid").innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div>⚠️</div><h2>Catalogue temporarily unavailable</h2><p>Please call JK Traders on <a href="tel:+919880079461"><b>98800 79461</b></a> or try again in a moment.</p></div>`;
    $("resultMeta").textContent = "Unable to load live catalogue";
    return;
  }
  renderCategories(); renderProducts(); renderPopular(); renderCart();
}

function categories(){
  const names = [...new Set(products.map(p=>p.category).filter(Boolean))];
  const ordered = FALLBACK_CATEGORIES.map(x=>x[0]).filter(x=>names.includes(x));
  names.forEach(n=>{if(!ordered.includes(n)) ordered.push(n)});
  return ordered.length ? ordered : FALLBACK_CATEGORIES.map(x=>x[0]);
}
function catIcon(name){return (FALLBACK_CATEGORIES.find(x=>x[0]===name)||["","🧺"])[1];}
function renderCategories(){
  const cats=categories();
  $("categoryTiles").innerHTML = cats.slice(0,8).map(c=>`<button class="category-tile ${selectedCategory===c?"active":""}" data-category="${esc(c)}"><span class="category-icon">${catIcon(c)}</span><strong>${esc(c.replace(" & "," & "))}</strong></button>`).join("");
  $("categoryList").innerHTML = `<button class="${selectedCategory==="All"?"active":""}" data-category="All"><span class="cat-icon">🛍️</span><span>All products</span></button>` + cats.map(c=>`<button class="${selectedCategory===c?"active":""}" data-category="${esc(c)}"><span class="cat-icon">${catIcon(c)}</span><span>${esc(c)}</span></button>`).join("");
  document.querySelectorAll("[data-category]").forEach(b=>b.addEventListener("click",()=>selectCategory(b.dataset.category)));
}
function selectCategory(cat){selectedCategory=cat; renderCategories(); renderProducts(); closeCategories(); window.scrollTo({top:document.querySelector(".shop-shell").offsetTop-70,behavior:"smooth"});}

function filteredProducts(){
  const q=$("search").value.trim().toLowerCase();
  let list=products.filter(p => (selectedCategory==="All" || p.category===selectedCategory) && (!q || `${p.name} ${p.category} ${p.size}`.toLowerCase().includes(q)));
  const sort=$("sortSelect").value;
  if(sort==="name") list.sort((a,b)=>a.name.localeCompare(b.name));
  if(sort==="price-low") list.sort((a,b)=>a.price-b.price);
  if(sort==="price-high") list.sort((a,b)=>b.price-a.price);
  return list;
}
function inCart(id){return cart[String(id)]?.qty || 0;}
function productCard(p){
  const qty=inCart(p.id);
  const old = p.price>0 ? p.price*1.15 : 0;
  const discount = old>p.price ? Math.round((1-p.price/old)*100) : 0;
  return `<article class="product-card">
    <div class="product-visual-wrap">${visualFor(p)}${discount>=8?`<span class="product-badge">${discount}% OFF</span>`:""}<button class="heart" aria-label="Save ${esc(p.name)}">♡</button></div>
    <div class="product-body"><div class="product-cat">${esc(p.category)}</div><div class="product-name">${esc(p.name)}</div>
      <select class="size-select" aria-label="Choose size for ${esc(p.name)}"><option>${esc(p.size)}</option></select>
      <div class="price-row"><span class="price">${money(p.price)}</span>${old>p.price?`<span class="old-price">${money(old)}</span>`:""}${discount>=8?`<span class="discount">${discount}% OFF</span>`:""}</div>
      <div class="add-row">${qty?`<div class="qty-control"><button data-action="dec" data-id="${p.id}">−</button><span>${qty}</span><button data-action="inc" data-id="${p.id}">+</button></div>`:`<button class="add-btn" data-action="add" data-id="${p.id}">＋ Add</button>`}</div>
    </div></article>`;
}
function renderProducts(){
  const list=filteredProducts();
  $("pageTitle").textContent=selectedCategory==="All" ? ( $("search").value ? "Search results" : "Shop groceries") : selectedCategory;
  $("resultMeta").textContent=`${list.length} product${list.length===1?"":"s"}`;
  $("productGrid").innerHTML=list.map(productCard).join("");
  $("emptyState").hidden=!!list.length;
  document.querySelectorAll("[data-action]").forEach(b=>b.addEventListener("click",()=>{
    const id=b.dataset.id; const action=b.dataset.action;
    if(action==="add") addToCart(id,1); if(action==="inc") addToCart(id,1); if(action==="dec") addToCart(id,-1);
  }));
}
function renderPopular(){
  const list=[...products].sort((a,b)=>Number(b.price)-Number(a.price)).slice(0,8);
  $("popularGrid").innerHTML=list.map(p=>`<article class="mini-card"><div class="mini-visual">${esc(iconFor(p.category,p.name))}</div><div><h3>${esc(p.name)}</h3><p>${money(p.price)}</p><button class="mini-add" data-mini-id="${p.id}">${inCart(p.id)?"Add more":"＋ Add"}</button></div></article>`).join("");
  document.querySelectorAll("[data-mini-id]").forEach(b=>b.addEventListener("click",()=>addToCart(b.dataset.miniId,1)));
}
function addToCart(id,delta){
  const p=products.find(x=>String(x.id)===String(id)); if(!p)return;
  const key=String(id); const next=(cart[key]?.qty||0)+delta;
  if(next<=0) delete cart[key]; else cart[key]={id:p.id,qty:next,product:p};
  saveCart(); renderProducts(); renderPopular(); renderCart();
  if(delta>0 && cartCount()===1) openCart();
}
function renderCart(){
  const entries=cartEntries(), count=cartCount(), total=cartTotal();
  $("cartCount").textContent=count; $("mobileBottomCount").textContent=count; $("mobileBottomTotal").textContent=money(total); $("cartSubhead").textContent=`${count} item${count===1?"":"s"}`; $("cartTotal").textContent=money(total);
  if(!entries.length){$("cartItems").innerHTML=`<div class="empty-state" style="border:0;padding:55px 15px"><div>🛒</div><h2>Your cart is empty</h2><p>Add products and they'll appear here.</p></div>`; $("deliveryProgress").innerHTML=""; return;}
  $("cartItems").innerHTML=entries.map(x=>`<div class="cart-item"><div class="cart-item-visual">${esc(iconFor(x.product.category,x.product.name))}</div><div><div class="cart-item-name">${esc(x.product.name)}</div><div class="cart-item-size">${esc(x.product.size)}</div><div class="cart-item-price">${money(x.product.price)}</div><div class="cart-qty"><button data-cart-dec="${x.product.id}">−</button><span>${x.qty}</span><button data-cart-inc="${x.product.id}">+</button></div></div><button class="cart-remove" data-cart-remove="${x.product.id}" aria-label="Remove">♧</button></div>`).join("");
  const remaining=Math.max(0,2000-total), pct=Math.min(100,total/2000*100);
  $("deliveryProgress").innerHTML=total>=2000?`<b>✓ Delivery minimum reached</b><div class="progress-line"><span style="width:100%"></span></div>`:`<b>Add ${money(remaining)} more for delivery</b><div class="progress-line"><span style="width:${pct}%"></span></div><small>${money(total)} / ₹2,000</small>`;
  document.querySelectorAll("[data-cart-inc]").forEach(b=>b.onclick=()=>addToCart(b.dataset.cartInc,1));
  document.querySelectorAll("[data-cart-dec]").forEach(b=>b.onclick=()=>addToCart(b.dataset.cartDec,-1));
  document.querySelectorAll("[data-cart-remove]").forEach(b=>b.onclick=()=>{delete cart[String(b.dataset.cartRemove)];saveCart();renderProducts();renderPopular();renderCart();});
}
function openCart(){$("cartDrawer").classList.add("open");$("cartDrawer").setAttribute("aria-hidden","false");document.body.classList.add("drawer-open")}
function closeCart(){$("cartDrawer").classList.remove("open");$("cartDrawer").setAttribute("aria-hidden","true");document.body.classList.remove("drawer-open")}
function openCategories(){renderCategories();$("categoryModal").classList.add("open");document.body.classList.add("modal-open")}
function closeCategories(){$("categoryModal").classList.remove("open");document.body.classList.remove("modal-open")}
function sendWhatsApp(){
  const entries=cartEntries(); if(!entries.length){openCart();return;}
  if(fulfilment==="delivery" && cartTotal()<2000){alert(`Delivery orders have a ₹2,000 minimum. Please add ${money(2000-cartTotal())} more, or choose store pickup.`);return;}
  const lines=["*JK TRADERS — ORDER*","",...entries.map((x,i)=>`${i+1}. ${x.product.name} — ${x.product.size} × ${x.qty} = ${money(x.product.price*x.qty)}`),"",`*Estimated total: ${money(cartTotal())}*`,`Fulfilment: ${fulfilment==="delivery"?"Home delivery":"Store pickup"}`,"","Please confirm availability, final price and delivery charges."];
  window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(lines.join("\n"))}`,"_blank","noopener");
}

$("search").addEventListener("input",()=>{ $("clearSearch").style.display=$("search").value?"block":"none"; renderProducts(); });
$("clearSearch").onclick=()=>{$("search").value="";$('clearSearch').style.display="none";renderProducts();};
$("sortSelect").onchange=renderProducts; $("cartBtn").onclick=openCart; $("mobileBottomCart").onclick=openCart; $("closeCart").onclick=closeCart; $("drawerBackdrop").onclick=closeCart;
$("categoryHeaderBtn").onclick=openCategories; $("mobileCategoryBtn").onclick=openCategories; $("mobileBottomCategories").onclick=openCategories; $("moreCategories").onclick=openCategories; $("closeCategories").onclick=closeCategories; $("categoryBackdrop").onclick=closeCategories;
$("resetFilters").onclick=()=>{selectedCategory="All";$('search').value="";$('clearSearch').style.display="none";renderCategories();renderProducts();};
$("whatsappOrder").onclick=sendWhatsApp;
document.querySelectorAll(".fulfilment-option").forEach(b=>b.onclick=()=>{fulfilment=b.dataset.fulfilment;document.querySelectorAll(".fulfilment-option").forEach(x=>x.classList.remove("selected"));b.classList.add("selected")});
document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeCart();closeCategories()}});
loadProducts();
