import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['GLOG_minloglevel'] = '2'
import cv2
import mediapipe as mp
import base64
import math

class VisionTracker:
    def __init__(self):
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            max_num_faces=1, refine_landmarks=True,
            min_detection_confidence=0.6, min_tracking_confidence=0.6,
            static_image_mode=False 
        )
        self.cap = cv2.VideoCapture(0)

    def process_frame(self):
        ret, frame = self.cap.read()
        if not ret: return None, None, None

        frame = cv2.flip(frame, 1) 
        h, w, _ = frame.shape
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.face_mesh.process(rgb_frame)

        vision_data = {
            "head_pose_state": "Không tìm thấy mặt",
            "gaze_state": "Không tìm thấy mắt",
            "person_id": "USER-01"
        }

        if results.multi_face_landmarks:
            for face_landmarks in results.multi_face_landmarks:
                # --- A & B GIỮ NGUYÊN ---
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

                # --- C. VẼ ĐIỂM (GIỮ NGUYÊN) ---
                for idx in [1, 33, 133, 468, 234, 454]:
                    pt = face_landmarks.landmark[idx]
                    cv2.circle(frame, (int(pt.x * w), int(pt.y * h)), 2, (0, 255, 0), -1)

        # --- D. VẼ HUD (GIỮ NGUYÊN) ---
        h_state = vision_data["head_pose_state"].replace("Nhìn thẳng", "Nhin Thang").replace("Quay trái", "Quay Trai").replace("Quay phải", "Quay Phai").replace("Không tìm thấy mặt", "No Face")
        g_state = vision_data["gaze_state"].replace("Nhìn thẳng", "Nhin Thang").replace("Liếc trái", "Liec Trai").replace("Liếc phải", "Liec Phai").replace("Không tìm thấy mắt", "No Eyes")
        cv2.rectangle(frame, (10, 10), (280, 90), (0, 0, 0), -1)
        cv2.putText(frame, f"HEAD: {h_state}", (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)
        cv2.putText(frame, f"GAZE: {g_state}", (20, 75), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)

        # 🔥 Ép ảnh nhỏ lại 640x480 để gửi đi 25 khung hình/giây không bị nghẽn mạng
        stream_frame = cv2.resize(frame, (640, 480))
        _, buffer = cv2.imencode('.jpg', stream_frame, [cv2.IMWRITE_JPEG_QUALITY, 50])
        frame_b64 = base64.b64encode(buffer).decode('utf-8')

        return vision_data, frame_b64, frame

    def release(self):
        self.face_mesh.close()
        self.cap.release()

# import cv2
# import mediapipe as mp
# import base64
# import math

# class VisionTracker:
#     def __init__(self):
#         # Khởi tạo giải pháp Face Mesh của MediaPipe
#         self.mp_face_mesh = mp.solutions.face_mesh
#         self.face_mesh = self.mp_face_mesh.FaceMesh(
#             max_num_faces=1,
#             refine_landmarks=True,
#             min_detection_confidence=0.6,
#             min_tracking_confidence=0.6,
#             static_image_mode=False 
#         )
#         self.cap = cv2.VideoCapture(0)

#     def process_frame(self):
#         ret, frame = self.cap.read()
#         if not ret:
#             return None, None, None

#         # 1. Tiền xử lý khung hình
#         frame = cv2.flip(frame, 1) # Lật ảnh kiểu soi gương
#         h, w, _ = frame.shape
#         rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
#         results = self.face_mesh.process(rgb_frame)

#         # Trạng thái mặc định nếu không thấy người
#         vision_data = {
#             "head_pose_state": "Không tìm thấy mặt",
#             "gaze_state": "Không tìm thấy mắt",
#             "person_id": "USER-01"
#         }

#         if results.multi_face_landmarks:
#             for face_landmarks in results.multi_face_landmarks:
#                 # --- A. TÍNH TOÁN TƯ THẾ ĐẦU (YAW) ---
#                 nose = face_landmarks.landmark[1]
#                 left_cheek = face_landmarks.landmark[234]
#                 right_cheek = face_landmarks.landmark[454]

#                 dist_left = math.hypot(nose.x - left_cheek.x, nose.y - left_cheek.y)
#                 dist_right = math.hypot(nose.x - right_cheek.x, nose.y - right_cheek.y)
                
#                 ratio_yaw = dist_left / (dist_right + 1e-6)
                
#                 if ratio_yaw > 1.4:
#                     vision_data["head_pose_state"] = "Quay phải"
#                 elif ratio_yaw < 0.7:
#                     vision_data["head_pose_state"] = "Quay trái"
#                 else:
#                     vision_data["head_pose_state"] = "Nhìn thẳng"

#                 # --- B. TÍNH TOÁN HƯỚNG MẮT (GAZE) ---
#                 # Sử dụng mắt trái (theo hướng người soi gương)
#                 eye_outer = face_landmarks.landmark[33] 
#                 eye_inner = face_landmarks.landmark[133]
#                 iris = face_landmarks.landmark[468]     

#                 eye_width = math.hypot(eye_outer.x - eye_inner.x, eye_outer.y - eye_inner.y)
#                 iris_to_inner = math.hypot(iris.x - eye_inner.x, iris.y - eye_inner.y)
                
#                 gaze_ratio = iris_to_inner / (eye_width + 1e-6)

#                 if gaze_ratio < 0.42:
#                     vision_data["gaze_state"] = "Liếc phải"
#                 elif gaze_ratio > 0.58:
#                     vision_data["gaze_state"] = "Liếc trái"
#                 else:
#                     vision_data["gaze_state"] = "Nhìn thẳng"

#                 # --- C. VẼ ĐIỂM NHẬN DIỆN (DEBUG POINTS) ---
#                 for idx in [1, 33, 133, 468, 234, 454]:
#                     pt = face_landmarks.landmark[idx]
#                     cv2.circle(frame, (int(pt.x * w), int(pt.y * h)), 2, (0, 255, 0), -1)

#         # --- D. VẼ GIAO DIỆN HUD LÊN VIDEO ---
#         # Chuyển đổi text sang không dấu để OpenCV hiển thị được font mặc định
#         h_state = vision_data["head_pose_state"].replace("Nhìn thẳng", "Nhin Thang").replace("Quay trái", "Quay Trai").replace("Quay phải", "Quay Phai").replace("Không tìm thấy mặt", "No Face")
#         g_state = vision_data["gaze_state"].replace("Nhìn thẳng", "Nhin Thang").replace("Liếc trái", "Liec Trai").replace("Liếc phải", "Liec Phai").replace("Không tìm thấy mắt", "No Eyes")

#         cv2.rectangle(frame, (10, 10), (280, 90), (0, 0, 0), -1)
        
#         # Vẽ Text thông số
#         cv2.putText(frame, f"HEAD: {h_state}", (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)
#         cv2.putText(frame, f"GAZE: {g_state}", (20, 75), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)

#         # 4. Nén ảnh Base64 để gửi qua Socket/Web
#         _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 50])
#         frame_b64 = base64.b64encode(buffer).decode('utf-8')

#         return vision_data, frame_b64, frame

#     def release(self):
#         self.face_mesh.close()
#         self.cap.release()
