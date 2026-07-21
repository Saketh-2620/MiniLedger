require('dotenv').config();
const express        = require('express');
const cors           = require('cors');
const cookieParser   = require('cookie-parser');
const session        = require('express-session');
const passport       = require('passport');


const authRoutes         = require('./routes/auth');
const categoriesRoutes   = require('./routes/categories');
const transactionsRoutes = require('./routes/transactions');
const summaryRoutes      = require('./routes/summary');
const notificationsRoutes = require('./routes/notifications');


require('./services/passportSetup');


require('./services/scheduler');

const errorHandler = require('./middleware/errorHandler');

const app  = express();
const PORT = process.env.PORT || 5000;



app.use(cors({
  origin:      process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

app.use(session({
  secret:            process.env.SESSION_SECRET || 'session_secret_change_me',
  resave:            false,
  saveUninitialized: false,
  cookie: {
    secure:   process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge:   10 * 60 * 1000, 
  },
}));

app.use(passport.initialize());
app.use(passport.session());



app.use('/api/auth',          authRoutes);
app.use('/api/categories',    categoriesRoutes);
app.use('/api/transactions',  transactionsRoutes);
app.use('/api/summary',       summaryRoutes);
app.use('/api/notifications', notificationsRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));


app.use(errorHandler);



app.listen(PORT, () => {
  console.log(`Mini-Ledger API running on http://localhost:${PORT}`);
});

module.exports = app;
