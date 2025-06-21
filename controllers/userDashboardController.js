const Favorite = require("../models/Favorite"); // Assuming you have a Favorite model
// Removed unused sequelize import since project uses raw SQL queries

// Other existing methods...


const QRCode = require('qrcode');

// User dashboard index page
const { pool } = require("../config/database");

exports.index = async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const userId = req.user.id;

    // Query stats counts
    const [statsRows] = await connection.execute(
      `SELECT
        SUM(CASE WHEN status = 'borrowed' THEN 1 ELSE 0 END) AS active_loans,
        SUM(CASE WHEN status = 'returned' THEN 1 ELSE 0 END) AS returned_books,
        SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END) AS overdue_books,
        COUNT(*) AS total_loans
      FROM loans
      WHERE user_id = ?`,
      [userId]
    );
    const stats = statsRows[0] || {
      active_loans: 0,
      returned_books: 0,
      overdue_books: 0,
      total_loans: 0,
    };

    // Query active loans with book details and days_remaining
    const [activeLoansRows] = await connection.execute(
      `SELECT l.id, l.loans_date, l.due_date, b.name AS book_title, b.author AS book_author, b.cover AS book_cover,
        DATEDIFF(l.due_date, CURDATE()) AS days_remaining
      FROM loans l
      LEFT JOIN books b ON l.book_id = b.id
      WHERE l.user_id = ? AND l.status = 'borrowed'
      ORDER BY l.loans_date DESC`,
      [userId]
    );

    // Generate QR code for each active loan
    for (const loan of activeLoansRows) {
      const qrData = {
        transaction_id: loan.id,
        book_title: loan.book_title,
        borrower_name: req.user.name,
        loan_date: loan.loans_date ? loan.loans_date.toISOString().split('T')[0] : '',
        due_date: loan.due_date ? loan.due_date.toISOString().split('T')[0] : '',
      };
      const qrString = JSON.stringify(qrData);
      try {
        loan.qrCodeDataUrl = await QRCode.toDataURL(qrString);
      } catch (err) {
        console.error('Error generating QR code for loan id', loan.id, err);
        loan.qrCodeDataUrl = null;
      }
    }

    // Query favorite books for user
    const [favoriteBooksRows] = await connection.execute(
      `SELECT b.id, b.name, b.author, b.cover
      FROM favorits f
      JOIN books b ON f.book_id = b.id
      WHERE f.user_id = ?`,
      [userId]
    );

    // Query loan history (returned or overdue)
    const [loanHistoryRows] = await connection.execute(
      `SELECT l.id, l.loans_date, l.return_date, l.status, b.name AS book_title, b.author AS book_author, b.cover AS book_cover
      FROM loans l
      LEFT JOIN books b ON l.book_id = b.id
      WHERE l.user_id = ? AND (l.status = 'returned' OR l.status = 'overdue')
      ORDER BY l.loans_date DESC`,
      [userId]
    );

    res.render("dashboard/user", {
      title: "User Dashboard",
      user: req.user,
      stats,
      activeLoans: activeLoansRows,
      favoriteBooks: favoriteBooksRows,
      loanHistory: loanHistoryRows,
    });
  } catch (error) {
    console.error("Error loading user dashboard:", error);
    res.status(500).send("Internal server error");
  } finally {
    if (connection) connection.release();
  }
};

// Return a loaned book
exports.returnBook = async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const userId = req.user.id;
    const loanId = req.params.loanId;

    // Update loan status to 'returned' and set return_date to current date
    const [result] = await connection.execute(
      `UPDATE loans
       SET status = 'returned', return_date = NOW()
       WHERE id = ? AND user_id = ? AND status != 'returned'`,
      [loanId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: "Loan not found or already returned" });
    }

    res.json({ success: true, message: "Book returned successfully" });
  } catch (error) {
    console.error("Error returning book:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  } finally {
    if (connection) connection.release();
  }
};

// Delete favorite book by ID for logged-in user
exports.deleteFavoriteBook = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming user info is in req.user
    const bookId = req.params.id;

    // Delete favorite entry for this user and book
    const deleted = await Favorite.destroy({
      where: {
        userId: userId,
        bookId: bookId,
      },
    });

    if (deleted) {
      return res.json({ success: true });
    } else {
      return res
        .status(404)
        .json({ success: false, error: "Favorite book not found" });
    }
  } catch (error) {
    console.error("Error deleting favorite book:", error);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  }
};

// Toggle favorite book for logged-in user
exports.toggleFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { bookId } = req.body;

    if (!bookId) {
      return res
        .status(400)
        .json({ success: false, error: "Book ID is required" });
    }

    // Check if favorite exists
    const connection = await require("../config/database").pool.getConnection();
    try {
      const [rows] = await connection.execute(
        "SELECT id FROM favorits WHERE user_id = ? AND book_id = ?",
        [userId, bookId]
      );

      if (rows.length > 0) {
        // Favorite exists, remove it
        await Favorite.destroy({ where: { userId, bookId } });
        return res.json({ success: true, message: "Favorite removed", favorited: false });
      } else {
        // Favorite does not exist, create it
        await Favorite.create({ userId, bookId });
        return res.json({ success: true, message: "Favorite added", favorited: true });
      }
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error toggling favorite:", error);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  }
};
