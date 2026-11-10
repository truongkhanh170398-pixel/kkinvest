/* Đọc TOÀN BỘ báo cáo PDF của AAS rồi nhờ AI dựng lại thành bản tin cổ phiếu.
 *
 * Vì sao cần bước này: aas-luandiem.json chỉ lấy phần tóm tắt sẵn có trên trang
 * AAS — mấy dòng đó 24hMoney hay bản tin nào cũng có, đọc không thêm được gì.
 * Thứ đáng giá nằm trong 12 trang PDF: cơ cấu lợi nhuận, lợi nhuận cốt lõi sau
 * khi loại khoản một lần, chất lượng dòng tiền, các khoản phải thu với bên liên
 * quan. Script này bóc chữ trong PDF rồi bắt AI viết lại theo một bố cục cố định.
 *
 * Chạy:  node phan-tich-aas.js            → làm những mã chưa có
 *        node phan-tich-aas.js IDC HPG    → làm lại đúng mấy mã đó
 *        node phan-tich-aas.js --lam-lai  → làm lại tất cả
 *
 * Ra: aas-bantin.json ở thư mục gốc (trang web nạp trực tiếp).
 * AI dùng /api/chat đã deploy nên xài đúng khoá Gemini miễn phí trên Vercel,
 * không cần khoá ở máy và không phát sinh chi phí.
 */
const fs = require('fs');
const path = require('path');

const GOC_AAS = 'https://phantich.aas.com.vn/be/api/v1/equity-compass/public';
const API_CHAT = process.env.KK_API || 'https://kkinvest.vercel.app/api/chat';
const RA = path.join(__dirname, 'aas-bantin.json');
const TAM = path.join(__dirname, 'du-lieu-aas', 'pdf-text');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36';
const NGHI = +process.env.KK_NGHI || 4000;   // giãn giữa hai lần gọi AI, tránh chạm trần
                                             // miễn phí. Chạy liền 50 mã thì hay nghẽn —
                                             // đặt KK_NGHI=12000 khi chạy lại phần lỗi.

const args = process.argv.slice(2);
const LAM_LAI = args.includes('--lam-lai');
const CHI = args.filter(a => /^[A-Z]{3}$/.test(a));

const cho = ms => new Promise(r => setTimeout(r, ms));

/* ── Bóc chữ trong PDF ─────────────────────────────────────────────── */
let pdfParse = null;
function napPdfParse() {
  if (pdfParse) return pdfParse;
  for (const p of ['pdf-parse', path.join(__dirname, 'node_modules', 'pdf-parse')]) {
    try { pdfParse = require(p); return pdfParse; } catch (e) {}
  }
  throw new Error('Thiếu pdf-parse. Chạy: npm install --no-save pdf-parse@1.1.1');
}

