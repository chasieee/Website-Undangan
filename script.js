// =============================================
// ⚙️ CONFIG
// =============================================
const CONFIG = {
    SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbxU-7G1wBdBTtO0GFJvHAbx-1R1S0tEVSPREw4Vp1EOPSK1nZnsiZiZeQyjbIZsuSnkFQ/exec',
    WEDDING_DATE: new Date(2026, 3, 11, 8, 0, 0), // 11 April 2026, 08:00
};

// =============================================
// INIT AOS
// =============================================
document.addEventListener('DOMContentLoaded', () => {
    AOS.init({ 
        duration: 1500, 
        once: false, 
        easing: 'ease-in-out',
        // offset: 60 
    });
    loadWishes();
    setInterval(loadWishes, 15000);
});

// =============================================
// OPENING — Buka Undangan
// Musik otomatis play setelah tombol ditekan
// =============================================
function bukaUndangan() {
    const opening     = document.getElementById('opening');
    const mainContent = document.getElementById('main-content');

    // Transition opening out
    opening.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
    opening.style.opacity    = '0';
    opening.style.transform  = 'translateY(-24px)';

    setTimeout(() => {
        opening.style.display = 'none';
        mainContent.style.display = 'block';
        document.getElementById('music-wrapper').style.display = 'block';
        AOS.refresh();

        // Auto-play musik setelah undangan dibuka
        // (gesture user sudah ada dari klik tombol, jadi browser izinkan autoplay)
        playMusic();
    }, 700);
}

// CUSTOM NAMA TAMU
function setGuestName() {
    const params = new URLSearchParams(window.location.search);
    const guest = params.get("to");

    const guestElement = document.getElementById("guest-name");

    if (guest && guestElement) {
        guestElement.textContent = decodeURIComponent(guest);
    }
}
document.addEventListener("DOMContentLoaded", setGuestName);

// =============================================
// MUSIC
// =============================================
const audio     = document.getElementById('bg-audio');
const musicBtn  = document.getElementById('music-btn');
const musicIcon = document.getElementById('music-icon');
let isPlaying   = false;

function playMusic() {
    if (!audio) return;
    audio.play().then(() => {
        isPlaying = true;
        musicIcon.src = './Assets/img/music-icon.svg';
        musicBtn.classList.add('playing');
    }).catch(() => {
        // Autoplay blocked — user can manually press button
    });
}

musicBtn.addEventListener('click', () => {
    if (isPlaying) {
        audio.pause();
        isPlaying = false;
        musicIcon.src = './Assets/img/mute-icon.svg';
        musicBtn.classList.remove('playing');
    } else {
        audio.play()
        .then(() => {
            isPlaying = true;
            musicIcon.src = './Assets/img/music-icon.svg';
            musicBtn.classList.add('playing');
        })
        .catch(() => showToast('Gagal memutar musik'));
    }
});

// =============================================
// COUNTDOWN TIMER
// =============================================
function updateCountdown() {
    const now  = new Date();
    const diff = CONFIG.WEDDING_DATE - now;

    if (diff <= 0) {
        ['cd-days','cd-hours','cd-mins','cd-secs'].forEach(id => {
        document.getElementById(id).textContent = '00';
        });
        return;
    }

    const days  = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins  = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs  = Math.floor((diff % (1000 * 60)) / 1000);

    document.getElementById('cd-days').textContent  = String(days).padStart(2, '0');
    document.getElementById('cd-hours').textContent = String(hours).padStart(2, '0');
    document.getElementById('cd-mins').textContent  = String(mins).padStart(2, '0');
    document.getElementById('cd-secs').textContent  = String(secs).padStart(2, '0');
}

setInterval(updateCountdown, 1000);
updateCountdown();

// =============================================
// ATTENDANCE SELECTION
// =============================================
// let selectedAttendance = '';

// function selectAttendance(el, value) {
//     document.querySelectorAll('.attendance-option').forEach(o => o.classList.remove('selected'));
//     el.classList.add('selected');
//     selectedAttendance = value;
// }

