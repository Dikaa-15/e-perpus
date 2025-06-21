const pool = require('../config/database').pool;

const isAuthenticated = async (req, res, next) => {
    if (req.session && req.session.userId) {
        try {
            const connection = await pool.getConnection();
            const [users] = await connection.execute(
                'SELECT id, name, email, roles FROM users WHERE id = ?',
                [req.session.userId]
            );
            connection.release();

            if (users.length === 0) {
                req.flash('error', 'User not found. Please login again.');
                return res.redirect('/auth/login');
            }

            req.user = users[0];
            return next();
        } catch (error) {
            console.error('Authentication error:', error);
            req.flash('error', 'Authentication error. Please login again.');
            return res.redirect('/auth/login');
        }
    }
    req.flash('error', 'Please login to access this page');
    res.redirect('/auth/login');
};

const isGuest = (req, res, next) => {
    if (!req.session || !req.session.userId) {
        return next();
    }
    res.redirect('/');
};

const isAdmin = async (req, res, next) => {
    console.log('isAdmin middleware: session userId =', req.session ? req.session.userId : null);

    // Check if request expects JSON (API request)
    const expectsJson = req.xhr || req.headers.accept.indexOf('json') > -1 || req.originalUrl.startsWith('/api');

    if (!req.session || !req.session.userId) {
        if (expectsJson) {
            return res.status(401).json({ error: 'Please login to access this resource' });
        } else {
            req.flash('error', 'Please login to access this page');
            return res.redirect('/auth/login');
        }
    }

    try {
        const connection = await pool.getConnection();
        const [users] = await connection.execute(
            'SELECT roles FROM users WHERE id = ?',
            [req.session.userId]
        );
        connection.release();

        console.log('isAdmin middleware: user roles from DB =', users.length > 0 ? users[0].roles : 'none');

        if (users.length === 0 || users[0].roles !== 'admin') {
            if (expectsJson) {
                return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
            } else {
                req.flash('error', 'Access denied. Admin privileges required.');
                return res.redirect('/');
            }
        }

        next();
    } catch (error) {
        console.error('Admin check error:', error);
        if (expectsJson) {
            return res.status(500).json({ error: 'Authentication error' });
        } else {
            req.flash('error', 'Authentication error');
            res.redirect('/auth/login');
        }
    }
};

module.exports = {
    isAuthenticated,
    isGuest,
    isAdmin
};
