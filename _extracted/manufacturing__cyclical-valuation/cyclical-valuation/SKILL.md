---
name: cyclical-valuation
description: Định giá doanh nghiệp sản xuất / chu kỳ tại Việt Nam (thép, hóa chất, phân bón, cao su) bằng phương pháp blended DCF-FCFF + P/E comps + EV/EBITDA comps. Dùng khi định giá nhà sản xuất tạo dòng tiền (HPG, HSG, NKG, GVR, DGC, DCM, DPM...), khi giá trị đến từ năng lực sản xuất & dòng tiền (KHÔNG dùng RNAV như BĐS). Bao gồm chuẩn hóa lợi nhuận giữa chu kỳ, P/B làm sàn ở đáy chu kỳ, xử lý net cash, và các bẫy đặc thù VN.
---

# Cyclical / Manufacturing Valuation — Việt Nam (Thép, Hóa chất, Phân bón, Cao su)

## Tổng quan

Doanh nghiệp sản xuất **tạo dòng tiền thật** từ năng lực vận hành → định giá bằng **dòng tiền + bội số lợi nhuận**, KHÔNG dùng RNAV/quỹ đất (đó là cho BĐS — xem [[rnav-valuation]]). Phương pháp chuẩn của các CTCK (SSI/HSC/VCSC) là **blended 3 phương pháp**:

| Phương pháp | Trọng số điển hình | Vai trò |
|---|---|---|
| **DCF (FCFF, 5 năm)** | **~50%** | Neo chính — bắt trọn chu kỳ + dự án mở rộng |
| **P/E comps** | **~30%** | So bội số lợi nhuận với peer (dùng EPS forward, mid-cycle) |
| **EV/EBITDA comps** | **~20%** | Phù hợp ngành nặng vốn + có nợ vay |

*(Ví dụ thật — HPG: DCF-FCFF 50% + P/E 30% + EV/EBITDA 20% → target 36.000; đồng thuận 33.371, dải 30.455–37.500.)*

## Khi nào dùng gì (theo trạng thái chu kỳ)

| Tình huống | Neo định giá |
|---|---|
| Hoạt động bình thường / hồi phục (HPG, DGC, DCM) | **DCF + P/E + EV/EBITDA** (blended) |
| **Đáy chu kỳ, lợi nhuận mỏng** (NKG P/E 38, HSG) | **P/B làm sàn** (giá trị thay thế tài sản); P/E vô nghĩa khi EPS đáy |
| Đang giao dịch **dưới giá trị sổ sách** (HSG 0,82×, NKG 0,78×) | P/B + EV/EBITDA; chờ chu kỳ đảo chiều |
| Có mảng định kỳ/đất KCN (GVR) | Thêm P/B cao hơn + EV/EBITDA; SOTP nếu nhiều mảng |

**Nguyên tắc vàng:** với mã chu kỳ, **đừng định giá bằng EPS đáy hay EPS đỉnh** — dùng **lợi nhuận chuẩn hóa giữa chu kỳ (mid-cycle)** hoặc **forward (1–2 năm)** khi có catalyst rõ (vd nhà máy mới chạy full).

## DCF-FCFF (neo chính)

```
EBIT × (1 − thuế) = NOPAT
(+) Khấu hao (D&A, % DT — sản xuất cao: 5–8%)
(−) CapEx (% DT — nặng vốn: 6–10%; cao khi đang mở rộng nhà máy)
(−) Δ Vốn lưu động (tồn kho thép/nguyên liệu lớn)
= Unlevered FCF (FCFF)
→ chiết khấu theo WACC; + Terminal value (g 2,5–3,5%)
EV = Σ PV(FCFF) + PV(TV)
Equity = EV − Nợ ròng   (LƯU Ý: nhiều mã NET CASH → cộng vào)
Giá/cp = Equity / số cp
```

**WACC (CAPM) thị trường VN:** Rf ~4–5% · ERP ~7–8% · Beta sản xuất chu kỳ **cao (1,1–1,4)**; hóa chất/phân bón thấp hơn (0,9–1,1). WACC điển hình **11–13%**.

**Năng lực mở rộng (rất quan trọng với thép):** mô hình hóa **công suất mới chạy full** vào doanh thu/sản lượng — vd HPG **Dung Quất 2** nâng công suất thép thô lên 15,1 triệu tấn, HRC 8,6 triệu tấn (~70% thị phần HRC nội địa) → tăng trưởng DT năm đầu rất mạnh (+30%+) rồi giảm dần.

