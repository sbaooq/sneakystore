const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

// ПРОВЕРЬ ДАННЫЕ НИЖЕ!
const SUPABASE_URL = 'https://zlfjpgjiwzuspudjeeyk.supabase.co'; 
const SUPABASE_KEY = 'sb_publishable_qrPjy7NqXpeeiwXQc8o9LQ_j7vrnKpE';
const MY_ID = 8067897290; // Твой ID цифрами

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let products = [];
let favorites = JSON.parse(localStorage.getItem('favs')) || [];

// Инициализация юзера
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

async function loadProducts() {
    const { data, error } = await _supabase.from('sneakers').select('*');
    if (error) {
        console.error(error);
    } else {
        products = data;
        renderShop();
    }
}

function showSection(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
    if (id === 'main-menu') renderShop();
}

function renderShop() {
    const list = document.getElementById('product-list');
    list.innerHTML = '';
    products.forEach(p => {
        const isFav = favorites.includes(p.id);
        list.innerHTML += `
            <div class="item-card">
                <img src="${p.img}" onclick="openProduct(${p.id})">
                <div class="item-info">
                    <div style="font-size:12px; font-weight:bold;">${p.name}</div>
                    <div class="item-price">${p.price}</div>
                    <button onclick="toggleFav(${p.id})" style="border:none; background:none; padding:5px 0;">
                        ${isFav ? '❤️' : '🤍'}
                    </button>
                </div>
            </div>`;
    });
}

async function saveProduct() {
    const n = document.getElementById('p-name').value;
    const p = document.getElementById('p-price').value;
    const d = document.getElementById('p-desc').value;
    const i = document.getElementById('p-img').value;

    const { error } = await _supabase.from('sneakers').insert([{ name: n, price: p, desc: d, img: i }]);
    if (error) {
        alert("Ошибка: " + error.message);
    } else {
        alert("Добавлено!");
        location.reload();
    }
}

function toggleFav(id) {
    if (favorites.includes(id)) {
        favorites = favorites.filter(f => f !== id);
    } else {
        favorites.push(id);
    }
    localStorage.setItem('favs', JSON.stringify(favorites));
    renderShop();
}

function openProduct(id) {
    const p = products.find(x => x.id === id);
    document.getElementById('detail-content').innerHTML = `
        <img src="${p.img}" style="width:100%;">
        <div style="padding:15px;">
            <h2>${p.name}</h2>
            <h3 style="color:var(--accent)">${p.price}</h3>
            <p>${p.desc}</p>
        </div>`;
    showSection('product-detail');
}

initApp();
