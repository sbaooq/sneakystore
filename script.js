const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

// --- НАСТРОЙКИ (ВСТАВЬ СВОИ) ---
const SUPABASE_URL = 'https://zlfjpgjiwzuspudjeeyk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_qrPjy7NqXpeeiwXQc8o9LQ_j7vrnKpE';
const MY_ID = 8067897290; // Твой ID

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let products = [];
let favorites = JSON.parse(localStorage.getItem('favs')) || [];

// Инициализация
function initApp() {
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

// Загрузка товаров из базы
async function loadProducts() {
    const { data, error } = await _supabase
        .from('sneakers')
        .select('*')
        .order('id', { ascending: false });
    
    if (error) console.error("Ошибка:", error);
    else {
        products = data;
        renderShop();
    }
}

// Переключение страниц
function showSection(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
    window.scrollTo(0,0);
    if (id === 'main-menu') loadProducts();
    if (id === 'favorites-page') renderFavs();
    if (id === 'admin-page') renderAdminItems();
}

// Главная витрина
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

// Избранное
function toggleFav(id) {
    const pId = Number(id);
    const index = favorites.indexOf(pId);
    if (index > -1) favorites.splice(index, 1);
    else favorites.push(pId);
    
    localStorage.setItem('favs', JSON.stringify(favorites));
    renderShop();
    if (!document.getElementById('favorites-page').classList.contains('hidden')) renderFavs();
}

function renderFavs() {
    const list = document.getElementById('fav-list');
    list.innerHTML = '';
    const favItems = products.filter(p => favorites.includes(p.id));
    if (favItems.length === 0) {
        list.innerHTML = '<p style="text-align:center; grid-column:1/3; color:gray; padding-top:20px;">У вас пока нет избранных товаров</p>';
        return;
    }
    favItems.forEach(p => {
        list.innerHTML += `
            <div class="item-card">
                <img src="${p.img}" onclick="openProduct(${p.id})">
                <div class="item-info">
                    <h3>${p.name}</h3>
                    <div class="item-price">${p.price}</div>
                </div>
            </div>`;
    });
}

// Админка: Добавление
async function saveProduct() {
    const n = document.getElementById('p-name').value;
    const pr = document.getElementById('p-price').value;
    const d = document.getElementById('p-desc').value;
    const i = document.getElementById('p-img').value;
    
    if(!n || !pr || !i) return alert("Заполни поля!");

    const { error } = await _supabase.from('sneakers').insert([{ name: n, price: pr, desc: d, img: i }]);
    if (error) alert("Ошибка: " + error.message);
    else {
        alert("Опубликовано!");
        document.querySelectorAll('.admin-form input').forEach(inp => inp.value = '');
        await loadProducts();
        renderAdminItems();
    }
}

// Админка: Удаление
function renderAdminItems() {
    const list = document.getElementById('admin-items-list');
    list.innerHTML = '<h3 style="margin-bottom:15px;">Список товаров (Удаление):</h3>';
    products.forEach(p => {
        const row = document.createElement('div');
        row.className = 'admin-item';
        row.innerHTML = `<span>${p.name}</span> <button class="del-btn" onclick="deleteProduct(${p.id})">Удалить</button>`;
        list.appendChild(row);
    });
}

async function deleteProduct(id) {
    if(!confirm("Удалить этот товар?")) return;
    const { error } = await _supabase.from('sneakers').delete().eq('id', id);
    if(error) alert(error.message);
    else {
        await loadProducts();
        renderAdminItems();
    }
}

// Открытие товара
function openProduct(id) {
    const p = products.find(x => x.id === id);
    if(!p) return;
    document.getElementById('detail-content').innerHTML = `
        <img src="${p.img}" style="width:100%; height:320px; object-fit:cover; border-radius:0 0 25px 25px;">
        <div style="padding:20px;">
            <h1 style="margin:0 0 10px 0;">${p.name}</h1>
            <div style="font-size:24px; font-weight:800; color:var(--accent); margin-bottom:15px;">${p.price}</div>
            <p style="line-height:1.6; font-size:16px;">${p.desc}</p>
        </div>`;
    showSection('product-detail');
}

initApp();
