import threading
import time
import random

class TGAMReader:
    def __init__(self, port='MOCK', baud_rate=57600):
        self.port = port
        self.baud_rate = baud_rate
        self.data = {
            "signal": 0,
            "attention": 50, 
            "meditation": 50,
            "delta": 0, "theta": 0, 
            "low_alpha": 0, "high_alpha": 0,
            "low_beta": 0, "high_beta": 0, 
            "low_gamma": 0, "mid_gamma": 0,
            "raw_values": [] # THÊM DÒNG NÀY ĐỂ VẼ BIỂU ĐỒ RAW
        }
        self.is_running = False

    def start(self):
        self.is_running = True
        threading.Thread(target=self._mock_loop, daemon=True).start()

    def _mock_loop(self):
        print(f"🔌 [MOCK TGAM] Đang giả lập kết nối...")
        while self.is_running:
            # 1. Giả lập Attention & Meditation
            self.data["attention"] = random.randint(30, 95)
            self.data["meditation"] = random.randint(30, 95)
            
            # 2. Giả lập sóng não (Tạo giá trị để gộp)
            self.data['delta'] = random.randint(100000, 500000)
            self.data['theta'] = random.randint(50000, 200000)
            self.data['low_alpha'] = random.randint(10000, 50000)
            self.data['high_alpha'] = random.randint(10000, 50000)
            self.data['low_beta'] = random.randint(5000, 25000)
            self.data['high_beta'] = random.randint(5000, 25000)
            self.data['low_gamma'] = random.randint(1000, 10000)
            self.data['mid_gamma'] = random.randint(1000, 10000)
            
            # 3. GIẢ LẬP SÓNG THÔ (Raw Waveform): Tạo 128 điểm ngẫu nhiên
            # Đây là thứ giúp biểu đồ RAW trong image_9eb518.jpg nhảy sóng
            self.data["raw_values"] = [random.randint(-500, 500) for _ in range(128)]
            
            time.sleep(1)

    def get_data(self):
        return self.data.copy()