import dynamic from "next/dynamic";

// SPA client-side: evita SSR para o roteamento por hash e o fetch dos dados
const App = dynamic(() => import("./App"), { ssr: false });

export default function Home() {
  return <App />;
}
