import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['GLOG_minloglevel'] = '2'
import cv2
import base64
import random
import numpy as np

class VisionTracker:
    def __init__(self):
        print(f"📷 [MOCK VISION - SLEEP] Khởi tạo Camera ảo SAO NHÃNG (Kèm Biểu cảm).")

    def process_frame(self):
        frame = np.zeros((480, 640, 3), dtype=np.uint8)
        
        vision_data = {
            "head_pose_state": "Không tìm thấy mặt",
            "gaze_state": "Không tìm thấy mắt",
            "person_id": "USER-01",
            "emotion": "Mệt mỏi" # 🔥 THÊM BIỂU CẢM
        }

        # 1. Giả lập Tư thế
        rand_val = random.random()
        if rand_val < 0.2:
            vision_data["head_pose_state"] = "Nhìn thẳng"
            vision_data["gaze_state"] = "Nhìn thẳng"
        elif rand_val < 0.5:
            vision_data["head_pose_state"] = "Quay trái"
            vision_data["gaze_state"] = "Liếc trái"
        elif rand_val < 0.8:
            vision_data["head_pose_state"] = "Quay phải"
            vision_data["gaze_state"] = "Liếc phải"
        else:
            vision_data["head_pose_state"] = "Không tìm thấy mặt"
            vision_data["gaze_state"] = "Không tìm thấy mắt"

        # 2. 🔥 Giả lập Biểu cảm khuôn mặt (Sao nhãng / Mệt)
        emo_rand = random.random()
        if emo_rand < 0.60:
            vision_data["emotion"] = "Mệt mỏi"
        elif emo_rand < 0.85:
            vision_data["emotion"] = "Buồn bã"
        else:
            vision_data["emotion"] = "Bình thường"

        # Vẽ HUD
        h_state = vision_data["head_pose_state"].replace("Nhìn thẳng", "Nhin Thang").replace("Quay trái", "Quay Trai").replace("Quay phải", "Quay Phai").replace("Không tìm thấy mặt", "Cui / Guc Mat")
        g_state = vision_data["gaze_state"].replace("Nhìn thẳng", "Nhin Thang").replace("Liếc trái", "Liec Trai").replace("Liếc phải", "Liec Phai").replace("Không tìm thấy mắt", "Nham / No Eyes")
        e_state = vision_data["emotion"].replace("Mệt mỏi", "Met Moi").replace("Buồn bã", "Buon Ba").replace("Bình thường", "Binh Thuong")

        cv2.rectangle(frame, (10, 10), (320, 115), (0, 0, 0), -1)
        cv2.putText(frame, f"AI MOCK: SLEEP / DISTRACTED", (20, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 1)
        cv2.putText(frame, f"HEAD: {h_state}", (20, 55), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)
        cv2.putText(frame, f"GAZE: {g_state}", (20, 80), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
        cv2.putText(frame, f"EMOTION: {e_state}", (20, 105), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 165, 0), 2)

        cv2.circle(frame, (600, 40), 10, (0, 0, 255) if random.random() > 0.5 else (0, 100, 0), -1)

        _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 50])
        frame_b64 = base64.b64encode(buffer).decode('utf-8')

        return vision_data, frame_b64, frame

    def release(self):
        pass