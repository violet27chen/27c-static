-- 27c.site 静态版 - Supabase 数据库 Schema
-- 在 Supabase SQL Editor 中执行此文件

-- ============================================================
-- 1. Products 表
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  image_url TEXT,
  thumb_url TEXT,
  quark_link TEXT NOT NULL,
  cloud_type TEXT,
  contact_tg TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- ============================================================
-- 2. Reviews 表
-- ============================================================
CREATE TABLE IF NOT EXISTS reviews (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);

-- ============================================================
-- 3. RLS 策略
-- ============================================================

-- Products: 所有人可读已上架商品
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 公开读取：已上架的商品所有人可见
CREATE POLICY "Public can view active products"
  ON products FOR SELECT
  USING (is_active = true);

-- 未上架的商品只有作者本人可见
CREATE POLICY "Users can view own inactive products"
  ON products FOR SELECT
  USING (auth.uid() = user_id);

-- 已登录用户可以插入自己的商品
CREATE POLICY "Users can insert own products"
  ON products FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 已登录用户可以更新自己的商品
CREATE POLICY "Users can update own products"
  ON products FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 已登录用户可以删除自己的商品
CREATE POLICY "Users can delete own products"
  ON products FOR DELETE
  USING (auth.uid() = user_id);

-- Reviews: 所有人可读
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view reviews"
  ON reviews FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own reviews"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews"
  ON reviews FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- 4. Storage Bucket (手动在 Supabase Dashboard 创建)
-- ============================================================
-- 创建 bucket: product-images
-- 访问权限: Public (所有人可读)

-- ============================================================
-- 5. 从 MySQL 迁移数据 (可选)
-- ============================================================
-- 如果要迁移现有数据，可以用 Supabase Dashboard 的 CSV 导入功能
-- 或者写脚本通过 Supabase REST API 批量插入
