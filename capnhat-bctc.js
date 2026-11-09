/* Làm mới SỐ NỀN BCTC trong ba module định giá, lấy từ 24hMoney.
 *
 * Trước đây doanh thu, giá vốn, tổng tài sản, tồn kho, nợ ròng, EBITDA được gõ
 * tay vào DATA{} của từng module theo BCTC Q2/2026. EPS/BVPS thì trang tự lấy
 * live, nên càng về sau càng lệch: EPS là quý mới, doanh thu vẫn quý cũ.
 *
 * Đã đối chiếu HPG: công thức dưới đây cho ra ĐÚNG số đang gõ tay
 * (doanh thu TTM 190.644 · nợ ròng 88.748), nên thay bằng số tự lấy là an toàn.
 *
 * Chạy:  node capnhat-bctc.js --thu    → chỉ in ra cái gì sẽ đổi, không ghi
 *        node capnhat-bctc.js          → ghi vào _nguon/*.html
 * Nhớ chạy nen-ma.js sau khi ghi.
 */
const fs = require('fs');
const path = require('path');

const API = 'https://api-finance-t19.24hmoney.vn/v1/web/company/financial-report';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36';
const THU = process.argv.includes('--thu');
const MODULE = ['dinh-gia-san-xuat.html', 'dinh-gia-chung-khoan.html', 'valuation-terminal.html'];
const SONG_SONG = 6;

/* Mã dòng của 24hMoney. Dùng KHOÁ chứ không dùng tên: tên có dấu và hay đổi
   cách viết, còn khoá thì ổn định. Bảng cân đối phải gọi expanded=false mới
   tách ra dòng vay; báo cáo KQKD và lưu chuyển tiền thì ngược lại. */
const BS = { assets: 'bsa53', inv: 'bsa15', tien: 'bsa2', vayNH: 'bsa56', vayDH: 'bsa71', vcsh: 'bsa78' };
const IS = { rev: 'isa3', cogs: 'isa4', ebit: 'isa11' };
const CF = { khauHao: 'cfa2' };

const cho = ms => new Promise(r => setTimeout(r, ms));

async function bang(ma, view, expanded) {
  const u = API + '?symbol=' + ma + '&view=' + view + '&period=2&expanded=' + expanded;
  const r = await fetch(u, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(25000) });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  const d = (await r.json()).data;
  if (!d || !Array.isArray(d.rows)) throw new Error('không có dữ liệu');
  return d;
}

// cột "normal" là số thật, cột "percent" là % thay đổi — phải bỏ qua cột percent
const cotThat = d => d.headers.map((h, i) => ({ h, i })).filter(x => x.h.type === 'normal');
const layQuy = (d, key, n) => {                       // giá trị quý gần nhất
  const r = d.rows.find(x => x.key === key);
  if (!r) return null;
  const c = cotThat(d)[n || 0];
  return c ? Math.round((+r.values[c.i] || 0)) : null;
};
const layTTM = (d, key) => {                          // cộng 4 quý gần nhất
  const r = d.rows.find(x => x.key === key);
  if (!r) return null;
  const c = cotThat(d).slice(0, 4);
  if (c.length < 4) return null;
  return Math.round(c.reduce((s, x) => s + (+r.values[x.i] || 0), 0));
};

async function soNen(ma) {
  const [bs, is, cf] = await Promise.all([bang(ma, 1, 'false'), bang(ma, 2, 'true'), bang(ma, 3, 'true')]);
  const ky = cotThat(bs)[0];
  const tien = layQuy(bs, BS.tien) || 0;
  const vay = (layQuy(bs, BS.vayNH) || 0) + (layQuy(bs, BS.vayDH) || 0);
  const vcsh = layQuy(bs, BS.vcsh) || 0;
  const ebit = layTTM(is, IS.ebit);
  const kh = layTTM(cf, CF.khauHao);
  return {
    quy: ky ? 'Q' + ky.h.quarter + '/' + ky.h.year : '?',
    rev0: layTTM(is, IS.rev),
    cogs: layTTM(is, IS.cogs),
    assets: layQuy(bs, BS.assets),
    inv: layQuy(bs, BS.inv),
    netDebt: vay - tien,
    // vốn đầu tư = vốn chủ + vay; EBITDA = lãi từ hoạt động kinh doanh + khấu hao
    ic: vcsh + vay,
    ebitda: (ebit != null && kh != null) ? ebit + kh : null
  };
}

