import cv2
import time
import threading
import requests
import base64
import os
import random  

os.environ['TF_USE_LEGACY_KERAS'] = '1'  
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

from deepface import DeepFace 

# ================= 2. CẤU HÌNH HỆ THỐNG =================
API_URL = "http://localhost:5000/api/eeg-data"
FACE_TIMEOUT = 3.0 

# ================= 3. KHO DỮ LIỆU CHUNG =================
latest_eeg = {
    "tbr": 0, "attention": 0, "meditation": 0, "signal": 0,
    "delta": 0, "theta": 0, "low_alpha": 0, "high_alpha": 0,
    "low_beta": 0, "high_beta": 0, "low_gamma": 0, "mid_gamma": 0
} 
current_emotion = "Loading..." 

# ================= 4. LUỒNG MOCK EEG =================
def eeg_mock_worker():
    global latest_eeg
    while True:
        # Giả lập dữ liệu có biến thiên tự nhiên
        latest_eeg['attention'] = random.randint(45, 85)
        latest_eeg['meditation'] = random.randint(40, 80)
        latest_eeg['theta'] = random.randint(15000, 35000)
        latest_eeg['low_beta'] = random.randint(10000, 20000)
        latest_eeg['high_beta'] = random.randint(10000, 20000)
        
        # Các dải sóng phụ để vẽ biểu đồ cho đẹp
        latest_eeg['delta'] = random.randint(50000, 100000)
        latest_eeg['low_alpha'] = random.randint(10000, 25000)
        latest_eeg['high_alpha'] = random.randint(10000, 25000)
        latest_eeg['low_gamma'] = random.randint(1000, 5000)
        latest_eeg['mid_gamma'] = random.randint(500, 3000)

        beta_total = latest_eeg['low_beta'] + latest_eeg['high_beta']
        if beta_total > 0: 
            latest_eeg['tbr'] = round(latest_eeg['theta'] / beta_total, 2)
        time.sleep(1)

# ================= 5. LUỒNG AI CAMERA =================
def ai_worker(frame_queue):
    global current_emotion
    print("[AI VISION] DeepFace đang sẵn sàng...")
    last_seen_time = time.time()
    
    while True:
        if not frame_queue: 
            time.sleep(0.05)
            continue
            
        frame = frame_queue[-1] 
        frame_queue.clear() 
        
        try:
            objs = DeepFace.analyze(frame, actions=['emotion'], enforce_detection=True, silent=True)
            if isinstance(objs, list):
                current_emotion = objs[0]['dominant_emotion']
            last_seen_time = time.time() 
        except:
            if time.time() - last_seen_time > FACE_TIMEOUT: 
                current_emotion = "Out of frame"
        
        time.sleep(0.5) # Tăng tốc độ nhận diện lên 0.5s

# ================= 6. LUỒNG CHÍNH =================
def main():
    threading.Thread(target=eeg_mock_worker, daemon=True).start()
    frame_queue = []
    threading.Thread(target=ai_worker, args=(frame_queue,), daemon=True).start()
    
    cap = cv2.VideoCapture(0)
    last_send = time.time()
    
    print("="*50)
    print("🚀 OPTIMIND TEST NODE IS ACTIVE")
    print("📡 Đang đẩy dữ liệu lên Dashboard...")
    print("="*50)

    try:
        while True:
            ret, frame = cap.read()
            if not ret: break
            
            frame = cv2.flip(frame, 1)
            frame_queue.append(frame.copy())

            if time.time() - last_send >= 1.0:
                tbr, att, med = latest_eeg["tbr"], latest_eeg["attention"], latest_eeg["meditation"]
                
                # Logic Fusion (EEG + Vision)
                if tbr < 1.5 and att > 60: 
                    if current_emotion in ['angry', 'sad', 'fear']:
                        final_state = "Stress / Qua tai"
                    else:
                        final_state = "Tap trung ly tuong"
                elif tbr > 2.2 and att < 45: 
                    final_state = "Buon ngu" if med > 65 else "Sao nhang"
                elif med > 75 and att < 50: 
                    final_state = "Thu gian sau"
                else: 
                    final_state = "Binh thuong"

                # Nén ảnh (Giảm chất lượng xuống 40 để truyền Socket mượt hơn)
                _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 40])
                frame_base64 = base64.b64encode(buffer).decode('utf-8')

                payload = {
                    "eeg": latest_eeg,
                    "vision": {"gaze": "Live Tracking", "emotion": current_emotion},
                    "final_state": final_state,
                    "frame": frame_base64,
                    "timestamp": int(time.time() * 1000)
                }
                
                try: 
                    res = requests.post(API_URL, json=payload, timeout=0.5)
                    if res.status_code == 200:
                        print(f"🟢 {current_emotion.upper():<10} | {final_state}")
                except: 
                    print("🔴 LỖI: Không kết nối được Backend!")
                
                last_send = time.time()
                
    except KeyboardInterrupt:
        print("\n🛑 Ngắt kết nối...")
    finally:
        cap.release()

if __name__ == "__main__": 
    main()