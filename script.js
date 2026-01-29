const tg = window.Telegram.WebApp;
tg.expand();

// --- НАСТРОЙКИ SUPABASE (ВСТАВЬ СВОИ) ---
const SUPABASE_URL = 'https://zlfjpgjiwzuspudjeeyk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_qrPjy7NqXpeeiwXQc8o9LQ_j7vrnKpE';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const MY_ID = 8067897290; // ТВОЙ ID ТЕЛЕГРАМ
let products = [];
let favorites = JSON.parse(localStorage.getItem('favs')) || [];

document.getElementById('user-name').innerText = tg.initDataUnsafe.user?.first_name || "Пользователь";
if (tg.initDataUnsafe.user?.photo_url) {
    document.getElementById('user-photo').src = tg.initDataUnsafe.user.photo_url;
}

if (tg.initDataUnsafe.user?.id === MY_ID) {
    document.getElementById('admin-btn').classList.remove('hidden');
}

async function loadProducts() {
    const { data, error } = await _supabase.from('sneakers').select('*');
    if (!error) {
        products = data;
        renderShop();
    }
}

function showSection(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
    if (id === 'main-menu') loadProducts();
    if (id === 'favorites-page') renderFavs();
    if (id === 'admin-page') renderAdminItems();
}

function renderShop() {
    const list = document.getElementById('product-list');
    list.innerHTML = '';
    products.forEach((p) => {
        const isFav = favorites.includes(p.id);
        const card = document.createElement('div');
        card.className = 'item-card';
        card.innerHTML = `
            <div onclick="openProductById(${p.id})">
                <img src="${p.img}">
                <div class="item-info">
                    <h3>${p.name || 'Временно недоступен'}</h3>
                    <p>${p.desc || ''}</p>
                    <div class="item-price">${p.price || ''}</div>
                </div>
            </div>
            <div style="padding: 0 10px 10px 10px">
                <button class="fav-btn ${isFav ? 'active' : ''}" onclick="toggleFav(event, ${p.id})">
                    ${isFav ? '❤️ В избранном' : '🤍 В избранное'}
                </button>
            </div>`;
        list.appendChild(card);
    });
}

async function saveProduct() {
    const n = document.getElementById('p-name').value;
    const pr = document.getElementById('p-price').value;
    const d = document.getElementById('p-desc').value;
    const i = document.getElementById('p-img').value;
    
    const { error } = await _supabase.from('sneakers').insert([{ name: n, price: pr, desc: d, img: i }]);
    if (!error) {
        alert("Опубликовано для всех!");
        loadProducts();
    }
}

function toggleFav(e, id) {
    e.stopPropagation();
    if (favorites.includes(id)) {
        favorites = favorites.filter(favId => favId !== id);
    } else {
        favorites.push(id);
    }
    localStorage.setItem('favs', JSON.stringify(favorites));
    renderShop();
}

function renderFavs() {
    const list = document.getElementById('fav-list');
    list.innerHTML = '';
    const favItems = products.filter(p => favorites.includes(p.id));
    favItems.forEach(p => {
        list.innerHTML += `<div class="item-card"><img src="${p.img}"><div class="item-info"><h3>${p.name}</h3><div class="item-price">${p.price}</div></div></div>`;
    });
}

function openProductById(id) {
    const p = products.find(item => item.id === id);
    const detail = document.getElementById('detail-content');
    detail.innerHTML = `<img src="${p.img}" style="width:100%; border-radius:0 0 24px 24px; margin-bottom:20px;">
        <div style="padding:0 15px"><h1>${p.name}</h1><p style="color:var(--accent); font-size:22px; font-weight:800;">${p.price}</p><p>${p.desc}</p></div>`;
    showSection('product-detail');
}

async function deleteProduct(id) {
    await _supabase.from('sneakers').delete().eq('id', id);
    loadProducts();
    renderAdminItems();
}

function renderAdminItems() {
    const list = document.getElementById('admin-items-list');
    list.innerHTML = '';
    products.forEach(p => {
        list.innerHTML += `<div class="admin-item"><span>${p.name}</span><button class="del-btn" onclick="deleteProduct(${p.id})">Удалить</button></div>`;
    });
}

loadProducts();