async function chuTrongPdf(slug) {
  fs.mkdirSync(TAM, { recursive: true });
  const dich = path.join(TAM, slug + '.txt');
  if (fs.existsSync(dich)) return fs.readFileSync(dich, 'utf8');   // đã bóc rồi thì dùng lại
  const r = await fetch(GOC_AAS + '/reports/' + slug + '/pdf',
    { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(90000) });
  if (!r.ok) throw new Error('tải PDF lỗi ' + r.status);
  const d = await napPdfParse()(Buffer.from(await r.arrayBuffer()));
  const chu = String(d.text || '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  fs.writeFileSync(dich, chu);
  return chu;
}

/* ── Nhờ AI dựng bản tin ───────────────────────────────────────────── */
const YEU_CAU = `Bạn đang đọc TOÀN VĂN một báo cáo phân tích cổ phiếu, kèm theo tóm tắt các báo cáo MỚI HƠN của những công ty chứng khoán khác. Hãy viết lại thành BẢN TIN CỔ PHIẾU theo đúng bố cục dưới đây.

NGUYÊN TẮC — quan trọng hơn bố cục:
1. Chỉ dùng số liệu CÓ TRONG báo cáo. Không có thì ghi null, tuyệt đối không suy đoán.
2. Ưu tiên thứ mà bảng số không tự nói ra: cơ cấu lợi nhuận đến từ đâu, lợi nhuận CỐT LÕI sau khi loại khoản một lần, chất lượng dòng tiền, các khoản phải thu/cho vay với bên liên quan, giả định nào đang đỡ định giá.
3. Mỗi gạch đầu dòng phải có SỐ hoặc một dữ kiện kiểm chứng được. Câu chung chung kiểu "triển vọng tích cực" thì bỏ.
4. KHÔNG viết khuyến nghị mua/bán/nắm giữ dưới bất kỳ dạng nào. Mô tả hiện trạng và giả định, để người đọc tự quyết.
5. Viết tiếng Việt gọn, như người trong nghề nói với nhau. Mỗi dòng tối đa 200 ký tự.
6. Tóm tắt của công ty chứng khoán thường kèm lời gọi mua/bán — KHÔNG chép lại những chữ đó. Được phép nêu họ dự phóng bao nhiêu, điều chỉnh tăng hay giảm, và vì sao; đó là thông tin, không phải lời khuyên.
7. Khi hai nguồn lệch nhau thì nói rõ cả hai và ngày của mỗi bên, đừng tự chọn một bên.

TRẢ VỀ DUY NHẤT một đối tượng JSON, không kèm lời dẫn, không bọc trong dấu nháy ba:
{
 "mot_cau": "một câu nêu bản chất khoản đầu tư này, tối đa 170 ký tự",
 "du_an": ["2-5 dòng: doanh nghiệp này đang có DỰ ÁN hay MẢNG KINH DOANH nào. Gọi ĐÚNG TÊN từng dự án/nhà máy/khu công nghiệp, kèm quy mô (ha, m2, căn, công suất), tỷ lệ sở hữu, tiến độ pháp lý và thời điểm dự kiến ghi nhận. Không có tên dự án cụ thể thì nêu từng mảng doanh thu và tỷ trọng"],
 "du_phong": ["2-5 dòng: DỰ PHÓNG các năm tới — doanh thu, lợi nhuận từng năm, ai dự phóng và ngày nào, giả định nào đỡ con số đó, và bên nào vừa điều chỉnh tăng/giảm bao nhiêu"],
 "ket_qua": ["2-4 dòng về kết quả kinh doanh kỳ gần nhất, kèm số và % so cùng kỳ"],
 "cot_loi": ["1-3 dòng: lợi nhuận cốt lõi sau khi loại khoản một lần, và chiếm bao nhiêu phần kế hoạch"],
 "tai_chinh": ["2-4 dòng: tiền, nợ vay, dòng tiền, khoản phải thu/cho vay đáng ngờ"],
 "ho_tro": ["1-3 dòng: điều gì đang đỡ giá trị doanh nghiệp"],
 "dinh_gia": "1-2 câu: báo cáo định giá bằng phương pháp gì, ra vùng nào, dựa trên giả định nào",
 "luu_y": ["0-3 dòng: hạn chế dữ liệu, giả định mạnh, xung đột lợi ích nếu báo cáo có nêu"]
}`;

/* Tóm tắt báo cáo của các công ty chứng khoán khác, lấy từ 24hMoney.
   Chúng thường MỚI HƠN báo cáo AAS và nhắc thẳng tên dự án cùng con số dự
   phóng — đúng hai thứ mà bản tin đang thiếu. Ví dụ KDH: bản AAS là 28/09,
   còn Mirae/VDSC/BSC ra tháng 10–11 và nói rõ tiến độ dự án Gladia. */
async function tomTatCTCK(ma) {
  const u = 'https://api-finance-t19.24hmoney.vn/v1/web/announcement/report-analytics?symbol='
    + encodeURIComponent(ma) + '&per_page=8';
  try {
    const r = await fetch(u, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(15000) });
    if (!r.ok) return '';
    const ds = ((await r.json()) || {}).data;
    if (!Array.isArray(ds) || !ds.length) return '';
    const d = ds.filter(x => String(x.summary || '').trim()).slice(0, 6)
      .map(x => '· ' + (x.publish_date || '') + ' [' + (x.source || '?') + '] '
        + String(x.summary).replace(/\s+/g, ' ').slice(0, 700));
    return d.length ? '\n\nTÓM TẮT BÁO CÁO CỦA CÁC CÔNG TY CHỨNG KHOÁN KHÁC (24hMoney, mới → cũ):\n'
      + d.join('\n') : '';
  } catch (e) { return ''; }
}

