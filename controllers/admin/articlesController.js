const { pool } = require('../../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../../public/uploads/articles');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'article-cover-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

const articlesController = {
    index: async (req, res) => {
        let connection;
        try {
            connection = await pool.getConnection();
            
            // Get search parameters
            const search = req.query.search || '';
            const category = req.query.category || '';
            const status = req.query.status || '';
let page = parseInt(req.query.page, 10);
if (isNaN(page) || page < 1) {
    page = 1;
}
const limit = 10;
const offset = (page - 1) * limit;
            
            // Build WHERE conditions
            let whereConditions = [];
            let queryParams = [];
            
            if (search) {
                whereConditions.push('(a.title LIKE ? OR a.content LIKE ?)');
                const searchTerm = `%${search}%`;
                queryParams.push(searchTerm, searchTerm);
            }
            
            if (category) {
                whereConditions.push('a.categorie_id = ?');
                queryParams.push(category);
            }
            
            if (status === 'published') {
                whereConditions.push('a.is_published = 1');
            } else if (status === 'draft') {
                whereConditions.push('a.is_published = 0');
            }
            
            const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
            
            // Get articles with search and pagination
            // Prepare the query with proper commas and parameter placeholders
            const articlesQuery = `
                SELECT 
                    a.id,
                    a.title,
                    a.slug,
                    a.cover,
                    SUBSTRING(a.content, 1, 150) as excerpt,
                    a.categorie_id,
                    c.name as category_name,
                    a.is_published,
                    a.created_at,
                    a.content
                FROM articles a
                LEFT JOIN categories c ON a.categorie_id = c.id
                ${whereClause}
                ORDER BY a.created_at DESC
                LIMIT ${limit} OFFSET ${offset}
            `;
            // Use only queryParams for articles query
            const articlesQueryParams = [...queryParams];
            const [articles] = await connection.execute(articlesQuery, articlesQueryParams);
            
            // Get total count for pagination (without limit/offset)
            const countQuery = `SELECT COUNT(*) as count FROM articles a LEFT JOIN categories c ON a.categorie_id = c.id ${whereClause}`;
            const [totalCount] = await connection.execute(countQuery, queryParams);
            const totalPages = Math.ceil(totalCount[0].count / limit);

            // Get categories for filter/add form
            const [categories] = await connection.execute('SELECT id, name FROM categories ORDER BY name');
            
            // Check if it's an AJAX request
            if (req.xhr || req.headers.accept.indexOf('json') > -1) {
                res.render('admin/articles/index', {
                    layout: false,  // Don't use layout for AJAX requests
                    articles: articles,
                    categories: categories,
                    currentPage: page,
                    totalPages: totalPages,
                    search: search,
                    category: category,
                    status: status
                });
            } else {
                res.render('admin/articles/index', {
                    title: 'Articles Management',
                    user: req.session.user,
                    path: req.path,
                    layout: 'layouts/admin',
                    articles: articles,
                    categories: categories,
                    currentPage: page,
                    totalPages: totalPages,
                    search: search,
                    category: category,
                    status: status,
                    messages: {
                        success: req.flash('success'),
                        error: req.flash('error')
                    }
                });
            }
        } catch (error) {
            console.error('Articles error:', error);
            req.flash('error', 'Failed to fetch articles: ' + error.message);
            res.render('admin/articles/index', {
                title: 'Articles Management',
                user: req.session.user,
                path: req.path,
                layout: 'layouts/admin',
                articles: [],
                categories: [],
                currentPage: 1,
                totalPages: 1,
                search: '',
                category: '',
                status: '',
                messages: {
                    success: req.flash('success'),
                    error: req.flash('error')
                }
            });
        } finally {
            if (connection) connection.release();
        }
    },

    create: async (req, res) => {
        let connection;
        try {
            const { title, content, categorie_id, is_published } = req.body;
            
            // Validate required fields
            if (!title || !content) {
                throw new Error('Title and content are required');
            }
            
            if (title.length < 3) {
                throw new Error('Title must be at least 3 characters long');
            }
            
            if (content.length < 10) {
                throw new Error('Content must be at least 10 characters long');
            }
            
            // Generate slug from title
            const slug = title.toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)+/g, '');
            
            // Handle cover image upload
            let coverPath = null;
            if (req.file) {
                coverPath = '/uploads/articles/' + req.file.filename;
            }
            
            connection = await pool.getConnection();
            
            // Check if article with same title/slug exists
            const [existing] = await connection.execute(
                'SELECT id FROM articles WHERE title = ? OR slug = ?',
                [title, slug]
            );
            
            if (existing.length > 0) {
                throw new Error('Article with this title already exists');
            }
            
            // Create new article
            await connection.execute(`
                INSERT INTO articles (
                    title, slug, content, cover, categorie_id, is_published, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, NOW())
            `, [
                title,
                slug,
                content,
                coverPath,
                categorie_id || null,
                is_published === 'on' ? 1 : 0
            ]);
            
            req.flash('success', 'Article created successfully!');
            res.redirect('/dashboard/articles');
        } catch (error) {
            console.error('Create article error:', error);
            
            // Clean up uploaded file if database operation failed
            if (req.file) {
                const filePath = path.join(uploadDir, req.file.filename);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
            
            req.flash('error', `Failed to create article: ${error.message}`);
            res.redirect('/dashboard/articles');
        } finally {
            if (connection) connection.release();
        }
    },

    update: async (req, res) => {
        let connection;
        try {
            const articleId = req.params.id;
            const { title, content, categorie_id, is_published } = req.body;
            
            // Validate required fields
            if (!title || !content) {
                throw new Error('Title and content are required');
            }
            
            if (title.length < 3) {
                throw new Error('Title must be at least 3 characters long');
            }
            
            if (content.length < 10) {
                throw new Error('Content must be at least 10 characters long');
            }
            
            // Generate slug from title
            const slug = title.toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)+/g, '');
            
            connection = await pool.getConnection();
            
            // Check if another article with same title/slug exists
            const [existing] = await connection.execute(
                'SELECT id FROM articles WHERE (title = ? OR slug = ?) AND id != ?',
                [title, slug, articleId]
            );
            
            if (existing.length > 0) {
                throw new Error('Another article with this title already exists');
            }
            
            // Get current article data to retrieve old cover path
            const [currentArticle] = await connection.execute('SELECT cover FROM articles WHERE id = ?', [articleId]);
            
            let coverPath = currentArticle[0]?.cover || null;
            let oldCoverPath = null;
            
            // Handle cover image upload
            if (req.file) {
                oldCoverPath = currentArticle[0]?.cover;
                coverPath = '/uploads/articles/' + req.file.filename;
            }
            
            // Update article
            await connection.execute(`
                UPDATE articles 
                SET title = ?, slug = ?, content = ?, cover = ?, categorie_id = ?, is_published = ?, updated_at = NOW()
                WHERE id = ?
            `, [
                title,
                slug,
                content,
                coverPath,
                categorie_id || null,
                is_published === 'on' ? 1 : 0,
                articleId
            ]);
            
            // Delete old cover file if a new one was uploaded
            if (req.file && oldCoverPath && oldCoverPath.startsWith('/uploads/articles/')) {
                const oldFileName = path.basename(oldCoverPath);
                const oldFilePath = path.join(uploadDir, oldFileName);
                if (fs.existsSync(oldFilePath)) {
                    fs.unlinkSync(oldFilePath);
                }
            }
            
            req.flash('success', 'Article updated successfully!');
            res.redirect('/dashboard/articles');
        } catch (error) {
            console.error('Update article error:', error);
            
            // Clean up uploaded file if database operation failed
            if (req.file) {
                const filePath = path.join(uploadDir, req.file.filename);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
            
            req.flash('error', `Failed to update article: ${error.message}`);
            res.redirect('/dashboard/articles');
        } finally {
            if (connection) connection.release();
        }
    },

    delete: async (req, res) => {
        let connection;
        try {
            const articleId = req.params.id;
            
            connection = await pool.getConnection();
            
            // Get article cover to delete file
            const [article] = await connection.execute('SELECT cover FROM articles WHERE id = ?', [articleId]);
            const coverPath = article[0]?.cover;
            
            // Delete article
            await connection.execute('DELETE FROM articles WHERE id = ?', [articleId]);
            
            // Delete cover file if it exists
            if (coverPath && coverPath.startsWith('/uploads/articles/')) {
                const fileName = path.basename(coverPath);
                const filePath = path.join(uploadDir, fileName);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
            
            req.flash('success', 'Article deleted successfully!');
            res.redirect('/dashboard/articles');
        } catch (error) {
            console.error('Delete article error:', error);
            req.flash('error', 'Failed to delete article. Please try again.');
            res.redirect('/dashboard/articles');
        } finally {
            if (connection) connection.release();
        }
    },

    // Export multer upload middleware
    uploadMiddleware: upload.single('cover')
};

module.exports = articlesController;
