"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { AnimatedArrowUpRight } from "@/components/ui/animated";
import { LoginModal } from "@/components/modals/log-in-modal";

interface PromptItem {
  text: string;
}

const TOP_ROWS: PromptItem[][] = [
  // Top Row 1 (to left)
  [
    { text: "मेरी रसोई में मौजूद सामग्री से एक सैंडविच बनाएँ" },
    { text: "How come orange juice prices have dropped?" },
    { text: "Me ajuda a estudar vocabulário pro vestibular" },
    { text: "Máximos goleadores de la Champions y mejores momentos de los partidos" },
    { text: "Meilleurs buteurs de la Ligue des champions et temps forts des matchs" },
    { text: "料理好きの友だちへのプレゼントのアイデアを教えて" },
    { text: "Erstelle einen Content-Kalender für einen TikTok-Account" },
    { text: "Explain quantum computing in simple terms for a beginner" },
  ],
  // Top Row 2 (to right)
  [
    { text: "Plan a trip to explore Seoul like a local" },
    { text: "कैमरे पर अच्छा दिखने वाला आउटफिट चुनने में मेरी मदद करें" },
    { text: "Write a text asking a friend to be my plus-one at a wedding" },
    { text: "Ayúdame a redactar un correo de seguimiento tras una entrevista" },
    { text: "Planeje um dia de saúde mental pra eu recarregar as energias" },
    { text: "Aide-moi à rédiger un e-mail de relance après un entretien" },
    { text: "Daftar pencetak gol terbanyak Liga Champions dan sorotan pertandingan" },
    { text: "Hilf mir, eine Nachfass-E-Mail nach einem Vorstellungsgespräch zu schreiben" },
  ],
  // Top Row 3 (to left)
  [
    { text: "Buenos sitios para brunch cerca de mí con mesas al aire libre" },
    { text: "Help me write a follow-up email after an interview" },
    { text: "면접 후에 보낼 감사 이메일을 작성해줘" },
    { text: "Explique \"nostalgia\" para uma criança de 6 anos" },
    { text: "Bantu saya memilih pakaian yang terlihat bagus di kamera" },
    { text: "Donne-moi des idées pour utiliser les dessins de mes enfants" },
    { text: "短い買い物リスト付きの1週間の献立を作って" },
    { text: "Write a python script to automate file organization" },
  ],
  // Top Row 4 (to right)
  [
    { text: "Consejos para preparar una maratón desde cero" },
    { text: "Brief me on the latest breakthrough in fusion energy" },
    { text: "Comment négocier son premier salaire après l'université" },
    { text: "자연어 처리 트랜스포머 아키텍처의 핵심 요약" },
    { text: "एक सप्ताह में कोडिंग सीखने की व्यावहारिक योजना" },
    { text: "Panduan memulai investasi saham untuk pemula" },
    { text: "Short bedtime story about a curious robotic fox" },
    { text: "Recette rapide de gâteau au chocolat sans gluten" },
  ],
];

const BOTTOM_ROWS: PromptItem[][] = [
  // Bottom Row 1 (to right)
  [
    { text: "Suggest healthy high-protein lunch meal prep recipes" },
    { text: "Como começar a investir em renda fixa com pouco dinheiro" },
    { text: "Propose des idées d'activités en famille pour un week-end pluvieux" },
    { text: "자바스크립트 비동기 프로그래밍 개념을 쉽게 설명해줘" },
    { text: "Tips memilih laptop terbaik untuk mahasiswa teknik" },
    { text: "एक शुरुआती स्तर का 30 मिनट का कसरत प्लान तैयार करें" },
    { text: "Summarize key differences between machine learning and deep learning" },
    { text: "Bagaimana harga minyak memengaruhi pasar energi global" },
  ],
  // Bottom Row 2 (to left)
  [
    { text: "Create a minimalist logo design brief for a coffee shop" },
    { text: "Wie optimiere ich meine Website für mobile Suchanfragen" },
    { text: "Quels sont les meilleurs exercices pour améliorer la posture" },
    { text: "Consejos para aprender un nuevo idioma desde cero en 6 meses" },
    { text: "英語のリスニング力を短期間で上げる勉強法を教えて" },
    { text: "ब्लॉग पोस्ट के लिए आकर्षक शीर्षक के 10 सुझाव दें" },
    { text: "Write an engaging introductory email to a potential client" },
    { text: "Latest EU inflation data and economic forecast" },
  ],
  // Bottom Row 3 (to right)
  [
    { text: "Ideas for a modern living room interior with neutral tones" },
    { text: "Panduan langkah demi langkah membuat portofolio web developer" },
    { text: "Estratégias simples para manter o foco durante os estudos" },
    { text: "Recherche d'inspiration pour une histoire courte de science-fiction" },
    { text: "10-minütige Dehnübungen gegen Rückenschmerzen im Büro" },
    { text: "React 19 의 새로운 훅과 주요 변경사항 요약" },
    { text: "Best practices for writing clean and maintainable code" },
    { text: "दैनिक जीवन में तनाव कम करने के 5 प्रभावी उपाय" },
  ],
  // Bottom Row 4 (to left)
  [
    { text: "Explain general relativity with thought experiments" },
    { text: "Strategien für ein erfolgreiches Gehaltsgespräch" },
    { text: "Dicas de fotografia urbana com smartphone" },
    { text: "머신러닝 과적합을 방지하는 5가지 핵심 기법" },
    { text: "व्यापार शुरू करने के लिए 10 कम लागत वाले विचार" },
    { text: "Tips memilih kopi specialty berkualitas tinggi" },
    { text: "Guide to building scalable microservices in Node.js" },
    { text: "Idées de cadeaux écologiques et originaux pour les fêtes" },
  ],
];

