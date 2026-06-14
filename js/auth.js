// 27c.site 静态版 - 认证模块

let currentUser = null;
let authListeners = [];

// 监听登录状态变化
supabase.auth.onAuthStateChange((event, session) => {
  currentUser = session ? session.user : null;
  authListeners.forEach(fn => fn(currentUser));
});

function onAuthChange(fn) {
  authListeners.push(fn);
  if (currentUser !== null) fn(currentUser);
}

async function signUp(email, password, username) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username } }
  });
  if (error) throw error;
  return data;
}

async function signIn(identifier, password) {
  // 支持用户名或邮箱登录
  // 先尝试邮箱登录
  let { data, error } = await supabase.auth.signInWithPassword({
    email: identifier,
    password,
  });
  if (error && identifier.includes('@')) throw error;

  // 如果不是邮箱格式，查 users 表找邮箱
  if (error && !identifier.includes('@')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('username', identifier)
      .single();
    if (profile) {
      ({ data, error } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password,
      }));
    }
    if (error) throw new Error('用户名或密码错误');
  }
  return data;
}

async function signOut() {
  await supabase.auth.signOut();
  currentUser = null;
}

async function getSession() {
  const { data } = await supabase.auth.getSession();
  currentUser = data.session ? data.session.user : null;
  return currentUser;
}

function isLoggedIn() {
  return currentUser !== null;
}
