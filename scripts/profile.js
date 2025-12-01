/* scripts/profile.js
   Local profile editor (no network)
   - uses localStorage keys: displayName, avatarUrl, bio
*/

(() => {
  const PLACEHOLDER = 'https://via.placeholder.com/160';
  const KEY_AVATAR = 'lh_profile_avatar';
  const KEY_NAME = 'lh_profile_name';
  const KEY_BIO = 'lh_profile_bio';
  const username = (localStorage.getItem('username')) || 'guest';

  // DOM helpers
  const $ = id => document.getElementById(id);
  const profileForm = $('profileForm'), displayNameInput = $('displayName'), avatarUrlInput = $('avatarUrl'),
        bioInput = $('bio'), profileAvatarLarge = $('profileAvatarLarge'), profileAvatarLargeSmall = $('profileAvatarLargeSmall'),
        displayNameHeading = $('displayNameHeading'), usernameLabel = $('usernameLabel'),
        clearProfileBtn = $('clearProfile'), profileBtn = $('profileBtn'), logoutBtn = $('logoutBtn'),
        userAvatarHeader = $('userAvatar'), avatarFileInput = $('avatarFile'), avatarPreviewWrap = $('avatarPreviewWrap'),
        themeSelect = $('themeSelect');

  function safeSet(el, url){
    if(!el) return;
    el.onerror = null;
    el.src = url || PLACEHOLDER;
    el.onerror = () => { el.onerror = null; el.src = PLACEHOLDER; };
  }

  function readLocal(){
    return {
      name: localStorage.getItem(KEY_NAME) || username,
      avatar: localStorage.getItem(KEY_AVATAR) || PLACEHOLDER,
      bio: localStorage.getItem(KEY_BIO) || ''
    };
  }

  function applyUI(name, avatar, bio){
    if(displayNameHeading) displayNameHeading.textContent = name || username;
    if(usernameLabel) usernameLabel.textContent = `@${username}`;
    safeSet(profileAvatarLarge, avatar); safeSet(profileAvatarLargeSmall, avatar);
    if(userAvatarHeader) safeSet(userAvatarHeader, avatar);
  }

  function loadProfile(){
    const local = readLocal();
    if(displayNameInput) displayNameInput.value = local.name;
    if(avatarUrlInput) avatarUrlInput.value = local.avatar;
    if(bioInput) bioInput.value = local.bio;
    applyUI(local.name, local.avatar, local.bio);
  }

  function handleFileUpload(file){
    if(!file) return;
    if(!file.type || !file.type.startsWith('image/')){ Swal.fire({icon:'error', title:'Please upload an image file.'}); return; }
    const r = new FileReader();
    r.onload = e => {
      const url = e.target.result;
      if(avatarUrlInput) avatarUrlInput.value = url;
      applyUI((displayNameInput && displayNameInput.value) || username, url, (bioInput && bioInput.value) || '');
    };
    r.readAsDataURL(file);
  }

  function saveProfile(e){
    if(e && e.preventDefault) e.preventDefault();
    const name = (displayNameInput && displayNameInput.value.trim()) || username;
    const avatar = (avatarUrlInput && avatarUrlInput.value.trim()) || PLACEHOLDER;
    const bio = (bioInput && bioInput.value.trim()) || '';
    try {
      localStorage.setItem(KEY_NAME, name);
      localStorage.setItem(KEY_AVATAR, avatar);
      localStorage.setItem(KEY_BIO, bio);
    } catch(e){}
    applyUI(name, avatar, bio);
    Swal.fire({ toast:true, position:'bottom-end', icon:'success', title:'Saved locally', showConfirmButton:false, timer:1200 });
    window.dispatchEvent(new CustomEvent('avatarChanged', { detail: { avatarUrl: avatar } }));
  }

  function clearProfile(){
    try {
      localStorage.removeItem(KEY_NAME);
      localStorage.removeItem(KEY_AVATAR);
      localStorage.removeItem(KEY_BIO);
    } catch(e){}
    loadProfile();
    Swal.fire({ toast:true, position:'bottom-end', icon:'success', title:'Profile reset', showConfirmButton:false, timer:1200 });
  }

  document.addEventListener('DOMContentLoaded', () => {
    loadProfile();

    if (avatarPreviewWrap && avatarFileInput) avatarPreviewWrap.addEventListener('click', () => avatarFileInput.click());
    if (avatarFileInput) avatarFileInput.addEventListener('change', ev => { const f = ev.target.files && ev.target.files[0]; if (f) handleFileUpload(f); });
    if (avatarUrlInput) avatarUrlInput.addEventListener('input', e => applyUI((displayNameInput && displayNameInput.value) || username, e.target.value.trim() || PLACEHOLDER, (bioInput && bioInput.value) || ''));
    if (profileForm) profileForm.addEventListener('submit', saveProfile);
    if (clearProfileBtn) clearProfileBtn.addEventListener('click', clearProfile);
    if (profileBtn) profileBtn.addEventListener('click', () => { window.location.href = './dashboard.html'; });
    if (logoutBtn) logoutBtn.addEventListener('click', () => { try { localStorage.removeItem('username'); } catch(e){}; window.location.href = '../index.html'; });

    if (themeSelect) {
      const t = localStorage.getItem('theme') || 'dark';
      document.body.setAttribute('data-theme', t); themeSelect.value = t;
      themeSelect.addEventListener('change', e => { const v = e.target.value; localStorage.setItem('theme', v); document.body.setAttribute('data-theme', v); });
    }

    window.addEventListener('storage', (e) => {
      if ([KEY_AVATAR, KEY_NAME, KEY_BIO].includes(e.key)) {
        const local = readLocal();
        if (displayNameInput) displayNameInput.value = local.name;
        if (avatarUrlInput) avatarUrlInput.value = local.avatar;
        if (bioInput) bioInput.value = local.bio;
        applyUI(local.name, local.avatar, local.bio);
      }
    });

    window.addEventListener('avatarChanged', ev => {
      const url = ev?.detail?.avatarUrl || localStorage.getItem(KEY_AVATAR) || PLACEHOLDER;
      safeSet(profileAvatarLarge, url); safeSet(profileAvatarLargeSmall, url);
      if (userAvatarHeader) safeSet(userAvatarHeader, url);
    });
  });
})();
