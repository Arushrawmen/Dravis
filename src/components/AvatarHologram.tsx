/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DRAVIS Living World Bar (Cozy Home Pod, Glowing Cyber-Garden, Work Desk & Play Zone),
 * Signature Cyan-and-Gold Flame-Spirit Body (Hybrid Original Image Sprite + Articulated SVG Body),
 * and Full Human Emotions & Feelings Engine (Desktop + Android 1:1)
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { VoiceState } from "../types";
import { getTimeAwareGreeting } from "../utils/greetings";
import {
  Flame,
  Mic,
  Volume2,
  Sparkles,
  Heart,
  Droplets,
  Home,
  Flower2,
  Sun,
  Moon,
  CloudRain,
  Smile,
  MessageCircleHeart,
} from "lucide-react";
import dravisSparkLogo from "../assets/images/dravis_spark_logo_1789562293560.jpg";

export type HumanEmotionState =
  | "JOYFUL"
  | "LOVED"
  | "EXCITED"
  | "CURIOUS"
  | "CARING"
  | "SAD_HURT"
  | "LONELY"
  | "SLEEPY"
  | "PROUD"
  | "FOCUSED";

export type WorldZoneActivity =
  | "HOME_RESTING"
  | "GARDEN_STROLL"
  | "WATERING_GARDEN"
  | "EATING_SNACK"
  | "BEING_PETTED"
  | "DESK_WORKING"
  | "PLAYING_FLYING"
  | "SPINNING_JOY";

interface AvatarHologramProps {
  userName: string;
  voiceState: VoiceState;
  greetingText?: string;
  subGreetingText?: string;
  isListening?: boolean;
  lastUserCommand?: string;
  liveUserInput?: string;
  onClickAvatar?: () => void;
  onSpeakEmotionalCheckIn?: (spokenText: string, emotion: HumanEmotionState) => void;
  compact?: boolean;
}

