import cv2
import time
import threading
import requests
import base64
import os
import serial 

os.environ['TF_USE_LEGACY_KERAS'] = '1'  
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

from deepface import DeepFace 

# =================  CẤU HÌNH HỆ THỐNG =================
API_URL = "http://localhost:5000/api/eeg-data"
COM_PORT = "COM3"  
BAUD_RATE = 57600
FACE_TIMEOUT = 3.0 

# =================  KHO DỮ LIỆU CHUNG =================
latest_eeg = {
    "tbr": 0, "attention": 0, "meditation": 0, "signal": 200, # 200 là chưa có tín hiệu
    "delta": 0, "theta": 0, "low_alpha": 0, "high_alpha": 0,
    "low_beta": 0, "high_beta": 0, "low_gamma": 0, "mid_gamma": 0
} 
current_emotion = "Loading..." 

# =================  LUỒNG ĐỌC VÒNG TGAM  =================
def eeg_real_worker():
    global latest_eeg
    print(f"[TGAM] Dang ket noi Bluetooth qua cong {COM_PORT}...")
    try:
        ser = serial.Serial(COM_PORT, BAUD_RATE, timeout=1)
        print(f"✅ [TGAM] Ket noi thanh cong! Vui long deo vong len dau.")
        
        while True:
            # Tìm Header của gói tin (0xAA 0xAA)
            if ser.read(1) == b'\xaa' and ser.read(1) == b'\xaa':
                plen = ord(ser.read(1))
                if plen < 170:
                    payload = ser.read(plen)
                    checksum = ord(ser.read(1))
                    
                    # Xác thực dữ liệu không bị nhiễu
                    if (sum(payload) & 0xFF) ^ 0xFF == checksum:
                        i = 0
                        while i < plen:
                            code = payload[i]
                            i += 1
                            if code == 0x02: # Tín hiệu nhiễu (Poor Signal)
                                latest_eeg['signal'] = payload[i]
                                i += 1
                            elif code == 0x04: # Mức độ tập trung (Attention)
                                latest_eeg['attention'] = payload[i]
                                i += 1
                            elif code == 0x05: # Mức độ thư giãn (Meditation)
                                latest_eeg['meditation'] = payload[i]
                                i += 1
                            elif code == 0x83: # ASIC EEG (8 dải sóng não)
                                i += 1 # Bỏ qua byte độ dài
                                v = payload[i:i+24]
                                
                                # Giải mã 8 dải sóng
                                latest_eeg['delta'] = (v[0]<<16) | (v[1]<<8) | v[2]
                                latest_eeg['theta'] = (v[3]<<16) | (v[4]<<8) | v[5]
                                latest_eeg['low_alpha'] = (v[6]<<16) | (v[7]<<8) | v[8]
                                latest_eeg['high_alpha'] = (v[9]<<16) | (v[10]<<8) | v[11]
                                latest_eeg['low_beta'] = (v[12]<<16) | (v[13]<<8) | v[14]
                                latest_eeg['high_beta'] = (v[15]<<16) | (v[16]<<8) | v[17]
                                latest_eeg['low_gamma'] = (v[18]<<16) | (v[19]<<8) | v[20]
                                latest_eeg['mid_gamma'] = (v[21]<<16) | (v[22]<<8) | v[23]
                                
                                # Tính chỉ số TBR (Theta/Beta Ratio)
                                beta_total = latest_eeg['low_beta'] + latest_eeg['high_beta']
                                if beta_total > 0:
                                    latest_eeg['tbr'] = round(latest_eeg['theta'] / beta_total, 2)
                                i += 24
    except serial.SerialException:
        print(f"❌ [LỖI] Khong the mo cong {COM_PORT}. Hay kiem tra lai Bluetooth!")
    except Exception as e:
        pass

# =================  LUỒNG AI CAMERA (DEEPFACE) =================
def ai_worker(frame_queue):
    global current_emotion
    print("He thong nhan dien cam xuc dang khoi dong...")
    last_seen_time = time.time()
    
    while True:
        if not frame_queue: 
            time.sleep(0.05)
            continue
            
        frame = frame_queue[-1] 
        frame_queue.clear() 
        
        try:
            objs = DeepFace.analyze(frame, actions=['emotion'], enforce_detection=True, silent=True)
            if isinstance(objs, list) and len(objs) > 0:
                current_emotion = objs[0]['dominant_emotion']
            elif isinstance(objs, dict):
                current_emotion = objs['dominant_emotion']
            last_seen_time = time.time() 
        except ValueError:
            if time.time() - last_seen_time > FACE_TIMEOUT: 
                current_emotion = "Out of frame"
        except:
            pass
            
        time.sleep(0.5) 

# =================  LUỒNG CHÍNH (ĐỒNG BỘ DỮ LIỆU) =================
def main():
    threading.Thread(target=eeg_real_worker, daemon=True).start()
    frame_queue = []
    threading.Thread(target=ai_worker, args=(frame_queue,), daemon=True).start()
    
    cap = cv2.VideoCapture(0)
    last_send = time.time()
    
    print("="*60)
    print("🚀 OPTIMIND MASTER STATION IS ONLINE")
    print("📌 Che do: REAL HARDWARE (TGAM Bluetooth + DeepFace)")
    print("="*60)

    try:
        while True:
            ret, frame = cap.read()
            if not ret: break
            
            frame = cv2.flip(frame, 1)
            frame_queue.append(frame.copy())

            if time.time() - last_send >= 1.0:
                tbr, att, med = latest_eeg["tbr"], latest_eeg["attention"], latest_eeg["meditation"]
                sig = latest_eeg["signal"]
                
                # --- MA TRẬN FUSION: EEG + EMOTION ---
                if sig > 50: 
                    # Nếu Signal > 50 nghĩa là vòng đeo lỏng hoặc chưa đeo
                    final_state = "Dang tim tin hieu EEG..."
                elif tbr < 1.5 and att > 60: 
                    if current_emotion in ['angry', 'sad', 'fear']:
                        final_state = "Stress / Qua tai"
                    else:
                        final_state = "Tap trung ly tuong"
                elif tbr > 2.2 and att < 40: 
                    final_state = "Buon ngu" if med > 65 else "Sao nhang"
                elif med > 70 and att < 50:
                    final_state = "Thu gian sau"
                else: 
                    final_state = "Binh thuong"

                # Nén ảnh gửi lên Dashboard
                _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 40])
                frame_base64 = base64.b64encode(buffer).decode('utf-8')

                payload = {
                    "eeg": latest_eeg,
                    "vision": {"gaze": "Real Tracking", "emotion": current_emotion},
                    "final_state": final_state,
                    "frame": frame_base64,
                    "timestamp": int(time.time() * 1000)
                }
                
                try: 
                    requests.post(API_URL, json=payload, timeout=0.5)
                    # In trạng thái ra màn hình để theo dõi
                    print(f"📡 Signal: {sig:<3} | Emo: {current_emotion.upper():<10} | State: {final_state}")
                except: 
                    pass
                last_send = time.time()
                
    except KeyboardInterrupt:
        print("\n🛑 Dang ngat ket noi he thong...")
    finally:
        cap.release()

if __name__ == "__main__": 
    main()