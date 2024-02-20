const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const google = require('google');
const puppeteer = require('puppeteer');

const app = express();
const PORT = 3000;

// Enable CORS for all routes
app.use(cors());
// Enable CORS for all origins
app.use(cors({ origin: '*' }));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

// Proxy middleware to forward requests to Google
app.use('/search', createProxyMiddleware({
  target: 'https://www.google.com',
  changeOrigin: true,
  pathRewrite: { '^/search': '/search' },
}));

// Handle the response from Google and display the requested page through the proxy
app.use('/search', async (req, res) => {
  const searchQuery = req.query.q;

  // Perform a Google search
  google(searchQuery, (err, response) => {
    if (err) {
      console.error('Error searching Google:', err);
      res.status(500).send('Error searching Google');
      return;
    }

    // Extract the first result URL
    const firstResult = response.links[0].href;

    // Use Puppeteer to display the content through the proxy
    (async () => {
      const browser = await puppeteer.launch();
      const page = await browser.newPage();

      // Use the proxy server for the Puppeteer page
      await page.goto(firstResult);

      // Get the HTML content after loading
      const content = await page.content();

      // Send the content back to the front-end
      res.send(content);

      // Close the Puppeteer browser
      await browser.close();
    })();
  });
});

app.listen(PORT, () => {
  console.log(`Proxy server is running on http://localhost:${PORT}`);
});