## P/E comps (forward, vs peer)

```
Giá (P/E) = EPS forward (mid-cycle) × P/E mục tiêu
```
- So với **trung bình peer**, không phải con số tuyệt đối. (HPG 9× 2026E vs peer ~13× → thị trường định giá thấp.)
- HPG lịch sử P/E ~12,5×, EV/EBITDA ~7,2× (2024) — dùng làm tham chiếu mid-cycle.
- Với mã EPS đáy (NKG 38×, HSG 17×) → **giảm trọng số P/E**, tăng P/B.

## EV/EBITDA comps

```
EV mục tiêu = EBITDA (forward/mid-cycle) × EV/EBITDA peer
Equity = EV − Nợ ròng (hoặc + Net cash)
```
Phù hợp vì loại trừ khác biệt đòn bẩy & khấu hao giữa các nhà sản xuất. Thép VN EV/EBITDA mục tiêu ~7–9×; KCN/cao su (GVR) cao hơn ~10–12×.

## Chỉ số vận hành PHẢI xem (khác BĐS)

- **Biên gộp / Biên EBITDA / Biên EBIT** — theo dõi xu hướng biên (giá HRC, giá nguyên liệu).
- **ROIC = NOPAT / Vốn đầu tư** — hiệu quả vốn (thước đo chất lượng nhà sản xuất).
- **Vòng quay tài sản = DT / Tổng tài sản** — nặng vốn nên thường thấp.
- **Số ngày tồn kho** — thép/hóa chất tồn kho lớn, nhạy giá hàng hóa.
- **Nợ ròng / EBITDA** — đòn bẩy chu kỳ; > 3× là cảnh báo.

## ⚠️ Bẫy đặc thù (PHẢI kiểm tra)

1. **Lợi nhuận một lần:** HPG Q1/2026 LNST 9.056 tỷ (+170%) nhưng ~3.800 tỷ từ **chuyển nhượng KĐT Phố Nối (BĐS, một lần)** → lõi thép ~5.000 tỷ (+52%). Luôn bóc tách lõi.
2. **Net cash vs net debt:** DGC, DCM, DPM **dư tiền mặt ròng lớn** → khi cầu nối EV→Equity phải **CỘNG** net cash (đừng trừ). HPG ngược lại nợ ròng ~50.000 tỷ (CapEx DQ2).
3. **Đáy chu kỳ → P/E bùng nổ giả:** NKG P/E 38, HSG 17 vì E ở đáy — KHÔNG kết luận "đắt"; nhìn P/B (cả hai < 1× sổ sách = rẻ trên tài sản).
4. **Giá hàng hóa quyết định biên:** thép (giá HRC, quặng, than cốc), phân bón (giá ure/khí), hóa chất (phốt pho vàng) — biên rất nhạy, đừng ngoại suy biên đỉnh.
5. **Thuế chống bán phá giá / chính sách:** bảo hộ HRC nội địa (lợi cho HPG/Formosa); thuế xuất nhập khẩu — ảnh hưởng sản lượng & giá.
6. **Mở rộng công suất = CapEx lớn → FCF âm tạm thời:** bình thường trong giai đoạn đầu tư (HPG DQ2); FCF bật mạnh khi nhà máy chạy full.

## Output chuẩn
- Football field 4 phương pháp: DCF · P/E · EV/EBITDA · (P/B nếu đáy chu kỳ)
- Blended target (trọng số DCF 50 / P/E 30 / EV-EBITDA 20, điều chỉnh theo chu kỳ)
- Upside vs giá + khuyến nghị (≥ +15% MUA · −15…+15% NẮM GIỮ · ≤ −15% BÁN)
- Nêu rõ: lợi nhuận lõi (đã bóc one-off), trạng thái chu kỳ, net cash/debt, WACC

## Tham chiếu (giá mục tiêu CTCK, T1–6/2026)
- **HPG:** đồng thuận **33.371** (dải 30.455–37.500). Method: DCF-FCFF 50% + P/E 30% + EV/EBITDA 20% → 36.000 (một báo cáo); P/E+DCF → 34.100; EPS 2026E 2.773 × bội số → 34.700. 2025 NPAT ~16.500 tỷ (+37%), 2026F ~21.200 tỷ (+29%) nhờ DQ2.
- Liên quan: [[rnav-valuation]] (BĐS), data nguồn [[data-source-24hmoney]].
