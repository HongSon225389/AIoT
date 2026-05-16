// import React, { useState, useEffect, useCallback, useRef } from "react";
// import axios from "axios";

// const FlankerTask = () => {
//   const MAX_TRIALS = 15;
//   const taskStartTime = useRef(null);
//   const isResponding = useRef(false);

//   const [currentStimulus, setCurrentStimulus] = useState("");
//   const [stimulusType, setStimulusType] = useState("");
//   const [startTime, setStartTime] = useState(0);
//   const [isRunning, setIsRunning] = useState(false);
//   const [isFinished, setIsFinished] = useState(false);
//   const [message, setMessage] = useState("Bấm BẮT ĐẦU để kiểm tra.");
//   const [trialCount, setTrialCount] = useState(0);
//   const [testResults, setTestResults] = useState([]);

//   const stimuliList = [
//     { text: "<<<<<", type: "Congruent", correctAnswer: "ArrowLeft" },
//     { text: ">>>>>", type: "Congruent", correctAnswer: "ArrowRight" },
//     { text: "<<><<", type: "Incongruent", correctAnswer: "ArrowRight" },
//     { text: ">><>>", type: "Incongruent", correctAnswer: "ArrowLeft" },
//   ];

//   const nextTrial = useCallback(() => {
//     isResponding.current = false;
//     const randomStimulus =
//       stimuliList[Math.floor(Math.random() * stimuliList.length)];
//     setCurrentStimulus(randomStimulus.text);
//     setStimulusType(randomStimulus.type);
//     setStartTime(Date.now());
//     setMessage("");
//   }, []);

//   const startGame = () => {
//     taskStartTime.current = Date.now();
//     setIsRunning(true);
//     setIsFinished(false);
//     setTrialCount(0);
//     setTestResults([]);
//     nextTrial();
//   };

//   useEffect(() => {
//     const handleKeyDown = async (e) => {
//       if (
//         !isRunning ||
//         currentStimulus === "" ||
//         isFinished ||
//         isResponding.current
//       )
//         return;

//       if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
//         isResponding.current = true;
//         const now = Date.now();
//         const rt = now - startTime;
//         const currentData = stimuliList.find((s) => s.text === currentStimulus);
//         const isCorrect = e.key === currentData.correctAnswer;
//         const label =
//           currentData.type === "Incongruent" ? "High_Load" : "Baseline";

//         try {
//           await axios.post("http://localhost:5000/api/label-event", {
//             taskName: "Flanker",
//             stimulusType: currentData.type,
//             reactionTime: rt,
//             isCorrect: isCorrect,
//             label: label,
//             timestamp: now,
//           });
//         } catch (err) {
//           console.error("Lỗi gửi label");
//         }

//         setTestResults((prev) => [
//           ...prev,
//           { type: currentData.type, isCorrect, rt },
//         ]);
//         setMessage(isCorrect ? `🟢 +${rt}ms` : "🔴 Sai!");
//         setCurrentStimulus("");

//         if (trialCount + 1 >= MAX_TRIALS) {
//           setTimeout(() => {
//             setIsRunning(false);
//             setIsFinished(true);
//           }, 1000);
//         } else {
//           setTrialCount((prev) => prev + 1);
//           setTimeout(nextTrial, 1000);
//         }
//       }
//     };
//     window.addEventListener("keydown", handleKeyDown);
//     return () => window.removeEventListener("keydown", handleKeyDown);
//   }, [
//     isRunning,
//     currentStimulus,
//     startTime,
//     trialCount,
//     isFinished,
//     nextTrial,
//   ]);

//   const downloadFullReport = async () => {
//     const endTime = Date.now();
//     try {
//       const response = await axios.get(
//         `http://localhost:5000/api/export-full-report?task=Flanker&start=${taskStartTime.current}&end=${endTime}`,
//       );
//       const data = response.data;
//       if (data.length === 0) return alert("Không tìm thấy dữ liệu!");

//       let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
//       csvContent += Object.keys(data[0]).join(",") + "\n";
//       data.forEach((row) => {
//         csvContent +=
//           Object.values(row)
//             .map((v) => `"${v}"`)
//             .join(",") + "\n";
//       });

//       const link = document.createElement("a");
//       link.setAttribute("href", encodeURI(csvContent));
//       link.setAttribute("download", `Flanker_Session_${Date.now()}.csv`);
//       link.click();
//     } catch (err) {
//       alert("Lỗi kết nối Backend!");
//     }
//   };

