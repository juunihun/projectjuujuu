USE juu_juu_shop;

-- Seed Users (Passwords are 'password123' generated with bcrypt)
INSERT IGNORE INTO users (id, name, email, password, role) VALUES 
(1, 'Admin User', 'admin@example.com', '$2b$10$B88yxYBxjmTpLueDT7H2J.5QpXhZoM26PsNpmB8nnTrxpOuR.KkktS', 'admin'),
(2, 'Seller One', 'seller1@example.com', '$2b$10$B88yxYBxjmTpLueDT7H2J.5QpXhZoM26PsNpmB8nnTrxpOuR.KkktS', 'seller');

-- Seed Products
INSERT IGNORE INTO products (id, title, price, images, category, sold, seller_id) VALUES 
(1, 'Blue T-Shirt', 299.00, '["https://picsum.photos/seed/prod-0/300/300", "https://picsum.photos/seed/prod-0-1/300/300"]', 'Clothing', 120, 2),
(2, 'Wireless Headphones', 1290.00, '["https://picsum.photos/seed/prod-1/300/300"]', 'Electronics', 450, 2),
(3, 'Gaming Mouse', 890.00, '["https://picsum.photos/seed/prod-2/300/300"]', 'Electronics', 89, 2);

-- Seed Banners
INSERT IGNORE INTO banners (id, image_url, title, position, sort_order) VALUES 
(1, 'https://picsum.photos/seed/banner1/800/300', 'Big Sale 50%', 'carousel', 1),
(2, 'https://picsum.photos/seed/banner2/800/300', 'New Arrivals', 'carousel', 2),
(3, 'https://picsum.photos/seed/side1/400/150', 'Free Shipping', 'side_1', 1),
(4, 'https://picsum.photos/seed/side2/400/150', 'Crazy Deals', 'side_2', 1);
