const { pool } = require('../config/database');

exports.show = async (req, res) => {
  let connection;
  try {
    const articleId = req.params.id;
    connection = await pool.getConnection();

    const [rows] = await connection.execute(
      `SELECT a.id, a.title, a.cover, a.content, c.name as category_name
       FROM articles a
       LEFT JOIN categories c ON a.categorie_id = c.id
       WHERE a.id = ?`,
      [articleId]
    );

    if (rows.length === 0) {
      return res.status(404).send('Article not found');
    }

    const article = rows[0];
    res.render('articles/show', { article, user: req.session.user, title: article.title || 'Article Detail' });
  } catch (error) {
    console.error('Error fetching article:', error);
    res.status(500).send('Internal Server Error');
  } finally {
    if (connection) connection.release();
  }
};