//   // --- GIAO DIỆN BÁO CÁO GIỐNG CPT ---
//   const renderSummary = () => {
//     const correctTrials = testResults.filter((r) => r.isCorrect);
//     const accuracy = Math.round((correctTrials.length / MAX_TRIALS) * 100);
//     const avgRT = Math.round(
//       testResults.reduce((sum, r) => sum + r.rt, 0) / MAX_TRIALS,
//     );

//     // Tính toán chỉ số chuyên sâu
//     const hardTrials = testResults.filter((r) => r.type === "Incongruent");
//     const hardCorrect = hardTrials.filter((r) => r.isCorrect).length;
//     const inhibitionScore = Math.round(
//       (hardCorrect / (hardTrials.length || 1)) * 100,
//     );

//     let profileName = "CĂNG THẲNG / QUÁ TẢI (COGNITIVE FATIGUE)";
//     let profileColor = "#3b82f6";

//     if (accuracy >= 85 && inhibitionScore >= 80) {
//       profileName = "TẬP TRUNG LÝ TƯỞNG (OPTIMAL FOCUS)";
//       profileColor = "#10b981";
//     } else if (inhibitionScore < 70) {
//       profileName = "DỄ BỊ NHIỄU / MẤT TẬP TRUNG (DISTRACTED)";
//       profileColor = "#f43f5e";
//     }

//     return (
//       <div
//         style={{
//           backgroundColor: "#0f172a",
//           padding: "30px",
//           borderRadius: "1.5rem",
//           border: `1px solid ${profileColor}50`,
//           maxWidth: "700px",
//           margin: "0 auto",
//           textAlign: "left",
//           boxShadow: `0 0 30px ${profileColor}15`,
//         }}
//       >
//         <div
//           style={{
//             textAlign: "center",
//             borderBottom: "1px solid rgba(255,255,255,0.05)",
//             paddingBottom: "20px",
//             marginBottom: "20px",
//           }}
//         >
//           <div
//             style={{
//               color: "#64748b",
//               fontSize: "11px",
//               letterSpacing: "2px",
//               fontWeight: "bold",
//             }}
//           >
//             COGNITIVE PERFORMANCE REPORT
//           </div>
//           <h2
//             style={{
//               color: profileColor,
//               margin: "10px 0",
//               fontSize: "24px",
//               fontWeight: "900",
//             }}
//           >
//             {profileName}
//           </h2>
//         </div>

//         <div
//           style={{
//             display: "grid",
//             gridTemplateColumns: "1fr 1fr",
//             gap: "30px",
//             marginBottom: "30px",
//           }}
//         >
//           <div>
//             <div
//               style={{
//                 color: "#94a3b8",
//                 fontSize: "12px",
//                 fontWeight: "bold",
//                 borderBottom: "1px dashed #334155",
//                 paddingBottom: "5px",
//                 marginBottom: "15px",
//               }}
//             >
//               THANG ĐO NĂNG LỰC
//             </div>
//             <div style={{ marginBottom: "15px" }}>
//               <div
//                 style={{
//                   display: "flex",
//                   justifyContent: "space-between",
//                   fontSize: "11px",
//                   color: "white",
//                   marginBottom: "5px",
//                 }}
//               >
//                 <span>Sức bền chú ý (Tổng quát)</span>
//                 <span>{accuracy}%</span>
//               </div>
//               <div
//                 style={{
//                   width: "100%",
//                   height: "6px",
//                   background: "rgba(255,255,255,0.1)",
//                   borderRadius: "3px",
//                 }}
//               >
//                 <div
//                   style={{
//                     height: "100%",
//                     width: `${accuracy}%`,
//                     background: "#34d399",
//                     borderRadius: "3px",
//                   }}
//                 ></div>
//               </div>
//             </div>
//             <div style={{ marginBottom: "15px" }}>
//               <div
//                 style={{
//                   display: "flex",
//                   justifyContent: "space-between",
//                   fontSize: "11px",
//                   color: "white",
//                   marginBottom: "5px",
//                 }}
//               >
//                 <span>Kiểm soát kháng nhiễu</span>
//                 <span>{inhibitionScore}%</span>
//               </div>
//               <div
//                 style={{
//                   width: "100%",
//                   height: "6px",
//                   background: "rgba(255,255,255,0.1)",
//                   borderRadius: "3px",
//                 }}
//               >
//                 <div
//                   style={{
//                     height: "100%",
//                     width: `${inhibitionScore}%`,
//                     background: "#f43f5e",
//                     borderRadius: "3px",
//                   }}
//                 ></div>
//               </div>
//             </div>
//           </div>

