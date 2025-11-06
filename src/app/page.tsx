import { fetchQuote } from "@/lib/api";
import QuoteDisplay from "./components/QuoteDisplay";

export default async function Home() {
  const quote = await fetchQuote();

  return <QuoteDisplay initialQuote={quote} />;
}
