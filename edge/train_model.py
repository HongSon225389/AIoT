import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report
import joblib

def train_ai():
    print("⏳ 1. Đang tải dữ liệu từ file Excel CSV...")
    df = pd.read_csv("dataset.csv", encoding="utf-8")
    
    print(f"📊 Tìm thấy tổng cộng {len(df)} dòng dữ liệu.")

    print("⚙️ 2. Đang chuẩn hóa dữ liệu (Encoding)...")
    
    # Mã hóa các đặc trưng thị giác (Head Pose, Gaze, Emotion)
    le_head = LabelEncoder()
    df['Head Pose'] = le_head.fit_transform(df['Head Pose'].astype(str))
    
    le_gaze = LabelEncoder()
    df['Gaze'] = le_gaze.fit_transform(df['Gaze'].astype(str))
    
    if 'Emotion' in df.columns:
        le_emo = LabelEncoder()
        df['Emotion'] = le_emo.fit_transform(df['Emotion'].astype(str))
        joblib.dump(le_emo, "encoder_emotion.pkl")

    joblib.dump(le_head, "encoder_head.pkl")
    joblib.dump(le_gaze, "encoder_gaze.pkl")

    # Tách dữ liệu: X là các chỉ số đầu vào, y là kết quả Nhãn (Target) mà AI cần đoán
    feature_cols = ['Attention', 'Meditation', 'Alpha', 'Beta', 'Theta', 'Delta', 'Gamma', 'Head Pose', 'Gaze']
    if 'Emotion' in df.columns:
        feature_cols.append('Emotion')
        
    X = df[feature_cols]
    y = df['Label (Target)'] # "Tập trung" hoặc "Sao nhãng"

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    print("🔥 3. Đang huấn luyện Mô hình AI (Random Forest)...")
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"\n✅ ĐÃ HUẤN LUYỆN XONG!")
    print(f"🎯 Độ chính xác của AI đạt: {accuracy * 100:.2f}%")
    print("\n📝 Báo cáo chi tiết :")
    print(classification_report(y_test, y_pred))

    #  Xuất mô hình AI thành file đóng gói
    joblib.dump(model, "optimind_ai_model.pkl")
    print("💾 Đã xuất mô hình thành công thành file: 'optimind_ai_model.pkl'")

if __name__ == "__main__":
    train_ai()