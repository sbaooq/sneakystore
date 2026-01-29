const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

// --- НАСТРОЙКИ ---
const SUPABASE_URL = 'https://zlfjpgjiwzuspudjeeyk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_qrPjy7NqXpeeiwXQc8o9LQ_j7vrnKpE';
const MY_ID = 8067897290; // ОБЯЗАТЕЛЬНО УКАЖИ СВОЙ ID ТУТ

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
let products = [];
let favorites = JSON.parse(localStorage.getItem('favs')) || [];

function getCurrentUserId() {
    return tg.initDataUnsafe?.user?.id;
}

function initApp() {
    const user = tg.initDataUnsafe?.user;
    if (user) {
        document.getElementById('user-name').innerText = user.first_name;
        if (user.photo_url) {
            const img = document.getElementById('user-photo');
            img.src = user.photo_url; img.style.display = 'block';
        }
        // Проверка: показывать ли кнопку админки
        if (Number(user.id) === Number(MY_ID)) {
            document.getElementById('admin-btn').classList.remove('hidden');
        }
    }
    loadProducts();
}

async function loadProducts() {
    const { data, error } = await _supabase.from('sneakers').select('*').order('id', { ascending: false });
    if (!error) {
        products = data || [];
        renderShop();
        if (!document.getElementById('admin-page').classList.contains('hidden')) renderAdminItems();
    }
}

function renderShop() {
    const list = document.getElementById('product-list');
    list.innerHTML = products.length ? '' : '<p style="grid-column:1/3;text-align:center;">Загрузка...</p>';
    products.forEach(p => {
        const isFav = favorites.includes(p.id);
        list.innerHTML += `
            <div class="item-card">
                <img src="${p.img}" onclick="openProduct(${p.id})">
                <button class="fav-icon-btn" onclick="toggleFav(${p.id})">${isFav ? '❤️' : '🤍'}</button>
                <div class="item-info" onclick="openProduct(${p.id})">
                    <div style="font-size:12px; font-weight:bold;">${p.name}</div>
                    <div style="color:var(--accent); font-weight:800;">${p.price}</div>
                </div>
            </div>`;
    });
}

function showSection(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
    loadProducts();
}

// Функции админа с проверкой ID
async function saveProduct() {
    if (Number(getCurrentUserId()) !== Number(MY_ID)) {
        return alert("У вас нет прав администратора!");
    }

    const n = document.getElementById('p-name').value, 
          pr = document.getElementById('p-price').value, 
          d = document.getElementById('p-desc').value, 
          i = document.getElementById('p-img').value;

    if(!n || !pr || !i) return alert("Заполни поля!");

    const btn = document.getElementById('publish-btn');
    btn.disabled = true;

    const { error } = await _supabase.from('sneakers').insert([{ name: n, price: pr, desc: d, img: i }]);
    btn.disabled = false;

    if (error) alert("Ошибка базы: " + error.message);
    else {
        alert("Товар добавлен!");
        document.querySelectorAll('.admin-form input').forEach(inp => inp.value = '');
        loadProducts();
    }
}

async function deleteProduct(id) {
    if (Number(getCurrentUserId()) !== Number(MY_ID)) {
        return alert("Действие запрещено!");
    }

    if(!confirm("Удалить?")) return;
    const { error } = await _supabase.from('sneakers').delete().eq('id', id);
    if (error) alert(error.message);
    else loadProducts();
}

function renderAdminItems() {
    const list = document.getElementById('admin-items-list');
    list.innerHTML = '<h4>Управление товарами:</h4>';
    products.forEach(p => {
        list.innerHTML += `<div class="admin-item"><span>${p.name}</span><button class="del-btn" onclick="deleteProduct(${p.id})">Удалить</button></div>`;
    });
}

// ... остальной код (toggleFav, renderFavs, openProduct) остается без изменений
function toggleFav(id) {
    const pId = Number(id);
    const idx = favorites.indexOf(pId);
    if (idx > -1) favorites.splice(idx, 1); else favorites.push(pId);
    localStorage.setItem('favs', JSON.stringify(favorites));
    renderShop();
}

function openProduct(id) {
    const p = products.find(x => x.id === id);
    document.getElementById('detail-content').innerHTML = `
        <img src="${p.img}" style="width:100%; height:250px; object-fit:cover; border-radius:15px;">
        <div style="padding:15px;"><h1>${p.name}</h1><h2 style="color:var(--accent)">${p.price}</h2><p>${p.desc}</p></div>`;
    showSection('product-detail');
}

initApp();
