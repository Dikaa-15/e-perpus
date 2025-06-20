const { pool } = require('../config/database');

const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.userId) {
        return next();
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
    if (!req.session || !req.session.userId) {
        req.flash('error', 'Please login to access this page');
        return res.redirect('/auth/login');
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
            req.flash('error', 'Access denied. Admin privileges required.');
            return res.redirect('/');
        }

        next();
    } catch (error) {
        console.error('Admin check error:', error);
        req.flash('error', 'Authentication error');
        res.redirect('/auth/login');
    }
};

module.exports = {
    isAuthenticated,
    isGuest,
    isAdmin
};
