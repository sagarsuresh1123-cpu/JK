const WHATSAPP = "919880079461";
const categories = [
  ["🌾","Rice & Grains","Staples & cereals"],["🫘","Dals & Pulses","Everyday essentials"],["🌶️","Spices & Masalas","Whole & powdered"],["🥣","Atta & Flours","Flours & rava"],["🥜","Dry Fruits & Nuts","Premium & everyday"],["🫙","Oils & Ghee","Cooking essentials"],["🍪","Snacks & Biscuits","Tea-time favourites"],["🥛","Beverages","Drinks & mixes"],["🫓","Papad & Sandige","Homemade favourites"],["🏠","Household","Home essentials"],["🧺","Others","Specialty & miscellaneous"],["🍯","Sugar & Jaggery","Sweeteners & jaggery"],["🧂","Salt & Sugar","Kitchen basics"],["🥜","Dry Fruits & Spices","Nuts & whole spices"]
];
let products = [];
let cart = JSON.parse(localStorage.getItem("jkCart") || "{}");
let supabaseClient;

function money(n){return "₹"+Number(n).toLocaleString("en-IN");}
function save(){localStorage.setItem("jkCart",JSON.stringify(cart));}
function cartCount(){return Object.values(cart).reduce((a,b)=>a+b,0);}
function cartTotal(){return Object.entries(cart).reduce((sum,[id,q])=>{const p=products.find(x=>x.id==id);return sum+(p?p.price*q:0)},0);}
function escapeHtml(s){return String(s??"").replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function renderCategories(){
 const grid=document.getElementById("categoryGrid");
 grid.innerHTML=categories.map(c=>`<button class="category" data-cat="${c[1]}" onclick="selectCategory('${c[1].replaceAll("'","\\'")}')"><span class="icon">${c[0]}</span><b>${c[1]}</b><span>${c[2]}</span></button>`).join("");
 const filter=document.getElementById("categoryFilter");
 filter.innerHTML='<option>All</option>';
 [...new Set(categories.map(c=>c[1]))].forEach(c=>filter.insertAdjacentHTML("beforeend",`<option>${c}</option>`));
}
function selectCategory(cat){document.getElementById("categoryFilter").value=cat;document.getElementById("shop").scrollIntoView({behavior:"smooth"});renderProducts();}
function renderProducts(){
 const q=document.getElementById("search").value.toLowerCase().trim(),cat=document.getElementById("categoryFilter").value;
 const list=products.filter(p=>p.active&&(cat==="All"||p.category===cat)&&(!q||`${p.name} ${p.category}`.toLowerCase().includes(q)));
 document.getElementById("productGrid").innerHTML=list.length?list.map(p=>`<article class="product"><div class="product-img">${p.icon||"🛒"}</div><div class="product-body"><span class="product-cat">${escapeHtml(p.category)}</span><h3>${escapeHtml(p.name)}</h3><div class="product-meta">${escapeHtml(p.size||"As listed")}</div><div class="product-bottom"><span class="price">${money(p.price)}</span><button class="add" onclick="addToCart(${p.id})">Add</button></div></div></article>`).join(""): `<div class="empty">No products found. Try another search.</div>`;
}
function addToCart(id){cart[id]=(cart[id]||0)+1;save();updateCartUI();openCart();}
function changeQty(id,delta){cart[id]=(cart[id]||0)+delta;if(cart[id]<=0)delete cart[id];save();updateCartUI();renderCart();}
function updateCartUI(){document.getElementById("cartCount").textContent=cartCount();}
function renderCart(){const box=document.getElementById("cartItems"),entries=Object.entries(cart);box.innerHTML=entries.length?entries.map(([id,q])=>{const p=products.find(x=>x.id==id);return p?`<div class="cart-row"><div><b>${escapeHtml(p.name)}</b><small>${escapeHtml(p.size||"As listed")} · ${money(p.price)} each</small></div><div class="qty"><button onclick="changeQty(${id},-1)">−</button><b>${q}</b><button onclick="changeQty(${id},1)">+</button></div></div>`:``}).join(""): `<div class="empty">Your cart is empty.<br>Add a few products to get started.</div>`;document.getElementById("cartTotal").textContent=money(cartTotal());}
function openCart(){document.getElementById("cartDrawer").classList.add("open");document.getElementById("cartDrawer").setAttribute("aria-hidden","false");renderCart();}
function closeCart(){document.getElementById("cartDrawer").classList.remove("open");document.getElementById("cartDrawer").setAttribute("aria-hidden","true");}
function whatsappUrl(){const entries=Object.entries(cart);if(!entries.length)return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent("Hi JK Traders, I'd like to place an order.")}`;let lines=["Hi JK Traders! I'd like to place an order:",""];entries.forEach(([id,q],i)=>{const p=products.find(x=>x.id==id);if(p)lines.push(`${i+1}. ${p.name} (${p.size||"As listed"}) × ${q} — ${money(p.price*q)}`)});lines.push("",`Estimated total: ${money(cartTotal())}`,"","Please confirm availability, final price and delivery charge.","Delivery / Pickup: ");return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(lines.join("\n"))}`;}

async function loadProducts(){
 try{
   if(!window.supabaseClient){
     if(!window.JK_SUPABASE_URL || window.JK_SUPABASE_URL==="YOUR_SUPABASE_PROJECT_URL") throw new Error("Supabase config missing");
     window.supabaseClient = supabase.createClient(window.JK_SUPABASE_URL, window.JK_SUPABASE_ANON_KEY);
   }
   const {data,error}=await window.supabaseClient.from("products").select("id,name,size,price,category,icon,active").eq("active",true).order("category").order("name");
   if(error) throw error;
   products=data||[];
   renderCategories();renderProducts();updateCartUI();
 }catch(e){
   document.getElementById("productGrid").innerHTML='<div class="empty">Catalogue setup is not connected yet. Add the Supabase keys to supabase-config.js.</div>';
   console.error(e);
 }
}
document.getElementById("search").addEventListener("input",renderProducts);
document.getElementById("categoryFilter").addEventListener("change",renderProducts);
document.getElementById("cartBtn").onclick=openCart;
document.getElementById("bannerCart").onclick=openCart;
document.getElementById("closeCart").onclick=closeCart;
document.getElementById("drawerBackdrop").onclick=closeCart;
document.getElementById("whatsappOrder").onclick=()=>window.open(whatsappUrl(),"_blank");
document.getElementById("heroWhatsapp").href=whatsappUrl();
loadProducts();
