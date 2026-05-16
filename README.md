<!-- edge: venv\Scripts\activate
python main_fusion.py
backend: npm run dev

frontend: npm run dev -->

# 🚀 OptiMind Analyzer - Hệ Thống Giám Sát Trạng Thái Tập Trung Qua Sóng Não (EEG) & Thị Giác AI

## 🌟 Giới thiệu (Introduction)

Trong môi trường học tập và làm việc hiện đại, việc duy trì sự tập trung cao độ là yếu tố quyết định hiệu suất, nhưng lại rất khó để đo lường và đánh giá một cách khách quan. Các phương pháp giám sát truyền thống thường chỉ dựa vào camera (nhận diện khuôn mặt) hoặc phần mềm theo dõi trên máy tính, không thể đánh giá được trạng thái nhận thức thực sự bên trong não bộ con người.

**OptiMind Analyzer** ra đời nhằm giải quyết bài toán đó. Đây là một dự án nghiên cứu và ứng dụng công nghệ **BCI (Brain-Computer Interface)** kết hợp với **Computer Vision**, mang đến một hệ thống giám sát "kép" đột phá:

- **Đọc từ bên trong (Internal):** Sử dụng thiết bị đọc sóng não TGAM để đo lường chính xác mức độ tập trung (Attention) và thư giãn (Relaxation) thông qua sóng điện não đồ (EEG).
- **Quan sát từ bên ngoài (External):** Sử dụng AI Vision (MediaPipe) để theo dõi tư thế đầu và hướng nhìn của mắt.

Sự kết hợp (Fusion) của hai nguồn dữ liệu này giúp hệ thống loại bỏ các "điểm mù" (ví dụ: mắt vẫn nhìn màn hình nhưng não đang lơ đãng), từ đó đưa ra kết luận chẩn đoán trạng thái tâm lý theo thời gian thực với độ tin cậy cực cao. Dự án được thiết kế đặc biệt tối ưu về tốc độ truyền tải và khả năng lưu trữ thông minh, hoàn toàn đáp ứng được các tiêu chuẩn khắt khe của một hệ thống IoT hoàn chỉnh.

---

## 🏗️ Kiến Trúc Hệ Thống (System Architecture)

Hệ thống hoạt động theo mô hình **Edge-Cloud-Client** truyền tải dữ liệu siêu tốc độ:

1. **Edge Station (Python):** Kết nối phần cứng sóng não TGAM1 qua Bluetooth (Cổng COM ảo) và xử lý Camera thông qua AI MediaPipe Face Mesh. Dữ liệu tổng hợp được đóng gói và "bơm" liên tục lên Server qua Socket.io với tốc độ 25-30 FPS.
2. **Backend Server (Node.js + Express + Socket.io):** Đóng vai trò trung tâm điều phối dữ liệu real-time. Nhận luồng Socket từ Edge và phát ngay (broadcast) sang giao diện Web, đồng thời tích hợp bộ lọc (Throttle) tự động lưu dữ liệu sạch vào cơ sở dữ liệu (1 giây/lần).
3. **Database (MongoDB Atlas):** Lưu trữ lịch sử các chỉ số sóng não, tư thế, trạng thái chẩn đoán đã được tối ưu hóa dung lượng (loại bỏ dữ liệu thô và ảnh base64 nền).
4. **Web Dashboard (React):** Hiển thị luồng Camera mượt mà, biểu đồ phân rã các dải sóng não, thanh đo Attention/Relaxation và nhật ký hệ thống.

---

## ✨ Các Tính Năng Cốt Lõi (Key Features)

- **AI Vision Tracking (MediaPipe Face Mesh):** Tự động nhận diện tư thế đầu (Yaw góc quay trái/phải), hướng liếc mắt (Gaze), vẽ điểm debug trán/mắt và hiển thị HUD trực tiếp trên khung hình.
- **EEG Brainwave Processing:** Đọc chuẩn xác các chỉ số Attention (Tập trung), Meditation (Thư giãn), Code Signal (Chất lượng phần cứng), và bóc tách thành công 8 dải sóng não nền tảng (Delta, Theta, Low/High Alpha, Low/High Beta, Low/Mid Gamma).
- **Ma Trận Chẩn Đoán Thông Minh (Diagnostic Matrix):** Thuật toán kết hợp chéo dữ liệu EEG và Thị giác để đưa ra kết luận trạng thái tâm lý thời gian thực:
  - _Tập trung lý tưởng_
  - _Căng thẳng / Áp lực_
  - _Buồn ngủ / Mơ màng_
  - _Sao nhãng / Lơ đãng_
  - _Đang suy nghĩ (Nhìn ra ngoài)_