function PromptCardRow({
  row,
  rowIndex,
  isToLeft,
}: {
  row: PromptItem[];
  rowIndex: number;
  isToLeft: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Duplicate 3 times for a completely seamless loop on any screen width
  const items = [...row, ...row, ...row];
  const duration = 60 + (rowIndex % 3) * 10;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let rafId: number;

    const lerp = (a: number, b: number, t: number) => Math.round(a + (b - a) * t);

    const checkCards = () => {
      const containerRect = container.getBoundingClientRect();
      const cards = container.querySelectorAll<HTMLElement>('[data-prompt-card]');

      cards.forEach((card) => {
        const cardRect = card.getBoundingClientRect();
        const cardWidth = cardRect.width;

        // How much of the card is inside the container
        const visibleLeft = Math.max(cardRect.left, containerRect.left);
        const visibleRight = Math.min(cardRect.right, containerRect.right);
        const visibleWidth = Math.max(0, visibleRight - visibleLeft);

        // Ratio: 1 = fully visible, 0 = fully hidden
        const visibleRatio = cardWidth > 0 ? visibleWidth / cardWidth : 1;
        // Mute factor: 0 = original, 1 = fully muted
        const muteFactor = Math.max(0, Math.min(1, 1 - visibleRatio));

        // bg: #2f2f2f (47) → #0d0d0d (13)
        const bgVal = lerp(47, 13, muteFactor);
        card.style.backgroundColor = `rgb(${bgVal}, ${bgVal}, ${bgVal})`;

        // border: rgba(255,255,255,0.1) → match bg
        const borderAlpha = lerp(10, 0, muteFactor); // 10% → 0% white opacity
        card.style.borderColor = muteFactor > 0.5
          ? `rgb(${bgVal}, ${bgVal}, ${bgVal})`
          : `rgba(255, 255, 255, ${borderAlpha / 100})`;

        // text: #fff (255) → #a6a6a6 (166)
        const span = card.querySelector('span') as HTMLElement | null;
        if (span) {
          const textVal = lerp(255, 166, muteFactor);
          span.style.color = `rgb(${textVal}, ${textVal}, ${textVal})`;
        }
      });

      rafId = requestAnimationFrame(checkCards);
    };

    rafId = requestAnimationFrame(checkCards);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <div ref={containerRef} className="marquee-row overflow-hidden whitespace-nowrap py-1 flex items-center">
      <div
        className={isToLeft ? "marquee-track-left" : "marquee-track-right"}
        style={{ "--duration": `${duration}s` } as React.CSSProperties}
      >
        {items.map((item, itemIndex) => (
          <Link
            data-prompt-card
            key={`${rowIndex}-${itemIndex}`}
            href={`/gc?p=${encodeURIComponent(item.text)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group shrink-0 w-[250px] sm:w-[275px] md:w-[300px] h-[70px] sm:h-[80px] px-3 py-1.5 sm:py-3 rounded-sm bg-white hover:bg-secondary border border-border/80 dark:border-white/10 dark:bg-[#2f2f2f] dark:hover:bg-[#383838] flex flex-col justify-center transition-colors duration-150 cursor-pointer select-none text-left whitespace-normal overflow-hidden"
          >
            <span className="text-[14px] sm:text-base leading-[1.3] text-foreground transition-colors line-clamp-4 whitespace-normal break-words">
              {item.text}{" "}
              <AnimatedArrowUpRight
                size={15}
                className="inline-flex align-middle shrink-0 text-foreground transition-colors -translate-y-[0.5px]"
              />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function NotFound() {
  const [showLoginModal, setShowLoginModal] = useState(false);

  return (
    <div className="relative w-screen h-[100dvh] overflow-hidden bg-black text-foreground flex flex-col justify-between items-center select-none">
      <style>{`
        @keyframes marquee-to-left {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-33.333333%, 0, 0); }
        }
        @keyframes marquee-to-right {
          0% { transform: translate3d(-33.333333%, 0, 0); }
          100% { transform: translate3d(0, 0, 0); }
        }
        .marquee-track-left {
          display: flex;
          gap: 10px;
          width: max-content;
          will-change: transform;
          animation: marquee-to-left var(--duration, 70s) linear infinite;
        }
        .marquee-track-right {
          display: flex;
          gap: 10px;
          width: max-content;
          will-change: transform;
          animation: marquee-to-right var(--duration, 70s) linear infinite;
        }
        .marquee-row:hover .marquee-track-left,
        .marquee-row:hover .marquee-track-right {
          animation-play-state: paused;
        }
        .mask-top-fade {
          -webkit-mask-image: linear-gradient(
            to bottom,
            black 45%,
            rgba(0, 0, 0, 0.65) 72%,
            rgba(0, 0, 0, 0.2) 92%,
            transparent 100%
          );
          mask-image: linear-gradient(
            to bottom,
            black 45%,
            rgba(0, 0, 0, 0.65) 72%,
            rgba(0, 0, 0, 0.2) 92%,
            transparent 100%
          );
        }
        .mask-bottom-fade {
          -webkit-mask-image: linear-gradient(
            to top,
            black 45%,
            rgba(0, 0, 0, 0.65) 72%,
            rgba(0, 0, 0, 0.2) 92%,
            transparent 100%
          );
          mask-image: linear-gradient(
            to top,
            black 45%,
            rgba(0, 0, 0, 0.65) 72%,
            rgba(0, 0, 0, 0.2) 92%,
            transparent 100%
          );
        }
      `}</style>

      {/* Top 4 Marquee Rows with gradient fade into center */}
      <div className="w-full pt-1.5 sm:pt-2 pointer-events-auto shrink-0 z-0">
        <div className="mask-top-fade space-y-1">
          {TOP_ROWS.map((row, index) => (
            <PromptCardRow
              key={`top-${index}`}
              row={row}
              rowIndex={index}
              isToLeft={index % 2 === 0}
            />
          ))}
        </div>
      </div>

      {/* Center 404 Section: Dead center of the viewport */}
      <main className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none select-none px-4">
        <div className="pointer-events-auto text-center flex flex-col items-center max-w-lg w-full">
          <h1 className="text-8xl sm:text-9xl md:text-[140px] font-bold tracking-tight text-[#b4b4b4] leading-none select-none font-sans">
            404
          </h1>
          <p className="text-xl font-semibold text-white mt-2 sm:mt-3 select-none tracking-tight font-sans">
            Page not found
          </p>

          <div className="flex items-center justify-center gap-3 mt-6 sm:mt-8">
            <button
              type="button"
              onClick={() => setShowLoginModal(true)}
              className="h-10 px-4 rounded-full bg-white hover:bg-secondary text-black border border-border/80 dark:border-none dark:bg-[#2f2f2f] dark:hover:bg-[#383838] dark:text-white text-base font-normal transition-colors cursor-pointer flex items-center justify-center text-center leading-none"
            >
              Log in
            </button>
            <Link
              href="/gc"
              className="h-10 px-4 rounded-full bg-black hover:bg-neutral-800 active:scale-[0.99] text-white border border-transparent dark:bg-white dark:text-black dark:border-none dark:hover:opacity-90 text-base font-medium transition-colors cursor-pointer flex items-center justify-center text-center leading-none"
            >
              Ask CloseAI
              <AnimatedArrowUpRight size={15} />
            </Link>
          </div>
        </div>
      </main>

      {/* Bottom 4 Marquee Rows with gradient fade into center */}
      <div className="w-full pb-1.5 sm:pb-2 pointer-events-auto shrink-0 z-0">
        <div className="mask-bottom-fade space-y-1">
          {BOTTOM_ROWS.map((row, index) => (
            <PromptCardRow
              key={`bottom-${index}`}
              row={row}
              rowIndex={index + 4}
              isToLeft={index % 2 !== 0}
            />
          ))}
        </div>
      </div>

      {/* Auth Modal for Sign up */}
      <LoginModal
        open={showLoginModal}
        onOpenChange={setShowLoginModal}
      />
    </div>
  );
}