/* Thay số trong một mục DATA, giữ nguyên mọi trường khác */
function thaySo(doan, truong, giaTri) {
  const re = new RegExp('(\\b' + truong + ':)(-?[\\d.]+)');
  return re.test(doan) ? doan.replace(re, '$1' + giaTri) : doan;
}

(async () => {
  let tongDoi = 0, tongBo = 0, tongLoi = 0;
  const quyThay = {};

  for (const ten of MODULE) {
    const duong = path.join(__dirname, '_nguon', ten);
    if (!fs.existsSync(duong)) { console.log('  ✗ không thấy ' + ten); continue; }
    let t = fs.readFileSync(duong, 'utf8');

    /* CHỈ đụng vào khối const DATA={...}. Module bất động sản còn có PROJ={...}
       cũng chứa các dòng dạng MA:{...} nhưng mang nghĩa hoàn toàn khác —
       cogs ở đó là chi phí xây dựng TRIỆU ĐỒNG/M², không phải giá vốn tỷ đồng.
       Quét cả file thì sẽ ghi 393.770 tỷ vào ô 35 triệu/m² và hỏng mô hình. */
    const dau = t.indexOf('\nconst DATA={');
    if (dau < 0) { console.log('  = ' + ten + ' — không thấy khối DATA'); continue; }
    const cuoi = t.indexOf('\n};', dau);
    if (cuoi < 0) { console.log('  = ' + ten + ' — khối DATA không đóng'); continue; }
    const khoiDATA = t.slice(dau, cuoi);

    const muc = [...khoiDATA.matchAll(/^  ([A-Z]{3}):\{([^}]*)\},/gm)];
    if (!muc.length) { console.log('  = ' + ten + ' — không thấy mục DATA nào'); continue; }
    console.log('\n  ' + ten + ' — ' + muc.length + ' mã');

    for (let i = 0; i < muc.length; i += SONG_SONG) {
      const lo = muc.slice(i, i + SONG_SONG);
      const kq = await Promise.all(lo.map(m =>
        soNen(m[1]).then(s => ({ m, s })).catch(e => ({ m, e }))));
      for (const { m, s, e } of kq) {
        const ma = m[1];
        if (e) { tongLoi++; console.log('    ✗ ' + ma.padEnd(5) + String(e.message).slice(0, 60)); continue; }
        quyThay[s.quy] = (quyThay[s.quy] || 0) + 1;
        let doan = m[0], doi = [];
        /* CHỈ cập nhật những trường tái lập được CHÍNH XÁC từ báo cáo. Đã kiểm
           trên các mã còn ở Q2 (HPG, FPT, DGC, DPM): năm trường này ra đúng
           từng đồng số curator gõ tay, nên thay là an toàn.
           KHÔNG đụng ic và ebitda: công thức của tôi (vốn chủ + vay; lãi HĐKD +
           khấu hao) lệch 20–30% so với số đang có — đó là khác ĐỊNH NGHĨA chứ
           không phải khác kỳ, ghi đè vào sẽ âm thầm đổi ROIC và EV/EBITDA. */
        for (const k of ['rev0', 'cogs', 'assets', 'inv', 'netDebt']) {
          if (s[k] == null || !isFinite(s[k])) continue;
          const cu = (doan.match(new RegExp('\\b' + k + ':(-?[\\d.]+)')) || [])[1];
          if (cu == null) continue;
          if (Math.round(+cu) === s[k]) continue;
          doi.push(k + ' ' + cu + '→' + s[k]);
          doan = thaySo(doan, k, s[k]);
        }
        if (!doi.length) { tongBo++; continue; }
        tongDoi++;
        // thay trong CHÍNH khối DATA để không trúng dòng trùng tên ở bảng khác
        t = t.slice(0, dau) + t.slice(dau, cuoi).replace(m[0], doan) + t.slice(cuoi);
        console.log('    ' + (THU ? '·' : '✓') + ' ' + ma.padEnd(5) + s.quy + '  ' + doi.join(' · '));
      }
      await cho(400);
    }
    if (!THU) fs.writeFileSync(duong, t);
  }

  console.log('\n  ' + (THU ? 'SẼ đổi ' : 'đã đổi ') + tongDoi + ' mã · giữ nguyên ' + tongBo
    + (tongLoi ? ' · lỗi ' + tongLoi : ''));
  console.log('  Quý của dữ liệu: ' + Object.entries(quyThay).map(([q, n]) => q + ' (' + n + ' mã)').join(' · '));
  if (!THU) console.log('\n  Nhớ chạy:  node nen-ma.js');
})().catch(e => { console.error('\n  LỖI: ' + (e && e.message || e) + '\n'); process.exit(1); });
