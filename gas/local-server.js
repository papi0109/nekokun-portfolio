// Local mock of Google Apps Script endpoint for portfolio data
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8888;

app.use(cors({ origin: '*', methods: ['GET'] }));
app.use((req, res, next) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });
  next();
});

// Static portfolio data to simulate GAS response
const data = {
  profile: {
    name: 'Your Name',
    title: 'Software Developer',
    summary: 'Building clean, accessible, and maintainable web apps with a focus on performance and developer experience.',
    contacts: {
      email: 'your.name@example.com',
      github: 'https://github.com/your-github',
      linkedin: 'https://www.linkedin.com/in/your-linkedin'
    }
  },
  skills: [
    'TypeScript', 'React', 'Node.js', 'GAS', 'Python', 'Cloud'
  ],
  projects: [
    {
      title: 'Project One',
      desc: 'Brief description of what this project solves and the stack used.',
      live: '#',
      code: '#'
    },
    {
      title: 'Project Two',
      desc: 'Another example project. Replace with your real work and links.',
      live: '#',
      code: '#'
    },
    {
      title: 'Project Three',
      desc: 'Keep cards consistent and concise for a clean look.',
      live: '#',
      code: '#'
    }
  ]
};

app.get('/api/portfolio', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json(data);
});

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Local GAS mock listening on http://0.0.0.0:${PORT}`);
});

