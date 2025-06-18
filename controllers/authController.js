const User = require("../models/User");

const authController = {
  // Show login form
  showLogin: (req, res) => {
    res.render("auth/login", {
      title: "Login",
      error: req.flash("error"),
      success: req.flash("success"),
    });
  },

  // Show registration form
  showRegister: (req, res) => {
    res.render("auth/register", {
      title: "Register",
      error: req.flash("error"),
      success: req.flash("success"),
    });
  },

  // Handle login
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      console.log('Login attempt:', { email, passwordLength: password ? password.length : 0 });

      // Validate input
      if (!email || !password) {
        console.log('Missing email or password');
        req.flash("error", "Email dan password harus diisi");
        return res.redirect("/auth/login");
      }

      // Find user by email
      console.log('Looking for user with email:', email);
      const user = await User.findByEmail(email);
      
      if (!user) {
        console.log('User not found for email:', email);
        req.flash("error", "Email atau password salah");
        return res.redirect("/auth/login");
      }

      console.log('User found:', { id: user.id, email: user.email, roles: user.roles, isActive: user.is_active });

      // Check if user is active
      if (!user.is_active) {
        console.log('User account is inactive:', email);
        req.flash("error", "Akun Anda tidak aktif. Hubungi administrator.");
        return res.redirect("/auth/login");
      }

      // Verify password
      console.log('Verifying password...');
      const isValid = await User.verifyPassword(password, user.password);
      console.log('Password verification result:', isValid);
      
      if (!isValid) {
        console.log('Password verification failed for user:', email);
        req.flash("error", "Email atau password salah");
        return res.redirect("/auth/login");
      }

      // Set session
      console.log('Setting session for user:', user.id);
      req.session.userId = user.id;
      req.session.user = {
          id: user.id,
          name: user.name,
          email: user.email,
          roles: user.roles
      };
      
      // Update last login
      await User.updateLastLogin(user.id);
      
      console.log('Login successful for user:', email);
      req.flash('success', 'Login berhasil!');
      
      // Redirect based on role
      if (user.roles === 'admin') {
          res.redirect('/dashboard');
      } else {
          res.redirect('/dashboard/user');
      }
      
    } catch (error) {
        console.error('Login error:', error);
        req.flash('error', 'Terjadi kesalahan saat login. Silakan coba lagi.');
        res.redirect('/auth/login');
    }
  },

  // Handle registration
  register: async (req, res) => {
    try {
      const {
        name,
        email,
        password,
        phone,
        nik,
        address,
        date_of_birth,
        gender,
      } = req.body;

      // Validate date_of_birth
      if (date_of_birth) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date_of_birth)) {
          req.flash(
            "error",
            "Format tanggal lahir tidak valid. Gunakan format YYYY-MM-DD"
          );
          return res.redirect("/auth/register");
        }

        const birthDate = new Date(date_of_birth);
        const today = new Date();
        if (birthDate > today || birthDate.getFullYear() < 1900) {
          req.flash("error", "Tanggal lahir tidak valid");
          return res.redirect("/auth/register");
        }
      }

      // Validate phone number
      if (phone && phone.length > 20) {
        req.flash(
          "error",
          "Nomor telepon terlalu panjang (maksimal 20 karakter)"
        );
        return res.redirect("/auth/register");
      }

      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        req.flash("error", "Email sudah terdaftar");
        return res.redirect("/auth/register");
      }

      // Create new user
      const userId = await User.create({
        name,
        email,
        password,
        phone: phone || null,
        nik: nik || null,
        address: address || null,
        date_of_birth: date_of_birth || null,
        gender: gender || null,
      });

      req.flash("success", "Registrasi berhasil! Selamat datang.");
      // Set session user after registration
      req.session.userId = userId;
      req.session.user = {
        id: userId,
        name: name,
        email: email,
        roles: ["user"],
      };
      res.redirect("/");
    } catch (error) {
      console.error("Registration error:", error);
      req.flash("error", "Terjadi kesalahan saat registrasi");
      res.redirect("/auth/register");
    }
  },

  // Handle logout
  logout: (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
      }
      res.redirect("/auth/login");
    });
  },
};

module.exports = authController;
