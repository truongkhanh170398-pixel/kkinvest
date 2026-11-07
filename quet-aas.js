/* Quét toàn bộ bảng tin Equity Compass của AAS (phantich.aas.com.vn).
 *
 * Nguồn: https://phantich.aas.com.vn/be/api/v1/equity-compass/public/reports
 * Trang là Next.js nhưng dữ liệu nằm sau một API công khai, gọi thẳng được —
 * không cần dựng trình duyệt. Đã dò ngày 07/11/2026:
 *   · /reports            → trả về TẤT CẢ trong một lần (61 báo cáo, 146 KB).
 *                           Mọi tham số phân trang (page/size/limit/offset/all)
 *                           đều bị bỏ qua, nên không phải lặp trang.
 *   · /reports/{slug}      → KHÔNG có thêm trường nào so với mục trong danh sách.
 *   · /reports/{slug}/pdf  → bản PDF đầy đủ (~0,1–2 MB mỗi bản).
 *
 * Chạy:  node quet-aas.js          → ghi JSON + CSV vào du-lieu-aas/
 *        node quet-aas.js --pdf    → tải thêm toàn bộ file PDF
 */
const fs = require('fs');
const path = require('path');

const GOC = 'https://phantich.aas.com.vn/be/api/v1/equity-compass/public';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
  + '(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const RA = path.join(__dirname, 'du-lieu-aas');
const TAI_PDF = process.argv.includes('--pdf');

// Mã nhóm AAS dùng trong trường category
const TEN_NHOM = { DP: 'Doanh nghiệp', CN: 'Chuyên ngành', CD: 'Chuyên đề',
  VM: 'Vĩ mô', NG: 'Ngành', SK: 'Sự kiện' };
// group là khuyến nghị đã chuẩn hoá; stance là chữ tự do của người viết
const TEN_KN = { buy: 'Mua', hold: 'Nắm giữ', watch: 'Theo dõi',
  avoid: 'Tránh', group: 'Theo nhóm' };

async function goi(duong, nhiPhan) {
  const r = await fetch(GOC + duong, {
    headers: { 'User-Agent': UA, 'Accept': nhiPhan ? '*/*' : 'application/json' },
    signal: AbortSignal.timeout(60000)
  });
  if (!r.ok) throw new Error('HTTP ' + r.status + ' ở ' + duong);
  return nhiPhan ? Buffer.from(await r.arrayBuffer()) : r.json();
}

/* ── CSV ──────────────────────────────────────────────────────────
   Mỗi báo cáo một dòng. Vùng giá nằm trong card.zones theo TỪNG MÃ —
   báo cáo ngành có nhiều mã nên gom lại, ngăn bằng dấu ; để một dòng
   vẫn ứng với một báo cáo. */
const o = v => (v == null ? '' : String(v));
const oSo = v => (v == null ? '' : String(v).replace('.', ','));   // Excel tiếng Việt
const oDay = (a, i) => (Array.isArray(a) && a[i] != null ? oSo(a[i]) : '');

function dongCSV(r) {
  const c = r.card || {};
  const z = c.zones || [];
  const gom = f => z.map(f).filter(x => x !== '').join(' ; ');
  return [
    r.report_date, r.slug,
    (r.tickers || []).join(' '), c.display, c.company, c.exchange, c.sector,
    r.category, TEN_NHOM[r.category] || r.category,
    c.group, TEN_KN[c.group] || c.group, c.stance,
    oSo(c.price), c.price_date,
    gom(x => oSo(x.fair)),
    gom(x => oDay(x.buy, 0)), gom(x => oDay(x.buy, 1)),
    gom(x => oDay(x.take, 0)), gom(x => oDay(x.take, 1)),
    gom(x => o(x.buy_text)), gom(x => o(x.take_text)), gom(x => o(x.fair_text)),
    c.title, c.summary,
    (c.metrics || []).map(m => m.label + ': ' + m.value + (m.delta ? ' (' + m.delta + ')' : '')).join(' ; '),
    (c.facts || []).map(m => m.label + ': ' + m.value).join(' ; '),
    r.page_count, r.views, r.published_at, r.pdf_filename
  ];
}

