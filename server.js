import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Bonjour } from 'bonjour-service';
import { createAndroidRemote, RemoteKeyCode } from '@kud/androidtv-remote';

const bonjour = new Bonjour();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const CERTS_FILE = path.join(__dirname, 'certs.json');
let certs = {};
if (fs.existsSync(CERTS_FILE)) {
  try {
    certs = JSON.parse(fs.readFileSync(CERTS_FILE, 'utf8'));
  } catch (e) {
    console.error("Error reading certs.json", e);
  }
}

function saveCerts() {
  fs.writeFileSync(CERTS_FILE, JSON.stringify(certs, null, 2));
}

// Store active remote instances
const remotes = {};

app.get('/api/scan', (req, res) => {
  const devices = [];
  
  const browser = bonjour.find({ type: 'androidtvremote2' });
  
  browser.on('up', (service) => {
    // Find an IPv4 address
    const ip = service.addresses?.find(addr => addr.includes('.')) || service.host;
    if (ip && !devices.find(d => d.ip === ip)) {
      devices.push({ name: service.name, ip: ip, isPaired: !!certs[ip] });
    }
  });

  // Scan for 3 seconds
  setTimeout(() => {
    browser.stop();
    res.json({ devices });
  }, 3000);
});

app.post('/api/connect', async (req, res) => {
  const { ip } = req.body;
  if (!ip) return res.status(400).json({ error: 'IP address required' });

  try {
    const options = {};
    if (certs[ip]) {
      options.cert = certs[ip];
    }
    
    // Clean up existing if reconnecting
    if (remotes[ip]) {
      remotes[ip].stop();
    }

    const remote = createAndroidRemote(ip, options);
    remotes[ip] = remote;
    
    let isPaired = false;
    let responseSent = false;

    remote.on('secret', () => {
      if (!responseSent) {
        res.json({ status: 'needs_pin' });
        responseSent = true;
      }
    });

    remote.on('ready', () => {
      console.log(`Connected to ${ip}`);
      if (!isPaired && !options.cert) {
        certs[ip] = remote.getCertificate();
        saveCerts();
        isPaired = true;
      }
      if (!responseSent) {
        res.json({ status: 'connected' });
        responseSent = true;
      }
    });

    remote.on('unpaired', () => {
      delete certs[ip];
      saveCerts();
      console.log(`Unpaired from ${ip}`);
    });
    
    remote.on('error', (err) => {
        console.error(`Remote error for ${ip}:`, err);
    });

    remote.start().catch(err => {
      console.error(`Error starting remote for ${ip}:`, err);
      if (!responseSent) {
        res.status(500).json({ error: err.message });
        responseSent = true;
      }
    });

  } catch (err) {
    console.error(err);
    if (!res.headersSent) res.status(500).json({ error: err.message });
  }
});

app.post('/api/send-pin', (req, res) => {
  const { ip, pin } = req.body;
  if (!ip || !pin) return res.status(400).json({ error: 'IP and PIN required' });
  
  const remote = remotes[ip];
  if (!remote) return res.status(404).json({ error: 'No connection initialized for this IP' });

  try {
    const success = remote.sendCode(pin);
    if (success) {
      res.json({ success: true });
    } else {
      res.status(500).json({ error: 'Failed to send PIN' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/status', (req, res) => {
  const { ip } = req.query;
  if (!ip) return res.status(400).json({ error: 'IP address required' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const remote = remotes[ip];
  const onPower = (isPowered) => {
    res.write(`data: ${JSON.stringify({ powered: isPowered })}\n\n`);
  };

  if (remote) {
    // Send initial status if supported, otherwise just wait for events
    // (Note: The library might not expose remote.powered directly, we rely on the event)
    res.write(`data: ${JSON.stringify({ connected: true })}\n\n`);
    remote.on('powered', onPower);
  } else {
    res.write(`data: ${JSON.stringify({ error: 'Not connected' })}\n\n`);
  }

  req.on('close', () => {
    if (remote) {
      try {
        remote.off('powered', onPower);
      } catch (e) {}
    }
  });
});

app.post('/api/text', (req, res) => {
  const { ip, text } = req.body;
  if (!ip || text === undefined) return res.status(400).json({ error: 'IP and text required' });

  const remote = remotes[ip];
  if (!remote) return res.status(404).json({ error: 'No connection initialized for this IP' });

  try {
    remote.sendText(text);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/command', (req, res) => {
  const { ip, key } = req.body;
  if (!ip || !key) return res.status(400).json({ error: 'IP and key required' });

  const remote = remotes[ip];
  if (!remote) return res.status(404).json({ error: 'No connection initialized for this IP' });

  try {
    const keyCode = RemoteKeyCode[`KEYCODE_${key.toUpperCase()}`];
    if (keyCode !== undefined) {
      remote.sendKey(keyCode);
      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'Invalid key code' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default app;
