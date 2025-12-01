/* scripts/admin.js
   Local admin CRUD for courses (encrypted storage)
   - No external network
   - Admin check based on local session
*/

const ENCRYPTION_KEY = 'EducationalSite2025!@#';
const STORAGE_KEY = 'encrypted_videos';
const ADMIN_PASS = 'admin111';

// encryption helpers
function encrypt(obj){
  try { return CryptoJS.AES.encrypt(JSON.stringify(obj), ENCRYPTION_KEY).toString(); }
  catch(e){ console.error('encrypt error', e); return null; }
}
function decrypt(enc){
  if(!enc) return null;
  try { const bytes = CryptoJS.AES.decrypt(enc, ENCRYPTION_KEY); return JSON.parse(bytes.toString(CryptoJS.enc.Utf8)); }
  catch(e){ return null; }
}

function uid(){ return 'c_' + Math.random().toString(36).slice(2,12); }
function isValidYouTubeId(id){ return typeof id === 'string' && /^[A-Za-z0-9_-]{11}$/.test(id); }
function extractVideoId(val){
  if(!val) return '';
  val = String(val).trim();
  if(/^[A-Za-z0-9_-]{11}$/.test(val)) return val;
  const m = val.match(/(?:v=|\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : '';
}
function thumbnailFromId(id){ return id ? `https://i.ytimg.com/vi/${id}/maxresdefault.jpg` : ''; }

function loadVideos(){ const enc = localStorage.getItem(STORAGE_KEY); const arr = decrypt(enc); return Array.isArray(arr) ? arr : []; }
function saveVideos(videos){ localStorage.setItem(STORAGE_KEY, encrypt(videos)); localStorage.setItem('encrypted_videos_updated_at', Date.now().toString()); }

function isAdminAllowed(){ return localStorage.getItem('username') === 'admin' && localStorage.getItem('admin_pass') === ADMIN_PASS; }
function enforceAdmin(){ if(isAdminAllowed()) return true; Swal.fire({icon:'error', title:'غير مصرح', text:'هذا القسم مخصص للأدمن فقط.'}).then(()=> window.location.href = '../index.html'); return false; }

const idInput = () => document.getElementById('courseId');
const titleInput = () => document.getElementById('courseTitle');
const descInput = () => document.getElementById('courseDesc');
const imgInput = () => document.getElementById('courseImg');
const vidInput = () => document.getElementById('courseVid');
const durationInput = () => document.getElementById('courseDuration');
const levelInput = () => document.getElementById('courseLevel');
const categorySelect = () => document.getElementById('courseCategory');
const coursesList = () => document.getElementById('coursesList');
const courseMsg = () => document.getElementById('courseMsg');

function flash(msg, type='success'){ const el = courseMsg(); if(el){ el.textContent = msg; el.style.color = type==='success' ? '#8bd48b' : '#f88'; setTimeout(()=> el.textContent = '', 3500); } }

function renderCoursesList(){
  const list = loadVideos();
  const out = coursesList();
  if(!out) return;
  if(list.length === 0){ out.innerHTML = '<div>لا توجد فيديوهات بعد.</div>'; return; }
  out.innerHTML = '';
  list.forEach(item => {
    const row = document.createElement('div');
    row.className = 'course-row';
    row.innerHTML = `
      <div style="display:flex;gap:12px;align-items:center">
        <img src="${item.thumbnail || thumbnailFromId(item.videoId||'')}" style="width:160px;height:90px;object-fit:cover;border-radius:8px" onerror="this.src='https://via.placeholder.com/160x90?text=No+Image'"/>
        <div style="flex:1">
          <div style="font-weight:600">${item.title}</div>
          <div style="font-size:13px;color:#aaa">${item.description||''}</div>
          <div style="font-size:12px;color:#999;margin-top:6px">القسم: ${item.category||'-'} • المدة: ${item.duration||'-'} • المستوى: ${item.level||'-'}</div>
        </div>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        <button class="contact-btn" data-action="edit" data-id="${item.id}" style="background:#f59e0b">تعديل</button>
        <button class="contact-btn" data-action="delete" data-id="${item.id}" style="background:#ef4444">حذف</button>
      </div>
    `;
    out.appendChild(row);
  });

  out.querySelectorAll('button[data-action]').forEach(btn=>{
    const action = btn.dataset.action;
    const id = btn.dataset.id;
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if(action === 'edit') startEditCourse(id);
      if(action === 'delete') confirmDelete(id);
    });
  });
}

