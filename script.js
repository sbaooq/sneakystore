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
        document.getElementById('user-name').innerText = user.first_name || "Пользователь";
        if (Number(user.id) === Number(MY_ID)) {
            document.getElementById('admin-btn')?.classList.remove('hidden');
        }
    }
    loadProducts();
}

async function loadProducts() {
    // 1. Пробуем получить данные
    const { data, error } = await _supabase
        .from('sneakers')
        .select('*')
        .order('id', { ascending: false });

    // 2. Если ошибка подключения
    if (error) {
        alert("Ошибка подключения: " + error.message);
        return;
    }

    // 3. Если база ответила, но там 0 строк
    if (!data || data.length === 0) {
        console.log("База пуста или RLS блокирует чтение");
        document.getElementById('product-list').innerHTML = 
            '<p style="grid-column:1/3; text-align:center; padding:50px; opacity:0.5;">В каталоге пока нет товаров.<br>Попробуйте добавить через админку.</p>';
        return;
    }

    // 4. Если данные есть, сохраняем и рисуем
    products = data;
    renderShop();
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

// Функции для работы кнопок
function showSection(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
    if (id === 'main-menu') loadProducts();
}

async function saveProduct() {
    const n = document.getElementById('p-name').value;
    const pr = document.getElementById('p-price').value;
    const d = document.getElementById('p-desc').value;
    const i = document.getElementById('p-img').value;

    if(!n || !pr || !i) return alert("Заполни Название, Цену и Фото!");

    const { error } = await _supabase.from('sneakers').insert([{ name: n, price: pr, desc: d, img: i }]);
    
    if (error) {
        alert("Ошибка сохранения: " + error.message);
    } else {
        alert("Товар успешно добавлен!");
        // Очистка и возврат на главную
        document.querySelectorAll('.admin-form input').forEach(inp => inp.value = '');
        showSection('main-menu');
    }
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
            <p style="opacity:0.8; line-height:1.6; font-size:16px;">${p.desc || 'Описание появится позже'}</p>
        </div>`;
    showSection('product-detail');
}

initApp();
