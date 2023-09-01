const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const User = require('./models/user');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware Setup
app.use(bodyParser.urlencoded({ extended: true }));

// MongoDB Setup
mongoose.connect('mongodb://localhost:27017/notes-app', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.log('MongoDB Connection Error:', err));


// Session setup using MongoDB to store session info
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
        mongoUrl: 'mongodb://localhost:27017/notes-app'
    })
}));

// Passport setup
require('./config/passport-config')(passport);
app.use(passport.initialize());
app.use(passport.session());

app.get('/', (req, res) => {
    res.send('Welcome to Notes App!');
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'register.html'));
});

app.post('/register', async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const user = new User({
            username: req.body.username,
            email: req.body.email,
            password: hashedPassword
        });
        await user.save();
        res.redirect('/login');
    } catch (error) {
        console.error(error);
        res.redirect('/register');
    }
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.post('/login', async (req, res, next) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).send('Invalid email or password.');
        }

        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.status(400).send('Invalid email or password.');
        }

        // Using Passport's login function
        req.login(user, function(err) {
            if (err) return next(err);
            return res.redirect('/dashboard');
        });

    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

// Example logout route
app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});

// Example dashboard route
app.get('/dashboard', (req, res) => {
    if (!req.isAuthenticated()) {
        return res.redirect('/login');
    }
    res.send('Welcome to the dashboard!');
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
