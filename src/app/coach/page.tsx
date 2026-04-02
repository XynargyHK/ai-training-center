"use client";

import { useRef, useState, useEffect, useCallback } from "react";

// ============================================================
// TYPES
// ============================================================
interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

interface ExerciseTarget {
  name: string;
  joints: { label: string; points: [number, number, number]; ideal: number; tolerance: number }[];
  icon: string;
}

// ============================================================
// EXERCISE DATABASE — ideal angles per exercise
// ============================================================
const EXERCISES: ExerciseTarget[] = [
  {
    name: "Squat",
    icon: "🏋️",
    joints: [
      { label: "Left Knee", points: [23, 25, 27], ideal: 90, tolerance: 15 },
      { label: "Right Knee", points: [24, 26, 28], ideal: 90, tolerance: 15 },
      { label: "Left Hip", points: [11, 23, 25], ideal: 90, tolerance: 20 },
      { label: "Right Hip", points: [12, 24, 26], ideal: 90, tolerance: 20 },
    ],
  },
  {
    name: "Push-up",
    icon: "💪",
    joints: [
      { label: "Left Elbow", points: [11, 13, 15], ideal: 90, tolerance: 15 },
      { label: "Right Elbow", points: [12, 14, 16], ideal: 90, tolerance: 15 },
      { label: "Left Shoulder", points: [13, 11, 23], ideal: 75, tolerance: 15 },
    ],
  },
  {
    name: "Lunge",
    icon: "🦵",
    joints: [
      { label: "Front Knee", points: [23, 25, 27], ideal: 90, tolerance: 15 },
      { label: "Back Knee", points: [24, 26, 28], ideal: 90, tolerance: 20 },
      { label: "Torso", points: [11, 23, 25], ideal: 170, tolerance: 15 },
    ],
  },
  {
    name: "Plank",
    icon: "🧘",
    joints: [
      { label: "Left Shoulder", points: [13, 11, 23], ideal: 180, tolerance: 15 },
      { label: "Left Hip", points: [11, 23, 25], ideal: 180, tolerance: 10 },
      { label: "Left Knee", points: [23, 25, 27], ideal: 180, tolerance: 10 },
    ],
  },
  {
    name: "Deadlift",
    icon: "🏗️",
    joints: [
      { label: "Left Hip", points: [11, 23, 25], ideal: 90, tolerance: 20 },
      { label: "Right Hip", points: [12, 24, 26], ideal: 90, tolerance: 20 },
      { label: "Left Knee", points: [23, 25, 27], ideal: 160, tolerance: 15 },
      { label: "Spine", points: [12, 24, 26], ideal: 180, tolerance: 10 },
    ],
  },
  {
    name: "Yoga - Warrior II",
    icon: "🧘‍♀️",
    joints: [
      { label: "Front Knee", points: [23, 25, 27], ideal: 90, tolerance: 15 },
      { label: "Back Leg", points: [24, 26, 28], ideal: 175, tolerance: 10 },
      { label: "Left Arm", points: [13, 11, 23], ideal: 180, tolerance: 15 },
    ],
  },
  {
    name: "Bicep Curl",
    icon: "💪",
    joints: [
      { label: "Left Elbow", points: [11, 13, 15], ideal: 40, tolerance: 15 },
      { label: "Right Elbow", points: [12, 14, 16], ideal: 40, tolerance: 15 },
    ],
  },
  {
    name: "Free Mode",
    icon: "👁️",
    joints: [],
  },
];

// MediaPipe landmark names
const LANDMARK_NAMES = [
  "nose", "left_eye_inner", "left_eye", "left_eye_outer",
  "right_eye_inner", "right_eye", "right_eye_outer",
  "left_ear", "right_ear", "mouth_left", "mouth_right",
  "left_shoulder", "right_shoulder", "left_elbow", "right_elbow",
  "left_wrist", "right_wrist", "left_pinky", "right_pinky",
  "left_index", "right_index", "left_thumb", "right_thumb",
  "left_hip", "right_hip", "left_knee", "right_knee",
  "left_ankle", "right_ankle", "left_heel", "right_heel",
  "left_foot_index", "right_foot_index",
];