- **High-Speed Streaming (Socket.io):** Nâng cấp luồng camera từ HTTP POST cũ sang Socket.io truyền dẫn nhị phân giúp đạt tốc độ hiển thị mượt mà không độ trễ.
- **Smart Data Logging:** Cơ chế lưu trữ thông minh chỉ lưu thông tin chữ/số cốt lõi, bỏ qua ảnh nền nặng để chống phình to Database (Database Bloat) và đồng bộ múi giờ Việt Nam (`local_time`).

---

## 📁 Cấu Trúc Thư Mục (Project Structure)

```text
optimind-project/
├── backend/                  # Server Node.js
│   ├── config/               # Cấu hình kết nối Database
│   ├── controllers/          # Logic xử lý dữ liệu và luồng Socket.io
│   ├── models/               # Schema định nghĩa dữ liệu MongoDB
│   ├── routes/               # Các tuyến API endpoint
│   └── server.js             # File khởi chạy Backend chính
├── frontend/                 # Giao diện Web Dashboard (React)
│   ├── src/                  # Mã nguồn giao diện, biểu đồ
│   └── package.json          # Quản lý thư viện Frontend
└── edge/                     # Trạm xử lý tại chỗ (Python)
    ├── main_fusion.py        # File khởi chạy đồng bộ Vision + EEG chính
    ├── vision_tracker.py     # Lõi nhận diện khuôn mặt & vẽ HUD Camera
    ├── tgam_reader.py        # Lõi đọc dữ liệu phần cứng sóng não thật từ cổng COM
    └── mock_tgam.py          # Module giả lập dữ liệu sóng não (phục vụ kiểm thử)

🛠️ Hướng Dẫn Cài Đặt & Khởi Chạy (Installation & Setup)
1. Chuẩn Bị Phần Cứng
Vòng đội đầu đọc sóng não dòng chip TGAM1 (ví dụ: Mind Link, MindWave).

Đã kết nối Bluetooth thành công với Máy tính (Được gán cổng Outgoing COM tự động, ví dụ COM14).

2. Cài Đặt Edge Station (Python)
Di chuyển vào thư mục edge và cài đặt các thư viện cần thiết:

Bash
cd edge
pip install opencv-python mediapipe python-socketio pyserial
Lưu ý: Mở file main_fusion.py để cấu hình lại đúng cổng port='COMxx' trùng với cổng Bluetooth của máy tính.

3. Cài Đặt Backend Server (Node.js)
Di chuyển vào thư mục backend, tạo file .env chứa chuỗi kết nối MongoDB Atlas (MONGO_URI), sau đó cài đặt dependencies:

Bash
cd backend
npm install
4. Cài Đặt Frontend (React)
Di chuyển vào thư mục frontend và cài đặt:

Bash
cd frontend
npm install
🚀 Quy Trình Khởi Chạy Hệ Thống
Để hệ thống hoạt động đồng bộ và không gặp lỗi từ chối kết nối, vui lòng khởi chạy theo đúng thứ tự sau:

Bước 1: Bật Backend Server

Bash
cd backend
npm run dev
(Chờ màn hình thông báo 🚀 API: http://localhost:5000)

Bước 2: Bật Giao Diện Web Frontend

Bash
cd frontend
npm run dev
(Trình duyệt sẽ tự động mở trang Dashboard)

Bước 3: Đeo Thiết Bị Phần Cứng

Đeo vòng Mind Link, đảm bảo cảm biến kim loại chạm sát da trán.

Kẹp kẹp cảm biến tiếp địa chắc chắn vào dái tai để đo được tín hiệu chuẩn (CODE: 0).

Bước 4: Chạy Luồng Thu Thập Dữ Liệu Edge (Python)

Bash
cd edge
venv\Scripts\activate
python main_fusion.py
```
