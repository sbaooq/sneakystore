const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

// --- НАСТРОЙКИ ---
const SUPABASE_URL = 'https://zlfjpgjiwzuspudjeeyk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_qrPjy7NqXpeeiwXQc8o9LQ_j7vrnKpE';
const MY_ID = 8067897290; // Твой ID цифрами

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
let products = [];
let favorites = JSON.parse(localStorage.getItem('favs')) || [];

// 1. Инициализация
function init() {
    const user = tg.initDataUnsafe?.user;
    if (user) {
        document.getElementById('user-name').innerText = user.first_name;
        if (user.photo_url) {
            const img = document.getElementById('user-photo');
            img.src = user.photo_url;
            img.style.display = 'block';
        }
        if (Number(user.id) === Number(MY_ID)) {
            document.getElementById('admin-btn').classList.remove('hidden');
        }
    } else {
        document.getElementById('user-name').innerText = "Пользователь";
    }
    loadProducts();
}

// 2. Загрузка данных
async function loadProducts() {
    const { data, error } = await _supabase.from('sneakers').select('*').order('id', { ascending: false });
    if (!error) {
        products = data;
        renderShop();
    }
}

// 3. Навигация
function showSection(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
    window.scrollTo(0,0);
    if (id === 'main-menu') loadProducts();
    if (id === 'favorites-page') renderFavs();
    if (id === 'admin-page') renderAdminItems();
}

// 4. Отрисовка магазина
function renderShop() {
    const list = document.getElementById('product-list');
    list.innerHTML = '';
    products.forEach(p => {
        const isFav = favorites.includes(p.id);
        const card = document.createElement('div');
        card.className = 'item-card';
        card.innerHTML = `
            <img src="${p.img}" onclick="openProduct(${p.id})">
            <button class="fav-icon-btn" onclick="toggleFav(${p.id})">${isFav ? '❤️' : '🤍'}</button>
            <div class="item-info" onclick="openProduct(${p.id})">
                <h3>${p.name}</h3>
                <div class="item-price">${p.price}</div>
            </div>`;
        list.appendChild(card);
    });
}

// 5. Админка: Добавление и Удаление
async function saveProduct() {
    const n = document.getElementById('p-name').value;
    const pr = document.getElementById('p-price').value;
    const d = document.getElementById('p-desc').value;
    const i = document.getElementById('p-img').value;
    if(!n || !pr || !i) return alert("Заполни всё!");

    const { error } = await _supabase.from('sneakers').insert([{ name: n, price: pr, desc: d, img: i }]);
    if (error) alert(error.message);
    else {
        alert("Товар добавлен!");
        document.querySelectorAll('.admin-form input').forEach(inp => inp.value = '');
        await loadProducts();
        renderAdminItems();
    }
}

function renderAdminItems() {
    const list = document.getElementById('admin-items-list');
    list.innerHTML = '<h3 style="margin-top:20px;">Удалить товары:</h3>';
    products.forEach(p => {
        list.innerHTML += `<div class="admin-item"><span>${p.name}</span><button class="del-btn" onclick="deleteProduct(${p.id})">Удалить</button></div>`;
    });
}

async function deleteProduct(id) {
    if(!confirm("Удалить?")) return;
    const { error } = await _supabase.from('sneakers').delete().eq('id', id);
    if(error) alert(error.message);
    else {
        await loadProducts();
        renderAdminItems();
    }
}

// 6. Избранное
function toggleFav(id) {
    if (favorites.includes(id)) favorites = favorites.filter(f => f !== id);
    else favorites.push(id);
    localStorage.setItem('favs', JSON.stringify(favorites));
    renderShop();
    renderFavs();
}

function renderFavs() {
    const list = document.getElementById('fav-list');
    list.innerHTML = '';
    const favItems = products.filter(p => favorites.includes(p.id));
    if(!favItems.length) list.innerHTML = 'Пусто';
    favItems.forEach(p => {
        list.innerHTML += `<div class="item-card"><img src="${p.img}" onclick="openProduct(${p.id})"><div class="item-info"><h3>${p.name}</h3><div class="item-price">${p.price}</div></div></div>`;
    });
}

// 7. Просмотр товара
function openProduct(id) {
    const p = products.find(x => x.id === id);
    document.getElementById('detail-content').innerHTML = `
        <img src="${p.img}" style="width:100%; height:300px; object-fit:cover; border-radius:0 0 20px 20px;">
        <div style="padding:20px;">
            <h1>${p.name}</h1>
            <h2 style="color:var(--accent)">${p.price}</h2>
            <p>${p.desc}</p>
        </div>`;
    showSection('product-detail');
}

init();
