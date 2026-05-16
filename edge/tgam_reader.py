import serial
import threading

class TGAMReader:
    def __init__(self, port='COM14', baud_rate=57600):
        self.port = port
        self.baud_rate = baud_rate
        self.data = {
            "signal": 200, "attention": 0, "meditation": 0,
            "delta": 0, "theta": 0, "low_alpha": 0, "high_alpha": 0,
            "low_beta": 0, "high_beta": 0, "low_gamma": 0, "mid_gamma": 0,
            "raw_values": []
        }
        self.is_running = False
        self.raw_buffer = []

    def start(self):
        self.is_running = True
        threading.Thread(target=self._read_loop, daemon=True).start()

    def _read_loop(self):
        print(f"🔌 [TGAM] Đang kết nối Bluetooth qua {self.port}...")
        try:
            ser = serial.Serial(self.port, self.baud_rate, timeout=1)
            print("✅ [TGAM] Đã kết nối thành công! Sẵn sàng nhận sóng não.")
            
            while self.is_running:
                if ser.read(1) == b'\xAA' and ser.read(1) == b'\xAA':
                    plen_byte = ser.read(1)
                    if not plen_byte: continue
                    plen = plen_byte[0] 
                    
                    if plen < 170:
                        payload = ser.read(plen)
                        if len(payload) < plen: continue 
                        
                        checksum_byte = ser.read(1)
                        if not checksum_byte: continue
                        checksum = checksum_byte[0]
                        
                        if (sum(payload) & 0xFF) ^ 0xFF == checksum:
                            self._parse_payload(payload)
        except Exception as e:
            print(f"⚠️ [TGAM] Lỗi phần cứng: {e}")

    def _parse_payload(self, payload):
        i = 0
        while i < len(payload):
            code = payload[i]
            if code == 0x80:
                i += 2 # Bỏ qua vlength
                raw_val = (payload[i] << 8) | payload[i+1]
                if raw_val > 32767: raw_val -= 65536
                self.raw_buffer.append(raw_val)
                if len(self.raw_buffer) > 128: # Giữ lại 128 điểm gần nhất
                    self.raw_buffer.pop(0)
                self.data["raw_values"] = self.raw_buffer
                i += 2
            
            elif code == 0x02:
                self.data["signal"] = payload[i+1]
                i += 2
            elif code == 0x04:
                self.data["attention"] = payload[i+1]
                i += 2
            elif code == 0x05:
                self.data["meditation"] = payload[i+1]
                i += 2
            elif code == 0x83:
                i += 1 
                vlength = payload[i] 
                i += 1 
                
                v = payload[i : i + vlength]
                if len(v) == 24:
                    self.data['delta'] = (v[0]<<16) | (v[1]<<8) | v[2]
                    self.data['theta'] = (v[3]<<16) | (v[4]<<8) | v[5]
                    self.data['low_alpha'] = (v[6]<<16) | (v[7]<<8) | v[8]
                    self.data['high_alpha'] = (v[9]<<16) | (v[10]<<8) | v[11]
                    self.data['low_beta'] = (v[12]<<16) | (v[13]<<8) | v[14]
                    self.data['high_beta'] = (v[15]<<16) | (v[16]<<8) | v[17]
                    self.data['low_gamma'] = (v[18]<<16) | (v[19]<<8) | v[20]
                    self.data['mid_gamma'] = (v[21]<<16) | (v[22]<<8) | v[23]
                i += vlength
            else:
                if code >= 0x80:
                    i += 1 
                    vlength = payload[i]
                    i += 1 + vlength 
                else:
                    i += 2 

    def get_data(self):
        return self.data.copy()