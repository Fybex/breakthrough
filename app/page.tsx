import Game from "@/components/game/Game";

export default function Home() {
  return (
    <main className="min-h-screen p-4 sm:p-8 flex items-center justify-center">
      <div className="w-full max-w-[820px]">
        <h1 className="text-2xl font-semibold mb-4 sm:mb-6 text-center">Breakthrough</h1>
        <Game />
      </div>
    </main>
  );
}
