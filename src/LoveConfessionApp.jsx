import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import confetti from "canvas-confetti";
import { Heart, Sparkles } from "lucide-react";

const CARD_WIDTH = 700;
const CARD_HEIGHT = 440;
const REJECT_PROXIMITY = 50;
const TYPEWRITER_TEXT =
  "Cau khong can tra loi vo i va nua... Chi can biet rang, ben canh cau, moi ngay deu la mot ngay rat dang yeu.";

const random = (min, max) => Math.random() * (max - min) + min;

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return isMobile;
}

function useTypewriter(text, speed = 28, enabled = false) {
  const [value, setValue] = useState("");

  useEffect(() => {
    if (!enabled) {
      setValue("");
      return;
    }

    let index = 0;
    const timer = setInterval(() => {
      index += 1;
      setValue(text.slice(0, index));
      if (index >= text.length) clearInterval(timer);
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed, enabled]);

  return value;
}

function FloatingHearts() {
  const hearts = useMemo(
    () =>
      Array.from({ length: 16 }, (_, idx) => ({
        id: idx,
        x: random(3, 97),
        y: random(0, 100),
        size: random(16, 44),
        duration: random(8, 16),
        delay: random(0, 8),
        opacity: random(0.2, 0.7),
      })),
    []
  );

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      {hearts.map((heart) => (
        <motion.div
          key={heart.id}
          className="absolute"
          style={{
            left: `${heart.x}%`,
            top: `${heart.y}%`,
            opacity: heart.opacity,
            filter: "drop-shadow(0 8px 16px rgba(255, 43, 150, 0.25))",
          }}
          animate={{
            y: [0, -24, 0],
            rotate: [-8, 8, -8],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: heart.duration,
            delay: heart.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Heart
            size={heart.size}
            className="fill-pink-300/40 text-pink-200/80"
            strokeWidth={1.5}
          />
        </motion.div>
      ))}
    </div>
  );
}

function CursorTrail() {
  const [points, setPoints] = useState([]);

  useEffect(() => {
    let cleanupTimer = null;
    const onMove = (event) => {
      const point = {
        id: `${Date.now()}-${Math.random()}`,
        x: event.clientX,
        y: event.clientY,
      };
      setPoints((prev) => [...prev.slice(-14), point]);
      clearTimeout(cleanupTimer);
      cleanupTimer = setTimeout(() => {
        setPoints((prev) => prev.slice(-8));
      }, 120);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      clearTimeout(cleanupTimer);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-30">
      {points.map((point) => (
        <motion.div
          key={point.id}
          className="absolute"
          style={{ left: point.x - 8, top: point.y - 8 }}
          initial={{ opacity: 0.8, scale: 1 }}
          animate={{ opacity: 0, scale: 0.3, y: -6 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
        >
          <Heart size={16} className="fill-pink-400 text-pink-300" />
        </motion.div>
      ))}
    </div>
  );
}

function App() {
  const cardRef = useRef(null);
  const rejectRef = useRef(null);
  const isMobile = useIsMobile();

  const [accepted, setAccepted] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [sparkles, setSparkles] = useState([]);
  const [rejectPosition, setRejectPosition] = useState({
    x: isMobile ? 0 : 160,
    y: 0,
    rotate: 0,
  });

  const typedText = useTypewriter(TYPEWRITER_TEXT, 28, accepted);

  useEffect(() => {
    // Keep the button in a safe zone on orientation changes.
    const recenter = () =>
      setRejectPosition((prev) => ({ ...prev, x: isMobile ? 0 : prev.x, y: 0 }));
    window.addEventListener("resize", recenter);
    return () => window.removeEventListener("resize", recenter);
  }, [isMobile]);

  const spawnSparkles = (x, y) => {
    const next = Array.from({ length: 14 }, (_, idx) => ({
      id: `${Date.now()}-${idx}`,
      x: x + random(-36, 36),
      y: y + random(-20, 20),
      size: random(8, 16),
      rotate: random(-30, 30),
      duration: random(0.6, 1.1),
    }));
    setSparkles(next);
  };

  const jumpRejectButton = () => {
    const maxX = isMobile ? 110 : 220;
    const maxY = isMobile ? 95 : 120;
    setRejectPosition({
      x: random(-maxX, maxX),
      y: random(-maxY, maxY),
      rotate: random(-28, 28),
    });
  };

  const handlePointerMoveCard = (event) => {
    if (!cardRef.current || isMobile) return;
    const rect = cardRef.current.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    const tiltY = (px - 0.5) * 18;
    const tiltX = (0.5 - py) * 16;
    setTilt({ x: tiltX, y: tiltY });

    if (!rejectRef.current) return;
    const b = rejectRef.current.getBoundingClientRect();
    const cx = b.left + b.width / 2;
    const cy = b.top + b.height / 2;
    const dist = Math.hypot(event.clientX - cx, event.clientY - cy);
    if (dist < REJECT_PROXIMITY) jumpRejectButton();
  };

  const celebrate = () => {
    setAccepted(true);
    const launch = () =>
      confetti({
        particleCount: 140,
        spread: 90,
        origin: { y: 0.6 },
        scalar: 1.1,
      });
    launch();
    setTimeout(launch, 220);
    setTimeout(launch, 420);
  };

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-[#120522] text-white [cursor:none]"
      onPointerMove={handlePointerMoveCard}
    >
      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            "radial-gradient(circle at 10% 20%, #ffd2ef 0%, #cb7cff 45%, #7b2cbf 100%)",
            "radial-gradient(circle at 80% 10%, #ffc8dd 0%, #a06cd5 48%, #5a189a 100%)",
            "radial-gradient(circle at 25% 85%, #ffafcc 0%, #b07dff 45%, #6a00f4 100%)",
          ],
        }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />

      <FloatingHearts />
      <CursorTrail />

      <AnimatePresence mode="wait">
        {!accepted ? (
          <motion.section
            key="proposal"
            className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12"
            exit={{ scale: 0.72, opacity: 0, filter: "blur(8px)" }}
            transition={{ duration: 0.55, ease: "easeInOut" }}
          >
            <motion.div
              ref={cardRef}
              className="relative w-full max-w-[700px] rounded-3xl border border-white/35 bg-white/15 p-6 shadow-[0_10px_45px_rgba(0,0,0,0.25)] backdrop-blur-xl md:p-10"
              animate={{ rotateX: tilt.x, rotateY: tilt.y }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              style={{
                width: CARD_WIDTH,
                minHeight: CARD_HEIGHT,
                transformStyle: "preserve-3d",
                boxShadow:
                  "0 10px 30px rgba(34, 0, 53, 0.2), inset 0 1px 0 rgba(255,255,255,0.35)",
              }}
            >
              <motion.div
                className="mb-4 inline-flex items-center gap-2 rounded-full bg-pink-200/20 px-3 py-1 text-pink-100"
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 2.1, repeat: Infinity }}
              >
                <Sparkles size={16} />
                Loi moi that long
              </motion.div>

              <h1 className="text-3xl font-black leading-tight md:text-5xl">
                Minh co the la nguoi di cung ban
                <span className="block bg-gradient-to-r from-pink-200 via-fuchsia-200 to-violet-200 bg-clip-text text-transparent">
                  den het thanh xuan khong?
                </span>
              </h1>

              <p className="mt-5 max-w-[90%] text-sm text-pink-50/90 md:text-lg">
                Hom nay, minh khong xin mot cau tra loi hoan hao. Minh chi xin
                mot co hoi de chung ta bat dau mot dieu gi do that dep.
              </p>

              <div className="relative mt-12 flex min-h-[120px] flex-wrap items-center justify-center gap-5">
                <motion.button
                  type="button"
                  className="relative rounded-2xl bg-pink-500 px-9 py-4 text-lg font-bold text-white outline-none"
                  style={{
                    boxShadow:
                      "0 18px 0 #be185d, 0 24px 42px rgba(219, 39, 119, 0.55), 0 0 40px rgba(255, 111, 206, 0.35)",
                  }}
                  animate={{
                    y: [0, -5, 0],
                    scale: [1, 1.02, 1],
                    boxShadow: [
                      "0 18px 0 #be185d, 0 24px 42px rgba(219, 39, 119, 0.5), 0 0 36px rgba(255, 111, 206, 0.3)",
                      "0 20px 0 #be185d, 0 28px 44px rgba(219, 39, 119, 0.65), 0 0 54px rgba(255, 111, 206, 0.55)",
                      "0 18px 0 #be185d, 0 24px 42px rgba(219, 39, 119, 0.5), 0 0 36px rgba(255, 111, 206, 0.3)",
                    ],
                  }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                  whileHover={{
                    scale: 1.09,
                    filter: "brightness(1.08)",
                    boxShadow:
                      "0 20px 0 #be185d, 0 30px 50px rgba(219, 39, 119, 0.72), 0 0 70px rgba(255, 174, 228, 0.9)",
                  }}
                  whileTap={{ scale: 0.96, y: 4 }}
                  onPointerEnter={(event) => spawnSparkles(event.clientX, event.clientY)}
                  onTouchStart={(event) => {
                    const touch = event.touches[0];
                    spawnSparkles(touch.clientX, touch.clientY);
                  }}
                  onClick={celebrate}
                >
                  Dong y
                </motion.button>

                <motion.button
                  ref={rejectRef}
                  type="button"
                  className="rounded-2xl border border-white/35 bg-white/20 px-8 py-4 text-lg font-semibold text-white backdrop-blur-md"
                  animate={{
                    x: rejectPosition.x,
                    y: rejectPosition.y,
                    rotate: rejectPosition.rotate,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 10,
                  }}
                  whileHover={{ scale: 0.98 }}
                  onPointerEnter={jumpRejectButton}
                  onTouchStart={jumpRejectButton}
                >
                  Tu choi
                </motion.button>

                <AnimatePresence>
                  {sparkles.map((s) => (
                    <motion.div
                      key={s.id}
                      className="pointer-events-none absolute z-20"
                      initial={{ opacity: 0, x: s.x, y: s.y, rotate: s.rotate, scale: 0.6 }}
                      animate={{ opacity: [0, 1, 0], y: s.y - random(26, 48), scale: [0.7, 1.2, 0.3] }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: s.duration, ease: "easeOut" }}
                    >
                      <Sparkles size={s.size} className="text-yellow-200" />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.section>
        ) : (
          <motion.section
            key="victory"
            className="relative z-10 flex min-h-screen items-center justify-center px-4"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="max-w-3xl text-center">
              <motion.h2
                className="text-5xl font-black leading-tight text-pink-100 md:text-7xl"
                animate={{ textShadow: ["0 0 12px #ff5fcf", "0 0 28px #ffa6e8", "0 0 12px #ff5fcf"] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Yeaaaaah! Cam on ban da chon minh!
              </motion.h2>

              <p className="mx-auto mt-8 min-h-[120px] max-w-2xl text-lg text-pink-50 md:text-2xl">
                {typedText}
                <motion.span
                  className="ml-1 inline-block h-7 w-[2px] bg-pink-100 align-middle"
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                />
              </p>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
