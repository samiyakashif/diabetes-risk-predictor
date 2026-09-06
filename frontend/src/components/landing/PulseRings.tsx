"use client";

export function PulseRings() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div
        className="absolute top-[-80px] right-[5%] w-[480px] h-[480px] rounded-full opacity-[0.07]"
        style={{
          background: "radial-gradient(circle, #0D7A8A 0%, transparent 70%)",
          animation: "pulse-orb 6s ease-in-out infinite",
        }}
      />
      <div
        className="absolute bottom-[-60px] left-[8%] w-[360px] h-[360px] rounded-full opacity-[0.06]"
        style={{
          background: "radial-gradient(circle, #2A9E6B 0%, transparent 70%)",
          animation: "pulse-orb 8s ease-in-out infinite 2s",
        }}
      />
      <div
        className="absolute top-[30%] left-[40%] w-[280px] h-[280px] rounded-full opacity-[0.05]"
        style={{
          background: "radial-gradient(circle, #6264A0 0%, transparent 70%)",
          animation: "pulse-orb 10s ease-in-out infinite 1s",
        }}
      />
      <div className="absolute top-[20%] right-[12%]">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="absolute rounded-full border border-primary/15"
            style={{
              width: 120 + i * 60,
              height: 120 + i * 60,
              top: -(60 + i * 30),
              left: -(60 + i * 30),
              animation: `ring-expand 3.5s ease-out infinite ${i * 1.1}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}