import threading
import time
import random

class TGAMReader:
    def __init__(self, port='MOCK', baud_rate=57600):
        self.port = port
        self.baud_rate = baud_rate
        self.data = {
            "signal": 0,
            "attention": 85, 
            "meditation": 50,
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
        print(f"🔌 [MOCK TGAM - FOCUS] Đang giả lập sóng não TẬP TRUNG...")
        while self.is_running:
            # TẬP TRUNG: Attention cao (75-98), Meditation trung bình
            self.data["attention"] = random.randint(75, 98)
            self.data["meditation"] = random.randint(40, 60)
            
            # Sóng Beta (tư duy logic) tăng cao, Theta (buồn ngủ) thấp
            self.data['delta'] = random.randint(50000, 150000)
            self.data['theta'] = random.randint(20000, 80000)
            self.data['low_alpha'] = random.randint(20000, 60000)
            self.data['high_alpha'] = random.randint(20000, 60000)
            self.data['low_beta'] = random.randint(50000, 150000)  
            self.data['high_beta'] = random.randint(50000, 150000) 
            self.data['low_gamma'] = random.randint(10000, 30000)
            self.data['mid_gamma'] = random.randint(5000, 20000)
            
            self.data["raw_values"] = [random.randint(-200, 200) for _ in range(512)]
            time.sleep(1)

    def get_data(self):
        return self.data.copy()