//           <div>
//             <div
//               style={{
//                 color: "#94a3b8",
//                 fontSize: "12px",
//                 fontWeight: "bold",
//                 borderBottom: "1px dashed #334155",
//                 paddingBottom: "5px",
//                 marginBottom: "15px",
//               }}
//             >
//               CHỈ SỐ THỜI GIAN THỰC
//             </div>
//             <div
//               style={{
//                 display: "flex",
//                 justifyContent: "space-between",
//                 background: "rgba(255,255,255,0.02)",
//                 padding: "10px",
//                 borderRadius: "8px",
//                 marginBottom: "10px",
//               }}
//             >
//               <span style={{ color: "#94a3b8", fontSize: "12px" }}>
//                 Phản xạ TB (RT)
//               </span>
//               <span style={{ color: "#fcd34d", fontWeight: "bold" }}>
//                 {avgRT} ms
//               </span>
//             </div>
//             <div
//               style={{
//                 display: "flex",
//                 justifyContent: "space-between",
//                 background: "rgba(255,255,255,0.02)",
//                 padding: "10px",
//                 borderRadius: "8px",
//               }}
//             >
//               <span style={{ color: "#94a3b8", fontSize: "12px" }}>
//                 Độ chính xác
//               </span>
//               <span style={{ color: "#10b981", fontWeight: "bold" }}>
//                 {accuracy}%
//               </span>
//             </div>
//           </div>
//         </div>

//         <div style={{ display: "flex", gap: "15px" }}>
//           <button
//             onClick={downloadFullReport}
//             style={{
//               flex: 1,
//               padding: "15px",
//               backgroundColor: "#10b981",
//               color: "white",
//               border: "none",
//               borderRadius: "10px",
//               cursor: "pointer",
//               fontWeight: "bold",
//             }}
//           >
//             📥 TẢI BÁO CÁO PHIÊN NÀY (.CSV)
//           </button>
//           <button
//             onClick={startGame}
//             style={{
//               flex: 1,
//               padding: "15px",
//               backgroundColor: "transparent",
//               color: profileColor,
//               border: `1px solid ${profileColor}`,
//               borderRadius: "10px",
//               cursor: "pointer",
//               fontWeight: "bold",
//             }}
//           >
//             🔄 THỬ LẠI
//           </button>
//         </div>
//       </div>
//     );
//   };

//   return (
//     <div style={{ textAlign: "center", marginTop: "30px", color: "white" }}>
//       {!isFinished && (
//         <h2
//           style={{ color: "#0ea5e9", fontWeight: "900", letterSpacing: "2px" }}
//         >
//           FLANKER: COGNITIVE TASK
//         </h2>
//       )}
//       {isFinished ? (
//         renderSummary()
//       ) : (
//         <>
//           <p style={{ fontSize: "15px", color: "#94a3b8" }}>
//             Nhìn mũi tên <b>Ở GIỮA</b>. Bấm Trái/Phải tương ứng.
//           </p>
//           <div
//             style={{
//               height: "30px",
//               margin: "10px 0",
//               color: "#fcd34d",
//               fontWeight: "bold",
//               fontSize: "18px",
//             }}
//           >
//             {message}
//           </div>
//           {!isRunning ? (
//             <button
//               onClick={startGame}
//               style={{
//                 padding: "18px 45px",
//                 backgroundColor: "#10b981",
//                 color: "white",
//                 border: "none",
//                 borderRadius: "12px",
//                 fontWeight: "bold",
//                 cursor: "pointer",
//               }}
//             >
//               BẮT ĐẦU TEST
//             </button>
//           ) : (
//             <>
//               <div
//                 style={{
//                   fontSize: "110px",
//                   letterSpacing: "20px",
//                   margin: "40px 0",
//                   minHeight: "130px",
//                   fontWeight: "900",
//                   fontFamily: "monospace",
//                 }}
//               >
//                 {currentStimulus}
//               </div>
//               <div
//                 style={{
//                   color: "#475569",
//                   fontSize: "12px",
//                   fontWeight: "bold",
//                   letterSpacing: "2px",
//                 }}
//               >
//                 TIẾN TRÌNH: {trialCount} / {MAX_TRIALS}
//               </div>
//             </>
//           )}
//         </>
//       )}
//     </div>
//   );
// };

// export default FlankerTask;
import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";

