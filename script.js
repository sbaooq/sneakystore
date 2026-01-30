const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

// Твои данные уже здесь
const SUPABASE_URL = 'https://zlfjpgjiwzuspudjeeyk.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsZmpwZ2ppd3p1c3B1ZGplZXlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2OTQ5OTMsImV4cCI6MjA4NTI3MDk5M30.8Mg1h48q4ChV84un3n4DPKl-Vr9d49HmAWJoAAXmVCc'; 
const MY_ID = 8067897290; 

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
let products = [];
let favorites = JSON.parse(localStorage.getItem('kaykas_favs')) || [];

function initApp() {
    const user = tg.initDataUnsafe?.user;
    if (user) {
        document.getElementById('user-name').innerText = user.first_name || "Стильный гость";
        if (user.photo_url) {
            const img = document.getElementById('user-photo');
            img.src = user.photo_url; img.style.display = 'block';
        }
        // Проверка на админа
        if (Number(user.id) === Number(MY_ID)) {
            document.getElementById('admin-btn')?.classList.remove('hidden');
        }
    }
    loadProducts();
}

async function loadProducts() {
    const { data, error } = await _supabase.from('sneakers').select('*').order('id', { ascending: false });
    if (error) return console.error("Ошибка загрузки:", error);
    
    products = data || [];
    renderShop();
    renderAdminItems(); // Список для удаления в админке
    if (!document.getElementById('favorites-page').classList.contains('hidden')) renderFavs();
}

function renderShop() {
    const list = document.getElementById('product-list');
    if (!list) return;
    list.innerHTML = '';
    
    if (products.length === 0) {
        list.innerHTML = '<p style="grid-column:1/3;text-align:center;padding:40px;opacity:0.5;">Витрина пока пуста...</p>';
        return;
    }

    products.forEach(p => {
        list.innerHTML += `
            <div class="item-card" onclick="openProduct(${p.id})">
                <img src="${p.img}" onerror="this.src='https://placehold.co/400x400?text=KAYKAS+STORE'">
                <div class="item-info">
                    <span class="name">${p.name}</span>
                    <span class="price">${p.price}</span>
                </div>
            </div>`;
    });
}

function openProduct(id) {
    const p = products.find(x => x.id === id);
    if (!p) return;

    const content = document.getElementById('detail-content');
    content.innerHTML = `
        <button class="floating-back" onclick="showSection('main-menu')">✕</button>
        <img src="${p.img}" class="detail-img" onerror="this.src='https://placehold.co/600x600?text=Ошибка+загрузки+фото'">
        <div class="detail-body">
            <h1 style="margin:0;">${p.name}</h1>
            <div style="color:var(--accent); font-size:22px; font-weight:900; margin:10px 0;">${p.price}</div>
            <p style="opacity:0.7; line-height:1.6; font-size:15px; margin-bottom:25px;">${p.desc || 'Описание для этой пары еще не добавлено.'}</p>
            <button class="order-btn" onclick="window.open('https://t.me/broyad', '_blank')">Забрать эту пару</button>
        </div>
    `;
    showSection('product-detail');
}

async function saveProduct() {
    const n = document.getElementById('p-name').value;
    const pr = document.getElementById('p-price').value;
    const d = document.getElementById('p-desc').value;
    const i = document.getElementById('p-img').value;

    if (!n || !pr || !i) return alert("Пожалуйста, заполни Название, Цену и Фото!");

    const btn = document.getElementById('publish-btn');
    btn.innerText = "Публикуем..."; btn.disabled = true;

    const { error } = await _supabase.from('sneakers').insert([{ name: n, price: pr, desc: d, img: i }]);
    
    btn.innerText = "Опубликовать в каталог"; btn.disabled = false;

    if (error) alert("Ошибка: " + error.message);
    else {
        alert("Успешно добавлено!");
        document.querySelectorAll('.admin-form input').forEach(inp => inp.value = '');
        loadProducts();
        showSection('main-menu');
    }
}

function renderAdminItems() {
    const list = document.getElementById('admin-items-list');
    if (!list) return;
    list.innerHTML = '<h3 style="margin-bottom:15px;">Удалить из магазина:</h3>';
    products.forEach(p => {
        list.innerHTML += `
            <div class="admin-item">
                <span style="font-weight:600;">${p.name}</span>
                <button class="del-btn" onclick="deleteProduct(${p.id})">Удалить</button>
            </div>`;
    });
}

async function deleteProduct(id) {
    if (!confirm("Удалить этот товар из каталога навсегда?")) return;
    const { error } = await _supabase.from('sneakers').delete().eq('id', id);
    if (error) alert(error.message);
    else loadProducts();
}

function showSection(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
    window.scrollTo(0, 0);
}

// Запуск
initApp();
