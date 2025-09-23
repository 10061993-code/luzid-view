// app/view/[user]/[date]/page.tsx
type Params = { user: string; date: string };

export default async function Page({ params }: { params: Promise<Params> }) {
  const { user, date } = await params;

  const embedSrc = `/view/${encodeURIComponent(user)}/${encodeURIComponent(date)}/embed?v=${Date.now()}`;

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        background: "#000",
      }}
    >
      <iframe
        src={embedSrc}
        title={`${user} ${date} preview`}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          border: "0",
          display: "block",
          background: "#fff",
        }}
        allow="fullscreen; clipboard-read; clipboard-write"
      />
    </div>
  );
}

