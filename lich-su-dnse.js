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
let nho = { ngay: '', luc: 0, lenh: [], soMa: 0, tongLenh: 0, den: 0 };
let dangGom = null;   // gom đang chạy — request sau bám vào, không gom chồng

// Khoá chống trùng khi ghép phần mới vào phần cũ. Dùng đúng những trường mà
// một lệnh khớp không thể trùng nhau: thời điểm + mã + giá + khối lượng.
const khoaLenh = x => x.t + '|' + x.tk + '|' + x.px + '|' + x.vol;

async function gomTatCa() {
  const d = new Date(Date.now() + 7 * 3600e3);
  const ngay = d.toISOString().slice(0, 10);
  const moCua = Math.floor(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 2, 0, 0) / 1000); // 9h VN
  const den = Math.floor(Date.now() / 1000);
  // Lần đầu trong ngày thì quét cả phiên; những lần sau chỉ lấy PHẦN MỚI kể từ
  // mốc đã quét. Quét cả phiên mất hơn 120 giây với 329k lệnh, lấy phần mới chỉ
  // vài giây — đây là khác biệt giữa 'cổng không bao giờ trả lời' và 'tức thì'.
  const tiep = (nho.ngay === ngay && nho.den > 0);
  const tu = tiep ? Math.max(moCua, nho.den - 120) : moCua;   // lùi 2 phút cho chắc
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
  // ghép phần mới vào phần đã có, bỏ trùng ở chỗ hai lần quét chồng lên nhau
  let gop = ra;
  if (tiep) {
    const thay = new Set(nho.lenh.map(khoaLenh));
    gop = nho.lenh.concat(ra.filter(x => !thay.has(khoaLenh(x))));
    gop.sort((a, b) => a.t - b.t);
    tongLenh += nho.tongLenh;
  }
  nho = { ngay, luc: Date.now(), lenh: gop, soMa: UNI.length, tongLenh, den };
  console.log('\r  ' + (tiep ? 'cập nhật' : 'xong') + ': ' + tongLenh.toLocaleString('vi-VN')
    + ' lệnh cả phiên · giữ '
    + gop.length.toLocaleString('vi-VN') + ' lệnh ≥' + (NGUONG_MIN / 1e6) + ' triệu · '
    + ((Date.now() - t0) / 1000).toFixed(1) + 's' + (loi ? ' · ' + loi + ' mã lỗi' : '') + '        ');
  const n3 = gop.filter(x => x.val >= 3e9).length;
  console.log('  trong đó ' + gop.filter(x => x.val >= 1e9).length + ' lệnh ≥1 tỷ · ' + n3 + ' lệnh ≥3 tỷ');
  return nho;
}

/* ── máy chủ nhỏ ở 127.0.0.1: vừa phục vụ trang radar, vừa trả lịch sử ──
 *
 * Vì sao phải tự phục vụ trang: Chrome 138+ có Local Network Access — trang
 * https://kkinvest.vercel.app gọi vào http://127.0.0.1 là bị chặn thẳng
 * ("Permission was denied for this request to access the loopback address
 * space"), phải người dùng bấm cho phép mới chạy. Mở trang từ chính địa chỉ
 * nội bộ này thì hai bên cùng một nguồn gốc, không có gì để chặn.
 * Các lời gọi /api/... được đổi sang tên miền thật vì hàm serverless nằm ở đó
 * (api/dnse đã đặt Access-Control-Allow-Origin: *).
 */
const TEN_MIEN = 'https://kkinvest.vercel.app';
const KIEU = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8',
  '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.ico':'image/x-icon' };

function phucVuTep(res, ten) {
  const duong = path.join(__dirname, ten);
  // chỉ phục vụ tệp nằm trong chính thư mục này, không cho đi ngược ra ngoài
  if (!duong.startsWith(__dirname) || !fs.existsSync(duong) || !fs.statSync(duong).isFile()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Không có tệp ' + ten); return;
  }
  const duoi = path.extname(duong).toLowerCase();
  let noi = fs.readFileSync(duong);
  if (duoi === '.html' || duoi === '.js') {
    // '/api/... → 'https://kkinvest.vercel.app/api/...  (giữ nguyên dấu nháy)
    noi = Buffer.from(String(noi).replace(/(['"`])\/api\//g, '$1' + TEN_MIEN + '/api/'), 'utf8');
  }
  res.writeHead(200, { 'Content-Type': KIEU[duoi] || 'application/octet-stream' });
  res.end(noi);
}

http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Private-Network', 'true');   // cho bản Chrome cũ
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') { res.writeHead(204).end(); return; }

  const u = new URL(req.url, 'http://x');

  if (u.pathname !== '/lenh') {
    const ten = u.pathname === '/' ? 'radar-dong-tien.html' : decodeURIComponent(u.pathname.slice(1));
    phucVuTep(res, ten); return;
  }

  try {
    const hnay = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
    // Gom chỉ chạy MỘT lần tại một thời điểm: request đến giữa chừng thì bám vào
    // lần gom đang chạy. Trước đây mỗi request lại gom riêng, gom chồng lên nhau
    // nên cổng không bao giờ trả lời kịp.
    if (nho.ngay !== hnay || Date.now() - nho.luc > 15000) {
      if (!dangGom) dangGom = gomTatCa().finally(() => { dangGom = null; });
      await dangGom;
    }
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
  console.log('\n  ╔══════════════════════════════════════════════════════╗');
  console.log('  ║  MỞ TRANG RADAR Ở:  http://127.0.0.1:' + CONG + '            ║');
  console.log('  ╚══════════════════════════════════════════════════════╝');
  console.log('  Mở bằng địa chỉ này thì trang lấy được lịch sử cả phiên.');
  console.log('  Cứ để cửa sổ này chạy suốt phiên.\n');
  try { dangGom = gomTatCa(); await dangGom; } catch (e) { console.error('  Lỗi: ' + e.message); }
  finally { dangGom = null; }
  console.log('\n  Sẵn sàng.');
});
