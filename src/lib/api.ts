interface Quote {
  quote: string;
  author: string;
}

export async function fetchQuote(): Promise<Quote> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch("https://aot-api.vercel.app/quote", {
      cache: "no-store",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch quote: ${response.status}`);
    }

    const data = await response.json();

    if (!data.quote || !data.author) {
      throw new Error("Invalid quote data received");
    }

    return data;
  } catch (error) {
    const fallbackQuotes = [
      {
        quote: "The only way to do great work is to love what you do.",
        author: "Steve Jobs",
      },
      {
        quote: "Life is what happens when you're busy making other plans.",
        author: "John Lennon",
      },
      {
        quote:
          "The future belongs to those who believe in the beauty of their dreams.",
        author: "Eleanor Roosevelt",
      },
      {
        quote:
          "It is during our darkest moments that we must focus to see the light.",
        author: "Aristotle",
      },
    ];

    const randomQuote =
      fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
    return randomQuote;
  }
}

export async function addToFavoritesAPI(quoteData: Quote) {
  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: `Favorite Quote by ${quoteData.author}`,
        body: quoteData.quote,
        userId: 1,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to add favorite: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    return { id: Date.now(), success: true };
  }
}
