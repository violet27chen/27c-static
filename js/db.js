// 27c.site 静态版 - 数据库操作模块

// 云盘类型检测
function detectCloudType(url) {
  if (!url) return null;
  const u = url.toLowerCase();
  const map = [
    ['quark.cn', 'quark'], ['pan.quark', 'quark'],
    ['baidu.com', 'baidu'], ['pan.baidu', 'baidu'],
    ['alipan.com', 'aliyun'], ['aliyundrive.com', 'aliyun'],
    ['123pan.com', '123pan'], ['123云盘', '123pan'],
    ['xunlei.com', 'xunlei'], ['pan.xunlei', 'xunlei'],
    ['guangyapan.com', 'guangya'],
    ['115.com', '115pan'],
    ['lanzou', 'lanzou'],
    ['weiyun.com', 'weiyun'], ['微云', 'weiyun'],
    ['ctfile.com', 'ctfile'], ['城通', 'ctfile'],
    ['mega.nz', 'mega'], ['mega.co', 'mega'],
    ['drive.google.com', 'gdrive'], ['docs.google.com', 'gdrive'],
    ['dropbox.com', 'dropbox'],
    ['onedrive.live.com', 'onedrive'], ['1drv.ms', 'onedrive'],
    ['pcloud.com', 'pcloud'],
    ['mediafire.com', 'mediafire'],
    ['wetransfer.com', 'wetransfer'],
    ['box.com', 'box'],
  ];
  for (const [needle, type] of map) {
    if (u.includes(needle)) return type;
  }
  return 'other';
}

// 获取所有上架商品（首页用）
async function fetchActiveProducts({ search = '', category = '' } = {}) {
  let query = supabase
    .from('products')
    .select('*, profiles:user_id(username)')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
  }
  if (category && category !== 'all') {
    query = query.eq('category', category);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// 获取所有分类
async function fetchCategories() {
  const { data, error } = await supabase
    .from('products')
    .select('category')
    .eq('is_active', true)
    .not('category', 'is', null)
    .order('category');
  if (error) throw error;
  const cats = [...new Set(data.map(c => c.category))];
  return cats;
}

// 获取单个商品详情
async function fetchProduct(id) {
  const { data, error } = await supabase
    .from('products')
    .select('*, profiles:user_id(username)')
    .eq('id', id)
    .eq('is_active', true)
    .single();
  if (error) throw error;
  return data;
}

// 获取当前用户的商品（管理后台用）
async function fetchMyProducts() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

// 新增商品
async function insertProduct(product) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('未登录');

  const { data, error } = await supabase
    .from('products')
    .insert({
      user_id: user.id,
      name: product.name,
      description: product.description || '',
      category: product.category || null,
      image_url: product.image_url || null,
      thumb_url: product.thumb_url || null,
      quark_link: product.quark_link,
      cloud_type: detectCloudType(product.quark_link),
      contact_tg: product.contact_tg || null,
      is_active: product.is_active !== false,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// 更新商品
async function updateProduct(id, product) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('未登录');

  const { data, error } = await supabase
    .from('products')
    .update({
      name: product.name,
      description: product.description || '',
      category: product.category || null,
      image_url: product.image_url || null,
      thumb_url: product.thumb_url || null,
      quark_link: product.quark_link,
      cloud_type: detectCloudType(product.quark_link),
      contact_tg: product.contact_tg || null,
      is_active: product.is_active !== false,
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// 切换上架状态
async function toggleProduct(id) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('未登录');

  const { data: current } = await supabase
    .from('products')
    .select('is_active')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  const { data, error } = await supabase
    .from('products')
    .update({ is_active: !current.is_active })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// 删除商品
async function deleteProduct(id) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('未登录');

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);
  if (error) throw error;
}

// 上传图片到 Supabase Storage
async function uploadImage(file, folder = 'products') {
  const ext = file.name.split('.').pop();
  const filename = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { data, error } = await supabase.storage
    .from('product-images')
    .upload(filename, file, { upsert: false });
  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from('product-images')
    .getPublicUrl(data.path);
  return urlData.publicUrl;
}

// 获取商品评价
async function fetchReviews(productId) {
  const { data, error } = await supabase
    .from('reviews')
    .select('*, profiles:user_id(username)')
    .eq('product_id', productId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

// 提交评价
async function addReview(productId, rating, content) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('未登录');

  const { data, error } = await supabase
    .from('reviews')
    .insert({
      product_id: productId,
      user_id: user.id,
      rating,
      content,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}
