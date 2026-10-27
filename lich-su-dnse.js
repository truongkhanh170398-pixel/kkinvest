/* Trình nạp lịch sử lệnh khớp DNSE — CHẠY TRÊN MÁY ANH, không phải trên Vercel.
 *
 * Vì sao phải chạy ở máy: DNSE chỉ cho IP Việt Nam. Máy chủ Vercel gọi
 * openapi.dnse.com.vn là timeout (đã thử cả vùng Singapore lẫn Hong Kong), còn
 * trình duyệt thì bị CORS chặn vì DNSE không trả header access-control. Máy anh
 * có IP Việt Nam nên gọi thẳng được, và Node thì không bị CORS.
 *
 * Nó làm hai việc:
 *   1. Kéo TOÀN BỘ lệnh khớp của phiên hôm nay cho cả rổ mã (phân trang đầy đủ).
 *   2. Mở một cổng nhỏ ở 127.0.0.1:8787 để trang radar lấy về và ghép vào luồng
 *      realtime — nhờ đó mở trang lúc nào cũng thấy đủ cả phiên.
 *
 * Chạy:  node lich-su-dnse.js        (hoặc bấm đúp LAY-LICH-SU-DNSE.bat)
 * Khoá:  đặt DNSE_API_KEY / DNSE_API_SECRET trong môi trường, hoặc tạo file
 *        dnse-key.txt gồm 2 dòng: dòng 1 là key, dòng 2 là secret.
 */
const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const CONG = 8787;
const GOC = 'https://openapi.dnse.com.vn';
const LO_CP = 10;        // matchQtty của DNSE tính theo LÔ 10 CỔ PHIẾU
const SONG_SONG = 12;    // số mã gọi cùng lúc
const NGUONG_MIN = 3e7;  // chỉ giữ lệnh ≥30 triệu cho nhẹ

/* ── khoá ───────────────────────────────────────────────────── */
function layKhoa() {
  let k = process.env.DNSE_API_KEY || '', s = process.env.DNSE_API_SECRET || '';
  if (!k || !s) {
    const f = path.join(__dirname, 'dnse-key.txt');
    if (fs.existsSync(f)) {
      const d = fs.readFileSync(f, 'utf8').split(/\r?\n/).map(x => x.trim()).filter(Boolean);
      k = k || d[0] || ''; s = s || d[1] || '';
    }
  }
  return { k, s };
}
const { k: KEY, s: SEC } = layKhoa();
if (!KEY || !SEC) {
  console.error('\n  Chưa có khoá DNSE.\n'
    + '  Cách 1: tạo file dnse-key.txt cạnh file này, dòng 1 là API key, dòng 2 là API secret.\n'
    + '  Cách 2: đặt biến môi trường DNSE_API_KEY và DNSE_API_SECRET.\n');
  process.exit(1);
}

/* ── ký HMAC kiểu HTTP Signatures ───────────────────────────── */
function kyHeader(method, p) {
  const date = new Date().toUTCString().replace('GMT', '+0000');
  const nonce = crypto.randomBytes(16).toString('hex');
  // nonce CÓ trong chuỗi ký nhưng KHÔNG liệt kê ở trường headers — lệch là 401
  const chuoi = ['(request-target): ' + method.toLowerCase() + ' ' + p,
                 'date: ' + date, 'nonce: ' + nonce].join('\n');
  const sig = encodeURIComponent(crypto.createHmac('sha256', SEC).update(chuoi).digest('base64'));
  return { 'x-api-key': KEY, date,
    'X-Signature': 'Signature keyId="' + KEY + '",algorithm="hmac-sha256",'
      + 'headers="(request-target) date",signature="' + sig + '",nonce="' + nonce + '"' };
}

const vnMs = s => new Date(String(s).replace(' ', 'T') + '+07:00').getTime();

/* ── lấy cả phiên của một mã, phân trang lùi ────────────────── */
async function caPhien(ma, tu, den) {
  let tat = [], moc = den, lan = 0;
  while (lan < 60) {
    lan++;
    const p = '/price/' + ma + '/trades';
    let j = null;
    try {
      const r = await fetch(GOC + p + '?' + new URLSearchParams(
        { boardId: 'G1', from: tu, to: moc, limit: 1000 }),
        { headers: kyHeader('GET', p), signal: AbortSignal.timeout(20000) });
      if (r.ok) j = await r.json();
      else if (r.status === 401 || r.status === 403) throw new Error('DNSE từ chối khoá (' + r.status + ')');
    } catch (e) {
      if (String(e.message).includes('từ chối')) throw e;
      break;
    }
    const ds = (j && j.trades) || [];
    if (!ds.length) break;
    tat = tat.concat(ds);
    // API trả 1000 lệnh GẦN NHẤT trong khoảng → lùi mốc về lệnh cũ nhất vừa nhận
    const cuNhat = Math.min(...ds.map(x => vnMs(x.time)));
    const mocMoi = Math.floor(cuNhat / 1000) - 1;
    if (ds.length < 1000 || mocMoi <= tu) break;
    moc = mocMoi;
  }
  const thay = new Set(), sach = [];
  for (const x of tat) {
    const kk = x.time + '|' + x.matchPrice + '|' + x.matchQtty + '|' + x.totalVolumeTraded;
    if (!thay.has(kk)) { thay.add(kk); sach.push(x); }
  }
  return sach;
}

