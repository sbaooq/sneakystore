const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

// --- НАСТРОЙКИ (ПОЛНОСТЬЮ ЗАПОЛНЕНО) ---
const SUPABASE_URL = 'https://zlfjpgjiwzuspudjeeyk.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsZmpwZ2ppd3p1c3B1ZGplZXlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2OTQ5OTMsImV4cCI6MjA4NTI3MDk5M30.8Mg1h48q4ChV84un3n4DPKl-Vr9d49HmAWJoAAXmVCc'; 
const MY_ID = 8067897290; 

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
let products = [];
let favorites = JSON.parse(localStorage.getItem('favs')) || [];

function initApp() {
    const user = tg.initDataUnsafe?.user;
    if (user) {
        document.getElementById('user-name').innerText = user.first_name || "Пользователь";
        if (user.photo_url) {
            const img = document.getElementById('user-photo');
            img.src = user.photo_url; img.style.display = 'block';
        }
        // Проверка прав администратора
        if (Number(user.id) === Number(MY_ID)) {
            const adminBtn = document.getElementById('admin-btn');
            if (adminBtn) adminBtn.classList.remove('hidden');
        }
    }
    loadProducts();
}

async function loadProducts() {
    console.log("Загрузка товаров...");
    const { data, error } = await _supabase
        .from('sneakers')
        .select('*')
        .order('id', { ascending: false });

    if (error) {
        alert("Ошибка подключения: " + error.message);
        return;
    }

    products = data || [];
    
    if (products.length === 0) {
        document.getElementById('product-list').innerHTML = 
            '<p style="grid-column:1/3; text-align:center; padding:50px; opacity:0.5;">Каталог пуст.<br>Добавьте первый товар в админке!</p>';
    } else {
        renderShop();
    }
    
    // Обновляем список в админке, если она открыта
    if (!document.getElementById('admin-page').classList.contains('hidden')) {
        renderAdminItems();
    }
}

function renderShop() {
    const list = document.getElementById('product-list');
    if (!list) return;
    list.innerHTML = '';
    
    products.forEach(p => {
        const isFav = favorites.includes(p.id);
        list.innerHTML += `
            <div class="item-card">
                <img src="${p.img}" onclick="openProduct(${p.id})" onerror="this.src='https://placehold.co/300x300?text=Нет+фото'">
                <button class="fav-icon-btn" onclick="toggleFav(${p.id})">${isFav ? '❤️' : '🤍'}</button>
                <div class="item-info" onclick="openProduct(${p.id})">
                    <div style="font-size:13px; font-weight:bold;">${p.name}</div>
                    <div style="color:var(--accent); font-weight:800;">${p.price}</div>
                </div>
            </div>`;
    });
}

async function saveProduct() {
    const user = tg.initDataUnsafe?.user;
    if (!user || Number(user.id) !== Number(MY_ID)) {
        alert("Доступ запрещен!");
        return;
    }

    const n = document.getElementById('p-name').value;
    const pr = document.getElementById('p-price').value;
    const d = document.getElementById('p-desc').value;
    const i = document.getElementById('p-img').value;

    if(!n || !pr || !i) return alert("Заполните Название, Цену и URL фото!");

    const btn = document.getElementById('publish-btn');
    btn.disabled = true;
    btn.innerText = "Загрузка...";

    const { error } = await _supabase.from('sneakers').insert([{ name: n, price: pr, desc: d, img: i }]);
    
    btn.disabled = false;
    btn.innerText = "Опубликовать";

    if (error) {
        alert("Ошибка: " + error.message);
    } else {
        alert("Товар добавлен!");
        document.querySelectorAll('.admin-form input').forEach(inp => inp.value = '');
        showSection('main-menu');
    }
}

function showSection(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    const target = document.getElementById(id);
    if (target) target.classList.remove('hidden');
    if (id === 'main-menu') loadProducts();
}

function toggleFav(id) {
    const pId = Number(id);
    const idx = favorites.indexOf(pId);
    if (idx > -1) favorites.splice(idx, 1); else favorites.push(pId);
    localStorage.setItem('favs', JSON.stringify(favorites));
    renderShop();
}

function openProduct(id) {
    const p = products.find(x => x.id === id);
    if(!p) return;
    document.getElementById('detail-content').innerHTML = `
        <img src="${p.img}" style="width:100%; height:300px; object-fit:cover;">
        <div style="padding:20px;">
            <h1>${p.name}</h1>
            <h2 style="color:var(--accent);">${p.price}</h2>
            <p style="opacity:0.8; line-height:1.6; font-size:16px;">${p.desc || 'Описание отсутствует'}</p>
        </div>`;
    showSection('product-detail');
}

function renderAdminItems() {
    const list = document.getElementById('admin-items-list');
    if (!list) return;
    list.innerHTML = '<h3>Удаление товаров:</h3>';
    products.forEach(p => {
        list.innerHTML += `
            <div class="admin-item">
                <span>${p.name}</span>
                <button class="del-btn" onclick="deleteProduct(${p.id})">Удалить</button>
            </div>`;
    });
}

async function deleteProduct(id) {
    if (!confirm("Удалить товар?")) return;
    const { error } = await _supabase.from('sneakers').delete().eq('id', id);
    if (error) alert(error.message);
    else loadProducts();
}

initApp();
