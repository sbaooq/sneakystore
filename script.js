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
    if (user && Number(user.id) === Number(MY_ID)) {
        document.getElementById('admin-btn')?.classList.remove('hidden');
    }
    loadProducts();
}

async function loadProducts() {
    const { data, error } = await _supabase.from('sneakers').select('*').order('id', { ascending: false });
    if (error) return console.error(error);
    products = data || [];
    renderShop();
    renderAdminItems(); // Обновляем список удаления в админке
}

function renderShop() {
    const list = document.getElementById('product-list');
    if (!list) return;
    list.innerHTML = products.length ? '' : '<p style="text-align:center;width:100%;opacity:0.5;">Каталог пуст</p>';
    
    products.forEach(p => {
        list.innerHTML += `
            <div class="item-card" onclick="openProduct(${p.id})">
                <img src="${p.img}" onerror="this.src='https://placehold.co/300x300?text=Ошибка+фото'">
                <div class="item-info">
                    <div style="font-weight:600; font-size:14px;">${p.name}</div>
                    <div class="item-price">${p.price}</div>
                </div>
            </div>`;
    });
}

// Удаление товара
async function deleteProduct(id) {
    if (!confirm("Вы уверены, что хотите удалить этот товар?")) return;
    
    const { error } = await _supabase.from('sneakers').delete().eq('id', id);
    if (error) {
        alert("Ошибка: " + error.message);
    } else {
        loadProducts(); // Перезагружаем список после удаления
    }
}

function renderAdminItems() {
    const list = document.getElementById('admin-items-list');
    if (!list) return;
    list.innerHTML = '<h3 style="margin: 20px 0 10px;">Удаление товаров:</h3>';
    products.forEach(p => {
        list.innerHTML += `
            <div class="admin-item">
                <span style="font-size:14px;">${p.name}</span>
                <button class="del-btn" onclick="deleteProduct(${p.id})">Удалить</button>
            </div>`;
    });
}

function openProduct(id) {
    const p = products.find(x => x.id === id);
    if (!p) return;
    
    const detail = document.getElementById('product-detail');
    detail.innerHTML = `
        <button class="back-btn floating-back" onclick="showSection('main-menu')">✕</button>
        <img src="${p.img}" style="width:100%; height:350px; object-fit:cover;">
        <div style="padding:20px;">
            <h1 style="margin:0; font-size:24px;">${p.name}</h1>
            <div style="color:var(--accent); font-size:22px; font-weight:800; margin:10px 0;">${p.price}</div>
            <p style="opacity:0.7; line-height:1.5;">${p.desc || 'Описание отсутствует'}</p>
            <button class="main-btn" onclick="window.open('https://t.me/broyad')">Заказать эту пару</button>
        </div>
    `;
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
    else {
        alert("Товар добавлен!");
        document.querySelectorAll('input').forEach(i => i.value = '');
        loadProducts();
        showSection('main-menu');
    }
}

function showSection(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
    window.scrollTo(0, 0);
}

initApp();