const FlankerTask = () => {
  const MAX_TRIALS = 15;
  const taskStartTime = useRef(null);
  const isResponding = useRef(false);

  const [currentStimulus, setCurrentStimulus] = useState("");
  const [startTime, setStartTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [message, setMessage] = useState("Bấm BẮT ĐẦU để kiểm tra.");
  const [trialCount, setTrialCount] = useState(0);
  const [testResults, setTestResults] = useState([]);

  const stimuliList = [
    { text: "<<<<<", type: "Congruent", correctAnswer: "ArrowLeft" },
    { text: ">>>>>", type: "Congruent", correctAnswer: "ArrowRight" },
    { text: "<<><<", type: "Incongruent", correctAnswer: "ArrowRight" },
    { text: ">><>>", type: "Incongruent", correctAnswer: "ArrowLeft" },
  ];

  const nextTrial = useCallback(() => {
    isResponding.current = false;
    const randomStimulus =
      stimuliList[Math.floor(Math.random() * stimuliList.length)];
    setCurrentStimulus(randomStimulus.text);
    setStartTime(Date.now());
    setMessage("");
  }, []);

  const startGame = () => {
    taskStartTime.current = Date.now();
    setIsRunning(true);
    setIsFinished(false);
    setTrialCount(0);
    setTestResults([]);
    nextTrial();
  };

  useEffect(() => {
    const handleKeyDown = async (e) => {
      if (
        !isRunning ||
        currentStimulus === "" ||
        isFinished ||
        isResponding.current
      )
        return;

      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        isResponding.current = true;
        const now = Date.now();
        const rt = now - startTime;
        const currentData = stimuliList.find((s) => s.text === currentStimulus);
        const isCorrect = e.key === currentData.correctAnswer;

        // Ghi nhận sự kiện về Backend
        try {
          await axios.post("http://localhost:5000/api/label-event", {
            taskName: "Flanker",
            stimulusType: currentData.type,
            reactionTime: rt,
            isCorrect: isCorrect,
            label: isCorrect ? "Focused" : "Distracted",
            timestamp: now,
          });
        } catch (err) {
          console.error("Lỗi gửi label");
        }

        setTestResults((prev) => [...prev, { isCorrect, rt }]);
        setMessage(isCorrect ? `🟢 +${rt}ms` : "🔴 Sai!");
        setCurrentStimulus("");

        if (trialCount + 1 >= MAX_TRIALS) {
          setTimeout(() => {
            setIsRunning(false);
            setIsFinished(true);
          }, 1000);
        } else {
          setTrialCount((prev) => prev + 1);
          setTimeout(nextTrial, 1000);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isRunning,
    currentStimulus,
    startTime,
    trialCount,
    isFinished,
    nextTrial,
  ]);

  const downloadFullReport = async () => {
    const endTime = Date.now();
    try {
      const response = await axios.get(
        `http://localhost:5000/api/export-full-report?task=Flanker&start=${taskStartTime.current}&end=${endTime}`,
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
      link.setAttribute("download", `Flanker_Report_${Date.now()}.csv`);
      link.click();
    } catch (err) {
      alert("Lỗi kết nối Backend!");
    }
  };

  const renderSummary = () => {
    const correctCount = testResults.filter((r) => r.isCorrect).length;
    const accuracy = Math.round((correctCount / MAX_TRIALS) * 100);
    const avgRT = Math.round(
      testResults.reduce((sum, r) => sum + r.rt, 0) / (testResults.length || 1),
    );
    const isFocused = accuracy >= 75;

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
          onClick={downloadFullReport}
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
          style={{ color: "#0ea5e9", fontWeight: "900", letterSpacing: "2px" }}
        >
          FLANKER TASK
        </h2>
      )}
      {isFinished ? (
        renderSummary()
      ) : (
        <>
          <p style={{ fontSize: "15px", color: "#94a3b8" }}>
            Nhìn mũi tên <b>Ở GIỮA</b>. Bấm Trái/Phải tương ứng.
          </p>
          <div
            style={{
              height: "30px",
              margin: "10px 0",
              color: "#fcd34d",
              fontWeight: "bold",
              fontSize: "18px",
            }}
          >
            {message}
          </div>
          {!isRunning ? (
            <button
              onClick={startGame}
              style={{
                padding: "18px 45px",
                backgroundColor: "#10b981",
                color: "white",
                border: "none",
                borderRadius: "12px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              BẮT ĐẦU
            </button>
          ) : (
            <>
              <div
                style={{
                  fontSize: "110px",
                  letterSpacing: "20px",
                  margin: "40px 0",
                  minHeight: "130px",
                  fontWeight: "900",
                  fontFamily: "monospace",
                }}
              >
                {currentStimulus}
              </div>
              <div
                style={{
                  color: "#475569",
                  fontSize: "12px",
                  fontWeight: "bold",
                  letterSpacing: "2px",
                }}
              >
                TIẾN TRÌNH: {trialCount} / {MAX_TRIALS}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default FlankerTask;
