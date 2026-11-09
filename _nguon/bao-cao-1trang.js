/* Báo cáo 1 trang A4 — điểm nhấn đầu tư.
 *
 * Thay cho cả cụm biểu đồ nến + football field + bảng DCF + bảng độ nhạy: thay
 * vì đổ 60 con số ra màn hình rồi để người đọc tự lọc, trang này CHỈ giữ những
 * con số đổi được quyết định, và nói thẳng vì sao chúng đáng chú ý.
 *
 * KHÔNG có khuyến nghị mua/bán. Trang này mô tả doanh nghiệp đang ở đâu so với
 * vùng định giá và điều gì làm vùng đó dịch chuyển — quyết định là của người đọc.
 *
 * Dùng chung cho cả 3 module định giá (sản xuất · tài chính · bất động sản).
 * Mỗi module gọi veBaoCao({...}) với tín hiệu của riêng nó; luật nào thiếu dữ
 * liệu thì tự bỏ qua, nên không cần sửa file này khi thêm module mới.
 */
(function (G) {
  'use strict';

  const so = n => (isFinite(n) ? Math.round(n).toLocaleString('vi-VN') : '—');
  const so1 = n => (isFinite(n) ? n.toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '—');
  const pc = n => (isFinite(n) ? (n >= 0 ? '+' : '') + n.toFixed(1) + '%' : '—');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ── Suy luận: từ tín hiệu số ra điểm nhấn ────────────────────────────
     Mỗi luật là một câu hỏi mà người đọc báo cáo sẽ hỏi, kèm NGƯỠNG và LÝ DO
     chọn ngưỡng đó. Luật nào không đủ dữ liệu thì trả về null và bị bỏ qua. */
  const LUAT = [

    // Câu hỏi gốc của mọi định giá: doanh nghiệp kiếm trên vốn có hơn chi phí vốn
    // không. Hơn thì tăng trưởng tạo giá trị, kém thì mở rộng càng làm mất giá trị.
    t => {
      if (!isFinite(t.roic) || !isFinite(t.wacc)) return null;
      const d = t.roic - t.wacc;
      if (d >= 3) return { loai: 'tot', y: 'Sinh lời trên vốn vượt chi phí vốn',
        vi: 'ROIC ' + so1(t.roic) + '% so với WACC ' + so1(t.wacc) + '% — chênh ' + so1(d)
          + ' điểm. Mỗi đồng tái đầu tư tạo thêm giá trị, nên tăng trưởng là thứ đáng trả tiền.' };
      if (d <= -1) return { loai: 'xau', y: 'Sinh lời trên vốn THẤP HƠN chi phí vốn',
        vi: 'ROIC ' + so1(t.roic) + '% so với WACC ' + so1(t.wacc) + '% — thiếu ' + so1(-d)
          + ' điểm. Mở rộng quy mô ở mức này làm giảm giá trị chứ không tăng; chỉ nên trả theo tài sản, đừng trả theo tăng trưởng.' };
      return { loai: 'trung', y: 'Sinh lời trên vốn chỉ ngang chi phí vốn',
        vi: 'ROIC ' + so1(t.roic) + '% so với WACC ' + so1(t.wacc)
          + '% — tăng trưởng gần như không tạo thêm giá trị, giá trị nằm ở tài sản sẵn có.' };
    },

    // DCF mà phần lớn giá trị rơi vào giá trị cuối kỳ thì thực chất là đặt cược
    // vào giả định vĩnh viễn, không phải vào 5 năm dự phóng. Phải nói ra.
    t => {
      if (!isFinite(t.tvPct)) return null;
      if (t.tvPct >= 75) return { loai: 'xau', y: 'Định giá DCF dựa gần như hoàn toàn vào giả định dài hạn',
        vi: so(t.tvPct) + '% giá trị doanh nghiệp nằm ở giá trị cuối kỳ. Dòng tiền 5 năm dự phóng chỉ chiếm '
          + so(100 - t.tvPct) + '%, nên con số DCF nhạy với g và WACC hơn là với kết quả kinh doanh sắp tới.' };
      if (t.tvPct <= 55) return { loai: 'tot', y: 'Giá trị tựa nhiều vào dòng tiền nhìn thấy được',
        vi: 'Chỉ ' + so(t.tvPct) + '% giá trị đến từ giá trị cuối kỳ — phần lớn nằm trong 5 năm dự phóng, nên DCF ở đây bớt phải tin vào giả định vĩnh viễn.' };
      return null;
    },

    // Các phương pháp lệch nhau xa nghĩa là chưa có câu trả lời, không phải có
    // nhiều câu trả lời. Người đọc cần biết điều đó trước khi nhìn giá mục tiêu.
    t => {
      if (!isFinite(t.phanTan)) return null;
      if (t.phanTan >= 60) return { loai: 'xau', y: 'Các phương pháp chưa hội tụ',
        vi: 'Khoảng cách giữa phương pháp cao nhất và thấp nhất bằng ' + so(t.phanTan)
          + '% mức giữa. Vùng định giá rộng thế này nên đọc như một dải khả năng, không phải một mức giá.' };
      if (t.phanTan <= 25) return { loai: 'tot', y: 'Các phương pháp cho kết quả gần nhau',
        vi: 'Chênh lệch giữa các phương pháp chỉ ' + so(t.phanTan) + '% — dòng tiền, bội số lợi nhuận và giá trị sổ sách cùng chỉ về một vùng.' };
      return null;
    },

    // FCF âm không xấu tuyệt đối (có thể đang đầu tư), nhưng đổi bản chất khoản
    // đầu tư: người mua đang tài trợ cho tăng trưởng chứ không nhận tiền về.
    t => {
      if (!isFinite(t.bienFcf)) return null;
      if (t.bienFcf < 0) return { loai: 'xau', y: 'Dòng tiền tự do đang âm',
        vi: 'Biên FCF năm đầu ' + so1(t.bienFcf) + '%. Doanh nghiệp tiêu tiền nhiều hơn tạo ra, nên định giá phụ thuộc vào việc vòng đầu tư này có kết quả hay không.' };
      if (t.bienFcf >= 12) return { loai: 'tot', y: 'Dòng tiền tự do dày',
        vi: 'Biên FCF năm đầu ' + so1(t.bienFcf) + '% doanh thu — đủ để tự tài trợ tăng trưởng mà không cần vay thêm hay phát hành.' };
      return null;
    },

    // Nợ ròng trên EBITDA là ngưỡng ngân hàng hay dùng; quá 3 lần thì cấu trúc
    // vốn bắt đầu chi phối kết quả nhiều hơn hoạt động kinh doanh.
    t => {
      if (!isFinite(t.noEbitda)) return null;
      if (t.noEbitda >= 3) return { loai: 'xau', y: 'Đòn bẩy cao',
        vi: 'Nợ ròng bằng ' + so1(t.noEbitda) + ' lần EBITDA. Ở mức này lãi suất và kỳ hạn nợ tác động tới vốn chủ mạnh hơn cả biên lợi nhuận.' };
      if (t.noEbitda <= 0) return { loai: 'tot', y: 'Tiền ròng, không vay ròng',
        vi: 'Doanh nghiệp còn tiền ròng sau khi trừ hết nợ vay — lãi suất tăng không làm hỏng luận điểm.' };
      return null;
    },

    // Vốn kẹt trong tồn kho là tiền không sinh lời; với doanh nghiệp sản xuất
    // đây thường là chỗ rò rỉ lớn nhất.
    t => {
      if (!isFinite(t.tonKhoNgay) || t.tonKhoNgay <= 0) return null;
      if (t.tonKhoNgay >= 120) return { loai: 'xau', y: 'Vốn kẹt ở tồn kho',
        vi: 'Hàng nằm kho trung bình ' + so(t.tonKhoNgay) + ' ngày. Mỗi vòng quay chậm là một lần vốn lưu động bị giữ lại thay vì sinh lời.' };
      if (t.tonKhoNgay <= 45) return { loai: 'tot', y: 'Tồn kho quay nhanh',
        vi: 'Hàng nằm kho ' + so(t.tonKhoNgay) + ' ngày — vốn lưu động quay nhanh, ít rủi ro giảm giá hàng tồn.' };
      return null;
    },

    // Ngân hàng / chứng khoán: ROE so với chi phí vốn chủ quyết định P/B hợp lý.
    t => {
      if (!isFinite(t.roe) || !isFinite(t.ke)) return null;
      const d = t.roe - t.ke;
      if (d >= 3) return { loai: 'tot', y: 'ROE vượt chi phí vốn chủ',
        vi: 'ROE ' + so1(t.roe) + '% so với chi phí vốn chủ ' + so1(t.ke)
          + '% — chênh ' + so1(d) + ' điểm, đây là lý do giao dịch trên giá trị sổ sách là hợp lý.' };
      if (d <= -1) return { loai: 'xau', y: 'ROE chưa bù nổi chi phí vốn chủ',
        vi: 'ROE ' + so1(t.roe) + '% so với chi phí vốn chủ ' + so1(t.ke)
          + '% — khi chưa bù được, giá trị sổ sách là trần chứ không phải sàn.' };
      return null;
    },

    // Đòn bẩy của định chế tài chính: khuếch đại cả hai chiều.
    t => {
      if (!isFinite(t.donBay)) return null;
      if (t.donBay >= 5) return { loai: 'xau', y: 'Đòn bẩy tài sản cao',
        vi: 'Tổng tài sản gấp ' + so1(t.donBay) + ' lần vốn chủ. Một biến động nhỏ ở chất lượng tài sản cũng ăn thẳng vào vốn chủ.' };
      return null;
    },

    /* Ba luật dưới đây LUÔN có dữ liệu, để mục Điểm nhấn không bao giờ trống.
       Chúng không phán xét tốt/xấu, chỉ đặt con số vào đúng ngữ cảnh — thứ mà
       một bảng số thô không tự nói ra được. */

    // Giá đang nằm đâu trong dải các phương pháp. Đây là dữ kiện, không phải lời
    // khuyên: nói vị trí, không nói nên làm gì.
    t => {
      if (!isFinite(t.viTriGia) || !isFinite(t.ppThap) || !isFinite(t.ppCao)) return null;
      const v = t.viTriGia;
      if (v < 0) return { loai: 'trung', y: 'Giá đang nằm dưới mọi phương pháp định giá',
        vi: 'Dải các phương pháp chạy từ ' + so(t.ppThap) + ' đến ' + so(t.ppCao)
          + ' đ, giá hiện tại nằm dưới cả mức thấp nhất. Hoặc thị trường thấy rủi ro mà mô hình chưa tính, hoặc giả định đầu vào đang lạc quan.' };
      if (v > 100) return { loai: 'trung', y: 'Giá đang cao hơn mọi phương pháp định giá',
        vi: 'Dải các phương pháp chạy từ ' + so(t.ppThap) + ' đến ' + so(t.ppCao)
          + ' đ, giá hiện tại vượt cả mức cao nhất — phần vượt là kỳ vọng chưa nằm trong giả định nào.' };
      return { loai: 'trung', y: 'Giá nằm trong dải định giá, ở mức ' + so(v) + '% từ đáy dải',
        vi: 'Dải chạy từ ' + so(t.ppThap) + ' đến ' + so(t.ppCao) + ' đ. '
          + (v <= 35 ? 'Giá nghiêng về phía thấp của dải.'
            : v >= 65 ? 'Giá nghiêng về phía cao của dải.'
            : 'Giá nằm gần giữa dải, các phương pháp chưa chỉ về một phía rõ rệt.') };
    },

    // Giá trị đến từ đâu: dòng tiền nhìn thấy được hay giả định vĩnh viễn.
    t => {
      if (!isFinite(t.tvPct) || t.tvPct > 75 || t.tvPct < 55) return null;   // hai đầu đã có luật riêng
      return { loai: 'trung', y: 'Giá trị chia đôi giữa dự phóng và giả định dài hạn',
        vi: so(100 - t.tvPct) + '% giá trị doanh nghiệp đến từ dòng tiền 5 năm dự phóng, '
          + so(t.tvPct) + '% từ giá trị cuối kỳ — tỷ lệ thường gặp, nhưng vẫn có nghĩa là một nửa luận điểm nằm ngoài tầm nhìn dự phóng.' };
    },

    // Quy mô sinh lời, gắn với đòn bẩy vận hành: 1 điểm biên đổi bao nhiêu tiền.
    t => {
      if (!isFinite(t.doanhThu) || !isFinite(t.bienEbit) || t.doanhThu <= 0) return null;
      return { loai: 'trung', y: 'Mỗi điểm biên EBIT đáng ' + so(t.doanhThu / 100) + ' tỷ lợi nhuận',
        vi: 'Doanh thu ' + so(t.doanhThu) + ' tỷ, biên EBIT ' + so1(t.bienEbit) + '% cho ra '
          + so(t.doanhThu * t.bienEbit / 100) + ' tỷ EBIT. Nền doanh thu lớn nên định giá nhạy với biên hơn là với tăng trưởng doanh thu.' };
    }
  ];

  /* ── Catalyst: sự kiện THẬT, không phải độ nhạy ───────────────────────
     Bảng "đổi giả định thì giá đổi bao nhiêu" là ĐỘ NHẠY, không phải catalyst.
     Catalyst là việc có thể xảy ra ngoài đời rồi kéo định giá đi. Lấy từ công
     bố thông tin của chính doanh nghiệp (24hMoney) rồi LỌC: chỉ giữ tin rơi vào
     một nhóm có khả năng đổi dòng tiền hoặc cấu trúc vốn; thủ tục hành chính
     (thay đổi đăng ký niêm yết, giấy chứng nhận ĐKDN…) không khớp nhóm nào nên
     tự rụng. Lọc bằng cách giữ-khi-khớp chứ không liệt kê danh sách rác, vì
     danh sách rác thì không bao giờ kể hết được. */
  const NHOM = [
    { ten: 'Kết quả kinh doanh', uu: 1, tu: /báo cáo tài chính|kết quả kinh doanh|giải trình.*lợi nhuận|doanh thu/i },
    { ten: 'Dự án · pháp lý',    uu: 1, tu: /dự án|khởi công|bàn giao|chấp thuận|giấy phép|quy hoạch|chủ trương đầu tư|giao đất|đấu giá/i },
    { ten: 'Huy động vốn',       uu: 2, tu: /phát hành|chào bán|tăng vốn|trái phiếu|đợt phát hành|vay hợp vốn/i },
    { ten: 'Cổ tức',             uu: 2, tu: /cổ tức|tạm ứng|chi trả.*tiền|ngày đăng ký cuối cùng/i },
    { ten: 'Giao dịch vốn',      uu: 2, tu: /thoái vốn|chuyển nhượng|mua lại|sáp nhập|góp vốn|công ty con|công ty liên kết/i },
    { ten: 'Cổ đông',            uu: 3, tu: /cổ đông lớn|người nội bộ|đăng ký (mua|bán)|giao dịch cổ phiếu/i },
    { ten: 'Quản trị',           uu: 4, tu: /nghị quyết|đại hội|đhđcđ|bổ nhiệm|miễn nhiệm|điều lệ/i }
  ];

  /* Vài tin thủ tục có chữ trùng với nhóm thật — "Quyết định về việc CHẤP THUẬN
     thay đổi đăng ký niêm yết cổ phiếu" lọt vào nhóm Dự án · pháp lý chỉ vì hai
     chữ "chấp thuận". Chặn nhóm thủ tục trước khi phân loại. */
  const THU_TUC = /niêm yết|đăng ký (doanh nghiệp|chứng khoán|giao dịch)|lưu ký|mã số thuế|giấy chứng nhận đăng ký/i;

  function phanNhom(tieu) {
    if (THU_TUC.test(tieu)) return null;
    for (const n of NHOM) if (n.tu.test(tieu)) return n;
    return null;
  }

  async function layTin(ma) {
    const u = 'https://api-finance-t19.24hmoney.vn/v1/web/announcement?symbol=' + encodeURIComponent(ma) + '&per_page=50';
    // thử gọi thẳng trước, không được thì qua proxy của trang — y như các module
    for (const p of [u, '/api/proxy?url=' + encodeURIComponent(u)]) {
      try {
        const r = await fetch(p, { cache: 'no-store', signal: AbortSignal.timeout(9000) });
        if (!r.ok) continue;
        const j = await r.json();
        const ds = j && j.data && (j.data.data || j.data);
        if (Array.isArray(ds) && ds.length) return ds;
      } catch (e) {}
    }
    return [];
  }

  function locTin(ds, ma) {
    const ra = [], daCo = new Set();
    for (const x of ds) {
      const tieu = String(x.title || '').replace(new RegExp('^' + ma + '\\s*[:：-]\\s*', 'i'), '').trim();
      if (!tieu) continue;
      const n = phanNhom(tieu);
      if (!n) continue;                               // không khớp nhóm nào → thủ tục, bỏ
      const t = +x.published_date || 0;
      const ngay = t ? new Date(t * 1000) : null;
      // cùng nhóm trong cùng một ngày thì chỉ giữ một (BCTC riêng lẻ + hợp nhất…)
      const khoa = n.ten + '|' + (ngay ? ngay.toISOString().slice(0, 10) : '');
      if (daCo.has(khoa)) continue;
      daCo.add(khoa);
      ra.push({ nhom: n.ten, uu: n.uu, t: t, tieu: tieu,
        ngay: ngay ? ngay.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) : '' });
    }
    ra.sort((a, b) => a.uu - b.uu || b.t - a.t);

    /* Lấy thẳng 5 cái đầu thì doanh nghiệp nào cũng ra 5 dòng "Báo cáo tài
       chính" — đúng nhóm nhưng vô dụng, vì BCTC quý nào cũng có. Vòng một chỉ
       lấy MỖI NHÓM MỘT tin để thấy được các loại sự kiện khác nhau, còn chỗ
       trống thì vòng hai mới lấp bằng tin mới tiếp theo. */
    const chon = [], daNhom = new Set();
    for (const x of ra) if (!daNhom.has(x.nhom)) { daNhom.add(x.nhom); chon.push(x); }
    for (const x of ra) { if (chon.length >= 5) break; if (!chon.includes(x)) chon.push(x); }
    const out = chon.slice(0, 5);

    /* Một mốc NHÌN VỀ PHÍA TRƯỚC: công bố thông tin chỉ kể chuyện đã xảy ra,
       trong khi thứ đáng canh là kỳ báo cáo tới. Suy từ lần ra BCTC gần nhất
       cộng một quý — không phải lịch chính thức, nên ghi rõ là "dự kiến". */
    const bctc = ra.filter(x => x.nhom === 'Kết quả kinh doanh' && x.t).sort((a, b) => b.t - a.t)[0];
    if (bctc) {
      const d = new Date(bctc.t * 1000); d.setMonth(d.getMonth() + 3);
      if (d.getTime() > Date.now())
        out.unshift({ nhom: 'Sắp tới', tieu: 'Kỳ báo cáo tài chính tiếp theo (dự kiến, suy từ lần gần nhất)',
          ngay: d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }), toi: true });
    }
    return out.slice(0, 5);
  }

  /* ── Luận điểm từ báo cáo phân tích ───────────────────────────────────
     Chỉ số nói doanh nghiệp LÃI bao nhiêu, không nói lãi TỪ ĐÂU. "Hàng tồn kho
     8.164 tỷ, gần như toàn bộ là chi phí dở dang KCN (Hựu Thạnh 2.973, Tân
     Phước 1 1.405)" — loại câu đó phải lấy từ người đã đọc thuyết minh báo cáo
     tài chính, mô hình định giá không tự sinh ra được.
     Nguồn: AAS Research (phantich.aas.com.vn/equity-compass), quét bằng
     quet-aas.js ra aas-luandiem.json. Luôn dẫn nguồn và ngày báo cáo kèm theo
     vì đây là nhận định của bên thứ ba, không phải của trang này. */
  /* recalc() chạy nhiều lần cho một mã (một lần khi nạp, một lần nữa sau khi
     24hMoney trả số liệu), mỗi lần vẽ đè cả khối nên #bcLD / #bcCat bị thay
     mới. Phần tải về của lần vẽ CŨ sẽ rơi vào node đã gỡ khỏi trang, còn chữ
     "đang lấy…" của lần vẽ MỚI thì nằm lại vĩnh viễn — đúng cái thấy ở IDC.
     Đánh số mỗi lần vẽ, tải xong thì đối chiếu, lệch số là bỏ. */
  let luotVe = 0;
  let nhoAAS = null;
  async function layAAS(ma) {
    if (!ma) return null;
    if (!nhoAAS) {
      nhoAAS = fetch('aas-luandiem.json', { cache: 'force-cache' })
        .then(r => r.ok ? r.json() : null).catch(() => null);
    }
    const j = await nhoAAS;
    return (j && j.ma && j.ma[ma]) || null;
  }

  // Báo cáo của các công ty chứng khoán khác, lấy tiêu đề để thấy bên ngoài
  // đang nhìn mã này theo hướng nào.
  async function layCTCK(ma) {
    const u = 'https://api-finance-t19.24hmoney.vn/v1/web/announcement/report-analytics?symbol='
      + encodeURIComponent(ma) + '&per_page=6';
    for (const p of [u, '/api/proxy?url=' + encodeURIComponent(u)]) {
      try {
        const r = await fetch(p, { cache: 'no-store', signal: AbortSignal.timeout(9000) });
        if (!r.ok) continue;
        const j = await r.json();
        const ds = j && j.data && (j.data.data || j.data);
        if (Array.isArray(ds) && ds.length) return ds;
      } catch (e) {}
    }
    return [];
  }

  const ngayVN = s => { const d = new Date(s); return isNaN(d) ? String(s || '')
    : d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }); };

  async function napLuanDiem(ma, el, luot) {
    const [a, ck] = await Promise.all([layAAS(ma), ma ? layCTCK(ma) : []]);
    if (luot !== luotVe) return;              // đã có lần vẽ mới hơn
    const o = el.querySelector('#bcLD');    // phải lấy SAU await
    if (!o) return;
    let h = '';

    if (a) {
      h += '<div class="bcY"><span class="bcCham"></span><div><b>' + esc(a.tieuDe) + '</b>'
        + (a.phu ? ' <i>(báo cáo ngành, không viết riêng cho ' + esc(ma) + ')</i>' : '')
        + '</div></div>';
      if (a.facts && a.facts.length)
        h += '<table class="bcBang bcFact"><tbody>' + a.facts.slice(0, 5).map(f =>
          '<tr><td><b>' + esc(f.l) + '</b></td><td class="bcFv">' + esc(f.v) + '</td></tr>').join('')
          + '</tbody></table>';
      h += '<div class="bcPhu" style="margin-top:3px">Nguồn: <b>' + esc(a.nguon) + '</b> · '
        + esc(ngayVN(a.ngay)) + ' · <a href="' + esc(a.link) + '" target="_blank" rel="noopener">bài gốc</a></div>';
    }

    /* Bỏ các tiêu đề chỉ là lời gọi mua/bán. Trang này đã bỏ khuyến nghị của
       chính nó thì không thể mượn lời khuyến nghị của bên khác để nói hộ —
       dẫn ba dòng "Khuyến nghị MUA giá mục tiêu 26.500" thì khác gì tự khuyến
       nghị. Chỉ giữ tiêu đề mang nội dung phân tích. */
    const daThay = new Set();
    const ckSach = ck.filter(x => {
      const s = String(x.title || '');
      if (/khuyến\s*nghị|mục\s*tiêu|khả\s*quan|trung\s*lập|tích\s*cực|kém\s*khả\s*quan/i.test(s)) return false;
      const k = s.replace(/\s+/g, ' ').trim().toLowerCase();   // cùng một tiêu đề thì chỉ giữ một
      if (daThay.has(k)) return false;
      daThay.add(k); return true;
    });
    if (ckSach.length) {
      const d = ckSach.slice(0, 3).map(x => {
        const t = String(x.title || '').replace(/\s+/g, ' ').slice(0, 88);
        const n = x.published_date ? new Date(x.published_date * 1000)
          .toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) : '';
        return '<tr><td>' + esc(t) + '</td><td>' + esc(n) + '</td></tr>';
      }).join('');
      h += '<div class="bcPhu" style="margin-top:6px;font-weight:700">Báo cáo công ty chứng khoán gần đây</div>'
        + '<table class="bcBang"><tbody>' + d + '</tbody></table>';
    }

    if (!h) return;            // không có gì thì giữ nguyên phần luận điểm tự tính
    o.innerHTML = h;
    o.previousElementSibling.textContent = 'Luận điểm đầu tư';
  }

  async function napCatalyst(ma, el, luot) {
    if (!ma) return;
    const ds = locTin(await layTin(ma), ma);
    if (luot !== luotVe) return;
    const o = el.querySelector('#bcCat');
    if (!o) return;
    if (!ds.length) {
      o.innerHTML = '<tr><td>Không có công bố nào thuộc nhóm có thể đổi định giá trong kỳ gần đây</td><td>—</td></tr>';
      return;
    }
    o.innerHTML = ds.map(x => '<tr' + (x.toi ? ' class="bcToi"' : '') + '><td><b>' + esc(x.nhom)
      + '</b> · ' + esc(x.tieu.slice(0, 92)) + '</td><td>' + esc(x.ngay) + '</td></tr>').join('');
  }

  /* ── Luận điểm đầu tư ─────────────────────────────────────────────────
     Một câu, ghép từ ba phần: mặt mạnh nhất · mặt yếu nhất · giá đang ở đâu so
     với vùng định giá. Nhắc lại tên một chỉ số thì KHÔNG phải luận điểm — luận
     điểm là nói giá trị của doanh nghiệp nằm ở đâu và điều gì đang cản nó.
     Vẫn không có chữ nên mua hay nên bán. */
  function luanDiem(t, d) {
    const manh = [
      [isFinite(t.roic) && isFinite(t.wacc) && t.roic - t.wacc >= 3, 'sinh lời trên vốn vượt chi phí vốn'],
      [isFinite(t.roe) && isFinite(t.ke) && t.roe - t.ke >= 3, 'ROE vượt chi phí vốn chủ'],
      [isFinite(t.bienFcf) && t.bienFcf >= 12, 'dòng tiền tự do dày'],
      [isFinite(t.noEbitda) && t.noEbitda <= 0, 'không vay ròng'],
      [isFinite(t.tonKhoNgay) && t.tonKhoNgay > 0 && t.tonKhoNgay <= 45, 'tồn kho quay nhanh'],
      [isFinite(t.phanTan) && t.phanTan <= 25, 'các phương pháp định giá hội tụ']
    ].filter(x => x[0]).map(x => x[1]);

    const yeu = [
      [isFinite(t.roic) && isFinite(t.wacc) && t.roic - t.wacc <= -1, 'sinh lời trên vốn chưa bù nổi chi phí vốn'],
      [isFinite(t.roe) && isFinite(t.ke) && t.roe - t.ke <= -1, 'ROE chưa bù nổi chi phí vốn chủ'],
      [isFinite(t.bienFcf) && t.bienFcf < 0, 'dòng tiền tự do đang âm'],
      [isFinite(t.noEbitda) && t.noEbitda >= 3, 'đòn bẩy cao'],
      [isFinite(t.donBay) && t.donBay >= 5, 'đòn bẩy tài sản cao'],
      [isFinite(t.tvPct) && t.tvPct >= 75, 'phần lớn giá trị nằm ở giả định dài hạn'],
      [isFinite(t.tonKhoNgay) && t.tonKhoNgay >= 120, 'vốn kẹt ở tồn kho'],
      [isFinite(t.phanTan) && t.phanTan >= 60, 'các phương pháp định giá chưa hội tụ']
    ].filter(x => x[0]).map(x => x[1]);

    let viTri = '';
    if (isFinite(t.viTriGia)) {
      viTri = t.viTriGia < 0 ? 'giá đang nằm dưới mọi phương pháp định giá'
        : t.viTriGia > 100 ? 'giá đang cao hơn mọi phương pháp định giá'
        : t.viTriGia <= 35 ? 'giá nằm ở phần thấp của vùng định giá'
        : t.viTriGia >= 65 ? 'giá nằm ở phần cao của vùng định giá'
        : 'giá nằm quanh giữa vùng định giá';
    }

    // Hai mặt cùng có thì phải nói cả hai — bỏ một bên là làm người đọc lệch.
    const hai = m => m.slice(0, 2).join(' và ');
    let cau;
    if (manh.length && yeu.length) cau = hoa(hai(manh)) + ', nhưng ' + hai(yeu);
    else if (manh.length) cau = hoa(hai(manh));
    else if (yeu.length) cau = hoa(hai(yeu));
    else cau = 'Chưa có tín hiệu nào vượt ngưỡng ở cả hai phía';
    return cau + (viTri ? ' — ' + viTri : '') + '.';
  }
  const hoa = s => s.charAt(0).toUpperCase() + s.slice(1);

  /* ── Thanh vùng định giá ──────────────────────────────────────────────
     Thay cho football field: một dải duy nhất, có vạch từng phương pháp, mức
     tổng hợp và vị trí giá hiện tại. Mục đích là thấy giá đang nằm đâu trong
     dải, không phải đọc chính xác từng con số. */
  function veDai(pp, gia, mucTieu) {
    const mid = pp.map(p => p.mid).filter(v => isFinite(v) && v > 0);
    if (!mid.length) return '';
    const lo = Math.min(...mid, gia || Infinity), hi = Math.max(...mid, gia || 0);
    if (!(hi > lo)) return '';
    const dem = 0.08 * (hi - lo), t0 = lo - dem, t1 = hi + dem;
    const vt = v => ((v - t0) / (t1 - t0) * 100).toFixed(2);
    const vach = pp.filter(p => isFinite(p.mid) && p.mid > 0).map(p =>
      '<div class="bcV" style="left:' + vt(p.mid) + '%"><i></i><u>' + esc(p.n) + '</u></div>').join('');
    const dMin = Math.min(...mid), dMax = Math.max(...mid);
    // Hai mốc sát nhau thì hai nhãn đè lên nhau, không đọc được chữ nào — thấy ở
    // IDC: "Giá nay 34.600" chồng lên "Tổng hợp 37.003". Hạ nhãn giá xuống dòng dưới.
    const gan = isFinite(gia) && isFinite(mucTieu) && mucTieu > 0
      && Math.abs(vt(gia) - vt(mucTieu)) < 14;
    return '<div class="bcDai">'
      + '<div class="bcNen"></div>'
      + '<div class="bcVung" style="left:' + vt(dMin) + '%;width:' + (vt(dMax) - vt(dMin)) + '%"></div>'
      + vach
      + (isFinite(mucTieu) && mucTieu > 0 ? '<div class="bcMuc" style="left:' + vt(mucTieu) + '%"><i></i><u>Tổng hợp ' + so(mucTieu) + '</u></div>' : '')
      + (isFinite(gia) && gia > 0 ? '<div class="bcGia' + (gan ? ' bcXa' : '')
          + '" style="left:' + vt(gia) + '%"><i></i><u>Giá nay ' + so(gia) + '</u></div>' : '')
      + '</div>'
      + '<div class="bcTruc"><span>' + so(t0) + '</span><span>' + so(t1) + ' đ</span></div>';
  }

  const CSS = `
  .bcWrap{--bcN:#0d1424;--bcC:#121b2e;--bcL:#223050;--bcT:#e8edf7;--bcM:#8094b8;
    --bcV:#e2b33b;--bcX:#4f8cff;--bcU:#26c281;--bcD:#f0556b;
    background:var(--bcN);color:var(--bcT);border:1px solid var(--bcL);border-radius:12px;
    width:100%;max-width:820px;margin:0 auto;padding:16px 18px 14px;
    font:400 12px/1.45 "Segoe UI",system-ui,Roboto,Arial,sans-serif}
  .bcWrap *{box-sizing:border-box}
  .bcDau{display:flex;align-items:flex-start;gap:12px;border-bottom:1px solid var(--bcL);padding-bottom:9px}
  .bcMa{font-size:27px;font-weight:800;letter-spacing:-.5px;line-height:1}
  .bcTen{font-size:12.5px;font-weight:700}
  .bcPhu{color:var(--bcM);font-size:10.5px;margin-top:2px}
  .bcGiaN{margin-left:auto;text-align:right;flex:none}
  .bcGiaN b{font-size:20px;font-weight:800;display:block;line-height:1.1}
  .bcLuan{font-size:13.5px;font-weight:700;line-height:1.4;margin:10px 0 2px}
  .bcChiSo{display:grid;grid-template-columns:repeat(auto-fit,minmax(104px,1fr));gap:6px;margin:9px 0}
  .bcO{background:var(--bcC);border:1px solid var(--bcL);border-radius:8px;padding:6px 9px}
  .bcO.hl{border-color:rgba(226,179,59,.55);background:rgba(226,179,59,.07)}
  .bcO.tot .v{color:var(--bcU)}.bcO.xau .v{color:var(--bcD)}
  .bcO .l{color:var(--bcM);font-size:9.5px;text-transform:uppercase;letter-spacing:.4px}
  .bcO .v{font-size:15px;font-weight:800;margin-top:1px}
  .bcMuc2{color:var(--bcV);font-weight:800;font-size:10.5px;letter-spacing:1.1px;
    text-transform:uppercase;margin:11px 0 5px;display:flex;align-items:center;gap:7px}
  .bcMuc2:after{content:"";flex:1;height:1px;background:var(--bcL)}
  .bcY{display:flex;gap:8px;margin-bottom:6px;align-items:flex-start}
  .bcCham{width:6px;height:6px;border-radius:50%;margin-top:5px;flex:none;background:var(--bcM)}
  .bcY.tot .bcCham{background:var(--bcU)}.bcY.xau .bcCham{background:var(--bcD)}
  .bcY b{font-weight:700}
  .bcY span{color:#c3cfe4}
  .bcDai{position:relative;height:30px;margin:17px 0 2px}
  .bcNen{position:absolute;top:13px;left:0;right:0;height:4px;border-radius:2px;background:#1b2740}
  .bcVung{position:absolute;top:11px;height:8px;border-radius:4px;
    background:linear-gradient(90deg,rgba(226,179,59,.35),rgba(226,179,59,.75))}
  .bcV,.bcMuc,.bcGia{position:absolute;top:0;transform:translateX(-50%);text-align:center;white-space:nowrap}
  .bcV i{display:block;width:1px;height:11px;margin:7px auto 0;background:#66789c}
  .bcV u{display:block;text-decoration:none;color:var(--bcM);font-size:8.5px;margin-top:1px}
  .bcMuc i{display:block;width:2px;height:20px;margin:5px auto 0;background:var(--bcV)}
  .bcMuc u{display:block;text-decoration:none;color:var(--bcV);font-size:9px;font-weight:800}
  .bcGia i{display:block;width:2px;height:20px;margin:5px auto 0;background:var(--bcX)}
  .bcGia u{display:block;text-decoration:none;color:var(--bcX);font-size:9px;font-weight:800}
  .bcGia.bcXa i{height:31px}.bcGia.bcXa u{margin-top:0}   /* tránh đè nhãn Tổng hợp */
  .bcTruc{display:flex;justify-content:space-between;color:var(--bcM);font-size:9px;margin-top:13px}
  .bcHai{display:grid;grid-template-columns:1fr 1fr;gap:14px}
  .bcBang{width:100%;border-collapse:collapse;font-size:11px}
  .bcBang td{padding:3px 0;border-bottom:1px dotted #1e2a44;vertical-align:top}
  .bcBang td:last-child{text-align:right;font-weight:700;white-space:nowrap;padding-left:8px}
  .bcFact td{padding:2px 0}
  .bcFact td:first-child{width:38%;color:var(--bcM)}
  .bcFv{text-align:left!important;font-weight:400!important;white-space:normal!important;color:#c3cfe4}
  .bcWrap a{color:var(--bcX);text-decoration:none}
  .bcBang tr.bcToi td{color:var(--bcV)}   /* mốc nhìn về phía trước */
  .bcChan{color:var(--bcM);font-size:9.5px;line-height:1.5;border-top:1px solid var(--bcL);margin-top:11px;padding-top:8px}

  @media print{
    @page{size:A4 portrait;margin:9mm}
    html,body{background:#fff!important}
    /* In CHỈ tờ báo cáo. Ẩn theo display:none sẽ ẩn luôn cả tổ tiên của nó nên
       trang in ra trắng — dùng visibility rồi bật lại đúng nhánh báo cáo. */
    body *{visibility:hidden!important}
    /* Khối chi tiết cũ của module BĐS nằm ngoài màn hình bằng position:absolute —
       visibility:hidden vẫn để nó CHIẾM CHỖ nên trang in phình ra 4 tờ. Phải
       display:none hẳn thì mới gọn lại đúng một tờ. */
    [aria-hidden="true"]{display:none!important}
    #baoCao1T,#baoCao1T *{visibility:visible!important}
    #baoCao1T{position:absolute!important;left:0;top:0;width:100%;margin:0}
    .bcWrap{max-width:none;width:100%;border:none;border-radius:0;padding:0;
      background:#fff;color:#111;font-size:10.5px}
    .bcWrap{--bcN:#fff;--bcC:#f6f8fc;--bcL:#ccd6e6;--bcT:#111;--bcM:#5a6b88}
    .bcNen{background:#e3e9f3}.bcY span{color:#333}
    .bcWrap,.bcWrap *{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  }`;

  function napCSS() {
    if (document.getElementById('bcCSS')) return;
    const s = document.createElement('style');
    s.id = 'bcCSS'; s.textContent = CSS;
    document.head.appendChild(s);
  }

  /* ── Vẽ ──────────────────────────────────────────────────────────── */
  G.veBaoCao = function (d) {
    napCSS();
    const el = typeof d.hop === 'string' ? document.getElementById(d.hop) : d.hop;
    if (!el) return;
    const t = Object.assign({}, d.tin || {});

    // Tín hiệu suy ra được từ chính dữ liệu đã truyền vào — tính ở đây để mọi
    // module đều có, khỏi phải lặp lại ở từng nơi gọi.
    const mids = (d.phuongPhap || []).map(p => p.mid).filter(v => isFinite(v) && v > 0);
    if (mids.length) {
      t.ppThap = Math.min(...mids); t.ppCao = Math.max(...mids);
      if (isFinite(d.gia) && d.gia > 0 && t.ppCao > t.ppThap)
        t.viTriGia = (d.gia - t.ppThap) / (t.ppCao - t.ppThap) * 100;
      /* Độ phân tán PHẢI tính trên đúng những phương pháp được VẼ, không phải
         trên tập dùng để lấy trung bình. Trước đây module tài chính truyền vào
         độ phân tán của 2 phương pháp vào blend (P/B, P/E) trong khi dải lại vẽ
         thêm Justified P/B — trang in ra câu "các phương pháp chỉ lệch 6%" ngay
         trên một cái dải chạy từ 7.449 đến 24.767 đ. Tính ở đây thì hai bên
         không thể nói ngược nhau được nữa. */
      const sx = mids.slice().sort((x, y) => x - y);
      const med = sx.length % 2 ? sx[(sx.length - 1) / 2] : (sx[sx.length / 2 - 1] + sx[sx.length / 2]) / 2;
      t.phanTan = (sx.length > 1 && med) ? (sx[sx.length - 1] - sx[0]) / med * 100 : NaN;
    } else t.phanTan = NaN;

    const y = LUAT.map(f => { try { return f(t); } catch (e) { return null; } }).filter(Boolean);
    const nhan = y.filter(x => x.loai !== 'xau').slice(0, 3);
    const soi = y.filter(x => x.loai === 'xau').slice(0, 3);
    // không có gì đáng cảnh báo thì vẫn phải có mục, nói rõ là không có
    const bay = a => a.length
      ? a.map(x => '<div class="bcY ' + x.loai + '"><span class="bcCham"></span><div><b>'
          + esc(x.y) + '.</b> <span>' + esc(x.vi) + '</span></div></div>').join('')
      : '<div class="bcY"><span class="bcCham"></span><div><span>Không có tín hiệu nào vượt ngưỡng ở nhóm này.</span></div></div>';

    const cauLuan = luanDiem(t, d);
    const viTri = (isFinite(d.gia) && isFinite(d.mucTieu) && d.gia > 0)
      ? (d.mucTieu - d.gia) / d.gia * 100 : NaN;

    el.innerHTML = '<div class="bcWrap">'
      + '<div class="bcDau">'
        + '<div><div class="bcMa">' + esc(d.ma || '—') + '</div></div>'
        + '<div style="padding-top:2px"><div class="bcTen">' + esc(d.congTy || '') + '</div>'
          + '<div class="bcPhu">' + [d.san, d.nganh].filter(Boolean).map(esc).join(' · ') + '</div></div>'
        + '<div class="bcGiaN"><b>' + so(d.gia) + ' đ</b>'
          + '<div class="bcPhu">' + esc(d.ngay || '') + '</div></div>'
      + '</div>'

      + '<div class="bcLuan">' + esc(cauLuan) + '</div>'

      + '<div class="bcChiSo">' + (d.chiSo || []).map(c =>
          '<div class="bcO' + (c.tot ? ' hl' : '') + (c.trang ? ' ' + c.trang : '') + '"><div class="l">' + esc(c.l)
          + '</div><div class="v">' + esc(c.v) + '</div></div>').join('') + '</div>'

      + '<div class="bcMuc2">Điểm nhấn</div><div id="bcLD">' + bay(nhan) + '</div>'
      + '<div class="bcMuc2">Điểm cần soi</div>' + bay(soi)

      + '<div class="bcMuc2">Vùng định giá theo các phương pháp</div>'
      + veDai(d.phuongPhap || [], d.gia, d.mucTieu)
      + '<div class="bcPhu" id="bcViTri" style="margin-top:4px"></div>'

      + '<div class="bcMuc2">Catalyst — sự kiện doanh nghiệp đã công bố</div>'
      + '<table class="bcBang"><tbody id="bcCat"><tr><td>đang lấy công bố thông tin…</td><td>—</td></tr></tbody></table>'
      + '<div class="bcHai" style="margin-top:8px">'
        + '<div><div class="bcMuc2">Độ nhạy định giá</div><table class="bcBang"><tbody>'
          + ((d.nhay || []).length
              ? d.nhay.map(n => '<tr><td>' + esc(n.ten) + '</td><td>' + esc(n.anhHuong) + '</td></tr>').join('')
              : '<tr><td>Chưa đủ dữ liệu để đo độ nhạy</td><td>—</td></tr>')
          + '</tbody></table></div>'
        + '<div><div class="bcMuc2">Số liệu nền</div><table class="bcBang"><tbody>'
          + (d.nen || []).map(n => '<tr><td>' + esc(n.l) + '</td><td>' + esc(n.v) + '</td></tr>').join('')
          + '</tbody></table></div>'
      + '</div>'

      + '<div class="bcChan">' + esc(d.ghiChu || '')
        + ' <b>Trang này không đưa ra khuyến nghị mua, bán hay nắm giữ.</b> '
        + 'Các con số là kết quả tính từ giả định nêu trên, không phải cam kết về kết quả tương lai.'
      + '</div></div>';

    /* Hai chiều của cùng một khoảng cách KHÔNG bằng nhau — đây là chỗ hay bị
       nói sai. Mức tổng hợp cao hơn giá 64% thì giá chỉ thấp hơn mức đó 39%,
       vì hai tỷ lệ chia cho hai mẫu số khác nhau. Ghi cả hai cho khỏi hiểu lầm. */
    const luot = ++luotVe;   // cả hai chạy ở nền, không chặn phần còn lại
    napCatalyst(d.ma, el, luot);
    napLuanDiem(d.ma, el, luot);

    const p = el.querySelector('#bcViTri');
    if (p && isFinite(viTri) && isFinite(d.mucTieu) && d.mucTieu > 0) {
      const nguoc = (d.mucTieu - d.gia) / d.mucTieu * 100;
      p.textContent = viTri >= 0
        ? 'Mức tổng hợp cao hơn giá hiện tại ' + viTri.toFixed(1)
          + '% — tức giá hiện tại thấp hơn mức đó ' + nguoc.toFixed(1) + '%.'
        : 'Mức tổng hợp thấp hơn giá hiện tại ' + Math.abs(viTri).toFixed(1)
          + '% — tức giá hiện tại cao hơn mức đó ' + Math.abs(nguoc).toFixed(1) + '%.';
    }
  };
})(window);
