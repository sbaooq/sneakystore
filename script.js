const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

// --- НАСТРОЙКИ (ЗАПОЛНИ СВОИ) ---
const SUPABASE_URL = 'https://zlfjpgjiwzuspudjeeyk.supabase.co'; 
const SUPABASE_KEY = 'sb_publishable_qrPjy7NqXpeeiwXQc8o9LQ_j7vrnKpE'; 
const MY_ID = 8067897290; // Твой Telegram ID для доступа к админке

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let products = [];
let favorites = JSON.parse(localStorage.getItem('favs')) || [];

// Функция получения ID текущего пользователя
function getCurrentUserId() {
    return tg.initDataUnsafe?.user?.id;
}

// Инициализация приложения
function initApp() {
    const user = tg.initDataUnsafe?.user;
    
    if (user) {
        document.getElementById('user-name').innerText = user.first_name;
        if (user.photo_url) {
            const img = document.getElementById('user-photo');
            img.src = user.photo_url;
            img.style.display = 'block';
        }
        
        // Показываем кнопку админки только владельцу
        if (Number(user.id) === Number(MY_ID)) {
            const adminBtn = document.getElementById('admin-btn');
            if (adminBtn) adminBtn.classList.remove('hidden');
        }
    }
    loadProducts();
}

// Загрузка товаров из базы
async function loadProducts() {
    console.log("Запрос к базе данных...");
    const { data, error } = await _supabase
        .from('sneakers')
        .select('*')
        .order('id', { ascending: false });

    if (error) {
        console.error("Ошибка Supabase:", error.message);
        return;
    }

    console.log("Товары успешно загружены:", data);
    products = data || [];
    renderShop();
    
    // Обновляем список в админке, если она открыта
    if (!document.getElementById('admin-page').classList.contains('hidden')) {
        renderAdminItems();
    }
}

// Отрисовка витрины
function renderShop() {
    const list = document.getElementById('product-list');
    if (!list) return;

    if (products.length === 0) {
        list.innerHTML = '<p style="grid-column: 1/3; text-align: center; padding: 20px; opacity: 0.6;">Товаров пока нет...</p>';
        return;
    }

    list.innerHTML = '';
    products.forEach(p => {
        const isFav = favorites.includes(p.id);
        list.innerHTML += `
            <div class="item-card">
                <img src="${p.img}" alt="${p.name}" onclick="openProduct(${p.id})" onerror="this.src='https://placehold.co/300x300?text=No+Photo'">
                <button class="fav-icon-btn" onclick="toggleFav(${p.id})">${isFav ? '❤️' : '🤍'}</button>
                <div class="item-info" onclick="openProduct(${p.id})">
                    <div style="font-size: 13px; font-weight: bold; margin-bottom: 4px;">${p.name}</div>
                    <div style="color: var(--accent); font-weight: 800; font-size: 14px;">${p.price}</div>
                </div>
            </div>`;
    });
}

// Переключение между страницами
function showSection(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    const target = document.getElementById(id);
    if (target) {
        target.classList.remove('hidden');
        window.scrollTo(0, 0);
    }
    // Перезагружаем данные при переходе на главную или в админку
    if (id === 'main-menu' || id === 'admin-page') loadProducts();
}

// Работа с избранным
function toggleFav(id) {
    const pId = Number(id);
    const idx = favorites.indexOf(pId);
    if (idx > -1) favorites.splice(idx, 1);
    else favorites.push(pId);
    
    localStorage.setItem('favs', JSON.stringify(favorites));
    renderShop();
    if (!document.getElementById('favorites-page').classList.contains('hidden')) renderFavs();
}

function renderFavs() {
    const list = document.getElementById('fav-list');
    if (!list) return;
    
    const items = products.filter(p => favorites.includes(p.id));
    list.innerHTML = '';
    
    if (items.length === 0) {
        list.innerHTML = '<p style="grid-column: 1/3; text-align: center; padding: 20px; opacity: 0.6;">В избранном пусто</p>';
        return;
    }

    items.forEach(p => {
        list.innerHTML += `
            <div class="item-card">
                <img src="${p.img}" onclick="openProduct(${p.id})">
                <div class="item-info">
                    <div style="font-weight: bold;">${p.name}</div>
                    <div style="color: var(--accent); font-weight: 800;">${p.price}</div>
                </div>
            </div>`;
    });
}

// Функции администратора
async function saveProduct() {
    const userId = getCurrentUserId();
    if (Number(userId) !== Number(MY_ID)) {
        alert("Ошибка: У вас нет прав администратора!");
        return;
    }

    const n = document.getElementById('p-name').value;
    const pr = document.getElementById('p-price').value;
    const d = document.getElementById('p-desc').value;
    const i = document.getElementById('p-img').value;

    if (!n || !pr || !i) {
        alert("Заполни поля: Название, Цена и URL фото!");
        return;
    }

    const btn = document.getElementById('publish-btn');
    btn.disabled = true;
    btn.innerText = "Публикация...";

    const { error } = await _supabase
        .from('sneakers')
        .insert([{ name: n, price: pr, desc: d, img: i }]);

    btn.disabled = false;
    btn.innerText = "Опубликовать";

    if (error) {
        alert("Ошибка при сохранении: " + error.message);
    } else {
        alert("Товар успешно добавлен!");
        // Очистка полей
        document.getElementById('p-name').value = '';
        document.getElementById('p-price').value = '';
        document.getElementById('p-desc').value = '';
        document.getElementById('p-img').value = '';
        loadProducts();
    }
}

async function deleteProduct(id) {
    if (Number(getCurrentUserId()) !== Number(MY_ID)) {
        alert("Доступ запрещен!");
        return;
    }

    if (!confirm("Удалить этот товар навсегда?")) return;

    const { error } = await _supabase
        .from('sneakers')
        .delete()
        .eq('id', id);

    if (error) alert("Ошибка удаления: " + error.message);
    else loadProducts();
}

function renderAdminItems() {
    const list = document.getElementById('admin-items-list');
    if (!list) return;
    
    list.innerHTML = '<h3 style="margin: 20px 0 10px;">Удаление товаров:</h3>';
    products.forEach(p => {
        list.innerHTML += `
            <div class="admin-item">
                <span>${p.name}</span>
                <button class="del-btn" onclick="deleteProduct(${p.id})">Удалить</button>
            </div>`;
    });
}

// Открытие карточки товара
function openProduct(id) {
    const p = products.find(x => x.id === id);
    if (!p) return;

    const detailContent = document.getElementById('detail-content');
    detailContent.innerHTML = `
        <img src="${p.img}" style="width: 100%; height: 280px; object-fit: cover; border-radius: 15px; margin-bottom: 15px;" onerror="this.src='https://placehold.co/600x400?text=No+Image'">
        <div style="padding: 10px;">
            <h1 style="margin: 0 0 10px 0; font-size: 24px;">${p.name}</h1>
            <div style="font-size: 20px; font-weight: 800; color: var(--accent); margin-bottom: 15px;">${p.price}</div>
            <p style="line-height: 1.5; opacity: 0.9; font-size: 15px; white-space: pre-wrap;">${p.desc || 'Описание отсутствует'}</p>
        </div>`;
    showSection('product-detail');
}

// Запуск приложения
initApp();