// Connections for drawing skeleton
const POSE_CONNECTIONS = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
  [11, 23], [12, 24], [23, 24], [23, 25], [24, 26],
  [25, 27], [26, 28], [27, 29], [28, 30], [29, 31], [30, 32],
  [15, 17], [15, 19], [15, 21], [16, 18], [16, 20], [16, 22],
];

// ============================================================
// MATH HELPERS
// ============================================================
function calcAngle(a: Landmark, b: Landmark, c: Landmark): number {
  const radians =
    Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180) / Math.PI);
  if (angle > 180) angle = 360 - angle;
  return Math.round(angle);
}

function scoreFromAngle(actual: number, ideal: number, tolerance: number): number {
  const diff = Math.abs(actual - ideal);
  if (diff <= tolerance * 0.5) return 10;
  if (diff <= tolerance) return 8;
  if (diff <= tolerance * 1.5) return 6;
  if (diff <= tolerance * 2) return 4;
  return 2;
}

function angleColor(actual: number, ideal: number, tolerance: number): string {
  const diff = Math.abs(actual - ideal);
  if (diff <= tolerance) return "#22c55e"; // green
  if (diff <= tolerance * 2) return "#eab308"; // yellow
  return "#ef4444"; // red
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function CoachPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(0);
  const [currentAngles, setCurrentAngles] = useState<{ label: string; angle: number; ideal: number; tolerance: number; score: number }[]>([]);
  const [formScore, setFormScore] = useState<number | null>(null);
  const [coaching, setCoaching] = useState<string>("");
  const [loadingCoach, setLoadingCoach] = useState(false);
  const [poseLandmarker, setPoseLandmarker] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<"user" | "environment">("user");
  const animFrameRef = useRef<number>(0);
  const landmarksRef = useRef<Landmark[]>([]);

  // Load MediaPipe
  const initMediaPipe = useCallback(async () => {
    setLoading(true);
    try {
      const { PoseLandmarker, FilesetResolver } = await import(
        "@mediapipe/tasks-vision"
      );
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );
      const landmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      setPoseLandmarker(landmarker);
    } catch (err) {
      console.error("MediaPipe init failed:", err);
      alert("Failed to load MediaPipe. Check console.");
    }
    setLoading(false);
  }, []);

  // Start camera
  const startCamera = useCallback(async () => {
    if (!poseLandmarker) {
      await initMediaPipe();
      return; // will be called again after init
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: cameraFacing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsRunning(true);
      }
    } catch (err) {
      console.error("Camera error:", err);
      alert("Camera access denied.");
    }
  }, [poseLandmarker, cameraFacing, initMediaPipe]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setIsRunning(false);
    setCurrentAngles([]);
    setFormScore(null);
  }, []);

  // Detection loop
  useEffect(() => {
    if (!isRunning || !poseLandmarker || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    let lastTime = -1;

    const detect = () => {
      if (!video.paused && !video.ended && video.currentTime !== lastTime) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        lastTime = video.currentTime;

        const result = poseLandmarker.detectForVideo(video, performance.now());

        // Draw video
        ctx.drawImage(video, 0, 0);

        if (result.landmarks && result.landmarks.length > 0) {
          const landmarks: Landmark[] = result.landmarks[0];
          landmarksRef.current = landmarks;

          // Draw skeleton
          ctx.lineWidth = 3;
          ctx.strokeStyle = "#00ff88";
          for (const [i, j] of POSE_CONNECTIONS) {
            const a = landmarks[i];
            const b = landmarks[j];
            if (a && b && (a.visibility ?? 1) > 0.5 && (b.visibility ?? 1) > 0.5) {
              ctx.beginPath();
              ctx.moveTo(a.x * canvas.width, a.y * canvas.height);
              ctx.lineTo(b.x * canvas.width, b.y * canvas.height);
              ctx.stroke();
            }
          }

          // Draw landmark dots
          for (const lm of landmarks) {
            if ((lm.visibility ?? 1) > 0.5) {
              ctx.beginPath();
              ctx.arc(lm.x * canvas.width, lm.y * canvas.height, 5, 0, 2 * Math.PI);
              ctx.fillStyle = "#00ff88";
              ctx.fill();
            }
          }

          // Calculate angles for selected exercise (only if landmarks are VISIBLE)
          const exercise = EXERCISES[selectedExercise];
          const MIN_VISIBILITY = 0.65;
          if (exercise.joints.length > 0) {
            const angles = exercise.joints
              .filter((j) => {
                // Only show angles where ALL 3 landmarks are clearly visible
                const [ai, bi, ci] = j.points;
                return (
                  (landmarks[ai]?.visibility ?? 0) > MIN_VISIBILITY &&
                  (landmarks[bi]?.visibility ?? 0) > MIN_VISIBILITY &&
                  (landmarks[ci]?.visibility ?? 0) > MIN_VISIBILITY
                );
              })
              .map((j) => {
              const [ai, bi, ci] = j.points;
              const angle = calcAngle(landmarks[ai], landmarks[bi], landmarks[ci]);
              const score = scoreFromAngle(angle, j.ideal, j.tolerance);
              const color = angleColor(angle, j.ideal, j.tolerance);

              // Draw angle on canvas
              const mid = landmarks[bi];
              ctx.font = "bold 18px monospace";
              ctx.fillStyle = color;
              ctx.strokeStyle = "#000";
              ctx.lineWidth = 3;
              const text = `${j.label}: ${angle}°`;
              const tx = mid.x * canvas.width + 10;
              const ty = mid.y * canvas.height - 10;
              ctx.strokeText(text, tx, ty);
              ctx.fillText(text, tx, ty);

              return { label: j.label, angle, ideal: j.ideal, tolerance: j.tolerance, score };
            });

            setCurrentAngles(angles);
            if (angles.length > 0) {
              const avg = angles.reduce((s, a) => s + a.score, 0) / angles.length;
              setFormScore(Math.round(avg * 10) / 10);
            } else {
              setFormScore(null); // No visible joints for this exercise
            }
          }
        }
      }
      animFrameRef.current = requestAnimationFrame(detect);
    };

    detect();
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isRunning, poseLandmarker, selectedExercise]);

  // Auto-init MediaPipe on mount
  useEffect(() => {
    initMediaPipe();
  }, [initMediaPipe]);

  // Get AI coaching from Brain
  const getCoaching = async () => {
    if (currentAngles.length === 0) return;
    setLoadingCoach(true);
    setCoaching("");

    const exercise = EXERCISES[selectedExercise];
    const angleData = currentAngles
      .map((a) => `${a.label}: ${a.angle}° (ideal: ${a.ideal}°, ${a.angle > a.ideal ? "too open" : "too closed"})`)
      .join("\n");

    try {
      const res = await fetch("https://modest-mercy-production-efe8.up.railway.app/think", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `EXERCISE: ${exercise.name}\nSKELETON DATA:\n${angleData}\nForm Score: ${formScore}/10\n\nGive specific coaching advice. Be encouraging but point out what needs fixing. Reference the exact angles. Suggest one drill to improve the weakest point.`,
          conversation_history: [
            {
              role: "user",
              parts: [{ text: "You are a friendly personal trainer. You analyze skeleton pose data from a camera. Give specific, encouraging coaching advice. Reference exact angles. Keep it concise — 3-4 sentences max." }],
            },
            {
              role: "model",
              parts: [{ text: "Ready! Send me your pose data." }],
            },
          ],
          user_context: { user_name: "Athlete" },
        }),
      });
      const data = await res.json();
      setCoaching(data.response || "No coaching available.");
    } catch (err) {
      setCoaching("Failed to get coaching. Check connection.");
    }
    setLoadingCoach(false);
  };

  // Get Vision coaching — send actual camera frame to Brain /vision
  const getVisionCoaching = async () => {
    if (!canvasRef.current) return;
    setLoadingCoach(true);
    setCoaching("");

    const exercise = EXERCISES[selectedExercise];
    const angleInfo = currentAngles.length > 0
      ? `\nVisible skeleton angles: ${currentAngles.map(a => `${a.label}: ${a.angle}°`).join(", ")}`
      : "";

    try {
      // Capture current canvas frame as base64
      const imageBase64 = canvasRef.current.toDataURL("image/jpeg", 0.8);

      const res = await fetch("https://modest-mercy-production-efe8.up.railway.app/vision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_base64: imageBase64,
          question: `You are an expert fitness and sports coach. Analyze this person's form for: ${exercise.name}. ${angleInfo}\n\nLook at their full body posture, any equipment they're holding (rackets, weights, etc.), stance width, head position, and anything the skeleton data can't capture. Give 2-3 specific, encouraging coaching tips. If you can see equipment, comment on grip and positioning.`,
          lang: "en",
        }),
      });
      const data = await res.json();
      setCoaching(data.description || "No coaching available.");
    } catch (err) {
      setCoaching("Failed to get vision coaching. Check connection.");
    }
    setLoadingCoach(false);
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div style={{ background: "#0a0a0a", color: "#fff", minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #222" }}>
        <h1 style={{ fontSize: "20px", fontWeight: 700, margin: 0 }}>AI Fitness Coach</h1>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => setCameraFacing(cameraFacing === "user" ? "environment" : "user")}
            style={{ padding: "6px 12px", borderRadius: "8px", border: "1px solid #333", background: "#1a1a1a", color: "#fff", cursor: "pointer", fontSize: "14px" }}
          >
            Flip Camera
          </button>
        </div>
      </div>

      {/* Exercise Selector */}
      <div style={{ padding: "8px 16px", display: "flex", gap: "8px", overflowX: "auto", borderBottom: "1px solid #222" }}>
        {EXERCISES.map((ex, i) => (
          <button
            key={ex.name}
            onClick={() => setSelectedExercise(i)}
            style={{
              padding: "8px 16px",
              borderRadius: "20px",
              border: selectedExercise === i ? "2px solid #22c55e" : "1px solid #333",
              background: selectedExercise === i ? "#22c55e22" : "#1a1a1a",
              color: selectedExercise === i ? "#22c55e" : "#888",
              cursor: "pointer",
              whiteSpace: "nowrap",
              fontSize: "14px",
              fontWeight: selectedExercise === i ? 700 : 400,
            }}
          >
            {ex.icon} {ex.name}
          </button>
        ))}
      </div>

      {/* Camera / Canvas */}
      <div style={{ position: "relative", width: "100%", maxWidth: "800px", margin: "0 auto" }}>
        <video ref={videoRef} style={{ display: "none" }} playsInline muted />
        <canvas
          ref={canvasRef}
          style={{
            width: "100%",
            height: "auto",
            display: isRunning ? "block" : "none",
            borderRadius: "0",
          }}
        />
        {!isRunning && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 20px", gap: "20px" }}>
            <div style={{ fontSize: "64px" }}>{EXERCISES[selectedExercise].icon}</div>
            <p style={{ color: "#888", textAlign: "center", maxWidth: "300px" }}>
              {loading ? "Loading MediaPipe model..." : `Select an exercise and start your camera. The AI will track your form in real-time.`}
            </p>
            <button
              onClick={startCamera}
              disabled={loading}
              style={{
                padding: "16px 40px",
                borderRadius: "12px",
                border: "none",
                background: loading ? "#333" : "#22c55e",
                color: "#fff",
                fontSize: "18px",
                fontWeight: 700,
                cursor: loading ? "wait" : "pointer",
              }}
            >
              {loading ? "Loading Model..." : "Start Camera"}
            </button>
          </div>
        )}

        {/* Form Score Overlay */}
        {isRunning && formScore !== null && (
          <div
            style={{
              position: "absolute",
              top: "12px",
              right: "12px",
              background: "rgba(0,0,0,0.8)",
              borderRadius: "12px",
              padding: "12px 16px",
              textAlign: "center",
              backdropFilter: "blur(10px)",
            }}
          >
            <div style={{ fontSize: "12px", color: "#888", textTransform: "uppercase", letterSpacing: "1px" }}>Form Score</div>
            <div
              style={{
                fontSize: "36px",
                fontWeight: 800,
                color: formScore >= 8 ? "#22c55e" : formScore >= 5 ? "#eab308" : "#ef4444",
              }}
            >
              {formScore}
            </div>
            <div style={{ fontSize: "12px", color: "#888" }}>/10</div>
          </div>
        )}
      </div>

      {/* No visible joints message */}
      {isRunning && currentAngles.length === 0 && EXERCISES[selectedExercise].joints.length > 0 && (
        <div style={{ padding: "12px 16px", maxWidth: "800px", margin: "0 auto" }}>
          <div style={{ background: "#1a1a1a", borderRadius: "8px", padding: "12px 16px", border: "1px solid #333", textAlign: "center" }}>
            <span style={{ color: "#888", fontSize: "14px" }}>
              Can&apos;t see the joints needed for {EXERCISES[selectedExercise].name}. Try stepping back or adjusting the camera so your full body is visible. Use <strong style={{ color: "#8b5cf6" }}>Vision Coach</strong> instead — it analyzes the actual image.
            </span>
          </div>
        </div>
      )}

      {/* Angle Details */}
      {isRunning && currentAngles.length > 0 && (
        <div style={{ padding: "12px 16px", maxWidth: "800px", margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "8px" }}>
            {currentAngles.map((a) => (
              <div
                key={a.label}
                style={{
                  background: "#1a1a1a",
                  borderRadius: "8px",
                  padding: "10px 14px",
                  border: `1px solid ${angleColor(a.angle, a.ideal, a.tolerance)}33`,
                }}
              >
                <div style={{ fontSize: "12px", color: "#888" }}>{a.label}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontSize: "24px", fontWeight: 700, color: angleColor(a.angle, a.ideal, a.tolerance) }}>
                    {a.angle}°
                  </span>
                  <span style={{ fontSize: "12px", color: "#555" }}>target: {a.ideal}°</span>
                </div>
                <div style={{ height: "4px", borderRadius: "2px", background: "#333", marginTop: "6px" }}>
                  <div
                    style={{
                      height: "100%",
                      borderRadius: "2px",
                      width: `${a.score * 10}%`,
                      background: angleColor(a.angle, a.ideal, a.tolerance),
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Controls */}
      {isRunning && (
        <div style={{ padding: "12px 16px", maxWidth: "800px", margin: "0 auto", display: "flex", gap: "8px" }}>
          <button
            onClick={getCoaching}
            disabled={loadingCoach || currentAngles.length === 0}
            style={{
              flex: 1,
              padding: "14px",
              borderRadius: "12px",
              border: "none",
              background: loadingCoach ? "#333" : "#3b82f6",
              color: "#fff",
              fontSize: "16px",
              fontWeight: 700,
              cursor: loadingCoach ? "wait" : "pointer",
            }}
          >
            {loadingCoach ? "Analyzing..." : "Skeleton Coach"}
          </button>
          <button
            onClick={getVisionCoaching}
            disabled={loadingCoach}
            style={{
              flex: 1,
              padding: "14px",
              borderRadius: "12px",
              border: "none",
              background: loadingCoach ? "#333" : "#8b5cf6",
              color: "#fff",
              fontSize: "16px",
              fontWeight: 700,
              cursor: loadingCoach ? "wait" : "pointer",
            }}
          >
            {loadingCoach ? "Analyzing..." : "Vision Coach"}
          </button>
          <button
            onClick={stopCamera}
            style={{
              padding: "14px 20px",
              borderRadius: "12px",
              border: "1px solid #333",
              background: "#1a1a1a",
              color: "#ef4444",
              fontSize: "16px",
              cursor: "pointer",
            }}
          >
            Stop
          </button>
        </div>
      )}

      {/* AI Coaching Response */}
      {coaching && (
        <div style={{ padding: "12px 16px", maxWidth: "800px", margin: "0 auto" }}>
          <div
            style={{
              background: "#1a2332",
              border: "1px solid #1e3a5f",
              borderRadius: "12px",
              padding: "16px",
            }}
          >
            <div style={{ fontSize: "12px", color: "#3b82f6", marginBottom: "8px", fontWeight: 700 }}>
              AI COACH
            </div>
            <div style={{ fontSize: "15px", lineHeight: 1.6, color: "#ccc" }}>{coaching}</div>
          </div>
        </div>
      )}

      {/* Footer spacing */}
      <div style={{ height: "40px" }} />
    </div>
  );
}
