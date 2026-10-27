/* Ẩn các khối chú thích / ghi nguồn / giải thích phương pháp cho đỡ rối.
   Mặc định ẩn; nút ⓘ góc dưới trái để bật lại. Lựa chọn nhớ trong trình duyệt.

   Chỉ ẩn khối CHỮ THUẦN. Quy tắc an toàn: bỏ qua phần tử nào chứa bảng, nút,
   ô nhập, đồ thị… vì ở vài trang cùng một tên lớp lại là khung nội dung thật
   (ví dụ .note ở trang Phân tích cơ bản chính là thẻ Investment Note). */
(function () {
  if (window.__anGhiChu) return; window.__anGhiChu = true;

  var CHON = '.sub, .note, .nst, .src, #method, #filtLine, #noteSt';
  var CAM = 'table, canvas, svg, button, input, select, textarea, iframe, img';
  var K = 'an_ghi_chu';

  var css = document.createElement('style');
  css.textContent =
    'html.anGhiChu .ghiChuAn{display:none!important}' +
    '#btnGhiChu{position:fixed;left:14px;bottom:16px;z-index:9997;width:30px;height:30px;' +
      'border-radius:50%;border:1px solid #1c2740;background:#0e1525;color:#5d6b8c;' +
      'font:600 14px "Segoe UI",system-ui,sans-serif;cursor:pointer;line-height:1;padding:0;' +
      'opacity:.5;transition:opacity .15s,color .15s}' +
    '#btnGhiChu:hover{opacity:1;color:#e2b33b;border-color:#e2b33b}' +
    '@media(max-width:560px){#btnGhiChu{left:8px;bottom:8px}}';
  document.head.appendChild(css);

  function danhDau() {
    var ds = document.querySelectorAll(CHON), n = 0;
    for (var i = 0; i < ds.length; i++) {
      var e = ds[i];
      if (e.classList.contains('ghiChuAn')) { n++; continue; }
      if (e.querySelector(CAM)) continue;              // có nội dung thật bên trong → giữ
      // Thẻ Investment Note dùng lại vài tên lớp này cho nội dung thật
      if (e.closest && e.closest('#noteBox')) continue;
      // Dưới 40 ký tự thường là thông báo trạng thái ("Chưa có tin."), không
      // phải chú thích phương pháp — giữ lại cho khỏi mất ngữ cảnh.
      if ((e.textContent || '').trim().length < 40) continue;
      e.classList.add('ghiChuAn'); n++;
    }
    return n;
  }

  var an = true;
  try { an = localStorage.getItem(K) !== '0'; } catch (e) {}

  function ve() {
    document.documentElement.classList.toggle('anGhiChu', an);
    var b = document.getElementById('btnGhiChu');
    if (b) {
      b.textContent = an ? 'ⓘ' : '✕';
      b.title = an ? 'Hiện lại chú thích và ghi nguồn' : 'Ẩn chú thích cho gọn';
    }
  }

  function dung() {
    danhDau();
    if (!document.getElementById('btnGhiChu')) {
      var b = document.createElement('button');
      b.id = 'btnGhiChu';
      b.onclick = function () {
        an = !an;
        try { localStorage.setItem(K, an ? '1' : '0'); } catch (e) {}
        danhDau(); ve();
      };
      document.body.appendChild(b);
    }
    ve();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', dung);
  else dung();

  // Nhiều trang dựng nội dung sau khi tải xong (nạp mã, quét tín hiệu…) nên
  // phải quét lại, nếu không chú thích mới hiện ra sẽ không bị ẩn.
  var bo = new MutationObserver(function () { danhDau(); });
  try { bo.observe(document.body, { childList: true, subtree: true }); } catch (e) {}
})();
