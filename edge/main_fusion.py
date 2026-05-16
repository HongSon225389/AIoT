import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'  
os.environ['GLOG_minloglevel'] = '2'
import time
import cv2
import socketio

from tgam_reader import TGAMReader
# from mock_tgam import TGAMReader
from vision_tracker import VisionTracker

# KHỞI TẠO ĐƯỜNG TRUYỀN SIÊU TỐC
sio = socketio.Client()

def main():

    # Kết nối tới Server Node.js
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
    try:
        while True:
            vision_data, frame_b64, display_frame = vision.process_frame()
            if display_frame is None: break
            current_time = time.time()
            # 🔥 CHỈNH THỜI GIAN: Đẩy lên web mỗi 0.04 giây (25 FPS) thay vì 1.0 giây
            if time.time() - last_send_time >= 0.04:
                raw_eeg = tgam.get_data()

                head = vision_data["head_pose_state"]
                gaze = vision_data["gaze_state"]
                att = raw_eeg["attention"]
                med = raw_eeg["meditation"]

                # --- MA TRẬN CHẨN ĐOÁN  ---
                final_state = "Bình thường"
                if raw_eeg["signal"] > 50:
                    final_state = "Đang tìm tín hiệu TGAM..."
                elif head != "Nhìn thẳng" or gaze != "Nhìn thẳng":
                    final_state = "Đang suy nghĩ (Nhìn ra ngoài)" if att > 60 else "Sao nhãng"
                else: 
                    if att >= 60:
                        final_state = "Căng thẳng / Áp lực" if med < 30 else "Tập trung lý tưởng"
                    elif att < 40:
                        final_state = "Buồn ngủ / Mơ màng" if med > 60 else "Lơ đãng / Chán nản"
                    else:
                        final_state = "Trạng thái bình thường"

                # --- ĐÓNG GÓI PAYLOAD  ---
                ui_payload = {
                    "eeg": {
                        "signal": raw_eeg["signal"],
                        "attention": att,
                        "meditation": med,
                        "alpha": raw_eeg["low_alpha"] + raw_eeg["high_alpha"],
                        "beta": raw_eeg["low_beta"] + raw_eeg["high_beta"],
                        "gamma": raw_eeg["low_gamma"] + raw_eeg["mid_gamma"],
                        "delta": raw_eeg["delta"],
                        "theta": raw_eeg["theta"],
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

                # --- BẮN DỮ LIỆU QUA SOCKET NGAY LẬP TỨC ---
                if sio.connected:
                    sio.emit('sensor_data', ui_payload)
                    if current_time - last_print_time >= 1.0:
                        print(f"📡 Sent | Att: {att:<3} | Med: {med} | KL: {final_state}")
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

# import time
# import requests
# import cv2
# import threading  

# # from tgam_reader import TGAMReader
# from mock_tgam import TGAMReader
# from vision_tracker import VisionTracker

# API_URL = "http://localhost:5000/api/eeg-data"

# # HÀM GỬI DỮ LIỆU NGẦM (ASYNC)
# def send_data_async(payload):
#     try:
#         requests.post(API_URL, json=payload, timeout=1.0)
#     except Exception:
#         pass

# def main():
#     print("="*60)
#     print("🚀 OPTIMIND EDGE STATION IS ONLINE")
#     print("📌 Mode: Multi-threaded Async Streaming")
#     print("="*60)

#     tgam = TGAMReader(port='COM3', baud_rate=57600)
#     tgam.start()
    
#     vision = VisionTracker()
#     last_send_time = time.time()

#     try:
#         while True:
#             vision_data, frame_b64, display_frame = vision.process_frame()
#             if display_frame is None: break

#             # Chỉ đóng gói và đẩy dữ liệu lên Web mỗi 1 giây
#             if time.time() - last_send_time >= 1.0:
#                 raw_eeg = tgam.get_data()

#                 head = vision_data["head_pose_state"]
#                 gaze = vision_data["gaze_state"]
#                 att = raw_eeg["attention"]
#                 med = raw_eeg["meditation"]

#                 # --- MA TRẬN CHẨN ĐOÁN  ---
#                 final_state = "Bình thường"
#                 if raw_eeg["signal"] > 50:
#                     final_state = "Đang tìm tín hiệu TGAM..."
#                 elif head != "Nhìn thẳng" or gaze != "Nhìn thẳng":
#                     final_state = "Đang suy nghĩ (Nhìn ra ngoài)" if att > 60 else "Sao nhãng"
#                 else: 
#                     if att >= 60:
#                         final_state = "Căng thẳng / Áp lực" if med < 30 else "Tập trung lý tưởng"
#                     elif att < 40:
#                         final_state = "Buồn ngủ / Mơ màng" if med > 60 else "Lơ đãng / Chán nản"
#                     else:
#                         final_state = "Trạng thái bình thường"

#                 # --- ĐÓNG GÓI PAYLOAD ---
#                 ui_payload = {
#                     "eeg": {
#                         "signal": raw_eeg["signal"],
#                         "attention": att,
#                         "meditation": med,
#                         "alpha": raw_eeg["low_alpha"] + raw_eeg["high_alpha"],
#                         "beta": raw_eeg["low_beta"] + raw_eeg["high_beta"],
#                         "gamma": raw_eeg["low_gamma"] + raw_eeg["mid_gamma"],
#                         "delta": raw_eeg["delta"],
#                         "theta": raw_eeg["theta"],
#                         "low_alpha": raw_eeg["low_alpha"],
#                         "high_alpha": raw_eeg["high_alpha"],
#                         "low_beta": raw_eeg["low_beta"],
#                         "high_beta": raw_eeg["high_beta"],
#                         "low_gamma": raw_eeg["low_gamma"],
#                         "mid_gamma": raw_eeg["mid_gamma"]
#                     },
#                     "raw_values": raw_eeg.get("raw_values", []), 
#                     "vision": vision_data,
#                     "final_state": final_state,
#                     "frame": frame_b64
#                 }

#                 # --- GỬI DỮ LIỆU BẰNG LUỒNG RIÊNG (Không gây giật lag) ---
#                 thread = threading.Thread(target=send_data_async, args=(ui_payload,), daemon=True)
#                 thread.start()
                
#                 print(f"📡 Sent | Att: {att:<3} | Med: {med}| KL: {final_state}")
#                 last_send_time = time.time()

#             # Hiển thị camera tại chỗ mượt mà
#             # cv2.imshow("OptiMind - Edge Processing", display_frame)
#             # if cv2.waitKey(1) & 0xFF == ord('q'):
#             #     break

#     except KeyboardInterrupt:
#         print("\n🛑 Đang ngắt kết nối an toàn...")
#     finally:
#         vision.release()
#         cv2.destroyAllWindows()

# if __name__ == "__main__":
#     main()
