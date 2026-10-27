// Cầu nối tới DNSE Open API — ký HMAC-SHA256 ở phía máy chủ.
//
// Đây là nguồn DUY NHẤT cho tới nay trả về TỪNG LỆNH KHỚP thật kèm chiều
// mua/bán do sàn công bố (side BUY/SELL), không phải suy từ nến hay từ sổ lệnh.
// Đối soát 27/10/2026: tổng matchQtty lấy về khớp 100,0% totalVolumeTraded.
//
// Khoá KHÔNG được nằm trong mã nguồn. Lấy từ biến môi trường DNSE_API_KEY /
// DNSE_API_SECRET của Vercel; chưa đặt thì nhận tạm từ header do trình duyệt gửi.
import crypto from 'crypto';
export const config = { maxDuration: 60 };

const GOC = 'https://openapi.dnse.com.vn';
const LO = 40;           // số mã gọi song song mỗi lô (đo: 218 mã / 6 lô = 0,6 giây)
const TOI_DA_MA = 240;

function kyHeader(method, path, key, secret) {
  const date = new Date().toUTCString().replace('GMT', '+0000');   // RFC 2822
  const nonce = crypto.randomBytes(16).toString('hex');
  // nonce CÓ trong chuỗi ký nhưng KHÔNG liệt kê ở trường headers — đúng như SDK
  // chính chủ dnse-tech/dnse-py làm. Lệch chỗ này là 401.
  const chuoi = [
    '(request-target): ' + method.toLowerCase() + ' ' + path,
    'date: ' + date,
    'nonce: ' + nonce
  ].join('\n');
  const sig = encodeURIComponent(
    crypto.createHmac('sha256', secret).update(chuoi).digest('base64'));
  return {
    'x-api-key': key,
    'date': date,
    'X-Signature': 'Signature keyId="' + key + '",algorithm="hmac-sha256",'
      + 'headers="(request-target) date",signature="' + sig + '",nonce="' + nonce + '"'
  };
}

async function goiDnse(path, params, key, secret, ms) {
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), ms || 15000);
  try {
    const r = await fetch(GOC + path + '?' + new URLSearchParams(params),
      { headers: kyHeader('GET', path, key, secret), signal: ctrl.signal });
    const txt = await r.text();
    let j = null; try { j = JSON.parse(txt); } catch (e) {}
    return { ma: r.status, j, txt };
  } catch (e) {
    // "fetch failed" của undici giấu nguyên nhân thật trong e.cause — phải moi ra,
    // không thì không biết là DNS, chặn theo vùng, hay TLS.
    const c = e && e.cause;
    const vi = c ? [c.code, c.errno, c.syscall, c.hostname, c.message].filter(Boolean).join(' ') : '';
    return { ma: 0, loi: (e && e.name === 'AbortError') ? 'quá thời gian chờ'
      : (String(e && e.message || e) + (vi ? ' — ' + vi : '')).slice(0, 200) };
  } finally { clearTimeout(to); }
}

// Giá DNSE trả theo NGHÌN đồng (HPG 21.1 = 21.100đ) — nhân 1000 cho đồng nhất với radar
function gonLenh(ma, t) {
  const gia = (+t.matchPrice || 0) * 1000;
  const kl = +t.matchQtty || 0;
  return {
    tk: ma,
    t: Math.floor(new Date(String(t.time).replace(' ', 'T') + '+07:00').getTime() / 1000),
    ms: String(t.time).slice(11, 23),
    px: gia,
    vol: kl,
    val: gia * kl,
    dir: t.side === 'SELL' ? 'S' : 'B',     // chiều THẬT do sàn công bố
    luyKe: +t.totalVolumeTraded || 0
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,X-Dnse-Key,X-Dnse-Secret');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }

  const key = process.env.DNSE_API_KEY || String(req.headers['x-dnse-key'] || '').trim();
  const secret = process.env.DNSE_API_SECRET || String(req.headers['x-dnse-secret'] || '').trim();
  if (!key || !secret) {
    res.status(503).json({
      loi: 'Chưa có khoá DNSE', canKhoa: true,
      huongDan: 'Đặt DNSE_API_KEY và DNSE_API_SECRET trong Vercel → Settings → Environment Variables → Redeploy. '
        + 'Hoặc dán tạm vào trang (lưu trong trình duyệt này).'
    });
    return;
  }

  const q = req.query || {};
  const dsMa = String(q.ma || '').toUpperCase().split(',')
    .map(s => s.trim()).filter(s => /^[A-Z0-9]{3,8}$/.test(s)).slice(0, TOI_DA_MA);
  if (!dsMa.length) { res.status(400).json({ loi: 'Thiếu tham số ma (danh sách mã, ngăn bằng dấu phẩy)' }); return; }

  const nay = Math.floor(Date.now() / 1000);
  const den = Math.min(nay, Math.floor(+q.den || nay));
  const tu = Math.floor(+q.tu || (den - 60));
  if (!(tu > 0) || tu >= den) { res.status(400).json({ loi: 'Khoảng thời gian không hợp lệ' }); return; }
  const gioiHan = Math.min(1000, Math.max(1, Math.floor(+q.sl || 1000)));   // API chặn ở 1000

  const batDau = Date.now();
  const lenh = [];
  const loi = [];
  let dayLimit = 0;   // mã nào trả đủ 1000 = có thể còn sót, cần thu hẹp cửa sổ

  for (let i = 0; i < dsMa.length; i += LO) {
    const lo = dsMa.slice(i, i + LO);
    const kq = await Promise.all(lo.map(m =>
      goiDnse('/price/' + m + '/trades', { boardId: q.bang || 'G1', from: tu, to: den, limit: gioiHan }, key, secret)
        .then(r => ({ m, r }))));
    for (const { m, r } of kq) {
      if (r.ma === 401 || r.ma === 403) {
        res.status(r.ma).json({ loi: 'DNSE từ chối khoá này (' + r.ma + ')', canKhoa: !process.env.DNSE_API_KEY,
          chiTiet: String(r.txt || '').slice(0, 200) });
        return;
      }
      if (r.ma !== 200 || !r.j) { loi.push({ ma: m, maLoi: r.ma, vi: (r.j && r.j.message) || r.loi || '' }); continue; }
      const ds = r.j.trades || [];
      if (ds.length >= gioiHan) dayLimit++;
      for (const t of ds) lenh.push(gonLenh(m, t));
    }
  }

  lenh.sort((a, b) => a.t - b.t);
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    lenh,
    tong: lenh.length,
    soMa: dsMa.length,
    tu, den,
    giay: Math.round((Date.now() - batDau) / 100) / 10,
    // mã chạm trần 1000 nghĩa là cửa sổ đang quá rộng, còn lệnh chưa lấy hết
    chamTran: dayLimit,
    loi: loi.slice(0, 10)
  });
}
