import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['GLOG_minloglevel'] = '2'
import cv2
import base64
import random
import numpy as np

class VisionTracker:
    def __init__(self):
        print(f"📷 [MOCK VISION - FOCUS] Khởi tạo Camera ảo TẬP TRUNG (Kèm Biểu cảm).")

    def process_frame(self):
        frame = np.zeros((480, 640, 3), dtype=np.uint8)
        
        vision_data = {
            "head_pose_state": "Nhìn thẳng",
            "gaze_state": "Nhìn thẳng",
            "person_id": "USER-01",
            "emotion": "Bình thường" # 🔥 THÊM BIỂU CẢM
        }

        # 1. Giả lập Tư thế và Ánh nhìn (90% Tập trung)
        if random.random() < 0.90:
            vision_data["head_pose_state"] = "Nhìn thẳng"
            vision_data["gaze_state"] = "Nhìn thẳng"
        else:
            vision_data["head_pose_state"] = random.choice(["Quay trái", "Quay phải"])
            vision_data["gaze_state"] = random.choice(["Liếc trái", "Liếc phải"])

        # 2. 🔥 Giả lập Biểu cảm khuôn mặt (Tập trung)
        emo_rand = random.random()
        if emo_rand < 0.85:
            vision_data["emotion"] = "Bình thường"
        else:
            vision_data["emotion"] = "Vui vẻ"

        # Vẽ HUD
        h_state = vision_data["head_pose_state"].replace("Nhìn thẳng", "Nhin Thang").replace("Quay trái", "Quay Trai").replace("Quay phải", "Quay Phai")
        g_state = vision_data["gaze_state"].replace("Nhìn thẳng", "Nhin Thang").replace("Liếc trái", "Liec Trai").replace("Liếc phải", "Liec Phai")
        e_state = vision_data["emotion"].replace("Bình thường", "Binh Thuong").replace("Vui vẻ", "Vui Ve")

        cv2.rectangle(frame, (10, 10), (280, 115), (0, 0, 0), -1)
        cv2.putText(frame, f"AI MOCK: FOCUS", (20, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
        cv2.putText(frame, f"HEAD: {h_state}", (20, 55), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)
        cv2.putText(frame, f"GAZE: {g_state}", (20, 80), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
        cv2.putText(frame, f"EMOTION: {e_state}", (20, 105), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 165, 0), 2) # Màu cam

        cv2.circle(frame, (600, 40), 10, (0, 0, 255) if random.random() > 0.5 else (0, 100, 0), -1)

        _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 50])
        frame_b64 = base64.b64encode(buffer).decode('utf-8')

        return vision_data, frame_b64, frame

    def release(self):
        pass