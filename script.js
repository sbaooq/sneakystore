const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

const SUPABASE_URL = 'https://zlfjpgjiwzuspudjeeyk.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsZmpwZ2ppd3p1c3B1ZGplZXlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2OTQ5OTMsImV4cCI6MjA4NTI3MDk5M30.8Mg1h48q4ChV84un3n4DPKl-Vr9d49HmAWJoAAXmVCc'; 
const MY_ID = 8067897290; 

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
let products = [];

function initApp() {
    const user = tg.initDataUnsafe?.user;
    if (user) {
        document.getElementById('user-name').innerText = user.first_name || "Guest";
        if (user.photo_url) {
            const img = document.getElementById('user-photo');
            img.src = user.photo_url; img.style.display = 'block';
        }
        if (Number(user.id) === Number(MY_ID)) {
            document.getElementById('admin-btn')?.classList.remove('hidden');
        }
    }
    loadProducts();
}

async function loadProducts() {
    const { data, error } = await _supabase.from('sneakers').select('*').order('id', { ascending: false });
    if (error) return;
    products = data || [];
    renderShop();
    renderAdminItems();
}

function renderShop() {
    const list = document.getElementById('product-list');
    list.innerHTML = '';
    products.forEach(p => {
        list.innerHTML += `
            <div class="item-card" onclick="openProduct(${p.id})">
                <img src="${p.img}" onerror="this.src='https://placehold.co/300x300?text=KAYKAS'">
                <div class="item-info">
                    <div style="font-weight:bold; font-size:13px;">${p.name}</div>
                    <div style="color:var(--accent); font-weight:800;">${p.price}</div>
                </div>
            </div>`;
    });
}

function openProduct(id) {
    const p = products.find(x => x.id === id);
    if (!p) return;
    document.getElementById('detail-content').innerHTML = `
        <button class="floating-back" onclick="showSection('main-menu')">✕</button>
        <img src="${p.img}" style="width:100%; height:300px; object-fit:cover;">
        <div style="padding:20px;">
            <h1>${p.name}</h1>
            <h2 style="color:var(--accent);">${p.price}</h2>
            <p style="line-height:1.6; opacity:0.8;">${p.desc || 'Нет описания'}</p>
            <button class="order-custom-btn" onclick="window.open('https://t.me/broyad')">Заказать эту пару</button>
        </div>`;
    showSection('product-detail');
}

async function saveProduct() {
    const n = document.getElementById('p-name').value;
    const pr = document.getElementById('p-price').value;
    const d = document.getElementById('p-desc').value;
    const i = document.getElementById('p-img').value;
    if(!n || !pr || !i) return alert("Заполни поля!");

    const { error } = await _supabase.from('sneakers').insert([{ name: n, price: pr, desc: d, img: i }]);
    if (error) alert(error.message);
    else { alert("Добавлено!"); loadProducts(); showSection('main-menu'); }
}

function renderAdminItems() {
    const list = document.getElementById('admin-items-list');
    list.innerHTML = '<h3 style="margin-top:20px;">Удаление:</h3>';
    products.forEach(p => {
        list.innerHTML += `
            <div class="admin-item">
                <span>${p.name}</span>
                <button class="del-btn" onclick="deleteProduct(${p.id})">Удалить</button>
            </div>`;
    });
}

async function deleteProduct(id) {
    if(!confirm("Удалить?")) return;
    await _supabase.from('sneakers').delete().eq('id', id);
    loadProducts();
}

function showSection(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
}

initApp();
