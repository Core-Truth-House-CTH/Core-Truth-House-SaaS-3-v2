function DashboardHero({ imagePath }) {
  return (
    <section style={{
      position: "relative",
      overflow: "hidden",
      minHeight: "clamp(270px, 25vw, 330px)",
      background: `
        url('${imagePath}')
        center center / cover no-repeat`,
      borderBottom:
        "1px solid rgba(216,197,195,0.65)",
      isolation: "isolate",
    }}>
      <div style={{
        position: "absolute",
        inset: 0,
        backgroundImage: `
          linear-gradient(
            rgba(255,255,255,0.04) 1px,
            transparent 1px
          ),
          linear-gradient(
            90deg,
            rgba(255,255,255,0.04) 1px,
            transparent 1px
          )`,
        backgroundSize: "44px 44px",
        pointerEvents: "none",
        zIndex: 0,
      }} />
    </section>
  );
}

export default DashboardHero;
