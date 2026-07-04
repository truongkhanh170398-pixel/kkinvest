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
    'apipubaws.tcbs.com.vn', '24hmoney.vn'
  ];
  let host;
  try { host = new URL(target).hostname.replace(/^www\./, ''); }
  catch { res.status(400).send('URL không hợp lệ'); return; }
  if (!ALLOW.some(h => host === h || host.endsWith('.' + h))) {
    res.status(403).send('Host không nằm trong danh sách cho phép');
    return;
  }
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 9000);
    const r = await fetch(target, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': '*/*' }
    });
    clearTimeout(t);
    const body = await r.text();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', r.headers.get('content-type') || 'text/plain; charset=utf-8');
    // cache nhẹ ở edge để giảm số lần gọi
    res.setHeader('Cache-Control', 's-maxage=15, stale-while-revalidate=45');
    res.status(r.status).send(body);
  } catch (e) {
    res.status(502).send('Proxy lỗi: ' + (e && e.message ? e.message : String(e)));
  }
}
