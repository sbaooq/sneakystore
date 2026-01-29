const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

// --- НАСТРОЙКИ ---
const SUPABASE_URL = 'https://zlfjpgjiwzuspudjeeyk.supabase.co'; 
const SUPABASE_KEY = 'sb_publishable_qrPjy7NqXpeeiwXQc8o9LQ_j7vrnKpE'; 
const MY_ID = 8067897290; 

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
let products = [];
let favorites = JSON.parse(localStorage.getItem('favs')) || [];

function initApp() {
    const user = tg.initDataUnsafe?.user;
    if (user) {
        document.getElementById('user-name').innerText = user.first_name;
        if (user.photo_url) {
            const img = document.getElementById('user-photo');
            img.src = user.photo_url; img.style.display = 'block';
        }
        if (Number(user.id) === Number(MY_ID)) {
            document.getElementById('admin-btn').classList.remove('hidden');
        }
    }
    loadProducts();
}

async function loadProducts() {
    console.log("Загрузка данных...");
    const { data, error } = await _supabase.from('sneakers').select('*').order('id', { ascending: false });

    if (error) {
        alert("Ошибка базы: " + error.message);
        console.error(error);
        return;
    }

    products = data || [];
    console.log("Данные получены:", products);
    
    renderShop();
    if (!document.getElementById('admin-page').classList.contains('hidden')) renderAdminItems();
}

function renderShop() {
    const list = document.getElementById('product-list');
    if (products.length === 0) {
        list.innerHTML = '<p style="grid-column:1/3; text-align:center; padding:20px;">Товары не найдены в базе</p>';
        return;
    }
    list.innerHTML = '';
    products.forEach(p => {
        const isFav = favorites.includes(p.id);
        list.innerHTML += `
            <div class="item-card">
                <img src="${p.img}" onclick="openProduct(${p.id})" onerror="this.src='https://placehold.co/300x300?text=Ошибка+фото'">
                <button class="fav-icon-btn" onclick="toggleFav(${p.id})">${isFav ? '❤️' : '🤍'}</button>
                <div class="item-info" onclick="openProduct(${p.id})">
                    <div style="font-size:13px; font-weight:bold;">${p.name}</div>
                    <div style="color:var(--accent); font-weight:800;">${p.price}</div>
                </div>
            </div>`;
    });
}

function showSection(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
    if (id === 'main-menu') loadProducts();
}

function toggleFav(id) {
    const pId = Number(id);
    const idx = favorites.indexOf(pId);
    if (idx > -1) favorites.splice(idx, 1); else favorites.push(pId);
    localStorage.setItem('favs', JSON.stringify(favorites));
    renderShop();
}

async function saveProduct() {
    if (Number(tg.initDataUnsafe?.user?.id) !== Number(MY_ID)) return alert("Нет прав");
    
    const n = document.getElementById('p-name').value;
    const pr = document.getElementById('p-price').value;
    const d = document.getElementById('p-desc').value;
    const i = document.getElementById('p-img').value;

    if(!n || !pr || !i) return alert("Заполни поля!");

    const { error } = await _supabase.from('sneakers').insert([{ name: n, price: pr, desc: d, img: i }]);
    
    if (error) alert("Ошибка сохранения: " + error.message);
    else {
        alert("Успешно!");
        document.querySelectorAll('.admin-form input').forEach(input => input.value = '');
        loadProducts();
    }
}

function renderAdminItems() {
    const list = document.getElementById('admin-items-list');
    list.innerHTML = '<h3>Список для удаления:</h3>';
    products.forEach(p => {
        list.innerHTML += `<div class="admin-item"><span>${p.name}</span><button class="del-btn" onclick="deleteProduct(${p.id})">Удалить</button></div>`;
    });
}

async function deleteProduct(id) {
    if (Number(tg.initDataUnsafe?.user?.id) !== Number(MY_ID)) return;
    if(!confirm("Удалить?")) return;
    await _supabase.from('sneakers').delete().eq('id', id);
    loadProducts();
}

function openProduct(id) {
    const p = products.find(x => x.id === id);
    if(!p) return;
    document.getElementById('detail-content').innerHTML = `
        <img src="${p.img}" style="width:100%; height:300px; object-fit:cover; border-radius:0 0 20px 20px;">
        <div style="padding:20px;">
            <h1 style="margin:0;">${p.name}</h1>
            <h2 style="color:var(--accent); margin:10px 0;">${p.price}</h2>
            <p style="opacity:0.8; line-height:1.6;">${p.desc || 'Описание отсутствует'}</p>
        </div>`;
    showSection('product-detail');
}

initApp();