/* ── Bảng thứ hai: MỘT DÒNG MỖI MÃ ───────────────────────────────
   Bảng trên là một dòng mỗi báo cáo, tiện đọc nhưng báo cáo ngành gộp tới 37 mã
   vào một ô. Bảng này trải ra theo mã để lọc/ghép với dữ liệu khác được.
   Ba nguồn theo mã trong một báo cáo, không phải lúc nào cũng có đủ:
     zones      — vùng mua / chốt lời / giá hợp lý (53 bài)
     tape       — giá và xu hướng tại thời điểm viết (47 bài)
     valuations — mức chênh so với định giá, dùng ở báo cáo ngành (7 bài)  */
const TIEU_DE_MA = ['Ngày', 'Mã bài', 'Mã CK', 'Doanh nghiệp', 'Sàn', 'Ngành',
  'Tên loại', 'Tên khuyến nghị', 'Quan điểm',
  'Giá', 'Giá hợp lý', 'Mua từ', 'Mua đến', 'Chốt lời từ', 'Chốt lời đến',
  'Ghi chú mua', 'Ghi chú chốt lời', 'Cơ sở định giá',
  'Giá theo dõi', 'Xu hướng', 'Nhận định ngắn',
  'Chênh định giá %', 'Nhãn định giá', 'Tiêu đề'];

function dongTheoMa(r) {
  const c = r.card || {};
  const chiMuc = ds => { const m = {}; for (const x of (ds || [])) if (x.ticker) m[x.ticker] = x; return m; };
  const z = chiMuc(c.zones), t = chiMuc(c.tape), v = chiMuc(c.valuations);
  // lấy hợp của mọi mã được nhắc, kể cả mã chỉ xuất hiện trong một trong ba nguồn
  const ma = [...new Set([...(r.tickers || []), ...Object.keys(z), ...Object.keys(t), ...Object.keys(v)])];
  return ma.map(k => {
    const zk = z[k] || {}, tk = t[k] || {}, vk = v[k] || {};
    return [
      r.report_date, r.slug, k,
      // tên doanh nghiệp chỉ đúng khi báo cáo viết về đúng mã đó
      c.display === k ? c.company : '', c.display === k ? c.exchange : '', c.sector,
      TEN_NHOM[r.category] || r.category, TEN_KN[c.group] || c.group, c.stance,
      oSo(zk.price != null ? zk.price : (c.display === k ? c.price : null)),
      oSo(zk.fair), oDay(zk.buy, 0), oDay(zk.buy, 1), oDay(zk.take, 0), oDay(zk.take, 1),
      o(zk.buy_text), o(zk.take_text), o(zk.fair_text),
      oSo(tk.price), o(tk.trend), o(tk.text),
      oSo(vk.value), o(vk.label), c.title
    ];
  });
}

const TIEU_DE = ['Ngày', 'Mã bài', 'Mã CK', 'Hiển thị', 'Doanh nghiệp', 'Sàn', 'Ngành',
  'Loại', 'Tên loại', 'Khuyến nghị', 'Tên khuyến nghị', 'Quan điểm',
  'Giá', 'Ngày giá', 'Giá hợp lý',
  'Mua từ', 'Mua đến', 'Chốt lời từ', 'Chốt lời đến',
  'Ghi chú mua', 'Ghi chú chốt lời', 'Cơ sở định giá',
  'Tiêu đề', 'Tóm tắt', 'Chỉ số chính', 'Dữ kiện', 'Số trang', 'Lượt xem',
  'Đăng lúc', 'Tên file PDF'];

