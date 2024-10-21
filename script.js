const express = require('express');
const bodyParser = require('body-parser');
const shortid = require('shortid');
const mysql = require('mysql2');
const path = require('path');
const fs=require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(express.json());
const uploadDir = path.join(__dirname, 'imgs');
app.use('/imgs', express.static(uploadDir));
const caCert = fs.readFileSync(path.join(__dirname, process.env.DB_SSL_CA));
// MySQL database connection
const db = mysql.createConnection({
    host: process.env.DB_HOST, // Your Aiven MySQL host from .env
    port: process.env.DB_PORT, // The port provided by Aiven from .env
    user: process.env.DB_USER, // Your Aiven user from .env
    password: process.env.DB_PASSWORD, // Your Aiven password from .env
    database: process.env.DB_NAME, // Your Aiven database name from .env
    ssl: {
      ca: caCert
    }
});

// Connect to MySQL
db.connect((err) => {
    if (err) throw err;
    console.log('Connected to MySQL database');
});

// Route for home page
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});
app.get('/index.html', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});
app.get('/style.css', (req, res) => {
    res.sendFile(__dirname + '/style.css');
});
app.get('/analyze.html', (req, res) => {
    res.sendFile(__dirname + '/analyze.html');
});

app.get('/about.html', (req, res) => {
    res.sendFile(__dirname + '/about.html');
});
app.get('/blogs.html', (req, res) => {
    res.sendFile(__dirname + '/blogs.html');
});
app.get('/blog01.html', (req, res) => {
    res.sendFile(__dirname + '/blog01.html');
});
app.get('/blog02.html', (req, res) => {
    res.sendFile(__dirname + '/blog02.html');
});
app.get('/blog03.html', (req, res) => {
    res.sendFile(__dirname + '/blog03.html');
});
app.get('/blog04.html', (req, res) => {
    res.sendFile(__dirname + '/blog04.html');
});
app.get('/blog05.html', (req, res) => {
    res.sendFile(__dirname + '/blog05.html');
});

app.get('/blog06.html', (req, res) => {
    res.sendFile(__dirname + '/blog06.html');
});
app.get('/privacy.html', (req, res) => {
    res.sendFile(__dirname + '/privacy.html');
});

app.get('/service.html', (req, res) => {
    res.sendFile(__dirname + '/service.html');
});
app.get('/terms.html', (req, res) => {
    res.sendFile(__dirname + '/terms.html');
});
app.get('/carrer.html', (req, res) => {
    res.sendFile(__dirname + '/carrer.html');
});

// Serve sitemap.xml
app.get('/sitemap.xml', (req, res) => {
    res.sendFile(__dirname + '/sitemap.xml');
});

// Serve robots.txt
app.get('/robots.txt', (req, res) => {
    res.sendFile(__dirname + '/robots.txt');
});



// Route for link shortening
app.post('/shorten', (req, res) => {
    const { originalUrl, customCode } = req.body;

    const code = customCode || shortid.generate(); // Use custom code or generate a new one

    // Check if the custom code already exists in the database
    const checkQuery = 'SELECT * FROM links WHERE code = ?';
    db.query(checkQuery, [code], (error, results) => {
        if (error) {
            console.error('Error checking code in the database:', error);
            return res.status(500).json({ error: 'Database error' });
        }
        if (results.length > 0) {
            // If the custom code exists, return an error
            return res.status(400).json({ error: 'This code already exists' });
        }

        // If the code is unique, insert the new link
        const insertQuery = 'INSERT INTO links (original_url, code) VALUES (?, ?)';
        db.query(insertQuery, [originalUrl, code], (error) => {
            if (error) {
                console.error('Error inserting link into the database:', error);
                return res.status(500).send('Error creating short link');
            }
            res.json({ shortUrl: `${req.protocol}://${req.get('host')}/${code}` });
        });
    });
});

// Redirect to original URL
app.get('/:code', (req, res) => {
    const query = 'SELECT original_url, clicks FROM links WHERE code = ?';
    db.query(query, [req.params.code], (error, results) => {
        if (error) {
            console.error('Error retrieving link from the database:', error);
            return res.status(500).send('Error retrieving link');
        }
        if (results.length > 0) {
            const originalUrl = results[0].original_url;
            const newClicks = results[0].clicks + 1;

            // Increment the click count
            const updateQuery = 'UPDATE links SET clicks = ? WHERE code = ?';
            db.query(updateQuery, [newClicks, req.params.code], (error) => {
                if (error) {
                    console.error('Error updating clicks in the database:', error);
                    return res.status(500).send('Error updating click count');
                }
                res.redirect(originalUrl);
            });
        } else {
            res.status(404).send('URL not found');
        }
    });
});


/*Analyze route*/
app.post('/analyze-link', (req, res) => {
    const url = req.body.url;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    // Extract the code from the full URL
    let code;
    try {
        const parsedUrl = new URL(url);
        code = parsedUrl.pathname.replace('/', ''); // Get the path without the leading '/'
    } catch (error) {
        return res.status(400).json({ error: 'Invalid URL format' });
    }

   // Query to fetch clicks, date, and time from the database
    const query = 'SELECT clicks, date, time FROM links WHERE code = ?';
    db.query(query, [code], (error, results) => {
        if (error) {
            console.error('Database error:', error);
            return res.status(500).json({ error: 'Database error' });
        }
        if (results.length > 0) {
            const { clicks, date, time } = results[0]; // Get clicks, date, and time
            res.json({ code, clicks, date, time });
        } else {
            res.status(404).json({ error: 'Link not found' });
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
