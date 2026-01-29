const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

// --- НАСТРОЙКИ SUPABASE ---
const SUPABASE_URL = 'https://zlfjpgjiwzuspudjeeyk.supabase.co'; // ВСТАВЬ СВОЙ
const SUPABASE_KEY = 'sb_publishable_qrPjy7NqXpeeiwXQc8o9LQ_j7vrnKpE'; // ВСТАВЬ СВОЙ
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const MY_ID = ; // ВСТАВЬ СВОЙ ID ЦИФРАМИ
let products = [];
let favorites = JSON.parse(localStorage.getItem('favs')) || [];

// 1. Инициализация пользователя
const user = tg.initDataUnsafe?.user;
if (user) {
    document.getElementById('user-name').innerText = user.first_name;
    if (user.photo_url) {
        const img = document.getElementById('user-photo');
        img.src = user.photo_url;
        img.style.display = 'block';
    }
    // Проверка на админа (сравниваем как числа)
    if (Number(user.id) === Number(MY_ID)) {
        document.getElementById('admin-btn').classList.remove('hidden');
    }
} else {
    document.getElementById('user-name').innerText = "Пользователь";
}

// 2. Загрузка товаров
async function loadProducts() {
    const { data, error } = await _supabase
        .from('sneakers')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Ошибка загрузки:", error);
    } else {
        products = data;
        renderShop();
    }
}

// 3. Переключение окон
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
    
    if (products.length === 0) {
        list.innerHTML = '<p style="grid-column: 1/3; text-align: center; color: gray; padding: 20px;">Товаров пока нет</p>';
        return;
    }

    products.forEach((p) => {
        const isFav = favorites.includes(p.id);
        const card = document.createElement('div');
        card.className = 'item-card';
        card.innerHTML = `
            <div onclick="openProductById(${p.id})">
                <img src="${p.img}" onerror="this.src='https://via.placeholder.com/150?text=No+Photo'">
                <div class="item-info">
                    <h3>${p.name || 'Без названия'}</h3>
                    <p>${p.desc || ''}</p>
                    <div class="item-price">${p.price || ''}</div>
                </div>
            </div>
            <div style="padding: 0 12px 12px 12px">
                <button class="fav-btn ${isFav ? 'active' : ''}" onclick="toggleFav(event, ${p.id})">
                    ${isFav ? '❤️ В избранном' : '🤍 В избранное'}
                </button>
            </div>`;
        list.appendChild(card);
    });
}

// 5. Сохранение (Админка)
async function saveProduct() {
    const n = document.getElementById('p-name').value;
    const pr = document.getElementById('p-price').value;
    const d = document.getElementById('p-desc').value;
    const i = document.getElementById('p-img').value;
    
    if(!n || !pr || !i) return alert("Заполни поля: Имя, Цена, Фото");
    
    const { data, error } = await _supabase
        .from('sneakers')
        .insert([{ name: n, price: pr, desc: d, img: i }]);

    if (error) {
        alert("Ошибка сохранения: " + error.message);
    } else {
        alert("Товар добавлен!");
        document.querySelectorAll('.admin-form input').forEach(inp => inp.value = '');
        await loadProducts();
        renderAdminItems();
    }
}

// 6. Избранное
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
    if(favItems.length === 0) {
        list.innerHTML = '<p style="grid-column: 1/3; text-align: center; padding: 20px; color: gray;">Список пуст</p>';
    }
    favItems.forEach(p => {
        list.innerHTML += `<div class="item-card" onclick="openProductById(${p.id})"><img src="${p.img}"><div class="item-info"><h3>${p.name}</h3><div class="item-price">${p.price}</div></div></div>`;
    });
}

// 7. Детали товара
function openProductById(id) {
    const p = products.find(item => item.id === id);
    const detail = document.getElementById('detail-content');
    detail.innerHTML = `
        <img src="${p.img}" style="width:100%; border-radius:0 0 30px 30px; margin-bottom:20px; height:300px; object-fit:cover;">
        <div style="padding:0 20px">
            <h1 style="margin:0 0 10px 0;">${p.name}</h1>
            <p style="color:var(--accent); font-size:24px; font-weight:800; margin-bottom:15px;">${p.price}</p>
            <p style="line-height:1.6; color:var(--text);">${p.desc}</p>
        </div>`;
    showSection('product-detail');
}

// 8. Админ-список
function renderAdminItems() {
    const list = document.getElementById('admin-items-list');
    list.innerHTML = '';
    products.forEach(p => {
        list.innerHTML += `<div class="admin-item"><span>${p.name}</span><button class="del-btn" onclick="deleteProduct(${p.id})">Удалить</button></div>`;
    });
}

async function deleteProduct(id) {
    if(confirm("Удалить этот товар?")) {
        const { error } = await _supabase.from('sneakers').delete().eq('id', id);
        if(error) alert(error.message);
        await loadProducts();
        renderAdminItems();
    }
}

// Запуск
loadProducts();
