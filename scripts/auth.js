/* scripts/auth.js
   Local-only auth + image-grid hover/focus behavior
*/

(function(){
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const themeSelect = document.getElementById('themeSelect');

  // --- image-grid behavior (populate overlays & hover blur) ---
  function initImageGrid(){
    const grid = document.querySelector('.brand-features .image-grid');
    if(!grid) return;

    const cards = Array.from(grid.querySelectorAll('.img-card'));

    // populate overlay from data- attributes
    cards.forEach(card => {
      const name = card.dataset.name || '';
      const id = card.dataset.id || '';
      const titleEl = card.querySelector('.overlay .title');
      const idEl = card.querySelector('.overlay .id');
      if(titleEl) titleEl.textContent = name;
      if(idEl) idEl.textContent = id;

      // mouseenter/mouseleave
      card.addEventListener('mouseenter', ()=> setActiveCard(card, cards));
      card.addEventListener('mouseleave', ()=> clearActive(cards));

      // focus/blur for keyboard
      card.addEventListener('focus', ()=> setActiveCard(card, cards));
      card.addEventListener('blur', ()=> clearActive(cards));

      // click: for accessibility - toggle (optional)
      card.addEventListener('click', (e) => {
        // prevent accidental form submission if inside button, just show overlay briefly
        e.preventDefault();
        setActiveCard(card, cards);
        setTimeout(()=> clearActive(cards), 2000);
      });
    });

    function setActiveCard(active, all){
      all.forEach(c => {
        if(c === active){
          c.classList.add('is-active');
          c.classList.remove('blurred');
        } else {
          c.classList.add('blurred');
          c.classList.remove('is-active');
        }
      });
    }
    function clearActive(all){
      all.forEach(c => { c.classList.remove('is-active','blurred'); });
    }
  }

  // Helpers for users (auth)
  function getUsers(){
    try { return JSON.parse(localStorage.getItem('lh_users')) || []; }
    catch(e){ return []; }
  }
  function setUsers(users){ localStorage.setItem('lh_users', JSON.stringify(users)); }

  // Ensure admin exists
  (function seedAdmin(){
    const users = getUsers();
    if(!users.find(u=>u.username === 'admin')){
      users.push({ username:'admin', password:'admin111', name:'Administrator', email:'admin@example.com' });
      setUsers(users);
    }
  })();

  function saveSession(user){
    const session = { username: user.username, name: user.name || user.username, createdAt: Date.now() };
    localStorage.setItem('lh_session', JSON.stringify(session));
    if(user.username === 'admin') localStorage.setItem('admin_pass', 'admin111');
    localStorage.setItem('username', user.username);
  }

  // Small UI helpers (modals)
  function showSuccess(text){
    const el = document.getElementById('successMessage');
    const modal = document.getElementById('successModal');
    if(el && modal){ el.textContent = text; modal.classList.add('show'); setTimeout(()=> modal.classList.remove('show'), 1800); }
    else alert(text);
  }
  function showError(text){
    const el = document.getElementById('errorMessage');
    const modal = document.getElementById('errorModal');
    if(el && modal){ el.textContent = text; modal.classList.add('show'); setTimeout(()=> modal.classList.remove('show'), 2500); }
    else alert(text);
  }

  // Toggle theme restore
  (function initTheme(){
    const saved = localStorage.getItem('theme') || 'dark';
    document.body.setAttribute('data-theme', saved);
    if(themeSelect) themeSelect.value = saved;
    themeSelect?.addEventListener('change', (e)=> {
      const v = e.target.value; localStorage.setItem('theme', v); document.body.setAttribute('data-theme', v);
    });
  })();

  // Toggle forms links
  document.querySelectorAll('.toggle-form-link')?.forEach(a=>{
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const form = a.dataset.form;
      document.querySelectorAll('.form-section').forEach(s=>s.classList.remove('active'));
      document.querySelector(`.${form}-section`)?.classList.add('active');
    });
  });

  // Register handler
  registerForm?.addEventListener('submit', function(e){
    e.preventDefault();
    const username = document.getElementById('regUsername')?.value?.trim();
    const email = document.getElementById('regEmail')?.value?.trim();
    const password = document.getElementById('regPassword')?.value;

    if(!username || !email || !password){ showError('من فضلك املأ كل الحقول'); return; }
    if(password.length < 6){ showError('كلمة المرور يجب أن تكون 6 أحرف على الأقل'); return; }

    const users = getUsers();
    if(users.find(u=>u.username === username)){ showError('اسم المستخدم موجود بالفعل'); return; }

    users.push({ username, password, email, name: username });
    setUsers(users);
    showSuccess('تم إنشاء الحساب محليًا! يمكنك تسجيل الدخول الآن');
    registerForm.reset();
    setTimeout(()=> {
      document.querySelector('.register-section')?.classList.remove('active');
      document.querySelector('.login-section')?.classList.add('active');
    }, 900);
  });

  // Login handler
  loginForm?.addEventListener('submit', function(e){
    e.preventDefault();
    const username = document.getElementById('loginUsername')?.value?.trim();
    const password = document.getElementById('loginPassword')?.value;

    if(!username || !password){ showError('أدخل اسم المستخدم وكلمة المرور'); return; }

    const users = getUsers();
    const found = users.find(u => u.username === username && u.password === password);
    if(!found){ showError('خطأ في اسم المستخدم أو كلمة المرور'); return; }

    saveSession(found);
    showSuccess('مرحبًا! جارٍ التحويل إلى لوحة التحكم...');
    setTimeout(()=> window.location.href = 'dashboard.html', 800);
  });

  // close modals on click
  document.querySelectorAll('.modal-overlay')?.forEach(modal=>{
    modal.addEventListener('click', (e)=> { if(e.target === modal) modal.classList.remove('show'); });
  });

  // init image grid after DOM ready
  document.addEventListener('DOMContentLoaded', ()=> {
    initImageGrid();
  });

})();