/* ── rổ mã: đọc thẳng từ trang radar để luôn khớp nhau ──────── */
function layRo() {
  try {
    const t = fs.readFileSync(path.join(__dirname, 'radar-dong-tien.html'), 'utf8');
    const i = t.indexOf('const SECTORS={'), j = t.indexOf('\nconst VN30', i);
    const S = new Function('return ' + t.slice(i + 14, j).trim().replace(/;$/, ''))();
    return [...new Set(Object.values(S).flat())];
  } catch (e) {
    return ['HPG', 'SSI', 'VIX', 'MSN', 'TCB', 'MWG', 'VND', 'STB', 'SHB', 'MBB', 'VPB', 'VIC', 'VHM', 'FPT', 'VCB'];
  }
}

/* ── gom cả rổ ──────────────────────────────────────────────── */
let nho = { ngay: '', luc: 0, lenh: [], soMa: 0, tongLenh: 0 };

async function gomTatCa() {
  const d = new Date(Date.now() + 7 * 3600e3);
  const ngay = d.toISOString().slice(0, 10);
  const tu = Math.floor(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 2, 0, 0) / 1000); // 9h VN
  const den = Math.floor(Date.now() / 1000);
  const UNI = layRo();

  const ra = [];
  let tongLenh = 0, loi = 0;
  const t0 = Date.now();
  for (let i = 0; i < UNI.length; i += SONG_SONG) {
    const lo = UNI.slice(i, i + SONG_SONG);
    const kq = await Promise.all(lo.map(m =>
      caPhien(m, tu, den).then(ds => ({ m, ds })).catch(e => { loi++; return { m, ds: [], e }; })));
    for (const { m, ds } of kq) {
      tongLenh += ds.length;
      for (const x of ds) {
        const gia = (+x.matchPrice || 0) * 1000;
        const kl = (+x.matchQtty || 0) * LO_CP;
        const val = gia * kl;
        if (val < NGUONG_MIN) continue;
        ra.push({ t: Math.floor(vnMs(x.time) / 1000), tk: m, px: gia, vol: kl, val,
                  dir: x.side === 'SELL' ? 'S' : 'B' });
      }
    }
    process.stdout.write('\r  đang gom… ' + Math.min(i + SONG_SONG, UNI.length) + '/' + UNI.length
      + ' mã · ' + tongLenh.toLocaleString('vi-VN') + ' lệnh · giữ ' + ra.length);
  }
  ra.sort((a, b) => a.t - b.t);
  nho = { ngay, luc: Date.now(), lenh: ra, soMa: UNI.length, tongLenh };
  console.log('\r  xong: ' + tongLenh.toLocaleString('vi-VN') + ' lệnh cả phiên · giữ '
    + ra.length.toLocaleString('vi-VN') + ' lệnh ≥' + (NGUONG_MIN / 1e6) + ' triệu · '
    + ((Date.now() - t0) / 1000).toFixed(1) + 's' + (loi ? ' · ' + loi + ' mã lỗi' : '') + '        ');
  const n3 = ra.filter(x => x.val >= 3e9).length;
  console.log('  trong đó ' + ra.filter(x => x.val >= 1e9).length + ' lệnh ≥1 tỷ · ' + n3 + ' lệnh ≥3 tỷ');
  return nho;
}

/* ── cổng nhỏ cho trang radar gọi vào ───────────────────────── */
http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') { res.writeHead(204).end(); return; }

  const u = new URL(req.url, 'http://x');
  if (u.pathname !== '/lenh') { res.writeHead(404).end('{"loi":"chỉ có /lenh"}'); return; }

  try {
    const hnay = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
    const cuQua = Date.now() - nho.luc > 60000;        // làm mới tối đa 1 phút/lần
    if (nho.ngay !== hnay || cuQua) await gomTatCa();
    const min = Math.max(0, +u.searchParams.get('min') || 0);
    const lenh = min ? nho.lenh.filter(x => x.val >= min) : nho.lenh;
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ngay: nho.ngay, soMa: nho.soMa, tongLenh: nho.tongLenh,
      luc: nho.luc, tong: lenh.length, lenh }));
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ loi: String(e && e.message || e) }));
  }
}).listen(CONG, '127.0.0.1', async () => {
  console.log('\n  Trình nạp lịch sử DNSE đang chạy tại http://127.0.0.1:' + CONG);
  console.log('  Cứ để cửa sổ này mở, rồi vào trang Radar dòng tiền → Tick DNSE.\n');
  try { await gomTatCa(); } catch (e) { console.error('  Lỗi: ' + e.message); }
  console.log('\n  Sẵn sàng. Trang sẽ tự lấy lịch sử khi anh bấm Kết nối tick.');
});