function startEditCourse(id){
  const videos = loadVideos();
  const v = videos.find(x => String(x.id) === String(id));
  if(!v){ Swal.fire('خطأ','لم أجد هذا الكورس','error'); return; }
  idInput().value = v.id;
  titleInput().value = v.title || '';
  descInput().value = v.description || '';
  imgInput().value = v.thumbnail || '';
  vidInput().value = v.videoId || '';
  durationInput().value = v.duration || '';
  levelInput().value = v.level || '';
  categorySelect().value = v.category || 'featured';
  flash('تم تحميل بيانات للتعديل','success');
}

function confirmDelete(id){
  Swal.fire({
    title:'هل أنت متأكد؟',
    text:'هذا الإجراء سيحذف الكورس نهائياً.',
    icon:'warning',
    showCancelButton:true,
    confirmButtonText:'نعم احذف',
    cancelButtonText:'إلغاء'
  }).then(res => { if(res.isConfirmed) deleteCourse(id); });
}

function deleteCourse(id){
  let arr = loadVideos();
  const before = arr.length;
  arr = arr.filter(x => String(x.id) !== String(id));
  if(arr.length === before){ flash('لم أجد الكورس للحذف','error'); return; }
  saveVideos(arr);
  renderCoursesList();
  flash('تم الحذف','success');
}

function saveCourse(){
  const idVal = idInput()?.value || '';
  const title = titleInput()?.value.trim() || '';
  if(!title){ flash('اكتب عنوان الفيديو','error'); return; }
  let videoId = extractVideoId(vidInput()?.value || '');
  let thumbnail = imgInput()?.value.trim() || (videoId ? thumbnailFromId(videoId) : '');
  const payload = {
    id: idVal || uid(),
    title,
    description: descInput()?.value.trim() || '',
    thumbnail,
    videoId,
    duration: durationInput()?.value?.trim() || '',
    level: levelInput()?.value?.trim() || '',
    category: categorySelect()?.value || 'featured'
  };

  const arr = loadVideos();
  if(idVal){
    const newArr = arr.map(x => String(x.id) === String(idVal) ? payload : x);
    saveVideos(newArr);
    flash('تم التعديل','success');
  } else {
    arr.push(payload);
    saveVideos(arr);
    flash('تم الإضافة','success');
  }

  clearForm();
  renderCoursesList();
}

function clearForm(){
  if(idInput()) idInput().value = '';
  if(titleInput()) titleInput().value = '';
  if(descInput()) descInput().value = '';
  if(imgInput()) imgInput().value = '';
  if(vidInput()) vidInput().value = '';
  if(durationInput()) durationInput().value = '';
  if(levelInput()) levelInput().value = '';
  if(categorySelect()) categorySelect().value = 'featured';
}

document.addEventListener('DOMContentLoaded', () => {
  if(!enforceAdmin()) return;

  document.getElementById('addCourseBtn')?.addEventListener('click', (e)=>{ e.preventDefault(); saveCourse(); });
  document.getElementById('clearCourseForm')?.addEventListener('click', (e)=>{ e.preventDefault(); clearForm(); flash('تم التفريغ','success'); });
  document.getElementById('logoutAdmin')?.addEventListener('click', ()=> { localStorage.removeItem('username'); localStorage.removeItem('admin_pass'); window.location.href = '../index.html'; });

  renderCoursesList();
  document.getElementById('userCount') && (document.getElementById('userCount').textContent = (JSON.parse(localStorage.getItem('lh_users')||'[]').length || 0));
});
