/* Nén mã trước khi đưa lên Vercel.
 *
 * NÓI RÕ GIỚI HẠN: mã chạy trong trình duyệt thì KHÔNG thể giấu được. Bất kỳ ai
 * mở DevTools cũng đọc được những gì trình duyệt đọc được. Nén chỉ làm mã khó
 * đọc và khó sao chép hơn — nó KHÔNG phải là bảo mật. Muốn giấu thật thì phần
 * tính toán phải chạy ở máy chủ (hàm serverless), trình duyệt chỉ nhận kết quả.
 *
 * Cách hoạt động: _nguon/ giữ bản ĐỌC ĐƯỢC và là bản gốc duy nhất. Mỗi lần chạy,
 * script đọc từ _nguon/, nén, rồi ghi đè ra thư mục gốc (bản đem deploy). Nhờ
 * thế chạy nhiều lần vẫn ra cùng kết quả, không nén chồng lên nén.
 *
 * Sửa mã thì sửa trong _nguon/ rồi chạy lại:  node nen-ma.js
 * Lấy lại bản đọc được:                        node nen-ma.js --khoiphuc
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const GOC = __dirname;
const NGUON = path.join(GOC, '_nguon');
const KHOI_PHUC = process.argv.includes('--khoiphuc');

// Chỉ nén những tệp thuộc phần định giá — đây là chỗ có logic đáng giữ.
const TEP = [
  'dinh-gia-san-xuat.html',
  'dinh-gia-chung-khoan.html',
  'valuation-terminal.html',
  'bao-cao-1trang.js'
];

function nenJS(ma) {
  // terser qua npx: không phải cài gì vào dự án, và bản 5.36.0 là bản đã đo
  return execFileSync('npx', ['--yes', 'terser@5.36.0', '--compress', '--mangle',
    '--format', 'comments=false'], { input: ma, encoding: 'utf8', shell: true, maxBuffer: 64 * 1024 * 1024 });
}

function nenHTML(html) {
  // Chỉ đụng vào <script> nội tuyến không có src. Giữ nguyên HTML và CSS: nén
  // chúng dễ làm vỡ bố cục mà chẳng giấu được gì đáng kể.
  return html.replace(/(<script(?![^>]*\bsrc=)[^>]*>)([\s\S]*?)(<\/script>)/g,
    (tat, mo, than, dong) => {
      if (!than.trim()) return tat;
      try { return mo + nenJS(than).trim() + dong; }
      catch (e) { console.log('    ⚠ giữ nguyên một khối script: ' + String(e.message).slice(0, 80)); return tat; }
    });
}

fs.mkdirSync(NGUON, { recursive: true });
let doi = 0;

for (const ten of TEP) {
  const dGoc = path.join(GOC, ten), dNguon = path.join(NGUON, ten);

  if (KHOI_PHUC) {
    if (fs.existsSync(dNguon)) { fs.copyFileSync(dNguon, dGoc); console.log('  ↩ khôi phục ' + ten); doi++; }
    continue;
  }

  // Lần đầu: bản đang có ở thư mục gốc chính là bản đọc được → cất vào _nguon/
  if (!fs.existsSync(dNguon)) {
    fs.copyFileSync(dGoc, dNguon);
    console.log('  + cất bản đọc được: _nguon/' + ten);
  }

  const truoc = fs.readFileSync(dNguon, 'utf8');
  const sau = ten.endsWith('.js') ? nenJS(truoc) : nenHTML(truoc);
  fs.writeFileSync(dGoc, sau);
  const giam = Math.round((1 - sau.length / truoc.length) * 100);
  console.log('  ✓ ' + ten.padEnd(28) + (truoc.length / 1024).toFixed(0) + ' KB → '
    + (sau.length / 1024).toFixed(0) + ' KB  (nhỏ hơn ' + giam + '%)');
  doi++;
}

console.log('\n  ' + doi + ' tệp' + (KHOI_PHUC ? ' đã khôi phục.' : ' đã nén.'));
if (!KHOI_PHUC) console.log('  Bản đọc được nằm ở _nguon/ — sửa mã thì sửa ở đó rồi chạy lại script này.');
