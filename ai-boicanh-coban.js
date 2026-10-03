/* Bối cảnh gửi cho trợ lý AI ở trang Phân tích cơ bản.
   Gửi thẳng các object mà trang đã tính (taScan / finData / canslim / groupStrength / breadth)
   để AI khỏi phải đoán lại từ chữ trên màn hình. Lược các mảng chuỗi thời gian cho gọn. */
(function () {
  function gonHon(k, v) {
    if (Array.isArray(v) && v.length > 24) return '[mảng ' + v.length + ' phần tử — đã lược]';
    if (typeof v === 'number') return isFinite(v) ? Math.round(v * 1e4) / 1e4 : null;
    return v;
  }

  window.AI_BOICANH = function () {
    var p = [], a = window._noteAI;

    if (a) {
      p.push('== INVESTMENT NOTE ĐANG MỞ: ' + a.tk + ' (dựng lúc ' + a.luc + ') ==');
      p.push('Stage Analysis + Classic Score + DuckMan + VSLRT (hàm taScan):\n' +
        JSON.stringify(a.ta, gonHon, 1));
      try { p.push('Tên stage: ' + (TEN_STAGE[a.ta.stage] || a.ta.stage)); } catch (e) {}
      p.push('CANSLIM: ' + JSON.stringify(a.CS, gonHon, 1));
      p.push('BCTC 24hMoney (hàm finData): ' + JSON.stringify(a.F, gonHon, 1));
      if (a.gs) p.push('Sức mạnh nhóm ngành: ' + JSON.stringify(a.gs, gonHon, 1));
      if (a.br) p.push('Độ rộng thị trường: ' + JSON.stringify(a.br, gonHon, 1));
      try {
        var q = FAQ[a.tk];
        if (q) p.push('Phần định tính đã soạn tay cho ' + a.tk + ': ' + JSON.stringify(q, null, 1));
        else p.push('Trang CHƯA có phần định tính soạn tay cho ' + a.tk +
          ' — mục Lợi thế cạnh tranh đang để trống, đừng tự điền thay.');
      } catch (e) {}
      try { p.push('Nhóm ngành của mã: ' + (nhomCua(a.tk) || 'chưa phân nhóm')); } catch (e) {}
    } else {
      p.push('== Chưa mở Investment Note nào — chỉ có nội dung đang hiển thị trên trang. ==');
    }

    var box = document.querySelector('.wrap');
    if (box) p.push('== CHỮ ĐANG HIỆN TRÊN TRANG ==\n' +
      (box.innerText || '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim().slice(0, 40000));

    return p.join('\n\n');
  };

  window.AI_GOI_Y = [
    'Luận điểm đầu tư của mã đang mở: điểm mạnh nhất và điểm yếu nhất',
    'Stage hiện tại có khớp với Classic Score và CANSLIM không, chỗ nào lệch?',
    'Nếu mua bây giờ thì mức vô hiệu hoá luận điểm là giá nào, vì sao?',
    'BCTC quý gần nhất có dấu hiệu nào đáng lo mà bảng điểm chưa phản ánh?'
  ];
})();
