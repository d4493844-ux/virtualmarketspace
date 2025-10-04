-- VMS Demo Data Seed Script
-- This script populates the database with realistic demo data for testing

-- Insert demo users (4 sellers + 4 buyers)
INSERT INTO users (id, email, display_name, avatar_url, bio, business_type, location, is_verified, is_seller, follower_count, following_count) VALUES
-- Sellers
('11111111-1111-1111-1111-111111111111', 'ada.pepper@vms.ng', 'Ada''s Fresh Peppers', 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?w=200', 'Local pepper seller in Lagos 🌶️ Fresh peppers daily! DM for wholesale prices.', 'Food & Groceries', 'Lagos, Nigeria', true, true, 1240, 89),
('22222222-2222-2222-2222-222222222222', 'chidi.shoes@vms.ng', 'Chidi Footwear', 'https://images.pexels.com/photos/1040881/pexels-photo-1040881.jpeg?w=200', 'Handmade leather shoes & repairs 👞 Quality craftsmanship since 2010', 'Fashion & Accessories', 'Aba, Nigeria', true, true, 3450, 234),
('33333333-3333-3333-3333-333333333333', 'mama.bisi@vms.ng', 'Mama Bisi Groceries', 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?w=200', 'Your neighborhood grocery store 🛒 Fresh produce, provisions & more', 'Food & Groceries', 'Ibadan, Nigeria', false, true, 890, 45),
('44444444-4444-4444-4444-444444444444', 'zara.fashion@vms.ng', 'Zara Luxury Fashion', 'https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg?w=200', 'Premium African fashion brand ✨ Ankara | Aso-ebi | Custom designs', 'Fashion & Accessories', 'Lagos, Nigeria', true, true, 8920, 567),
-- Buyers
('55555555-5555-5555-5555-555555555555', 'tunde.buyer@vms.ng', 'Tunde Adebayo', 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?w=200', 'Food lover | Supporting local businesses', null, 'Lagos, Nigeria', false, false, 234, 456),
('66666666-6666-6666-6666-666666666666', 'ngozi.style@vms.ng', 'Ngozi Okafor', 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?w=200', 'Fashion enthusiast | Entrepreneur', null, 'Abuja, Nigeria', false, false, 567, 890),
('77777777-7777-7777-7777-777777777777', 'emeka.tech@vms.ng', 'Emeka Johnson', 'https://images.pexels.com/photos/1516680/pexels-photo-1516680.jpeg?w=200', 'Tech professional | Love local products', null, 'Port Harcourt, Nigeria', false, false, 123, 234),
('88888888-8888-8888-8888-888888888888', 'aisha.market@vms.ng', 'Aisha Mohammed', 'https://images.pexels.com/photos/1181424/pexels-photo-1181424.jpeg?w=200', 'Market explorer | Finding the best deals', null, 'Kano, Nigeria', false, false, 345, 678)
ON CONFLICT (id) DO NOTHING;

-- Insert products
INSERT INTO products (id, seller_id, title, description, price, images, stock, sku, category, is_featured, view_count, purchase_count) VALUES
-- Ada's Peppers
('p1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Fresh Scotch Bonnet Peppers (1kg)', 'Premium quality scotch bonnet peppers, freshly harvested. Perfect for making pepper soup, stews and sauces. Very hot and flavorful!', 1500, ARRAY['https://images.pexels.com/photos/6646088/pexels-photo-6646088.jpeg', 'https://images.pexels.com/photos/4198018/pexels-photo-4198018.jpeg'], 50, 'ADA-SB-001', 'Food & Groceries', true, 456, 89),
('p1111111-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Dried Red Chili Peppers (500g)', 'Sun-dried red chili peppers for long-lasting flavor. Great for soups and traditional dishes.', 800, ARRAY['https://images.pexels.com/photos/6646094/pexels-photo-6646094.jpeg'], 30, 'ADA-RC-002', 'Food & Groceries', false, 234, 45),
('p1111111-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Bell Pepper Mix (1kg)', 'Colorful mix of red, yellow and green bell peppers. Fresh and crunchy!', 2000, ARRAY['https://images.pexels.com/photos/1391515/pexels-photo-1391515.jpeg'], 40, 'ADA-BP-003', 'Food & Groceries', false, 189, 34),

-- Chidi's Shoes
('p2222222-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Handmade Leather Oxford Shoes', 'Premium genuine leather Oxford shoes. Handcrafted with attention to detail. Available in brown and black. Perfect for formal occasions.', 25000, ARRAY['https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg', 'https://images.pexels.com/photos/1598507/pexels-photo-1598507.jpeg'], 12, 'CHI-OX-001', 'Fashion & Accessories', true, 892, 67),
('p2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Casual Leather Loafers', 'Comfortable leather loafers for everyday wear. Soft insole, durable construction.', 18000, ARRAY['https://images.pexels.com/photos/6046231/pexels-photo-6046231.jpeg'], 20, 'CHI-LF-002', 'Fashion & Accessories', false, 567, 45),
('p2222222-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'Traditional Leather Sandals', 'Authentic African-style leather sandals. Breathable and comfortable for hot weather.', 12000, ARRAY['https://images.pexels.com/photos/1476209/pexels-photo-1476209.jpeg'], 25, 'CHI-SD-003', 'Fashion & Accessories', false, 345, 28),
('p2222222-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'Shoe Repair & Polishing Service', 'Professional shoe repair and polishing service. Bring your old shoes back to life!', 3000, ARRAY['https://images.pexels.com/photos/3755706/pexels-photo-3755706.jpeg'], 999, 'CHI-SRV-004', 'Services', false, 234, 78),

-- Mama Bisi's Groceries
('p3333333-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'Local Rice (50kg Bag)', 'Premium quality local rice. Perfect for jollof, fried rice and more. Support local farmers!', 35000, ARRAY['https://images.pexels.com/photos/7363673/pexels-photo-7363673.jpeg'], 15, 'MAM-RC-001', 'Food & Groceries', true, 678, 34),
('p3333333-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 'Palm Oil (5 Liters)', 'Fresh red palm oil from local farms. Rich color and authentic taste.', 8500, ARRAY['https://images.pexels.com/photos/4110256/pexels-photo-4110256.jpeg'], 25, 'MAM-PO-002', 'Food & Groceries', false, 345, 56),
('p3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'Fresh Tomatoes (1 Basket)', 'Ripe tomatoes perfect for stews and sauces. Freshly delivered from the farm.', 4000, ARRAY['https://images.pexels.com/photos/1327838/pexels-photo-1327838.jpeg'], 20, 'MAM-TM-003', 'Food & Groceries', false, 234, 45),
('p3333333-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'Garri (White, 5kg)', 'Quality white garri, finely processed. Great for eba and garri soakings.', 2500, ARRAY['https://images.pexels.com/photos/5644975/pexels-photo-5644975.jpeg'], 40, 'MAM-GR-004', 'Food & Groceries', false, 456, 89),

-- Zara's Fashion
('p4444444-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'Ankara Maxi Dress - Limited Edition', 'Stunning ankara maxi dress with unique African print. Perfect for weddings, parties and special occasions. Comes with matching headwrap.', 45000, ARRAY['https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg', 'https://images.pexels.com/photos/3394658/pexels-photo-3394658.jpeg'], 8, 'ZAR-AMD-001', 'Fashion & Accessories', true, 1234, 23),
('p4444444-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', 'Aso-Ebi Package (5 Yards)', 'Premium aso-ebi fabric package. Beautiful designs for your special events. Bulk discounts available!', 35000, ARRAY['https://images.pexels.com/photos/3755707/pexels-photo-3755707.jpeg'], 15, 'ZAR-ASO-002', 'Fashion & Accessories', true, 890, 45),
('p4444444-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'Custom Ankara Shirt (Men)', 'Tailored ankara shirts for men. Modern cuts with traditional prints. Perfect for any occasion.', 28000, ARRAY['https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg'], 10, 'ZAR-CAS-003', 'Fashion & Accessories', false, 567, 34),
('p4444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'African Print Headwrap Set', 'Set of 3 beautiful African print headwraps. Versatile and stylish!', 12000, ARRAY['https://images.pexels.com/photos/3394666/pexels-photo-3394666.jpeg'], 30, 'ZAR-HW-004', 'Fashion & Accessories', false, 456, 67),
('p4444444-5555-5555-5555-555555555555', '44444444-4444-4444-4444-444444444444', 'Luxury Kaftan Dress', 'Elegant luxury kaftan with embroidery and beadwork. Statement piece for any wardrobe.', 85000, ARRAY['https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg'], 5, 'ZAR-KFT-005', 'Fashion & Accessories', true, 678, 12),

-- Additional mixed products
('p5555555-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Pepper Grinding Service', 'We grind your peppers fresh! Bring your peppers or buy ours. Fast service.', 500, ARRAY['https://images.pexels.com/photos/4198018/pexels-photo-4198018.jpeg'], 999, 'ADA-GRD-005', 'Services', false, 123, 34),
('p6666666-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'Mixed Vegetables Bundle', 'Fresh bundle of mixed vegetables: carrots, cabbage, green beans and more!', 3500, ARRAY['https://images.pexels.com/photos/1656666/pexels-photo-1656666.jpeg'], 18, 'MAM-VEG-005', 'Food & Groceries', false, 234, 45)
ON CONFLICT (id) DO NOTHING;

-- Insert videos (posts) with product tags
INSERT INTO videos (id, user_id, type, video_url, thumbnail_url, caption, hashtags, product_tags, like_count, comment_count, share_count, view_count) VALUES
-- Ada's content
('v1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'video', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 'https://images.pexels.com/photos/6646088/pexels-photo-6646088.jpeg', 'Just harvested these fresh scotch bonnets! 🌶️🔥 Who needs some for their pepper soup? DM for orders! #FreshPeppers #LagosMarket', ARRAY['FreshPeppers', 'LagosMarket', 'SupportLocal', 'NigerianFood'], ARRAY['p1111111-1111-1111-1111-111111111111']::uuid[], 234, 45, 23, 5678),
('v1111111-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'image', null, null, 'Bell peppers looking colorful today! Red, yellow, green - we have them all 🫑 Perfect for salads and stir-fry! #BellPeppers #HealthyEating', ARRAY['BellPeppers', 'HealthyEating', 'FreshProduce'], ARRAY['p1111111-3333-3333-3333-333333333333']::uuid[], 189, 34, 12, 3456),

-- Chidi's content
('v2222222-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'video', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', 'https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg', 'Watch me craft these beautiful Oxford shoes from scratch 👞✨ Every stitch tells a story. #Handmade #LeatherCraft #MadeInAba', ARRAY['Handmade', 'LeatherCraft', 'MadeInAba', 'NigerianBusiness'], ARRAY['p2222222-1111-1111-1111-111111111111']::uuid[], 567, 89, 45, 12345),
('v2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'video', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', 'https://images.pexels.com/photos/6046231/pexels-photo-6046231.jpeg', 'Loafers restocking alert! 🚨 These beauties won''t last long. Comfortable, stylish, and durable. #Loafers #Footwear #AbaShoes', ARRAY['Loafers', 'Footwear', 'AbaShoes', 'Fashion'], ARRAY['p2222222-2222-2222-2222-222222222222']::uuid[], 345, 56, 34, 8901),

-- Zara's content
('v4444444-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'video', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', 'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg', 'NEW DROP! 🔥 Limited edition ankara maxi dress. Only 8 pieces available. Tag someone who needs to see this! ✨ #AnkaraFashion #AfricanPrint #LuxuryFashion', ARRAY['AnkaraFashion', 'AfricanPrint', 'LuxuryFashion', 'NigerianFashion'], ARRAY['p4444444-1111-1111-1111-111111111111']::uuid[], 892, 123, 78, 23456),
('v4444444-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', 'image', null, null, 'Aso-ebi packages for your owambe parties! 💃🏾 Get the whole family matching. Bulk orders welcome! #AsoEbi #Owambe #PartyReady', ARRAY['AsoEbi', 'Owambe', 'PartyReady', 'NigerianWedding'], ARRAY['p4444444-2222-2222-2222-222222222222']::uuid[], 456, 67, 45, 9876),
('v4444444-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'video', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4', 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg', 'Men can rock ankara too! 💯 Check out these custom shirt designs. Modern meets traditional. #MensAnkara #AfricanMensFashion #CustomMade', ARRAY['MensAnkara', 'AfricanMensFashion', 'CustomMade'], ARRAY['p4444444-3333-3333-3333-333333333333']::uuid[], 678, 89, 56, 15678),

-- Mama Bisi's content
('v3333333-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'video', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', 'https://images.pexels.com/photos/7363673/pexels-photo-7363673.jpeg', 'Local rice just arrived! 🍚 Support our farmers, support Nigeria. Quality rice for quality jollof! #LocalRice #SupportLocal #NigerianRice', ARRAY['LocalRice', 'SupportLocal', 'NigerianRice', 'Jollof'], ARRAY['p3333333-1111-1111-1111-111111111111']::uuid[], 345, 67, 34, 7890),
('v3333333-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 'image', null, null, 'Fresh tomatoes from the farm this morning! 🍅 Red, ripe and ready for your stews. Visit the store today! #FreshTomatoes #FarmFresh #IbadanMarket', ARRAY['FreshTomatoes', 'FarmFresh', 'IbadanMarket'], ARRAY['p3333333-3333-3333-3333-333333333333']::uuid[], 234, 45, 23, 4567),

-- Lifestyle content from buyers
('v5555555-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', 'text', null, null, 'Just made the best pepper soup with @Ada''s Fresh Peppers scotch bonnets! 🔥🔥🔥 So spicy and flavorful! If you''re in Lagos, you need to try these peppers. Worth every naira! #PepperSoup #LagosFood #FoodReview', ARRAY['PepperSoup', 'LagosFood', 'FoodReview', 'SupportLocal'], ARRAY[]::uuid[], 167, 23, 12, 2345),
('v6666666-1111-1111-1111-111111111111', '66666666-6666-6666-6666-666666666666', 'image', null, null, 'Stepped out in my new Zara Luxury Fashion ankara dress and got SO many compliments! 😍💃🏾 The quality is unmatched. Already planning my next order! #OOTD #AnkaraStyle #NigerianFashion', ARRAY['OOTD', 'AnkaraStyle', 'NigerianFashion', 'FashionReview'], ARRAY['p4444444-1111-1111-1111-111111111111']::uuid[], 523, 78, 45, 8765),
('v7777777-1111-1111-1111-111111111111', '77777777-7777-7777-7777-777777777777', 'video', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 'https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg', 'Unboxing my new Chidi Footwear Oxfords! The craftsmanship is incredible 👞✨ These are investment pieces that will last for years. #ShoeReview #MadeInNigeria #QualityFootwear', ARRAY['ShoeReview', 'MadeInNigeria', 'QualityFootwear', 'Unboxing'], ARRAY['p2222222-1111-1111-1111-111111111111']::uuid[], 412, 56, 34, 6789),
('v8888888-1111-1111-1111-111111111111', '88888888-8888-8888-8888-888888888888', 'text', null, null, 'Shopping at Mama Bisi''s Groceries has changed my market experience! Everything is fresh, prices are fair, and the service is excellent. This is what supporting local businesses is all about! 🛒💚 #SupportLocal #NigerianBusiness #MarketDay', ARRAY['SupportLocal', 'NigerianBusiness', 'MarketDay'], ARRAY[]::uuid[], 289, 34, 18, 4321)
ON CONFLICT (id) DO NOTHING;

-- Insert follows
INSERT INTO follows (follower_id, following_id) VALUES
-- Buyers following sellers
('55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111'),
('55555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222'),
('55555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333'),
('66666666-6666-6666-6666-666666666666', '44444444-4444-4444-4444-444444444444'),
('66666666-6666-6666-6666-666666666666', '22222222-2222-2222-2222-222222222222'),
('66666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111'),
('77777777-7777-7777-7777-777777777777', '22222222-2222-2222-2222-222222222222'),
('77777777-7777-7777-7777-777777777777', '33333333-3333-3333-3333-333333333333'),
('88888888-8888-8888-8888-888888888888', '33333333-3333-3333-3333-333333333333'),
('88888888-8888-8888-8888-888888888888', '11111111-1111-1111-1111-111111111111'),
-- Cross-following between users
('11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444'),
('22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444'),
('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111'),
('44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222')
ON CONFLICT (follower_id, following_id) DO NOTHING;

-- Insert likes
INSERT INTO likes (user_id, video_id) VALUES
('55555555-5555-5555-5555-555555555555', 'v1111111-1111-1111-1111-111111111111'),
('55555555-5555-5555-5555-555555555555', 'v2222222-1111-1111-1111-111111111111'),
('55555555-5555-5555-5555-555555555555', 'v3333333-1111-1111-1111-111111111111'),
('66666666-6666-6666-6666-666666666666', 'v4444444-1111-1111-1111-111111111111'),
('66666666-6666-6666-6666-666666666666', 'v4444444-2222-2222-2222-222222222222'),
('66666666-6666-6666-6666-666666666666', 'v2222222-1111-1111-1111-111111111111'),
('77777777-7777-7777-7777-777777777777', 'v2222222-1111-1111-1111-111111111111'),
('77777777-7777-7777-7777-777777777777', 'v2222222-2222-2222-2222-222222222222'),
('88888888-8888-8888-8888-888888888888', 'v3333333-1111-1111-1111-111111111111'),
('88888888-8888-8888-8888-888888888888', 'v3333333-2222-2222-2222-222222222222'),
('11111111-1111-1111-1111-111111111111', 'v4444444-1111-1111-1111-111111111111'),
('22222222-2222-2222-2222-222222222222', 'v4444444-1111-1111-1111-111111111111'),
('33333333-3333-3333-3333-333333333333', 'v1111111-1111-1111-1111-111111111111'),
('44444444-4444-4444-4444-444444444444', 'v2222222-1111-1111-1111-111111111111')
ON CONFLICT (user_id, video_id) DO NOTHING;

-- Insert comments
INSERT INTO comments (user_id, video_id, content) VALUES
('55555555-5555-5555-5555-555555555555', 'v1111111-1111-1111-1111-111111111111', 'These peppers are 🔥! How much for 2kg?'),
('66666666-6666-6666-6666-666666666666', 'v1111111-1111-1111-1111-111111111111', 'Do you deliver to Abuja?'),
('77777777-7777-7777-7777-777777777777', 'v2222222-1111-1111-1111-111111111111', 'Beautiful craftsmanship! Do you do custom orders?'),
('88888888-8888-8888-8888-888888888888', 'v2222222-1111-1111-1111-111111111111', 'I need these for my wedding! DM sent'),
('55555555-5555-5555-5555-555555555555', 'v3333333-1111-1111-1111-111111111111', 'Supporting local rice! 🇳🇬'),
('66666666-6666-6666-6666-666666666666', 'v4444444-1111-1111-1111-111111111111', 'Absolutely stunning! 😍 What sizes are available?'),
('77777777-7777-7777-7777-777777777777', 'v4444444-1111-1111-1111-111111111111', 'This is gorgeous! Can you make in navy blue?'),
('11111111-1111-1111-1111-111111111111', 'v5555555-1111-1111-1111-111111111111', 'Thank you for the review! 🙏🏾 We appreciate your support!'),
('22222222-2222-2222-2222-222222222222', 'v7777777-1111-1111-1111-111111111111', 'Thanks for the love! Your support means everything 🙏🏾'),
('44444444-4444-4444-4444-444444444444', 'v6666666-1111-1111-1111-111111111111', 'You look amazing! Thank you for supporting us! ✨')
ON CONFLICT DO NOTHING;

-- Insert conversations
INSERT INTO conversations (id, participant_ids) VALUES
('c1111111-1111-1111-1111-111111111111', ARRAY['55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111']::uuid[]),
('c2222222-2222-2222-2222-222222222222', ARRAY['66666666-6666-6666-6666-666666666666', '44444444-4444-4444-4444-444444444444']::uuid[]),
('c3333333-3333-3333-3333-333333333333', ARRAY['77777777-7777-7777-7777-777777777777', '22222222-2222-2222-2222-222222222222']::uuid[]),
('c4444444-4444-4444-4444-444444444444', ARRAY['88888888-8888-8888-8888-888888888888', '33333333-3333-3333-3333-333333333333']::uuid[])
ON CONFLICT (id) DO NOTHING;

-- Insert messages
INSERT INTO messages (conversation_id, sender_id, content, is_read) VALUES
-- Conversation 1: Tunde and Ada
('c1111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', 'Hi Ada! I saw your fresh scotch bonnets. Do you deliver to Lekki?', true),
('c1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Yes! We deliver to Lekki. Minimum order is 2kg. Delivery is ₦500', true),
('c1111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', 'Perfect! I need 3kg. Can you deliver tomorrow morning?', true),
('c1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Yes, no problem! I''ll send you my account details', false),
-- Conversation 2: Ngozi and Zara
('c2222222-2222-2222-2222-222222222222', '66666666-6666-6666-6666-666666666666', 'Hello! I love the ankara maxi dress. Is it still available?', true),
('c2222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', 'Yes dear! We have 5 pieces left. What''s your size?', true),
('c2222222-2222-2222-2222-222222222222', '66666666-6666-6666-6666-666666666666', 'I''m a size 12. Do you have measurements?', true),
('c2222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', 'Yes! Size 12 fits bust 38", waist 32", hips 42". Let me send you more photos', false),
-- Conversation 3: Emeka and Chidi
('c3333333-3333-3333-3333-333333333333', '77777777-7777-7777-7777-777777777777', 'Good afternoon! I need Oxford shoes for my wedding. Size 43', true),
('c3333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'Congratulations! Yes, we have size 43 in stock. Brown or black?', true),
('c3333333-3333-3333-3333-333333333333', '77777777-7777-7777-7777-777777777777', 'Black please. How long for delivery to Port Harcourt?', false),
-- Conversation 4: Aisha and Mama Bisi
('c4444444-4444-4444-4444-444444444444', '88888888-8888-8888-8888-888888888888', 'Do you have local rice in stock? I need 2 bags', true),
('c4444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'Yes! Fresh stock just arrived. 50kg bags at ₦35,000 each', true),
('c4444444-4444-4444-4444-444444444444', '88888888-8888-8888-8888-888888888888', 'Great! Can you deliver to Sabon Gari this week?', false)
ON CONFLICT DO NOTHING;

-- Insert bookmarks
INSERT INTO bookmarks (user_id, video_id) VALUES
('55555555-5555-5555-5555-555555555555', 'v2222222-1111-1111-1111-111111111111'),
('55555555-5555-5555-5555-555555555555', 'v4444444-1111-1111-1111-111111111111'),
('66666666-6666-6666-6666-666666666666', 'v4444444-1111-1111-1111-111111111111'),
('66666666-6666-6666-6666-666666666666', 'v4444444-2222-2222-2222-222222222222'),
('77777777-7777-7777-7777-777777777777', 'v2222222-1111-1111-1111-111111111111')
ON CONFLICT (user_id, video_id) DO NOTHING;

-- Insert notifications
INSERT INTO notifications (user_id, type, actor_id, video_id, message, is_read) VALUES
('11111111-1111-1111-1111-111111111111', 'like', '55555555-5555-5555-5555-555555555555', 'v1111111-1111-1111-1111-111111111111', 'Tunde Adebayo liked your post', true),
('11111111-1111-1111-1111-111111111111', 'comment', '55555555-5555-5555-5555-555555555555', 'v1111111-1111-1111-1111-111111111111', 'Tunde Adebayo commented: These peppers are 🔥! How much for 2kg?', true),
('11111111-1111-1111-1111-111111111111', 'follow', '55555555-5555-5555-5555-555555555555', null, 'Tunde Adebayo started following you', false),
('44444444-4444-4444-4444-444444444444', 'like', '66666666-6666-6666-6666-666666666666', 'v4444444-1111-1111-1111-111111111111', 'Ngozi Okafor liked your post', false),
('44444444-4444-4444-4444-444444444444', 'comment', '66666666-6666-6666-6666-666666666666', 'v4444444-1111-1111-1111-111111111111', 'Ngozi Okafor commented: Absolutely stunning! 😍 What sizes are available?', false),
('22222222-2222-2222-2222-222222222222', 'message', '77777777-7777-7777-7777-777777777777', null, 'Emeka Johnson sent you a message', false)
ON CONFLICT DO NOTHING;

-- Insert verification requests
INSERT INTO verification_requests (user_id, status, payment_status) VALUES
('11111111-1111-1111-1111-111111111111', 'approved', 'demo'),
('22222222-2222-2222-2222-222222222222', 'approved', 'demo'),
('44444444-4444-4444-4444-444444444444', 'approved', 'demo'),
('33333333-3333-3333-3333-333333333333', 'pending', 'demo')
ON CONFLICT DO NOTHING;