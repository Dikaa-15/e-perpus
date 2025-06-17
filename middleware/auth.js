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

module.exports = {
    isAuthenticated,
    isGuest
};
