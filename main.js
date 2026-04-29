import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
  import { getFirestore, collection, getDocs, addDoc, doc, updateDoc, increment, getDoc, orderBy, query, limit } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

  const firebaseConfig = {
    apiKey: "AIzaSyDY5ghU4yoocsy4SXvWBJuul96nDdrF4Sk",
    authDomain: "world-humanity.firebaseapp.com",
    projectId: "world-humanity",
    storageBucket: "world-humanity.firebasestorage.app",
    messagingSenderId: "395556215937",
    appId: "1:395556215937:web:ea498d116c221e0702c180",
    measurementId: "G-QWZTM7X6YY"
  };

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  // ── Load Updates ──
  async function loadUpdates() {
    const grid = document.getElementById('updatesGrid');
    try {
      const q = query(collection(db, 'updates'), orderBy('date', 'desc'), limit(6));
      const snap = await getDocs(q);
      if (snap.empty) {
        grid.innerHTML = '<div class="updates-empty">No updates yet. Check back soon! 🌍</div>';
        return;
      }
      grid.innerHTML = '';
      snap.forEach(doc => {
        const d = doc.data();
        const card = document.createElement('div');
        card.className = 'update-card';
        card.innerHTML = `<div class="update-date">${d.date || ''}</div><div class="update-text">${d.text || ''}</div>`;
        grid.appendChild(card);
      });
    } catch (e) {
      grid.innerHTML = '<div class="updates-empty">Could not load updates.</div>';
    }
  }

  // ── Load Gallery ──
  async function loadGallery() {
    const grid = document.getElementById('galleryGrid');
    try {
      const q = query(collection(db, 'gallery'), orderBy('addedAt', 'desc'));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        grid.innerHTML = '<div class="gallery-empty" style="flex: 1;">Gallery is being updated. Check back soon! 📸</div>';
        return;
      }
      grid.innerHTML = '';
      
      // Convert Firebase results to a normal array
      let docsArray = snap.docs;
      
      // Pin the oldest image to the very front, newest follow behind it
      if (docsArray.length > 1) {
        const oldestImage = docsArray.pop(); // Remove oldest from the end
        docsArray.unshift(oldestImage);      // Add it to the very beginning
      }
      
      docsArray.forEach(doc => {
        const d = doc.data();
        const item = document.createElement('div');
        item.className = 'gallery-item';
        item.innerHTML = `<img src="${d.url}" alt="${d.caption || 'Gallery'}" loading="lazy" />`;
        item.addEventListener('click', () => openLightbox(d.url));
        grid.appendChild(item);
      });
    } catch (e) {
      grid.innerHTML = '<div class="gallery-empty" style="flex: 1;">Could not load gallery.</div>';
    }
  }

  // ── Load Honors ──
  async function loadHonors() {
    const grid = document.getElementById('honorsGrid');
    try {
      const q = query(collection(db, 'honors'), orderBy('addedAt', 'desc'));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        grid.innerHTML = '<div class="gallery-empty" style="flex: 1; border-color: rgba(200,163,90,0.5);">Awards & Honors are being updated.</div>';
        return;
      }
      grid.innerHTML = '';

      let docsArray = snap.docs;
      
      // Pin the oldest award to the very front, newest follow behind it
      if (docsArray.length > 1) {
        const oldestHonor = docsArray.pop();
        docsArray.unshift(oldestHonor);
      }

      docsArray.forEach(doc => {
        const d = doc.data();
        const item = document.createElement('div');
        item.className = 'honor-card';
        item.innerHTML = `
          <img src="${d.url}" alt="${d.title || 'Honor'}" loading="lazy" />
          <div class="honor-title">${d.title || 'Award'}</div>
        `;
        item.style.cursor = 'pointer';
        item.addEventListener('click', () => openLightbox(d.url));
        grid.appendChild(item);
      });
    } catch (e) {
      grid.innerHTML = '<div class="gallery-empty" style="flex: 1; border-color: rgba(200,163,90,0.5);">Could not load honors.</div>';
    }
  }

  // ── Lightbox (With Scroll Lock) ──
  function openLightbox(src) {
    document.getElementById('lightboxImg').src = src;
    document.getElementById('lightbox').classList.add('open');
    // Lock the background scroll
    document.body.style.overflow = 'hidden'; 
  }

  function closeLightbox() {
    document.getElementById('lightbox').classList.remove('open');
    // Unlock the background scroll
    document.body.style.overflow = ''; 
  }

  document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
  
  document.getElementById('lightbox').addEventListener('click', e => {
    if (e.target === document.getElementById('lightbox')) {
      closeLightbox();
    }
  });


  document.getElementById('lightboxClose').addEventListener('click', () => {
    document.getElementById('lightbox').classList.remove('open');
  });
  document.getElementById('lightbox').addEventListener('click', e => {
    if (e.target === document.getElementById('lightbox')) document.getElementById('lightbox').classList.remove('open');
  });

  // ── Volunteer Form ──
  document.getElementById('volunteerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('submitBtn');
    const msg = document.getElementById('successMsg');
    btn.textContent = 'Submitting...'; btn.disabled = true;
    try {
      await addDoc(collection(db, 'volunteers'), {
        name: document.getElementById('volName').value,
        phone: document.getElementById('volPhone').value,
        email: document.getElementById('volEmail').value,
        message: document.getElementById('volMessage').value,
        submittedAt: new Date().toISOString()
      });
      msg.style.display = 'block';
      document.getElementById('volunteerForm').reset();
    } catch (err) {
      alert('Submission failed. Please try again.');
    }
    btn.textContent = '🤝 Join as Volunteer'; btn.disabled = false;
  });

  // ── OPTIMIZED VISITOR TRACKING ──
  async function trackVisitor() {
    // 1. Get today's date in strict YYYY-MM-DD format based on user's local time
    const d = new Date();
    const today = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    
    // 2. Create a unique storage key for today
    const storageKey = 'wh_visited_' + today;

    // 3. Check if they have already visited today
    if (!localStorage.getItem(storageKey)) {
      // Mark as visited for today in their browser
      localStorage.setItem(storageKey, 'true');

      const { doc, updateDoc, increment, setDoc } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");

      // Update All-Time Visitors
      const globalRef = doc(db, 'analytics', 'visitors');
      try {
        await updateDoc(globalRef, { count: increment(1) });
      } catch {
        await setDoc(globalRef, { count: 1 });
      }

      // Update Daily Visitors (Creates a new document for every day)
      const dailyRef = doc(db, 'analytics_daily', today);
      try {
        await updateDoc(dailyRef, { count: increment(1), date: today });
      } catch {
        await setDoc(dailyRef, { count: 1, date: today }); // Create new day if it doesn't exist
      }
    }
  }

  loadUpdates(); loadGallery(); loadHonors(); trackVisitor();

// Nav scroll
  const nav = document.getElementById('nav');
  window.addEventListener('scroll', () => { nav.classList.toggle('scrolled', window.scrollY > 30); });

  // Hamburger
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');
  hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));
  navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));

  // Reveal on scroll
  const reveals = document.querySelectorAll('.reveal');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.12 });
  reveals.forEach(el => obs.observe(el));