async function hoiAI(chu, ma, themCTCK) {
  const r = await fetch(API_CHAT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      muc: 'sau', trang: 'Dựng bản tin ' + ma,
      boiCanh: 'TOÀN VĂN BÁO CÁO PHÂN TÍCH ' + ma + ':\n\n' + chu.slice(0, 95000) + (themCTCK || ''),
      hoiDap: [{ role: 'user', content: YEU_CAU }]
    }),
    signal: AbortSignal.timeout(180000)
  });
  if (!r.ok) throw new Error('API ' + r.status + ' ' + (await r.text()).slice(0, 120));

  // /api/chat trả SSE — gom các mảnh chữ lại
  const rd = r.body.getReader(), dec = new TextDecoder();
  let dem = '', ra = '';
  const xuLy = k => {
    for (const d of k.split('\n')) {
      if (!d.startsWith('data:')) continue;
      const p = d.slice(5).trim();
      if (!p || p === '[DONE]') continue;
      // /api/chat phát từng mẩu chữ dưới dạng {"t":"…"}; gói cuối mới có loi/xong
      try { const j = JSON.parse(p); if (j.t) ra += j.t; else if (j.loi) throw new Error(j.loi); }
      catch (e) { if (e instanceof Error && e.message && !/JSON/.test(e.message)) throw e; }
    }
  };
  for (;;) {
    const { done, value } = await rd.read();
    if (done) break;
    dem += dec.decode(value, { stream: true }).replace(/\r/g, '');
    const khoi = dem.split('\n\n'); dem = khoi.pop();
    for (const k of khoi) xuLy(k);
  }
  if (dem.trim()) xuLy(dem);

  // AI hay bọc JSON trong ```json … ``` dù đã dặn — cắt lấy phần trong ngoặc nhọn
  const i = ra.indexOf('{'), j = ra.lastIndexOf('}');
  if (i < 0 || j <= i) throw new Error('không thấy JSON trong trả lời (' + ra.length + ' ký tự)');
  return JSON.parse(ra.slice(i, j + 1));
}

/* ── Chạy ──────────────────────────────────────────────────────────── */
(async () => {
  const ds = JSON.parse(fs.readFileSync(path.join(__dirname, 'du-lieu-aas', 'bao-cao.json'), 'utf8')).items;
  // chỉ làm báo cáo viết riêng về một mã — báo cáo ngành không có bản tin theo mã
  const can = ds.filter(x => /^[A-Z]{3}$/.test(String((x.card || {}).display || '')))
    .filter(x => !CHI.length || CHI.includes(x.card.display));

  let cu = {};
  if (fs.existsSync(RA) && !LAM_LAI) { try { cu = JSON.parse(fs.readFileSync(RA, 'utf8')).ma || {}; } catch (e) {} }

  console.log('\n  ' + can.length + ' báo cáo cần xử lý' + (Object.keys(cu).length ? ' · đã có ' + Object.keys(cu).length + ' mã' : ''));
  let xong = 0, bo = 0, loi = 0;

  for (const x of can) {
    const ma = x.card.display;
    if (cu[ma] && cu[ma].ngay === x.report_date && !LAM_LAI && !CHI.includes(ma)) { bo++; continue; }
    try {
      const chu = await chuTrongPdf(x.slug);
      const b = await hoiAI(chu, ma, await tomTatCTCK(ma));
      cu[ma] = Object.assign({ ngay: x.report_date, soChu: chu.length,
        nguon: 'AAS Research', link: 'https://phantich.aas.com.vn/equity-compass/' + x.slug }, b);
      xong++;
      console.log('  ✓ ' + ma.padEnd(5) + x.report_date + ' · ' + chu.length + ' ký tự PDF · '
        + String(b.mot_cau || '').slice(0, 70));
      fs.writeFileSync(RA, JSON.stringify({ lamLuc: new Date().toISOString(),
        nguon: 'AAS Research — phantich.aas.com.vn/equity-compass', ma: cu }));
    } catch (e) {
      loi++; console.log('  ✗ ' + ma.padEnd(5) + String(e.message).slice(0, 100));
    }
    await cho(NGHI);
  }
  console.log('\n  xong ' + xong + ' · bỏ qua ' + bo + ' · lỗi ' + loi + '  →  ' + RA);
})().catch(e => { console.error('\n  LỖI: ' + (e && e.message || e) + '\n'); process.exit(1); });
