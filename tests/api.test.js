import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../server.js';

// Mock bonjour-service so it doesn't actually scan the network during tests
vi.mock('bonjour-service', () => {
  return {
    Bonjour: class Bonjour {
      find() {
        return {
          on: (event, callback) => {
            if (event === 'up') {
              // Simulate finding a device immediately
              callback({
                name: 'Test TV',
                addresses: ['192.168.1.100'],
                host: 'test-tv.local'
              });
            }
          },
          stop: vi.fn()
        };
      }
    }
  };
});

describe('Android TV Remote API', () => {
  
  describe('GET /api/scan', () => {
    it('should return discovered devices', async () => {
      // The endpoint uses a 3000ms timeout. For unit tests, we'll wait for it.
      const res = await request(app).get('/api/scan');
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('devices');
      expect(Array.isArray(res.body.devices)).toBe(true);
      expect(res.body.devices.length).toBeGreaterThan(0);
      expect(res.body.devices[0].ip).toBe('192.168.1.100');
    }, 5000); // increase timeout for this test
  });

  describe('POST /api/connect', () => {
    it('should return 400 if IP is missing', async () => {
      const res = await request(app)
        .post('/api/connect')
        .send({});
        
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'IP address required');
    });
  });

  describe('POST /api/command', () => {
    it('should return 400 if IP or key is missing', async () => {
      const res = await request(app)
        .post('/api/command')
        .send({ ip: '192.168.1.100' }); // missing key
        
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'IP and key required');
    });

    it('should return 404 if connection not initialized', async () => {
      const res = await request(app)
        .post('/api/command')
        .send({ ip: '192.168.1.99', key: 'home' });
        
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error', 'No connection initialized for this IP');
    });
  });

  describe('GET /api/status', () => {
    it('should return 400 if IP is missing', async () => {
      const res = await request(app).get('/api/status');
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/text', () => {
    it('should return 400 if IP or text is missing', async () => {
      const res = await request(app).post('/api/text').send({ ip: '192.168.1.100' });
      expect(res.status).toBe(400);
    });
  });

});
