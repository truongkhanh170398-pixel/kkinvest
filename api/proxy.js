// Serverless proxy CORS chạy trên chính Vercel (cùng origin → không bị chặn như proxy bên thứ 3)
// Dùng: /api/proxy?url=<URL đích đã encode>
export default async function handler(req, res) {
  const target = req.query.url;
  if (!target || !/^https?:\/\//i.test(target)) {
    res.status(400).send('Thiếu hoặc sai tham số url');
    return;
  }
  // chỉ cho phép vài host dữ liệu cần thiết (tránh bị lạm dụng làm open proxy)
  const ALLOW = [
    'vndirect.com.vn',                 // dchart-api / finfo-api / api-finfo … (mọi subdomain VNDirect)
    'query1.finance.yahoo.com',
    'query2.finance.yahoo.com',
    'cafef.vn', 'vietstock.vn', 'vneconomy.vn', 'tinnhanhchungkhoan.vn',
    'apipubaws.tcbs.com.vn', '24hmoney.vn',
    'cnbc.com', 'dowjones.io',  // tin tài chính quốc tế (RSS): CNBC · MarketWatch (feeds.content.dowjones.io)
    'api.dnse.com.vn'           // CHỈ để đăng nhập lấy token tick realtime (xem AUTH_ONLY bên dưới)
  ];
  let host, path;
  try { const u = new URL(target); host = u.hostname.replace(/^www\./, ''); path = u.pathname; }
  catch { res.status(400).send('URL không hợp lệ'); return; }
  if (!ALLOW.some(h => host === h || host.endsWith('.' + h))) {
    res.status(403).send('Host không nằm trong danh sách cho phép');
    return;
  }

  // ── DNSE: api.dnse.com.vn không trả Access-Control-Allow-Origin cho domain mình
  //    (chỉ cho localhost:* và các origin của chính DNSE) nên trình duyệt chặn thẳng.
  //    Cho phép đi vòng qua đây, nhưng KHOÁ CHẶT: chỉ đúng 2 đường dẫn đăng nhập,
  //    không biến proxy thành cổng ghi dữ liệu tuỳ ý vào tài khoản chứng khoán.
  //    Luồng tick sau đó chạy thẳng qua WebSocket, KHÔNG qua proxy này.
  const isDnse = host === 'api.dnse.com.vn';
  const DNSE_OK = ['/user-service/api/auth', '/user-service/api/me'];
  if (isDnse && !DNSE_OK.includes(path)) {
    res.status(403).send('DNSE: chỉ cho phép đường dẫn đăng nhập');
    return;
  }
  const method = (req.method || 'GET').toUpperCase();
  if (method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.status(204).end();
    return;
  }
  if (method === 'POST' && !isDnse) {
    res.status(405).send('Chỉ hỗ trợ POST cho đăng nhập DNSE');
    return;
  }

  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 9000);
    const headers = { 'User-Agent': 'Mozilla/5.0', 'Accept': '*/*' };
    if (req.headers.authorization) headers['Authorization'] = req.headers.authorization;
    let body;
    if (method === 'POST') {
      headers['Content-Type'] = 'application/json';
      body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
    }
    const r = await fetch(target, { method, signal: ctrl.signal, headers, body });
    clearTimeout(t);
    const text = await r.text();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', r.headers.get('content-type') || 'text/plain; charset=utf-8');
    // thông tin đăng nhập TUYỆT ĐỐI không được cache ở edge
    res.setHeader('Cache-Control', isDnse ? 'no-store, no-cache, must-revalidate' : 's-maxage=15, stale-while-revalidate=45');
    res.status(r.status).send(text);
  } catch (e) {
    res.status(502).send('Proxy lỗi: ' + (e && e.message ? e.message : String(e)));
  }
}
