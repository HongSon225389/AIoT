import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";

const AxCptTask = () => {
  const MAX_TRIALS = 25;
  const taskStartTime = useRef(null);

  const [displayLetter, setDisplayLetter] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [message, setMessage] = useState("Bấm SPACE khi X đi ngay sau A.");

  const [stats, setStats] = useState({
    hits: 0,
    misses: 0,
    correctRejections: 0,
    falseAlarms: 0,
    // Chỉ lưu thời gian của những lần người dùng thực sự bấm SPACE
    rts: [],
  });

  const trialCount = useRef(0);
  const prevLetter = useRef("");
  const currentLetter = useRef("");
  const hasResponded = useRef(false);
  const showTime = useRef(0);
  const timeoutRef = useRef(null);

  const getRandomLetter = () => {
    if (currentLetter.current === "A") return Math.random() < 0.7 ? "X" : "Y";
    return Math.random() < 0.4
      ? "A"
      : ["B", "C", "F", "H", "Z"][Math.floor(Math.random() * 5)];
  };

  const sendLabel = async (label, status, rt = 0, timestamp) => {
    try {
      await axios.post("http://localhost:5000/api/label-event", {
        taskName: "AX-CPT",
        stimulusType: `${prevLetter.current}-${currentLetter.current}`,
        reactionTime: rt,
        isCorrect: status === "Correct",
        label: label,
        timestamp: timestamp,
      });
    } catch (err) {
      console.error("Lỗi gửi label:", err);
    }
  };

  const showNextLetter = useCallback(() => {
    const now = Date.now();

    // CHẤM ĐIỂM CÂU VỪA KẾT THÚC (Nếu người dùng không bấm phím)
    if (trialCount.current > 0) {
      const isTarget =
        prevLetter.current === "A" && currentLetter.current === "X";

      if (!hasResponded.current) {
        if (isTarget) {
          // A-X nhưng không bấm -> Miss
          setStats((s) => ({
            ...s,
            misses: s.misses + 1,
          }));

          sendLabel("Inattention_Miss", "Wrong", 0, now);
        } else {
          // Không phải A-X và không bấm -> Correct Rejection
          setStats((s) => ({
            ...s,
            correctRejections: s.correctRejections + 1,
          }));

          sendLabel("Focused_Pass", "Correct", 0, now);
        }
      }
    }

    if (trialCount.current >= MAX_TRIALS) {
      setIsRunning(false);
      setIsFinished(true);
      return;
    }

    prevLetter.current = currentLetter.current;
    const nextL = getRandomLetter();
    currentLetter.current = nextL;
    hasResponded.current = false;
    showTime.current = Date.now();
    setDisplayLetter(nextL);
    setMessage("");
    trialCount.current += 1;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(showNextLetter, 1200);
  }, [MAX_TRIALS]);

  const startGame = () => {
    taskStartTime.current = Date.now();
    setIsRunning(true);
    setIsFinished(false);
    setStats({
      hits: 0,
      misses: 0,
      correctRejections: 0,
      falseAlarms: 0,
      rts: [],
    });
    trialCount.current = 0;
    prevLetter.current = "";
    currentLetter.current = "";
    showNextLetter();
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isRunning || e.code !== "Space" || hasResponded.current) return;
      e.preventDefault();
      hasResponded.current = true;
      const now = Date.now();
      const rt = now - showTime.current;
      const isTarget =
        prevLetter.current === "A" && currentLetter.current === "X";

      // Nếu là mục tiêu A-X mà bấm -> ĐÚNG (Hit)
      // Nếu không phải mục tiêu mà vẫn bấm -> SAI (False Alarm)
      if (isTarget) {
        // A-X và có bấm -> Hit
        setStats((s) => ({
          ...s,
          hits: s.hits + 1,
          rts: [...s.rts, rt],
        }));
        setMessage(`🟢 ĐÚNG (+${rt}ms)`);
        sendLabel("Focused_Hit", "Correct", rt, now);
      } else {
        // Không phải A-X nhưng vẫn bấm -> False Alarm
        setStats((s) => ({
          ...s,
          falseAlarms: s.falseAlarms + 1,
          rts: [...s.rts, rt],
        }));
        setMessage("🔴 SAI (BỐC ĐỒNG)");
        sendLabel("Impulsive_Error", "Wrong", rt, now);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isRunning]);

  const exportToCSV = async () => {
    const endTime = Date.now();
    try {
      const response = await axios.get(
        `http://localhost:5000/api/export-full-report?task=AX-CPT&start=${taskStartTime.current}&end=${endTime}`,
      );
      const data = response.data;
      if (data.length === 0) return alert("Không tìm thấy dữ liệu!");

      let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
      csvContent += Object.keys(data[0]).join(",") + "\n";
      data.forEach((row) => {
        csvContent +=
          Object.values(row)
            .map((v) => `"${v}"`)
            .join(",") + "\n";
      });

      const link = document.createElement("a");
      link.setAttribute("href", encodeURI(csvContent));
      link.setAttribute("download", `AX-CPT_Report_${Date.now()}.csv`);
      link.click();
    } catch (err) {
      alert("Lỗi tải báo cáo!");
    }
  };

  const renderSummary = () => {
    const targetCount = stats.hits + stats.misses;
    const nonTargetCount = stats.correctRejections + stats.falseAlarms;

    const hitRate = targetCount > 0 ? (stats.hits / targetCount) * 100 : 0;

    const correctRejectionRate =
      nonTargetCount > 0 ? (stats.correctRejections / nonTargetCount) * 100 : 0;

    const accuracy = Math.round((hitRate + correctRejectionRate) / 2);

    // Chỉ tính trung bình những lần người dùng thực sự bấm SPACE.
    // Bao gồm cả Hit và False Alarm; không tính Miss và Correct Rejection.
    const avgRT =
      stats.rts.length > 0
        ? Math.round(
            stats.rts.reduce((sum, rt) => sum + rt, 0) / stats.rts.length,
          )
        : 0;

    const isFocused = accuracy >= 75 && avgRT < 750;

    return (
      <div
        style={{
          backgroundColor: "#0f172a",
          padding: "40px",
          borderRadius: "1.5rem",
          border: `1px solid ${isFocused ? "#10b981" : "#f43f5e"}`,
          maxWidth: "600px",
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            color: isFocused ? "#10b981" : "#f43f5e",
            fontWeight: "900",
            marginBottom: "20px",
          }}
        >
          {isFocused ? "TRẠNG THÁI: TẬP TRUNG" : "TRẠNG THÁI: SAO NHÃNG"}
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "20px",
            marginBottom: "30px",
          }}
        >
          <div
            style={{
              background: "rgba(255,255,255,0.02)",
              padding: "20px",
              borderRadius: "12px",
            }}
          >
            <div
              style={{
                color: "#94a3b8",
                fontSize: "12px",
                marginBottom: "10px",
              }}
            >
              ĐỘ CHÍNH XÁC
            </div>
            <div
              style={{ fontSize: "32px", fontWeight: "bold", color: "white" }}
            >
              {accuracy}%
            </div>
          </div>
          <div
            style={{
              background: "rgba(255,255,255,0.02)",
              padding: "20px",
              borderRadius: "12px",
            }}
          >
            <div
              style={{
                color: "#94a3b8",
                fontSize: "12px",
                marginBottom: "10px",
              }}
            >
              PHẢN XẠ TRUNG BÌNH
            </div>
            <div
              style={{ fontSize: "32px", fontWeight: "bold", color: "#fcd34d" }}
            >
              {avgRT}ms
            </div>
          </div>
        </div>

        <button
          onClick={exportToCSV}
          style={{
            width: "100%",
            padding: "15px",
            backgroundColor: "#10b981",
            color: "white",
            border: "none",
            borderRadius: "10px",
            fontWeight: "bold",
            cursor: "pointer",
            marginBottom: "10px",
          }}
        >
          📥 XUẤT BÁO CÁO PHIÊN NÀY
        </button>
        <button
          onClick={startGame}
          style={{
            width: "100%",
            padding: "15px",
            background: "none",
            border: "1px solid #3b82f6",
            color: "#3b82f6",
            borderRadius: "10px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          🔄 LÀM LẠI TEST
        </button>
      </div>
    );
  };

  return (
    <div style={{ textAlign: "center", marginTop: "30px", color: "white" }}>
      {!isFinished && (
        <h2
          style={{ color: "#10b981", letterSpacing: "2px", fontWeight: "900" }}
        >
          AX-CPT TASK
        </h2>
      )}
      {isFinished ? (
        renderSummary()
      ) : (
        <>
          <p style={{ fontSize: "14px", color: "#64748b" }}>
            Mục tiêu: Bấm <b>SPACE</b> ngay khi thấy <b>X</b> sau <b>A</b>.
          </p>
          <div
            style={{
              height: "25px",
              margin: "10px 0",
              color: "#fcd34d",
              fontWeight: "bold",
            }}
          >
            {message}
          </div>
          {!isRunning ? (
            <button
              onClick={startGame}
              style={{
                padding: "18px 50px",
                backgroundColor: "#3b82f6",
                color: "white",
                borderRadius: "12px",
                border: "none",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              BẮT ĐẦU
            </button>
          ) : (
            <>
              <div
                style={{
                  fontSize: "160px",
                  margin: "20px 0",
                  minHeight: "180px",
                  fontWeight: "900",
                }}
              >
                {displayLetter}
              </div>
              <div
                style={{
                  color: "#475569",
                  fontSize: "11px",
                  fontWeight: "bold",
                }}
              >
                TIẾN ĐỘ: {trialCount.current} / {MAX_TRIALS}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default AxCptTask;
