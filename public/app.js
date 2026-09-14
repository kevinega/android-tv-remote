const screens = {
  pairing: document.getElementById('pairing-screen'),
  remote: document.getElementById('remote-screen')
};

const elements = {
  ipInput: document.getElementById('ip-input'),
  connectBtn: document.getElementById('connect-btn'),
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