// =============================================
// RSVP SUBMIT → Google Sheets
// =============================================
async function submitRSVP() {
    const name    = document.getElementById('rsvp-name').value.trim();
    const message = document.getElementById('rsvp-message').value.trim();
    const btn     = document.getElementById('btn-kirim');

    const attendance = document.getElementById('rsvp-attendance').value;
    if (!attendance) { showToast('Pilih status kehadiran terlebih dahulu'); return; }
    if (!name)               { showToast('Nama tidak boleh kosong'); return; }
    //   if (!selectedAttendance) { showToast('Pilih status kehadiran terlebih dahulu'); return; }
    if (!message)            { showToast('Pesan ucapan tidak boleh kosong'); return; }

    btn.disabled    = true;
    btn.textContent = 'Mengirim...';

    const params = new URLSearchParams({
        name,
        attendance: attendance,
        message,
        timestamp: new Date().toLocaleString('id-ID'),
    });

    try {
        await fetch(`${CONFIG.SCRIPT_URL}?${params.toString()}`, {
        method: 'GET',
        mode: 'no-cors',
        });

        document.getElementById('rsvp-form').style.display = 'none';
        document.getElementById('form-success').classList.remove('hidden');
        showToast('Ucapan terkirim! 🎉');

        setTimeout(loadWishes, 2000);
    } catch {
        showToast('Gagal mengirim, coba lagi');
        btn.disabled    = false;
        btn.textContent = 'Kirim';
    }
}

// =============================================
// LOAD WISHES FROM GOOGLE SHEETS
// =============================================
let isLoadingWishes = false;
let lastWishCount = 0;

async function loadWishes() {
    if (isLoadingWishes) return;
    isLoadingWishes = true;

    const list    = document.getElementById('wishes-list');
    const countEl = document.getElementById('wow-count-text');

    try {
        const res  = await fetch(`${CONFIG.SCRIPT_URL}?action=getWishes`);
        const data = await res.json();

        if (!data || data.length === 0) {
        list.innerHTML = '<div class="text-center font-body italic text-gray-400 py-10">Belum ada ucapan. Jadilah yang pertama! 💌</div>';
        countEl.textContent = '0 Ungkapan';
        return;
        }

        // jika jumlah data sama, tidak perlu render ulang
        if (data.length === lastWishCount) {
            isLoadingWishes = false;
            return;
        }

        lastWishCount = data.length;

        countEl.textContent = `${data.length} Ungkapan`;

        list.innerHTML = [...data].reverse().map(row => {
        const badgeClass = row.attendance === 'Saya Berencana Hadir!'
            ? 'badge-hadir'
            : row.attendance === 'Saya Masih Ragu'
            ? 'badge-ragu'
            : 'badge-tidak';

        return `
            <div class="wish-card flex items-start gap-3 bg-[#fbf0da] rounded-xl p-4 shadow-sm hover:scale-[1.02] transition" data-aos="fade-up">
                <div class="wish-avatar">
                    <img src="./Assets/img/rsvp/user-icon.svg" alt="" class="w-40 h-40" />
                </div>
                <div class="flex-1 min-w-0">
                    <span class="wish-attendance-badge ${badgeClass}">${escapeHtml(row.attendance || '')}</span>
                    <p class="wish-name">${escapeHtml(row.name || '')}</p>
                    <p class="wish-text break-words line-clamp-4">${escapeHtml(row.message || '')}</p>
                </div>
            </div>
        `;
        }).join('');

        AOS.refresh();
    } catch {
        list.innerHTML = '<div class="text-center font-body italic text-gray-400 py-8">Gagal memuat ucapan. Refresh halaman untuk mencoba lagi.</div>';
        countEl.textContent = '— Ungkapan';
    }
    isLoadingWishes = false;
}

// =============================================
// COPY TO CLIPBOARD
// =============================================
function copyText(text, btn) {
    navigator.clipboard.writeText(text)
    .then(() => {
      const originalHTML = btn.innerHTML;
      btn.innerHTML = '✓ Disalin!';
      btn.classList.add('copied');
      showToast('Berhasil disalin!');
      setTimeout(() => {
        btn.innerHTML = originalHTML;
        btn.classList.remove('copied');
      }, 2000);
    })
    .catch(() => showToast('Gagal menyalin'));
}

// =============================================
// TOAST
// =============================================
function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}

// =============================================
// ESCAPE HTML
// =============================================
function escapeHtml(text) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(text));
    return div.innerHTML;
}