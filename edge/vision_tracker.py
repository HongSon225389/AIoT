import os
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
os.environ["GLOG_minloglevel"] = "2"
import base64
import math
import threading
import time
import cv2
import mediapipe as mp
from deepface import DeepFace

class VisionTracker:
    def __init__(self):
        self.mp_face_mesh = mp.solutions.face_mesh

        self.face_mesh = self.mp_face_mesh.FaceMesh(
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.6,
            min_tracking_confidence=0.6,
            static_image_mode=False,
        )

        self.cap = cv2.VideoCapture(0)
        if not self.cap.isOpened():
            raise RuntimeError("Không thể mở camera tại VideoCapture(0).")
        # NGƯỠNG NHẬN DIỆN HƯỚNG ĐẦU
        self.head_yaw_right_threshold = 1.40
        self.head_yaw_left_threshold = 0.70
        self.head_up_threshold = 0.43
        self.head_down_threshold = 0.53
        # NGƯỠNG NHẬN DIỆN HƯỚNG MẮT
        self.gaze_right_threshold = 0.42
        self.gaze_left_threshold = 0.58
        self.gaze_up_threshold = 0.35
        self.gaze_down_threshold = 0.65
        self.current_emotion = "Bình thường"
        self.frame_to_analyze = None
        self.is_running = True

        print("📷 Khởi tạo Camera và luồng ngầm DeepFace...")

        threading.Thread(
            target=self._emotion_worker,
            daemon=True,
        ).start()

    def _emotion_worker(self):
        emotion_map = {
            "happy": "Vui vẻ",
            "sad": "Buồn bã",
            "angry": "Tức giận",
            "surprise": "Ngạc nhiên",
            "fear": "Sợ hãi",
            "disgust": "Khó chịu",
            "neutral": "Bình thường",
        }

        time.sleep(2)

        while self.is_running:
            if self.frame_to_analyze is not None:
                safe_frame = self.frame_to_analyze.copy()

                try:
                    result = DeepFace.analyze(
                        safe_frame,
                        actions=["emotion"],
                        enforce_detection=False,
                        silent=True,
                    )

                    if isinstance(result, list):
                        result = result[0]

                    dominant_emotion = result.get(
                        "dominant_emotion",
                        "neutral",
                    )

                    self.current_emotion = emotion_map.get(
                        dominant_emotion,
                        "Bình thường",
                    )

                except Exception:
                    # Giữ cảm xúc hợp lệ gần nhất nếu DeepFace lỗi tạm thời.
                    pass

            time.sleep(0.5)

# hàm không cần truy cập self
    @staticmethod
    def _distance(point_a, point_b):
        return math.hypot(
            point_a.x - point_b.x,
            point_a.y - point_b.y,
        )



    def _detect_head_pose(self, landmarks):

        nose = landmarks[1]
        forehead = landmarks[10]
        chin = landmarks[152]
        left_cheek = landmarks[234]
        right_cheek = landmarks[454]

        # quay trái / quay phải: mũi đến 2 má
        distance_left = self._distance(nose, left_cheek)
        distance_right = self._distance(nose, right_cheek)

        yaw_ratio = distance_left / (distance_right + 1e-6)

        if yaw_ratio > self.head_yaw_right_threshold:
            return "Quay phải"

        if yaw_ratio < self.head_yaw_left_threshold:
            return "Quay trái"

        # ngẩng lên / cúi xuống : mũi đến trán, cằm đến trán
        face_height = abs(chin.y - forehead.y)

        nose_vertical_ratio = (
            nose.y - forehead.y
        ) / (face_height + 1e-6)

        if nose_vertical_ratio < self.head_up_threshold:
            return "Ngẩng lên"

        if nose_vertical_ratio > self.head_down_threshold:
            return "Cúi xuống"

        return "Nhìn thẳng"
    

    def _detect_gaze(self, landmarks):
 
        eye_outer = landmarks[33]
        eye_inner = landmarks[133]
        eye_upper = landmarks[159]
        eye_lower = landmarks[145]
        iris = landmarks[468]

        # liếc lên / liếc xuống
        eye_height = abs(eye_lower.y - eye_upper.y)

        iris_vertical_ratio = (
            iris.y - eye_upper.y
        ) / (eye_height + 1e-6)

        if iris_vertical_ratio < self.gaze_up_threshold:
            return "Liếc lên"

        if iris_vertical_ratio > self.gaze_down_threshold:
            return "Liếc xuống"

        # liếc trái / liếc phải 
        eye_width = self._distance(
            eye_outer,
            eye_inner,
        )

        iris_to_inner = self._distance(
            iris,
            eye_inner,
        )

        gaze_horizontal_ratio = (
            iris_to_inner / (eye_width + 1e-6)
        )

        if gaze_horizontal_ratio < self.gaze_right_threshold:
            return "Liếc phải"

        if gaze_horizontal_ratio > self.gaze_left_threshold:
            return "Liếc trái"

        return "Nhìn thẳng"

    def process_frame(self):
        ret, frame = self.cap.read()

        if not ret:
            return None, None, None

        # Lật ảnh để thao tác trên giao diện giống gương.
        frame = cv2.flip(frame, 1)

        height, width, _ = frame.shape

        rgb_frame = cv2.cvtColor(
            frame,
            cv2.COLOR_BGR2RGB,
        )

        # Gửi một bản sao cho worker DeepFace.
        self.frame_to_analyze = frame.copy()

        results = self.face_mesh.process(rgb_frame)

        vision_data = {
            "head_pose_state": "Không tìm thấy mặt",
            "gaze_state": "Không tìm thấy mắt",
            "emotion": self.current_emotion,
            # "person_id": "USER-01",
        }

        if results.multi_face_landmarks:
            # max_num_faces=1 nên chỉ xử lý khuôn mặt đầu tiên.
            face_landmarks = results.multi_face_landmarks[0]
            landmarks = face_landmarks.landmark

            vision_data["head_pose_state"] = self._detect_head_pose(
                landmarks
            )

            vision_data["gaze_state"] = self._detect_gaze(
                landmarks
            )

            # Vẽ các điểm quan trọng để kiểm tra trực quan.
            landmark_indexes = [
                1,    # Mũi
                10,   # Trán
                152,  # Cằm
                234,  # Má trái
                454,  # Má phải
                33,   # Góc ngoài mắt
                133,  # Góc trong mắt
                159,  # Mí trên
                145,  # Mí dưới
                468,  # Tâm mống mắt
            ]

            for index in landmark_indexes:
                point = landmarks[index]

                cv2.circle(
                    frame,
                    (
                        int(point.x * width),
                        int(point.y * height),
                    ),
                    2,
                    (0, 255, 0),
                    -1,
                )
        # resize kích thước ảnh trước khi gửi
        stream_frame = cv2.resize(
            frame,
            (640, 480),
        )
        # mã hóa ảnh thành jpeg
        success, buffer = cv2.imencode(
            ".jpg",
            stream_frame,
            [cv2.IMWRITE_JPEG_QUALITY, 50],
        )

        if not success:
            return vision_data, None, frame

        #chuyển đổi ảnh sang base64 để gửi qua WebSocket
        frame_b64 = base64.b64encode(
            buffer
        ).decode("utf-8")

        return vision_data, frame_b64, frame

    def release(self):
        self.is_running = False
        self.face_mesh.close()
        self.cap.release()

