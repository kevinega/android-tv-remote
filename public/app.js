const screens = {
  pairing: document.getElementById('pairing-screen'),
  remote: document.getElementById('remote-screen')
};

const elements = {
  ipInput: document.getElementById('ip-input'),
  connectBtn: document.getElementById('connect-btn'),
  scanBtn: document.getElementById('scan-btn'),
  scanResults: document.getElementById('scan-results'),
  tvList: document.getElementById('tv-list'),
  pinSection: document.getElementById('pin-section'),
  pinInput: document.getElementById('pin-input'),
  pairBtn: document.getElementById('pair-btn'),
  pairingStatus: document.getElementById('pairing-status'),
  remoteButtons: document.querySelectorAll('.btn[data-key]')
};

let currentIp = localStorage.getItem('tv_ip') || '';
if (currentIp) {
  elements.ipInput.value = currentIp;
}

function showScreen(screenName) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[screenName].classList.add('active');
}

function updateStatus(msg, isError = false) {
  elements.pairingStatus.textContent = msg;
  elements.pairingStatus.style.color = isError ? 'var(--danger)' : 'var(--text-secondary)';
  elements.pairingStatus.style.marginTop = '15px';
}

function triggerHaptic() {
  if (navigator.vibrate) {
    navigator.vibrate(50);
  }
}

elements.scanBtn.addEventListener('click', async () => {
  elements.scanBtn.disabled = true;
  elements.scanBtn.innerHTML = 'Scanning...';
  elements.scanResults.style.display = 'none';
  elements.tvList.innerHTML = '';
  updateStatus('Searching for TVs on local network...');

  try {
    const res = await fetch('/api/scan');
    const data = await res.json();
    
    if (data.devices && data.devices.length > 0) {
      updateStatus(`Found ${data.devices.length} TV(s)`);
      data.devices.forEach(tv => {
        const li = document.createElement('li');
        li.className = 'tv-item';
        li.innerHTML = `<span class="tv-item-name">${tv.name}</span><span class="tv-item-ip">${tv.ip}</span>`;
        li.addEventListener('click', () => {
          elements.ipInput.value = tv.ip;
          elements.connectBtn.click();
        });
        elements.tvList.appendChild(li);
      });
      elements.scanResults.style.display = 'block';
    } else {
      updateStatus('No TVs found. Try manual IP.');
    }
  } catch (err) {
    updateStatus('Scan failed.', true);
  } finally {
    elements.scanBtn.disabled = false;
    elements.scanBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px; vertical-align: middle; margin-right: 8px; margin-bottom: 2px;"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg> Scan for TVs';
  }
});

elements.connectBtn.addEventListener('click', async () => {
  const ip = elements.ipInput.value.trim();
  if (!ip) return;
  
  currentIp = ip;
  localStorage.setItem('tv_ip', ip);
  
  updateStatus('Connecting...');
  elements.connectBtn.disabled = true;

  try {
    const res = await fetch('/api/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip })
    });
    const data = await res.json();

    if (data.status === 'connected') {
      showScreen('remote');
    } else if (data.status === 'needs_pin') {
      updateStatus('Please enter the PIN shown on your TV');
      elements.pinSection.style.display = 'block';
      elements.connectBtn.style.display = 'none';
    } else if (data.error) {
      updateStatus(data.error, true);
    }
  } catch (err) {
    updateStatus('Connection failed. Check server and IP.', true);
  } finally {
    elements.connectBtn.disabled = false;
  }
});

elements.pairBtn.addEventListener('click', async () => {
  const pin = elements.pinInput.value.trim();
  if (!pin) return;

  updateStatus('Pairing...');
  elements.pairBtn.disabled = true;

  try {
    const res = await fetch('/api/send-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip: currentIp, pin })
    });
    const data = await res.json();
    
    if (data.success) {
      setTimeout(() => {
        showScreen('remote');
      }, 1000);
    } else {
      updateStatus(data.error || 'Pairing failed', true);
    }
  } catch (err) {
    updateStatus('Pairing request failed.', true);
  } finally {
    elements.pairBtn.disabled = false;
  }
});

elements.remoteButtons.forEach(btn => {
  btn.addEventListener('click', async () => {
    triggerHaptic();
    const key = btn.dataset.key;
    
    try {
      fetch('/api/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip: currentIp, key })
      });
    } catch (err) {
      console.error('Failed to send command', err);
    }
  });
});