// Excel mở CSV theo dấu phẩy sẽ vỡ với văn bản tiếng Việt có dấu phẩy —
// dùng dấu chấm phẩy và thêm dòng sep= để Excel tự hiểu.
const oCSV = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
const lamCSV = (dau, hang) => 'sep=;\r\n'
  + [dau, ...hang].map(h => h.map(oCSV).join(';')).join('\r\n');

(async () => {
  fs.mkdirSync(RA, { recursive: true });
  console.log('\n  Đang lấy danh sách báo cáo…');
  const j = await goi('/reports');
  const ds = (j.items || []).slice().sort((a, b) =>
    String(b.report_date).localeCompare(String(a.report_date)));
  if (!ds.length) throw new Error('API không trả về báo cáo nào');

  fs.writeFileSync(path.join(RA, 'bao-cao.json'),
    JSON.stringify({ nguon: GOC + '/reports', quetLuc: new Date().toISOString(),
      tong: ds.length, items: ds }, null, 1));
  fs.writeFileSync(path.join(RA, 'bao-cao.csv'),
    '﻿' + lamCSV(TIEU_DE, ds.map(dongCSV)), 'utf8');
  const theoMa = ds.flatMap(dongTheoMa);
  fs.writeFileSync(path.join(RA, 'theo-ma.csv'),
    '﻿' + lamCSV(TIEU_DE_MA, theoMa), 'utf8');

  const ngay = ds.map(x => x.report_date).sort();
  console.log('  ✓ ' + ds.length + ' báo cáo · ' + ngay[0] + ' → ' + ngay[ngay.length - 1]);

  const dem = (f) => { const m = {}; for (const x of ds) { const k = f(x); m[k] = (m[k] || 0) + 1; } return m; };
  const in1 = (ten, m) => console.log('    ' + ten.padEnd(12)
    + Object.entries(m).sort((a, b) => b[1] - a[1]).map(([a, b]) => a + ' ' + b).join(' · '));
  in1('Loại:', dem(x => TEN_NHOM[x.category] || x.category));
  in1('Khuyến nghị:', dem(x => TEN_KN[(x.card || {}).group] || '(trống)'));

  const maCK = {};
  for (const x of ds) for (const t of (x.tickers || [])) maCK[t] = (maCK[t] || 0) + 1;
  console.log('    ' + Object.keys(maCK).length + ' mã cổ phiếu được nhắc tới');

  if (TAI_PDF) {
    const thuMuc = path.join(RA, 'pdf');
    fs.mkdirSync(thuMuc, { recursive: true });
    let xong = 0, bo = 0, loi = 0;
    for (const x of ds) {
      const dich = path.join(thuMuc, x.slug + '.pdf');
      if (fs.existsSync(dich)) { bo++; continue; }
      try {
        fs.writeFileSync(dich, await goi('/reports/' + x.slug + '/pdf', true));
        xong++;
      } catch (e) { loi++; console.log('    ✗ ' + x.slug + ': ' + e.message); }
      process.stdout.write('\r    tải PDF… ' + (xong + bo + loi) + '/' + ds.length);
    }
    console.log('\r  ✓ PDF: tải mới ' + xong + ' · có sẵn ' + bo
      + (loi ? ' · lỗi ' + loi : '') + '          ');
  }

  console.log('\n  Đã ghi vào ' + RA);
  console.log('    bao-cao.json  — nguyên vẹn mọi trường');
  console.log('    bao-cao.csv   — ' + TIEU_DE.length + ' cột, một dòng mỗi báo cáo');
  console.log('    theo-ma.csv   — ' + TIEU_DE_MA.length + ' cột, một dòng mỗi MÃ ('
    + theoMa.length + ' dòng)');
  if (!TAI_PDF) console.log('\n  Muốn tải cả bản PDF thì chạy: node quet-aas.js --pdf\n');
})().catch(e => { console.error('\n  LỖI: ' + (e && e.message || e) + '\n'); process.exit(1); });
