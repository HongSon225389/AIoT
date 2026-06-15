import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['GLOG_minloglevel'] = '2'
import cv2
import mediapipe as mp
import base64
import math
import threading
import time
from deepface import DeepFace

class VisionTracker:
    def __init__(self):
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            max_num_faces=1, refine_landmarks=True,
            min_detection_confidence=0.6, min_tracking_confidence=0.6,
            static_image_mode=False 
        )
        self.cap = cv2.VideoCapture(0)
        
        # 🔥 KHỞI TẠO ĐA LUỒNG CHO DEEPFACE
        self.current_emotion = "Bình thường"
        self.frame_to_analyze = None
        self.is_running = True
        print("📷 Khởi tạo Camera và luồng ngầm DeepFace...")
        threading.Thread(target=self._emotion_worker, daemon=True).start()

    def _emotion_worker(self):
        """Luồng chạy ngầm: Chuyên soi cảm xúc mà không làm giật camera chính"""
        emotion_map = {
            'happy': 'Vui vẻ', 'sad': 'Buồn bã', 'angry': 'Tức giận', 
            'surprise': 'Ngạc nhiên', 'fear': 'Sợ hãi', 'disgust': 'Khó chịu', 'neutral': 'Bình thường'
        }
        
        time.sleep(2) 
        
        while self.is_running:
            if self.frame_to_analyze is not None:
                try:
                    # Enforce_detection=False giúp không bị văng lỗi nếu có lúc lỡ quay mặt đi
                    result = DeepFace.analyze(self.frame_to_analyze, actions=['emotion'], enforce_detection=False, silent=True)
                    
                    # DeepFace có thể trả về mảng nếu có nhiều người, ta lấy người đầu tiên
                    if isinstance(result, list): result = result[0]
                    
                    dom_emo = result.get('dominant_emotion', 'neutral')
                    self.current_emotion = emotion_map.get(dom_emo, "Bình thường")
                except Exception as e:
                    pass
            
            time.sleep(0.5)

    def process_frame(self):
        ret, frame = self.cap.read()
        if not ret: return None, None, None

        frame = cv2.flip(frame, 1) 
        h, w, _ = frame.shape
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # 📸 COPY ẢNH GỬI CHO LUỒNG NGẦM DEEPFACE XỬ LÝ
        self.frame_to_analyze = frame.copy()
        
        # ==========================================
        # XỬ LÝ GÓC ĐẦU VÀ ÁNH MẮT (MediaPipe Siêu tốc)
        # ==========================================
        results = self.face_mesh.process(rgb_frame)
        vision_data = {
            "head_pose_state": "Không tìm thấy mặt",
            "gaze_state": "Không tìm thấy mắt",
            "emotion": self.current_emotion,
            "person_id": "USER-01"
        }

        if results.multi_face_landmarks:
            for face_landmarks in results.multi_face_landmarks:
                nose = face_landmarks.landmark[1]
                left_cheek = face_landmarks.landmark[234]
                right_cheek = face_landmarks.landmark[454]
                dist_left = math.hypot(nose.x - left_cheek.x, nose.y - left_cheek.y)
                dist_right = math.hypot(nose.x - right_cheek.x, nose.y - right_cheek.y)
                ratio_yaw = dist_left / (dist_right + 1e-6)
                
                if ratio_yaw > 1.4: vision_data["head_pose_state"] = "Quay phải"
                elif ratio_yaw < 0.7: vision_data["head_pose_state"] = "Quay trái"
                else: vision_data["head_pose_state"] = "Nhìn thẳng"

                eye_outer = face_landmarks.landmark[33] 
                eye_inner = face_landmarks.landmark[133]
                iris = face_landmarks.landmark[468]     
                eye_width = math.hypot(eye_outer.x - eye_inner.x, eye_outer.y - eye_inner.y)
                iris_to_inner = math.hypot(iris.x - eye_inner.x, iris.y - eye_inner.y)
                gaze_ratio = iris_to_inner / (eye_width + 1e-6)

                if gaze_ratio < 0.42: vision_data["gaze_state"] = "Liếc phải"
                elif gaze_ratio > 0.58: vision_data["gaze_state"] = "Liếc trái"
                else: vision_data["gaze_state"] = "Nhìn thẳng"

                # --- VẼ ĐIỂM MEDIA PIPE ---
                for idx in [1, 33, 133, 468, 234, 454]:
                    pt = face_landmarks.landmark[idx]
                    cv2.circle(frame, (int(pt.x * w), int(pt.y * h)), 2, (0, 255, 0), -1)

        # --- VẼ BẢNG THÔNG TIN (HUD) LÊN CAMERA ---
        h_state = vision_data["head_pose_state"].replace("Nhìn thẳng", "Nhin Thang").replace("Quay trái", "Quay Trai").replace("Quay phải", "Quay Phai").replace("Không tìm thấy mặt", "No Face")
        g_state = vision_data["gaze_state"].replace("Nhìn thẳng", "Nhin Thang").replace("Liếc trái", "Liec Trai").replace("Liếc phải", "Liec Phai").replace("Không tìm thấy mắt", "No Eyes")
        e_state = vision_data["emotion"].replace("Bình thường", "Binh Thuong").replace("Vui vẻ", "Vui Ve").replace("Buồn bã", "Buon Ba").replace("Mệt mỏi", "Met Moi").replace("Tức giận", "Tuc Gian").replace("Ngạc nhiên", "Ngac Nhien").replace("Sợ hãi", "So Hai").replace("Khó chịu", "Kho Chiu")

        cv2.rectangle(frame, (10, 10), (300, 120), (0, 0, 0), -1)
        cv2.putText(frame, f"HEAD: {h_state}", (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)
        cv2.putText(frame, f"GAZE: {g_state}", (20, 75), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
        cv2.putText(frame, f"EMOTION: {e_state}", (20, 110), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 165, 0), 2)

        stream_frame = cv2.resize(frame, (640, 480))
        _, buffer = cv2.imencode('.jpg', stream_frame, [cv2.IMWRITE_JPEG_QUALITY, 50])
        frame_b64 = base64.b64encode(buffer).decode('utf-8')

        return vision_data, frame_b64, frame

    def release(self):
        self.is_running = False 
        self.face_mesh.close()
        self.cap.release()
