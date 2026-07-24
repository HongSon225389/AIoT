🧠 Hệ thống AIoT Giám sát Trạng thái Nhận thức (Cognitive Monitoring System)

Dự án AIoT kết hợp dữ liệu sinh trắc học Điện não đồ (EEG - Sóng não) và Thị giác máy tính (Computer Vision) để giám sát, đánh giá và cảnh báo mức độ tập trung, sao nhãng, hoặc mệt mỏi của người dùng theo thời gian thực.

🌟 Tính năng nổi bật (Key Features)

📡 Real-time Sensor Fusion: Thu thập và đồng bộ hóa dữ liệu từ cảm biến sóng não TGAM (512Hz) và Camera (30FPS) với độ trễ cực thấp qua Socket.io.

👁️ Computer Vision đa luồng: Ứng dụng MediaPipe để đo lường góc quay đầu (Head Pose), hướng ánh mắt (Gaze); và DeepFace để phân tích biểu cảm khuôn mặt (Emotion) chạy trên luồng ngầm (Daemon Thread) chống giật lag.

🤖 Machine Learning cục bộ (Edge AI): Tích hợp mô hình Random Forest ngay tại thiết bị biên (Edge) để đưa ra phán quyết chẩn đoán nhận thức tức thời.

🎯 Ground Truth Generation: Tích hợp sẵn bài test tâm lý học thần kinh AX-CPT trên giao diện Web nhằm thu thập nhãn (label) phản xạ khách quan, phục vụ quá trình huấn luyện AI.

📊 Dashboard Trực quan: Giao diện React hiện đại, hiển thị biểu đồ sóng não thô (Raw EEG), phổ năng lượng (Spectrum) và các thông số chẩn đoán theo thời gian thực.

🏗️ Kiến trúc Hệ thống (Architecture)

Hệ thống được thiết kế theo chuẩn phân tán 3 tầng (3-Tier Architecture):

Edge Node (Python): Giao tiếp phần cứng (Serial/COM), xử lý hình ảnh, nội suy AI và phát luồng dữ liệu (Socket.io Client).

Backend Server (Node.js/Express): Đóng vai trò Broker trung chuyển luồng Socket.io tốc độ cao và cung cấp RESTful APIs. Lưu trữ dữ liệu vào MongoDB.

Frontend Client (React/Vite): Ứng dụng Web SPA (Single Page Application) nhận dữ liệu Real-time, vẽ biểu đồ và tương tác với người dùng.

📂 Cấu trúc thư mục (Folder Structure)

AIoT-main/
│
├── backend/ # Server Node.js (Trung chuyển & Database)
│ ├── config/ # Cấu hình kết nối DB
│ ├── controllers/ # Logic xử lý API và Socket.io
│ ├── models/ # Schema MongoDB (Label, Telemetry)
│ ├── routes/ # RESTful API Endpoints
│ └── server.js # File khởi chạy Backend
│
├── edge/ # Python Script (Chạy trên thiết bị thu thập)
│ ├── main_fusion.py # File khởi chạy chính (Gộp EEG & Vision)
│ ├── tgam_reader.py # Xử lý giao thức nối tiếp (Serial) chip TGAM
│ ├── vision_tracker.py # Xử lý Camera (MediaPipe + DeepFace)
│ ├── train_model.py # Huấn luyện mô hình ML (Random Forest)
│ └── \*.pkl # Các file mô hình AI và Encoder đã huấn luyện
│
└── frontend/ # Giao diện người dùng ReactJS
├── src/
│ ├── components/ # Các module UI (Dashboard, AX-CPT Task,...)
│ ├── App.jsx # Component gốc
│ └── main.jsx # Điểm neo React
└── package.json # Cấu hình thư viện Frontend

⚙️ Yêu cầu Hệ thống (Prerequisites)

Hardware:

Vòng đeo đầu NeuroSky MindWave / Module TGAM.

Webcam độ phân giải tối thiểu 480p.

Software:

Node.js (Phiên bản 16.x trở lên).

Python (Phiên bản 3.8 - 3.10 khuyến nghị).

Cơ sở dữ liệu MongoDB (Local hoặc Atlas).

🚀 Hướng dẫn Cài đặt & Khởi chạy (Installation & Setup)

Bạn cần mở 3 Terminal (Command Prompt) riêng biệt để chạy 3 thành phần của hệ thống.

Bước 1: Khởi chạy Backend (Node.js Server)

cd backend
npm install

Tạo file .env trong thư mục backend với nội dung:

PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/aiot_cognitive_db

Bật Server:

npm start

(Server sẽ chạy tại http://localhost:5000)

Bước 2: Khởi chạy Frontend (React Web UI)

Mở Terminal thứ 2:

cd frontend
npm install
npm run dev

(Giao diện Web sẽ chạy tại http://localhost:5173)

Bước 3: Khởi chạy Edge AI (Python Sensor Node)

Mở Terminal thứ 3:

cd edge
pip install -r requirements.txt

(Lưu ý: Bạn có thể cài đặt thủ công các thư viện cốt lõi nếu không có file requirements: pip install opencv-python mediapipe deepface pyserial python-socketio scikit-learn pandas)

Kết nối thiết bị TGAM (Kiểm tra đúng cổng COM trong file main_fusion.py) và chạy:

python main_fusion.py

📝 Quy trình Thu thập dữ liệu & Train AI (Mở rộng)

Nếu bạn muốn tự thu thập dữ liệu và huấn luyện lại mô hình AI cho cá nhân:

Đeo cảm biến, bật hệ thống và mở giao diện Web.

Vào mục Bài Test Nhận Thức (AX-CPT) và thực hiện các thao tác bấm phím.

Sau khi test xong, hệ thống sẽ tự động ghép nối Nhãn (Đúng/Sai) với dữ liệu Sóng Não + Camera.

Bấm Xuất Báo Cáo để tải file CSV.

Đặt file CSV vào thư mục edge và chạy lệnh python train_model.py để cập nhật lại "Bộ não" AI (optimind_ai_model.pkl).
