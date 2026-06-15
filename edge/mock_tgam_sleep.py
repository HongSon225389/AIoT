import threading
import time
import random

class TGAMReader:
    def __init__(self, port='MOCK', baud_rate=57600):
        self.port = port
        self.baud_rate = baud_rate
        self.data = {
            "signal": 0,
            "attention": 25, 
            "meditation": 80,
            "delta": 0, "theta": 0, 
            "low_alpha": 0, "high_alpha": 0,
            "low_beta": 0, "high_beta": 0, 
            "low_gamma": 0, "mid_gamma": 0,
            "raw_values": [] 
        }
        self.is_running = False

    def start(self):
        self.is_running = True
        threading.Thread(target=self._mock_loop, daemon=True).start()

    def _mock_loop(self):
        print(f"🔌 [MOCK TGAM - SLEEP] Đang giả lập sóng não BUỒN NGỦ / SAO NHÃNG...")
        while self.is_running:
            # BUỒN NGỦ: Attention rất thấp (10-40), Meditation có thể cao do thư giãn
            self.data["attention"] = random.randint(10, 40)
            self.data["meditation"] = random.randint(60, 95)
            
            # Sóng Delta/Theta (ngủ sâu, lơ mơ) tăng cực cao, Beta (logic) chạm đáy
            self.data['delta'] = random.randint(500000, 1500000) # Cực cao
            self.data['theta'] = random.randint(200000, 800000)  # Cực cao
            self.data['low_alpha'] = random.randint(10000, 40000)
            self.data['high_alpha'] = random.randint(10000, 40000)
            self.data['low_beta'] = random.randint(1000, 10000)    # Rất thấp
            self.data['high_beta'] = random.randint(1000, 10000)   # Rất thấp
            self.data['low_gamma'] = random.randint(500, 3000)
            self.data['mid_gamma'] = random.randint(500, 3000)
            
            # Sóng biên độ lớn hơn do ngủ
            self.data["raw_values"] = [random.randint(-600, 600) for _ in range(128)]
            time.sleep(1)

    def get_data(self):
        return self.data.copy()