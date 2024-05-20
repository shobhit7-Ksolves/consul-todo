require('dotenv').config();
const express = require('express');
const dns = require('dns');
const app = express();
const PORT = process.env.PORT || 3001;

// Set custom DNS server
dns.setServers(['127.0.0.1:8600']); // Assuming Consul DNS is running on localhost

app.get('/api/backend-url', (req, res) => {
  try {
    const serviceName = process.env.BACKEND_SERVICE_NAME;
    console.log('Fetching IP addresses for service:', serviceName);

    dns.resolve(serviceName + '.service.consul', 'A', (err, addresses) => {
      if (err) {
        console.error('Error resolving service:', err);
        return res.status(500).json({ error: 'Error resolving service' });
      }

      if (addresses.length === 0) {
        console.log(`No IP addresses found for service "${serviceName}"`);
        return res.status(404).json({ error: 'No IP addresses found' });
      }

      const randomAddress = addresses[Math.floor(Math.random() * addresses.length)];
      const backendUrl = `http://${randomAddress}:${process.env.BACKEND_SERVICE_PORT}`;
      console.log('Backend URL sent to client:', backendUrl);
      res.json({ backendUrl });
    });
  } catch (error) {
    console.error('Error querying Consul:', error);
    res.status(500).json({ error: 'Error querying Consul' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});