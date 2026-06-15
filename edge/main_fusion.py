import joblib
import pandas as pd
import os
import warnings
warnings.filterwarnings("ignore", category=UserWarning)
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'  
os.environ['GLOG_minloglevel'] = '2'
import time
import cv2
import socketio

from tgam_reader import TGAMReader
from vision_tracker import VisionTracker
# from mock_tgam import TGAMReader

# from mock_tgam_focus import TGAMReader
# from mock_vision_focus import VisionTracker

# from mock_tgam_sleep import TGAMReader
# from mock_vision_sleep import VisionTracker

sio = socketio.Client()

def main():
    try:
        sio.connect('http://localhost:5000')
        print("✅ Đã kết nối Socket.io tới Server!")
    except Exception as e:
        print("⚠️ Chưa bật Server Node.js: ", e)

    tgam = TGAMReader(port='COM14', baud_rate=57600)
    tgam.start()
    
    vision = VisionTracker()
    last_send_time = time.time()
    last_print_time = time.time()

    # 🧠 NẠP MÔ HÌNH AI ĐÃ HUẤN LUYỆN
    print("🧠 Đang nạp mô hình trí tuệ nhân tạo AI...")
    try:
        model = joblib.load("optimind_ai_model.pkl")
        le_head = joblib.load("encoder_head.pkl")
        le_gaze = joblib.load("encoder_gaze.pkl")
        le_emo = joblib.load("encoder_emotion.pkl") 
        ai_ready = True
        print("✅ Đã nạp thành công bộ não AI!")
    except Exception as e:
        print(f"⚠️ Không tìm thấy file Mô hình AI. Vui lòng chạy file train_model.py trước! Lỗi: {e}")
        ai_ready = False

    try:
        while True:
            vision_data, frame_b64, display_frame = vision.process_frame()
            if display_frame is None: break
            current_time = time.time()
            
            if time.time() - last_send_time >= 0.04:
                raw_eeg = tgam.get_data()

                head = vision_data["head_pose_state"]
                gaze = vision_data["gaze_state"]
                att = raw_eeg["attention"]
                med = raw_eeg["meditation"]
                
                alpha_sum = raw_eeg["low_alpha"] + raw_eeg["high_alpha"]
                beta_sum = raw_eeg["low_beta"] + raw_eeg["high_beta"]
                gamma_sum = raw_eeg["low_gamma"] + raw_eeg["mid_gamma"]
                theta_val = raw_eeg["theta"]
                delta_val = raw_eeg["delta"]

                # ==========================================================
                # 🚀 MA TRẬN CHẨN ĐOÁN 
                # ==========================================================
                final_state = "Đang phân tích..."
                
                if raw_eeg["signal"] > 50:
                    final_state = "Đang tìm tín hiệu TGAM..."
                elif not ai_ready:
                    final_state = "⚠️ Lỗi: Chưa Train Model AI"
                else:
                    try:
                        head_encoded = le_head.transform([head])[0]
                    except:
                        head_encoded = 0 
                    
                    try:
                        gaze_encoded = le_gaze.transform([gaze])[0]
                    except:
                        gaze_encoded = 0
                    
                    emo_text = vision_data.get("emotion", "Bình thường")
                    try:
                        emotion_encoded = le_emo.transform([emo_text])[0]
                    except:
                        emotion_encoded = 0

                    #  Xếp các chỉ số thành 1 dòng (Trật tự GIỐNG HỆT lúc train: 
                    # 'Attention', 'Meditation', 'Alpha', 'Beta', 'Theta', 'Delta', 'Gamma', 'Head Pose', 'Gaze')
                    current_features = [[
                        att, med, 
                        alpha_sum, beta_sum, theta_val, delta_val, gamma_sum, 
                        head_encoded, gaze_encoded , emotion_encoded
                    ]]
                    
                    #  Yêu cầu AI đưa ra phán đoán!
                    prediction = model.predict(current_features)
                    final_state = prediction[0] # Lấy chuỗi kết quả (VD: "Tập trung", "Sao nhãng")

                # --- ĐÓNG GÓI PAYLOAD GỬI LÊN WEB ---
                ui_payload = {
                    "eeg": {
                        "signal": raw_eeg["signal"],
                        "attention": att,
                        "meditation": med,
                        "alpha": alpha_sum,
                        "beta": beta_sum,
                        "gamma": gamma_sum,
                        "delta": delta_val,
                        "theta": theta_val,
                        "low_alpha": raw_eeg["low_alpha"],
                        "high_alpha": raw_eeg["high_alpha"],
                        "low_beta": raw_eeg["low_beta"],
                        "high_beta": raw_eeg["high_beta"],
                        "low_gamma": raw_eeg["low_gamma"],
                        "mid_gamma": raw_eeg["mid_gamma"]
                    },
                    "raw_values": raw_eeg.get("raw_values", []), 
                    "vision": vision_data,
                    "final_state": final_state, 
                    "frame": frame_b64
                }

                if sio.connected:
                    sio.emit('sensor_data', ui_payload)
                    if current_time - last_print_time >= 1.0:
                        print(f"📡 AI Chẩn đoán | Att: {att:<3} | Med: {med:<3} | Gaze: {gaze} | 👉 Kết quả: {final_state}")
                        last_print_time = current_time
                last_send_time = time.time()

    except KeyboardInterrupt:
        print("\n🛑 Đang ngắt kết nối an toàn...")
    finally:
        if sio.connected:
            sio.disconnect()
        vision.release()
        cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