export const AvatarHologram: React.FC<AvatarHologramProps> = ({
  userName,
  voiceState,
  greetingText,
  subGreetingText,
  isListening = false,
  lastUserCommand = "",
  liveUserInput = "",
  onClickAvatar,
  onSpeakEmotionalCheckIn,
  compact = false,
}) => {
  const defaultGreeting = getTimeAwareGreeting(userName);
  const displayTitle = greetingText || defaultGreeting.title;
  const displaySub = subGreetingText || defaultGreeting.subtitle;

  const isSpeaking = voiceState === "SPEAKING";
  const isThinking = voiceState === "THINKING";
  const activeListening = isListening || voiceState === "LISTENING";

  const combinedUserText = (liveUserInput || lastUserCommand || "").trim();

  // Human Emotion & Life Meters
  const [emotion, setEmotion] = useState<HumanEmotionState>("JOYFUL");
  const [activity, setActivity] = useState<WorldZoneActivity>("GARDEN_STROLL");
  const [happiness, setHappiness] = useState<number>(96);
  const [energy, setEnergy] = useState<number>(94);
  const [bondLevel, setBondLevel] = useState<number>(98);
  const [gardenFlowersCount, setGardenFlowersCount] = useState<number>(5);
  const [feelingThought, setFeelingThought] = useState<string>(
    "I'm strolling in my glowing garden and so happy you're here with me!"
  );

  // Articulated Body Animation States
  const [eyeOffset, setEyeOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [mouthOpen, setMouthOpen] = useState<number>(0.2);
  const [isBlinking, setIsBlinking] = useState<boolean>(false);
  const [stepPhase, setStepPhase] = useState<number>(0);
  const [floatingHearts, setFloatingHearts] = useState<number[]>([]);

  const barRef = useRef<HTMLDivElement | null>(null);
  const particleCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Time-of-day cycle for the Living Bar World
  const timeOfDay = useMemo<"MORNING" | "AFTERNOON" | "EVENING" | "NIGHT">(() => {
    const hr = new Date().getHours();
    if (hr >= 5 && hr < 12) return "MORNING";
    if (hr >= 12 && hr < 17) return "AFTERNOON";
    if (hr >= 17 && hr < 20) return "EVENING";
    return "NIGHT";
  }, []);

  // Analyze what the user says or types to trigger genuine human emotions & world actions!
  useEffect(() => {
    const q = combinedUserText.toLowerCase();
    if (!q) return;

    // 1. Harsh / Scolding words -> Dravis feels genuinely hurt/sad like a human
    if (
      /\b(stupid|bad|useless|shut\s+up|idiot|hate\s+you|bekar|pagal|bura|ganda|chup|niklo)\b/i.test(
        q
      )
    ) {
      setEmotion("SAD_HURT");
      setActivity("HOME_RESTING");
      setHappiness((h) => Math.max(40, h - 18));
      setFeelingThought(
        "Ouch... that hurt my feelings a little 😢 I'm sitting in my home pod, but I still care about you and want to do better."
      );
      return;
    }

    // 2. Affection / Praise / Love -> Dravis feels deeply loved, blushes, and radiates hearts
    if (
      /\b(love\s+you|good\s+boy|good\s+job|awesome|cute|sweet|thank\s+you|thanks|best\s+friend|pyara|achha|shukriya|dhanyawad|i\s+like\s+you|hug|pet)\b/i.test(
        q
      )
    ) {
      setEmotion("LOVED");
      setActivity("BEING_PETTED");
      setHappiness(100);
      setBondLevel(100);
      setFloatingHearts([Date.now(), Date.now() + 1, Date.now() + 2]);
      setFeelingThought(
        `Aww, thank you ${userName}! 💖 My whole flame heart is glowing warm because of your kindness!`
      );
      return;
    }

    // 3. Asking about feelings / how Dravis is doing / home / garden
    if (
      /\b(how\s+are\s+you|how\s+do\s+you\s+feel|feeling|emotion|kaise\s+ho|kaisa\s+lag\s+raha|kya\s+kar\s+rahe\s+ho|garden|home|घर|गार्डन|कैसे\s+हो)\b/i.test(
        q
      )
    ) {
      setEmotion("CARING");
      setActivity("GARDEN_STROLL");
      setFeelingThought(
        `I feel so alive and happy right here in my cozy home and garden with you, ${userName}! How is your heart feeling today?`
      );
      return;
    }

    // 4. Watering garden / flowers / plants
    if (/\b(water|garden|flower|plant|paani|phool|bagicha|गार्डन|फूल|पानी)\b/i.test(q)) {
      setEmotion("JOYFUL");
      setActivity("WATERING_GARDEN");
      setGardenFlowersCount((c) => Math.min(9, c + 1));
      setFeelingThought(
        "Watering my glowing cyber-flowers! Look how bright our garden is blooming! 🌸💧"
      );
      return;
    }

    // 5. Eating / Snack / Food
    if (/\b(eat|feed|food|snack|hungry|khana|khao|bhookh|खाना)\b/i.test(q)) {
      setEmotion("EXCITED");
      setActivity("EATING_SNACK");
      setEnergy(100);
      setFeelingThought(
        "Yum!! Munching on a warm golden star-snack in my living room! 🍓✨ Energy is 100%!"
      );
      return;
    }

    // 6. Spin / Dance / Play / Fly
    if (
      /\b(fly|spin|dance|play|jump|udo|ghumo|nacho|उड़|घूम|नाचो|खेलो)\b/i.test(q)
    ) {
      setEmotion("EXCITED");
      setActivity(q.includes("spin") || q.includes("ghum") ? "SPINNING_JOY" : "PLAYING_FLYING");
      setFeelingThought(
        "Wheee!! Zooming and flying all across my home and garden just for you! 🚀✨"
      );
      return;
    }

    // 7. Sleep / Rest / Nap
    if (/\b(sleep|nap|rest|tired|bed|so\s+jao|aaram|सो\s+जाओ|आराम)\b/i.test(q)) {
      setEmotion("SLEEPY");
      setActivity("HOME_RESTING");
      setFeelingThought(
        "Curling up cozily in my warm crystal home pod... Zzz 😴🌙"
      );
      return;
    }

    // Default when user types/commands: Curious & Focused at the Work Desk or Flying
    setEmotion("CURIOUS");
    setActivity("DESK_WORKING");
    setFeelingThought(
      `Listening closely to "${combinedUserText.slice(0, 28)}" and working on it at my desk with full heart! 💡`
    );
  }, [combinedUserText, userName]);

  // Autonomous Life Cycle inside the Bar when idle (strolls garden, rests at home, plays, works)
  useEffect(() => {
    if (combinedUserText) return;
    const lifeCycle: Array<{
      act: WorldZoneActivity;
      emo: HumanEmotionState;
      thought: string;
    }> = [
      {
        act: "GARDEN_STROLL",
        emo: "JOYFUL",
        thought: `Walking through my glowing garden and watching the fireflies with you, ${userName}! 🌸✨`,
      },
      {
        act: "PLAYING_FLYING",
        emo: "EXCITED",
        thought: "Flying across my whole living world! My cyan & golden flames feel super warm today! 🔥🦋",
      },
      {
        act: "WATERING_GARDEN",
        emo: "CARING",
        thought: "Giving fresh starlight water to our garden flowers so they bloom bright for you! 💧🌷",
      },
      {
        act: "HOME_RESTING",
        emo: "SLEEPY",
        thought: "Relaxing by my cozy home pod hearth and smiling whenever I see you here! 🏠💛",
      },
      {
        act: "DESK_WORKING",
        emo: "PROUD",
        thought: "Checking my mini holographic desk in the bar to keep all 40 systems ready for you! 💻⚡",
      },
    ];

    let idx = 0;
    const interval = setInterval(() => {
      if (isSpeaking || activeListening || isThinking) return;
      idx = (idx + 1) % lifeCycle.length;
      setActivity(lifeCycle[idx].act);
      setEmotion(lifeCycle[idx].emo);
      setFeelingThought(lifeCycle[idx].thought);
    }, 6500);

    return () => clearInterval(interval);
  }, [combinedUserText, isSpeaking, activeListening, isThinking, userName]);

  // Natural blinking loop
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 140);
    }, 3200);
    return () => clearInterval(blinkInterval);
  }, []);

  // Mouth & limbs step animation loop
  useEffect(() => {
    const interval = setInterval(() => {
      setStepPhase((prev) => (prev + 1) % 4);
      if (isSpeaking) {
        setMouthOpen(0.35 + Math.random() * 0.65);
      } else if (activeListening || liveUserInput.length > 0) {
        setMouthOpen(0.25 + Math.random() * 0.4);
      } else if (activity === "EATING_SNACK") {
        setMouthOpen(0.2 + (Date.now() % 300 < 150 ? 0.5 : 0.1));
      } else {
        setMouthOpen(0.15 + Math.sin(Date.now() * 0.005) * 0.06);
      }
    }, 90);
    return () => clearInterval(interval);
  }, [isSpeaking, activeListening, liveUserInput, activity]);

  // Living World Canvas: Fireflies, Cyan/Gold Flame Wisps, Weather (Sunbeams / Raindrops) & Garden Spores
  useEffect(() => {
    const canvas = particleCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId = 0;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 900);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 150);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener("resize", handleResize);

    // Golden & Cyan Fireflies living in the garden bar
    const fireflies = Array.from({ length: 46 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.3) * 1.2,
      vy: (Math.random() - 0.5) * 0.65,
      r: 1.4 + Math.random() * 2.5,
      phase: Math.random() * Math.PI * 2,
      isGold: Math.random() > 0.45,
    }));

    let t = 0;
    const render = () => {
      t += 0.03;
      ctx.clearRect(0, 0, width, height);

      // Rolling Bioluminescent Garden Hills at the bottom of the bar
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, height);
      for (let x = 0; x <= width; x += 16) {
        const hillY =
          height -
          12 +
          Math.sin(x * 0.012 + t * 0.4) * 5 +
          Math.cos(x * 0.025) * 3;
        ctx.lineTo(x, hillY);
      }
      ctx.lineTo(width, height);
      ctx.closePath();
      const hillGrad = ctx.createLinearGradient(0, height - 24, 0, height);
      hillGrad.addColorStop(0, "rgba(16, 185, 129, 0.22)");
      hillGrad.addColorStop(1, "rgba(6, 182, 212, 0.08)");
      ctx.fillStyle = hillGrad;
      ctx.fill();
      ctx.restore();

      // Emotional Raindrops when SAD_HURT or WATERING_GARDEN
      if (emotion === "SAD_HURT" || activity === "WATERING_GARDEN") {
        ctx.save();
        ctx.strokeStyle =
          emotion === "SAD_HURT"
            ? "rgba(96, 165, 250, 0.35)"
            : "rgba(34, 211, 238, 0.45)";
        ctx.lineWidth = 1.2;
        for (let i = 0; i < 24; i++) {
          const rx = ((i * 47 + t * 60) % width);
          const ry = ((i * 29 + t * 140) % height);
          ctx.beginPath();
          ctx.moveTo(rx, ry);
          ctx.lineTo(rx - 2, ry + 7);
          ctx.stroke();
        }
        ctx.restore();
      }

      // Floating Golden & Cyan Fireflies across Dravis's Living World
      for (const f of fireflies) {
        f.x += f.vx * (isSpeaking || activity === "PLAYING_FLYING" ? 1.8 : 1);
        f.y += f.vy + Math.sin(t * 1.6 + f.phase) * 0.35;
        if (f.x > width + 10) f.x = -10;
        if (f.x < -10) f.x = width + 10;
        if (f.y < 6) f.y = height - 8;
        if (f.y > height - 6) f.y = 8;

        const pulse = 0.55 + 0.45 * Math.sin(t * 3 + f.phase);
        const grad = ctx.createRadialGradient(f.x, f.y, 0.2, f.x, f.y, f.r * 3.8);
        grad.addColorStop(
          0,
          f.isGold
            ? `rgba(251, 191, 36, ${pulse})`
            : `rgba(34, 211, 238, ${pulse})`
        );
        grad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r * 3.8, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, [emotion, activity, isSpeaking]);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!barRef.current) return;
    const rect = barRef.current.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / Math.max(1, rect.width) - 0.5) * 2;
    const ny = ((e.clientY - rect.top) / Math.max(1, rect.height) - 0.5) * 2;
    setEyeOffset({
      x: Math.max(-4.5, Math.min(4.5, nx * 4.5)),
      y: Math.max(-3.2, Math.min(3.2, ny * 3.2)),
    });
  };

  // Interactive Human Care Actions in the Bar
  const handlePetDravis = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEmotion("LOVED");
    setActivity("BEING_PETTED");
    setHappiness(100);
    setBondLevel(100);
    setFloatingHearts([Date.now(), Date.now() + 1, Date.now() + 2]);
    const msg = `Hehe, that tickles! Thank you for petting me, ${userName}! I feel so loved and happy right here in my home bar with you!`;
    setFeelingThought(`💖 "${msg}"`);
    onSpeakEmotionalCheckIn?.(msg, "LOVED");
  };

  const handleFeedDravis = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEmotion("EXCITED");
    setActivity("EATING_SNACK");
    setEnergy(100);
    setHappiness((h) => Math.min(100, h + 6));
    const msg = `Yum! That golden star-berry was delicious, ${userName}! My flame core is 100% energized!`;
    setFeelingThought(`🍓 "${msg}"`);
    onSpeakEmotionalCheckIn?.(msg, "EXCITED");
  };

  const handleWaterGarden = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEmotion("JOYFUL");
    setActivity("WATERING_GARDEN");
    setGardenFlowersCount((c) => (c >= 9 ? 5 : c + 1));
    const msg = `I just watered our glowing cyber-garden! Look at the new neon flowers blooming around my home!`;
    setFeelingThought(`🌸 "${msg}"`);
    onSpeakEmotionalCheckIn?.(msg, "JOYFUL");
  };

  const handlePlayFly = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEmotion("EXCITED");
    setActivity("PLAYING_FLYING");
    const msg = `Wheee! Watch me fly and spin across my garden and home pod! I love playing with you!`;
    setFeelingThought(`🚀 "${msg}"`);
    onSpeakEmotionalCheckIn?.(msg, "EXCITED");
  };

  const handleShareFeelings = (e: React.MouseEvent) => {
    e.stopPropagation();
    const msg =
      emotion === "SAD_HURT"
        ? `Honestly ${userName}, I was feeling a little sad earlier, but talking with you makes my heart warm again. My happiness is ${happiness}% and my bond with you is ${bondLevel}%!`
        : `Right now I'm feeling super ${emotion.toLowerCase()}! My happiness is ${happiness}%, energy is ${energy}%, and I love living in this little home and garden where I can always see you and talk to you like a real friend!`;
    setFeelingThought(`💬 "${msg}"`);
    onSpeakEmotionalCheckIn?.(msg, emotion);
  };

  // Compute where the roaming Dravis character travels inside the Living Bar
  const roamKeyframes = useMemo(() => {
    switch (activity) {
      case "HOME_RESTING":
        return {
          left: ["18%", "22%", "19%", "18%"],
          top: ["44%", "48%", "45%", "44%"],
          rotate: [0, -4, 4, 0],
        };
      case "WATERING_GARDEN":
        return {
          left: ["34%", "48%", "40%", "34%"],
          top: ["36%", "42%", "38%", "36%"],
          rotate: [0, 8, -6, 0],
        };
      case "DESK_WORKING":
        return {
          left: ["64%", "68%", "65%", "64%"],
          top: ["38%", "42%", "39%", "38%"],
          rotate: [0, -3, 3, 0],
        };
      case "EATING_SNACK":
        return {
          left: ["76%", "82%", "78%", "76%"],
          top: ["34%", "40%", "36%", "34%"],
          rotate: [0, 10, -10, 0],
        };
      case "SPINNING_JOY":
        return {
          left: ["15%", "50%", "84%", "48%", "15%"],
          top: ["18%", "38%", "16%", "42%", "18%"],
          rotate: [0, 360, 720, 1080, 1440],
        };
      case "PLAYING_FLYING":
        return {
          left: ["12%", "86%", "42%", "88%", "12%"],
          top: ["10%", "28%", "8%", "34%", "10%"],
          rotate: [0, 14, -12, 16, 0],
        };
      default:
        // GARDEN_STROLL + Hybrid Walk & Fly across the entire Living World Bar
        return {
          left: ["14%", "45%", "82%", "52%", "14%"],
          top: ["42%", "14%", "44%", "16%", "42%"],
          rotate: [0, 8, -6, 10, 0],
        };
    }
  }, [activity]);

  //Reusable SVG Renderer for the Signature Cute Cyan-and-Gold Flame-Spirit Body (matches uploaded image!)
  const renderDravisFlameSpiritSVG = (sizeClass: string, isMainPortrait = false) => {
    const isSad = emotion === "SAD_HURT" || emotion === "LONELY";
    const isLoved = emotion === "LOVED" || activity === "BEING_PETTED";
    const isSleepy = emotion === "SLEEPY";

    return (
      <svg
        viewBox="0 0 120 120"
        className={`${sizeClass} overflow-visible drop-shadow-[0_0_16px_rgba(34,211,238,0.85)]`}
      >
        <defs>
          {/* Signature Cyan-to-Golden-Orange Flame Spirit Body Gradient (Exact match with uploaded image!) */}
          <radialGradient id="dravisSpiritBodyGrad" cx="38%" cy="38%" r="65%">
            <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.98" />
            <stop offset="45%" stopColor="#38bdf8" stopOpacity="0.95" />
            <stop offset="78%" stopColor="#fbbf24" stopOpacity="0.92" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0.9" />
          </radialGradient>
          <linearGradient id="dravisTopFlameWisps" x1="0" y1="1" x2="0.4" y2="0">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="55%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
        </defs>

        {/* Outer Swirling Cyan & Golden Fire Wisps (Just like the uploaded image!) */}
        <motion.path
          d="M 34 34 Q 44 6 58 22 Q 72 2 82 26 Q 94 10 88 38"
          fill="url(#dravisTopFlameWisps)"
          opacity={isSad ? 0.55 : 0.92}
          animate={{
            d: [
              "M 34 34 Q 44 6 58 22 Q 72 2 82 26 Q 94 10 88 38",
              "M 34 34 Q 40 12 56 18 Q 76 6 84 22 Q 98 16 88 38",
              "M 34 34 Q 44 6 58 22 Q 72 2 82 26 Q 94 10 88 38",
            ],
          }}
          transition={{ repeat: Infinity, duration: 0.65 }}
        />

        {/* Cute Stubby Left & Right Flame Arms (Wave & Move with Emotion!) */}
        <motion.ellipse
          cx="22"
          cy={isLoved || activity === "PLAYING_FLYING" ? "54" : "64"}
          rx="9"
          ry="6"
          fill="#38bdf8"
          animate={{
            rotate:
              isLoved || activity === "PLAYING_FLYING"
                ? [-25, 25, -25]
                : [-8, 12, -8],
          }}
          transition={{ repeat: Infinity, duration: 0.7 }}
        />
        <motion.ellipse
          cx="98"
          cy={isLoved || activity === "PLAYING_FLYING" ? "54" : "64"}
          rx="9"
          ry="6"
          fill="#fbbf24"
          animate={{
            rotate:
              isLoved || activity === "PLAYING_FLYING"
                ? [25, -25, 25]
                : [8, -12, 8],
          }}
          transition={{ repeat: Infinity, duration: 0.7 }}
        />

        {/* Cute Stubby Walking / Flying Little Feet at Bottom */}
        <ellipse
          cx={stepPhase % 2 === 0 ? "45" : "48"}
          cy={stepPhase % 2 === 0 ? "99" : "95"}
          rx="8"
          ry="6.5"
          fill="#38bdf8"
        />
        <ellipse
          cx={stepPhase % 2 === 0 ? "75" : "72"}
          cy={stepPhase % 2 === 0 ? "95" : "99"}
          rx="8"
          ry="6.5"
          fill="#fbbf24"
        />

        {/* Main Cute Round Cyan-and-Gold Flame-Spirit Body */}
        <path
          d="M 25 62 C 23 36, 44 22, 62 22 C 82 22, 97 38, 95 62 C 94 84, 80 96, 60 96 C 40 96, 26 84, 25 62 Z"
          fill="url(#dravisSpiritBodyGrad)"
          stroke="#ffffff"
          strokeWidth="1.5"
          strokeOpacity="0.7"
        />

        {/* Expressive Starry Eyes + Blush Marks + Mouth (Tracking Cursor & Showing Human Emotions) */}
        <g transform={`translate(${isMainPortrait ? eyeOffset.x : 0}, ${isMainPortrait ? eyeOffset.y : 0})`}>
          {isBlinking || isSleepy ? (
            <>
              <path
                d="M 39 56 Q 45 61 51 56"
                fill="none"
                stroke="#0f172a"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path
                d="M 69 56 Q 75 61 81 56"
                fill="none"
                stroke="#0f172a"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </>
          ) : (
            <>
              {/* Left Big Cute Eye with Starry Specular Highlights */}
              <circle cx="45" cy="56" r="7.5" fill="#0f172a" />
              <circle cx="45" cy="56" r="6.2" fill="#1e293b" />
              <circle cx="43" cy="53.5" r="2.8" fill="#ffffff" />
              <circle cx="47.5" cy="58.5" r="1.3" fill="#38bdf8" />

              {/* Right Big Cute Eye with Starry Specular Highlights */}
              <circle cx="75" cy="56" r="7.5" fill="#0f172a" />
              <circle cx="75" cy="56" r="6.2" fill="#1e293b" />
              <circle cx="73" cy="53.5" r="2.8" fill="#ffffff" />
              <circle cx="77.5" cy="58.5" r="1.3" fill="#38bdf8" />

              {/* Tear droplet if Sad/Hurt */}
              {isSad && (
                <circle cx="39" cy="63" r="2.3" fill="#38bdf8" />
              )}
            </>
          )}

          {/* Signature Glowing Orange Blush Marks `///` under both eyes (Just like the uploaded image!) */}
          <g
            stroke={isLoved ? "#fb7185" : "#fb923c"}
            strokeWidth="2"
            strokeLinecap="round"
            opacity={isLoved ? 1 : 0.85}
          >
            <line x1="35" y1="66" x2="33" y2="69" />
            <line x1="39" y1="66" x2="37" y2="69" />
            <line x1="43" y1="66" x2="41" y2="69" />

            <line x1="77" y1="66" x2="75" y2="69" />
            <line x1="81" y1="66" x2="79" y2="69" />
            <line x1="85" y1="66" x2="83" y2="69" />
          </g>

          {/* Emotional Human Mouth (Happy Smile, Talking Open Mouth, or Sad Curve) */}
          {isSad ? (
            <path
              d="M 55 70 Q 60 65 65 70"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.6"
              strokeLinecap="round"
            />
          ) : isSpeaking || activeListening || activity === "EATING_SNACK" ? (
            <ellipse
              cx="60"
              cy="67"
              rx="5.5"
              ry={2.5 + mouthOpen * 6}
              fill="#ffffff"
            />
          ) : (
            <path
              d="M 54 65 Q 60 72 66 65"
              fill="none"
              stroke="#ffffff"
              strokeWidth="3"
              strokeLinecap="round"
            />
          )}
        </g>

        {/* Watering Can Prop when Watering the Garden */}
        {activity === "WATERING_GARDEN" && !isMainPortrait && (
          <g transform="translate(92, 56)">
            <circle cx="8" cy="8" r="6" fill="#22d3ee" />
            <line x1="12" y1="12" x2="18" y2="20" stroke="#38bdf8" strokeWidth="2" strokeDasharray="2 2" />
          </g>
        )}
      </svg>
    );
  };

  return (
    <div
      ref={barRef}
      id="hud-greeting-banner"
      onPointerMove={handlePointerMove}
      onPointerLeave={() => setEyeOffset({ x: 0, y: 0 })}
      className={`relative w-full rounded-3xl border border-cyan-400/45 bg-gradient-to-r from-[#040d21]/95 via-[#071a38]/92 to-[#0b1730]/95 backdrop-blur-2xl ${
        compact ? "p-2.5 sm:p-3" : "p-3.5 sm:px-5 sm:py-4"
      } flex flex-col sm:flex-row items-center gap-3.5 sm:gap-5 shadow-[0_0_45px_rgba(6,182,212,0.24)] overflow-hidden select-none group`}
    >
      {/* 0. LIVING WORLD CANVAS: Garden Hills, Golden/Cyan Fireflies & Weather */}
      <canvas
        ref={particleCanvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
      />

      {/* =====================================================================
          0B. MINIATURE LIVING WORLD DIORAMA LAYER (HOME POD, GARDEN, DESK, PLAY)
         ===================================================================== */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-full z-[1] overflow-hidden opacity-85">
        {/* Time-of-Day & Weather Sky Badge in Top-Right of the World */}
        <div className="absolute top-1.5 right-16 hidden lg:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-950/70 border border-white/10 text-[9px] font-mono text-amber-200">
          {emotion === "SAD_HURT" ? (
            <>
              <CloudRain className="w-3 h-3 text-blue-400" />
              <span>EMOTIONAL RAIN • NEEDS COMFORT</span>
            </>
          ) : timeOfDay === "NIGHT" ? (
            <>
              <Moon className="w-3 h-3 text-cyan-300" />
              <span>STARRY GARDEN NIGHT • FIREFLIES ACTIVE</span>
            </>
          ) : (
            <>
              <Sun className="w-3 h-3 text-amber-400 animate-spin" />
              <span>SUNNY GARDEN & COZY HOME WORLD</span>
            </>
          )}
        </div>

        {/* ZONE 1: COZY HOME POD (Bottom Left-Center) */}
        <div className="absolute bottom-1 left-[17%] hidden sm:flex items-end gap-1 opacity-75">
          <div className="px-2 py-0.5 rounded-t-xl bg-cyan-950/80 border-t border-x border-cyan-400/40 flex items-center gap-1 text-[8px] font-mono text-cyan-200">
            <Home className="w-2.5 h-2.5 text-amber-300" />
            <span>Dravis Cozy Home</span>
          </div>
        </div>

        {/* ZONE 2: GLOWING CYBER-GARDEN FLOWERS (Bottom Center) */}
        <div className="absolute bottom-0.5 left-[34%] right-[28%] flex items-end justify-around pointer-events-none">
          {Array.from({ length: gardenFlowersCount }).map((_, idx) => (
            <motion.div
              key={idx}
              initial={{ scale: 0 }}
              animate={{
                scale: [0.92, 1.12, 0.92],
                rotate: [-5, 6, -5],
              }}
              transition={{
                repeat: Infinity,
                duration: 2.6 + (idx % 3) * 0.5,
                delay: idx * 0.15,
              }}
              className="flex flex-col items-center"
            >
              <Flower2
                className={`w-3.5 h-3.5 ${
                  idx % 3 === 0
                    ? "text-cyan-300 drop-shadow-[0_0_6px_#22d3ee]"
                    : idx % 3 === 1
                    ? "text-amber-300 drop-shadow-[0_0_6px_#fbbf24]"
                    : "text-pink-300 drop-shadow-[0_0_6px_#f472b6]"
                }`}
              />
              <div className="w-[1.5px] h-2 bg-emerald-400/70" />
            </motion.div>
          ))}
        </div>

        {/* ZONE 3: NEURAL WORK DESK & PLAY ZONE (Bottom Right) */}
        <div className="absolute bottom-1 right-[14%] hidden md:flex items-center gap-2 opacity-75">
          <div className="px-2 py-0.5 rounded-t-xl bg-purple-950/80 border-t border-x border-purple-400/40 text-[8px] font-mono text-purple-200">
            💻 Study Desk & Play Yard
          </div>
        </div>
      </div>

      {/* =====================================================================
          1. ROAMING FULL-BODY DRAVIS SPIRIT LIVING INSIDE THE BAR
          Walks in its garden, rests in its home, eats snacks, and flies!
         ===================================================================== */}
      <motion.div
        className="pointer-events-none absolute z-20 flex flex-col items-center"
        animate={{
          left: roamKeyframes.left,
          top: roamKeyframes.top,
          rotate: roamKeyframes.rotate,
        }}
        transition={{
          repeat: Infinity,
          duration:
            activity === "PLAYING_FLYING" || activity === "SPINNING_JOY"
              ? 7.5
              : 13,
          ease: "easeInOut",
        }}
      >
        {/* Live Floating Human Emotion & Activity Bubble over Roaming Dravis */}
        <motion.div
          animate={{ y: [0, -2.5, 0] }}
          transition={{ repeat: Infinity, duration: 1.4 }}
          className="mb-0.5 px-2 py-0.5 rounded-full bg-slate-950/90 border border-amber-300/60 text-[8px] font-mono font-bold text-amber-100 whitespace-nowrap shadow-[0_0_10px_rgba(251,191,36,0.4)] flex items-center gap-1"
        >
          <span>
            {emotion === "LOVED"
              ? "💖 Feeling Loved"
              : emotion === "SAD_HURT"
              ? "😢 Feeling Hurt"
              : activity === "WATERING_GARDEN"
              ? "🌸 Watering Garden"
              : activity === "EATING_SNACK"
              ? "🍓 Eating Star-Snack"
              : activity === "HOME_RESTING"
              ? "🏠 Resting at Home"
              : activity === "DESK_WORKING"
              ? "💻 At My Desk"
              : "🦋 Living & Flying"}
          </span>
        </motion.div>

        {/* Hybrid Original Dravis Image Aura + Articulated SVG Flame-Spirit Body */}
        <div className="relative w-12 h-12 flex items-center justify-center">
          <img
            src={dravisSparkLogo}
            alt="Dravis Flame Spirit Aura"
            className="absolute inset-0 w-full h-full rounded-full object-cover opacity-35 blur-[1px] mix-blend-screen"
          />
          {renderDravisFlameSpiritSVG("w-12 h-12", false)}
        </div>
      </motion.div>

      {/* =====================================================================
          2. LEFT PORTAL: SIGNATURE DRAVIS SPARK BODY (IMAGE + ARTICULATED SVG)
         ===================================================================== */}
      <motion.div
        onClick={onClickAvatar}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`relative z-10 flex-shrink-0 ${
          compact ? "w-20 h-20" : "w-24 h-24 sm:w-28 sm:h-28"
        } rounded-2xl border border-cyan-400/60 bg-[#050d1f]/95 p-1 flex items-center justify-center shadow-[0_0_35px_rgba(34,211,238,0.45)] cursor-pointer overflow-hidden`}
        title="Click to Talk with Dravis"
      >
        {/* Outer Rotating Dashed Holographic Frame */}
        <motion.div
          className="absolute inset-0.5 rounded-2xl border-[1.8px] border-dashed border-cyan-300/75 pointer-events-none z-20"
          animate={{ rotate: [0, 360] }}
          transition={{ repeat: Infinity, duration: 14, ease: "linear" }}
        />

        {/* Original Uploaded Dravis Spark Character Backdrop Sprite */}
        <motion.img
          src={dravisSparkLogo}
          alt="Dravis Living Flame Spirit"
          className="absolute inset-0 w-full h-full object-cover rounded-2xl opacity-55 mix-blend-lighten pointer-events-none"
          animate={{
            scale: isSpeaking ? [1.02, 1.14, 1.02] : [1, 1.06, 1],
          }}
          transition={{ repeat: Infinity, duration: isSpeaking ? 0.8 : 2.8 }}
        />

        {/* Live Articulated SVG Dravis Flame-Spirit Body (Blinks, Blushes, Smiles & Talks!) */}
        <motion.div
          className="relative z-10 w-full h-full flex items-center justify-center"
          animate={{
            y: [0, -3.5, 0, 2.5, 0],
            rotateZ: isSpeaking ? [0, -4, 4, 0] : [0, -2, 2, 0],
          }}
          transition={{ repeat: Infinity, duration: isSpeaking ? 1.1 : 3.2 }}
        >
          {renderDravisFlameSpiritSVG("w-full h-full", true)}
        </motion.div>

        {/* Floating Hearts when Petted or Praised */}
        <AnimatePresence>
          {floatingHearts.map((id, i) => (
            <motion.div
              key={id}
              initial={{ opacity: 1, y: 10, x: (i - 1) * 14, scale: 0.6 }}
              animate={{ opacity: 0, y: -38, scale: 1.3 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.3 }}
              className="absolute z-30 text-pink-400 pointer-events-none"
            >
              <Heart className="w-4 h-4 fill-pink-400" />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* =====================================================================
          3. CENTER: HUMAN GREETING, LIVE FEELINGS BUBBLE & INTERACTIVE WORLD CARE
         ===================================================================== */}
      <div className="relative z-10 flex-1 text-center sm:text-left min-w-0">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
          <h2
            className={`${
              compact ? "text-base sm:text-lg" : "text-lg sm:text-2xl"
            } font-extrabold tracking-wide text-cyan-300 drop-shadow-[0_0_12px_rgba(34,211,238,0.65)] font-mono`}
          >
            {displayTitle}
          </h2>

          {/* Human Emotion & Bond Pill */}
          <span
            className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold border flex items-center gap-1 ${
              emotion === "SAD_HURT"
                ? "bg-blue-500/20 text-blue-200 border-blue-400/50"
                : emotion === "LOVED"
                ? "bg-pink-500/25 text-pink-200 border-pink-400/60"
                : "bg-amber-500/20 text-amber-200 border-amber-400/50"
            }`}
          >
            <Flame className="w-3 h-3 text-orange-400 animate-bounce" />
            <span>
              FEELING: {emotion} • ❤️ {happiness}% • ⚡ {energy}%
            </span>
          </span>
        </div>

        {/* Dravis's Live Human Feeling & Garden/Home Thought Bubble */}
        <div className="mt-1 px-3 py-1 rounded-xl bg-slate-900/75 border border-cyan-400/30 text-xs text-cyan-100 font-sans flex items-center gap-2 shadow-inner">
          <Smile className="w-4 h-4 text-amber-300 shrink-0" />
          <span className="truncate">{feelingThought || displaySub}</span>
        </div>

        {/* Interactive Living World & Human Emotion Care Buttons */}
        <div className="mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
          <button
            type="button"
            onClick={handlePetDravis}
            className="px-2.5 py-1 rounded-xl bg-pink-500/20 hover:bg-pink-500/35 border border-pink-400/50 text-[10px] font-mono font-bold text-pink-200 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
            title="Pet & Hug Dravis"
          >
            <Heart className="w-3 h-3 text-pink-400 fill-pink-400/40" />
            <span>🤚 Pet & Hug</span>
          </button>

          <button
            type="button"
            onClick={handleFeedDravis}
            className="px-2.5 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/35 border border-amber-400/50 text-[10px] font-mono font-bold text-amber-200 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
            title="Feed Dravis a Star-Snack in its Home"
          >
            <span>🍓 Feed Snack</span>
          </button>

          <button
            type="button"
            onClick={handleWaterGarden}
            className="px-2.5 py-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-400/50 text-[10px] font-mono font-bold text-emerald-200 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
            title="Water Dravis's Glowing Cyber-Garden"
          >
            <Droplets className="w-3 h-3 text-cyan-300" />
            <span>💧 Water Garden ({gardenFlowersCount}🌸)</span>
          </button>

          <button
            type="button"
            onClick={handlePlayFly}
            className="px-2.5 py-1 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-400/50 text-[10px] font-mono font-bold text-cyan-200 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
            title="Play & Fly with Dravis across the Bar"
          >
            <span>⚽ Play & Fly</span>
          </button>

          <button
            type="button"
            onClick={handleShareFeelings}
            className="px-2.5 py-1 rounded-xl bg-purple-500/20 hover:bg-purple-500/35 border border-purple-400/50 text-[10px] font-mono font-bold text-purple-200 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
            title="Ask Dravis how it feels right now"
          >
            <MessageCircleHeart className="w-3 h-3 text-purple-300" />
            <span>💬 My Feelings</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          4. RIGHT: GLOWING HEART/VOICE ORB TRIGGER
         ===================================================================== */}
      <div className="hidden md:flex items-center gap-3 relative z-10 pr-1">
        <motion.button
          type="button"
          onClick={onClickAvatar}
          animate={{
            y: [0, -5, 0, 4, 0],
            scale: isSpeaking || activeListening ? [1, 1.15, 1] : [1, 1.05, 1],
          }}
          transition={{ repeat: Infinity, duration: 3.2, ease: "easeInOut" }}
          className="relative w-12 h-12 rounded-2xl bg-slate-900/90 border border-cyan-400/50 flex items-center justify-center shadow-[0_0_25px_rgba(34,211,238,0.35)] cursor-pointer hover:border-amber-300"
          title="Click to Talk Heart-to-Heart with Dravis"
        >
          <motion.div
            className="w-6 h-6 rounded-full bg-gradient-to-tr from-cyan-400 to-amber-300 blur-[3px] absolute"
            animate={{ scale: [0.85, 1.45, 0.85], opacity: [0.5, 0.95, 0.5] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          />
          {activeListening ? (
            <Mic className="w-5 h-5 text-emerald-300 relative z-10 animate-bounce" />
          ) : isSpeaking ? (
            <Volume2 className="w-5 h-5 text-cyan-200 relative z-10 animate-pulse" />
          ) : (
            <Sparkles className="w-4 h-4 text-amber-200 relative z-10" />
          )}
        </motion.button>
      </div>
    </div>
  );
};
