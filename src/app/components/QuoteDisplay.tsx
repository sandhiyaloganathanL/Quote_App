"use client";

import { addToFavoritesAPI, fetchQuote } from "@/lib/api";
import { useState, useEffect, useCallback, memo } from "react";
import {
  SunIcon,
  MoonIcon,
  HeartIcon,
  StarIcon,
  TrashIcon,
  SparklesIcon,
  LoaderIcon,
  CheckIcon,
  AlertIcon,
  XCircleIcon,
} from "./icons";

// Types
interface Quote {
  quote: string;
  author: string;
}

interface FavoriteItem {
  id: number;
  author: string;
  quote: string;
  addedAt: string;
}

// Loader component
const Loader = memo(({
  size = "default",
  text = "",
}: {
  size?: "small" | "default" | "large";
  text?: string;
}) => {
  const sizeClasses = {
    small: "w-4 h-4",
    default: "w-6 h-6",
    large: "w-8 h-8",
  };

  return (
    <div className="flex items-center justify-center gap-2">
      <LoaderIcon className={`${sizeClasses[size]} text-teal-500`} />
      {text && <span className="text-sm">{text}</span>}
    </div>
  );
});

Loader.displayName = 'Loader';

export default function QuoteDisplay({
  initialQuote,
}: {
  initialQuote: Quote;
}) {
  // States
  const [currentQuote, setCurrentQuote] = useState<Quote>(initialQuote);
  const [isLoading, setIsLoading] = useState({
    quote: false,
    favorite: false,
  });
  const [message, setMessage] = useState("");
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Load theme, favorites, and cached quote on mount
  useEffect(() => {
    // Apply theme
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldBeDark = savedTheme === "dark" || (!savedTheme && prefersDark);
    
    setIsDarkMode(shouldBeDark);
    
    if (shouldBeDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // Load data from localStorage
    const loadData = () => {
      const savedFavorites = localStorage.getItem("favoriteQuotes");
      if (savedFavorites) {
        try {
          const parsedFavorites = JSON.parse(savedFavorites);
          setFavorites(Array.isArray(parsedFavorites) ? parsedFavorites : []);
        } catch (error) {
          console.error("Error parsing favorites:", error);
          setFavorites([]);
        }
      }

      const cachedQuote = localStorage.getItem("lastQuote");
      if (cachedQuote) {
        try {
          const parsedQuote = JSON.parse(cachedQuote);
          if (parsedQuote?.quote && parsedQuote?.author) {
            setCurrentQuote(parsedQuote);
          }
        } catch (error) {
          console.error("Error parsing cached quote:", error);
        }
      }
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      requestIdleCallback(loadData);
    } else {
      setTimeout(loadData, 0);
    }
  }, []);

  // Toggle theme
  const toggleTheme = useCallback(() => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);

    if (newMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  // Fetch new quote
  const handleNextQuote = useCallback(async () => {
    setIsLoading((prev) => ({ ...prev, quote: true }));
    setIsAnimating(true);
    setMessage("");

    try {
      const newQuote = await fetchQuote();
      
      if (newQuote?.quote && newQuote?.author) {
        localStorage.setItem("lastQuote", JSON.stringify(newQuote));

        setTimeout(() => {
          setCurrentQuote(newQuote);
          setTimeout(() => {
            setIsAnimating(false);
          }, 50);
        }, 400);
      }
    } catch (error) {
      setMessage("error");
      setIsAnimating(false);
    } finally {
      setIsLoading((prev) => ({ ...prev, quote: false }));
    }
  }, []);

  // Add quote to favorites
  const handleAddFavorite = useCallback(async () => {
    // Check for duplicate
    const isDuplicate = favorites.some(
      (fav) =>
        fav?.quote === currentQuote?.quote &&
        fav?.author === currentQuote?.author
    );

    if (isDuplicate) {
      setMessage("warning");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    setIsLoading((prev) => ({ ...prev, favorite: true }));

    try {
      await addToFavoritesAPI(currentQuote);

      const newFavorite: FavoriteItem = {
        id: Date.now(),
        author: currentQuote?.author || "Unknown",
        quote: currentQuote?.quote || "",
        addedAt: new Date().toISOString(),
      };

      const updatedFavorites = [...favorites, newFavorite];
      setFavorites(updatedFavorites);
      localStorage.setItem("favoriteQuotes", JSON.stringify(updatedFavorites));

      setMessage("success");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage("error");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setIsLoading((prev) => ({ ...prev, favorite: false }));
    }
  }, [favorites, currentQuote]);

  // Remove favorite
  const removeFavorite = useCallback((id: number) => {
    const updatedFavorites = favorites.filter((fav) => fav?.id !== id);
    setFavorites(updatedFavorites);
    localStorage.setItem("favoriteQuotes", JSON.stringify(updatedFavorites));
    
    setMessage("removed");
    setTimeout(() => setMessage(""), 3000);
  }, [favorites]);

  return (
    <div
      className={`min-h-screen transition-colors duration-300 mb-10 ${
        isDarkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-10 lg:py-12">
        
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-center sm:items-start gap-4 mb-10 md:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-medium text-teal-500 text-center sm:text-left">
            Daily Wisdom
          </h1>
          <button
            onClick={toggleTheme}
            className={`p-3 rounded-full transition-all duration-300 hover:scale-110 ${
              isDarkMode
                ? "bg-teal-500 text-white hover:bg-teal-600"
                : "bg-teal-500 text-white hover:bg-teal-600"
            } shadow-lg`}
            aria-label="Toggle theme"
          >
            {isDarkMode ? <SunIcon /> : <MoonIcon />}
          </button>
        </header>

        {/* Message Alert */}
        {message && (
          <div
            className={`p-3 mb-6 rounded-lg flex items-center gap-2 font-light transition-all duration-300 text-sm md:text-base ${
              message === "success"
                ? "bg-teal-50 dark:bg-teal-900/30 text-teal-800 dark:text-teal-200 border border-teal-200 dark:border-teal-700"
                : message === "warning"
                ? "bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-700"
                : message === "removed"
                ? "bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700"
                : "bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-700"
            }`}
          >
            {message === "success" && (
              <>
                <CheckIcon className="w-4 h-4 shrink-0" />
                <span className="text-sm">Added to favorites!</span>
              </>
            )}
            {message === "warning" && (
              <>
                <AlertIcon className="w-4 h-4 shrink-0" />
                <span className="text-sm">Already in favorites!</span>
              </>
            )}
            {message === "removed" && (
              <>
                <TrashIcon className="w-4 h-4 shrink-0" />
                <span className="text-sm">Removed from favorites</span>
              </>
            )}
            {message === "error" && (
              <>
                <XCircleIcon className="w-4 h-4 shrink-0" />
                <span className="text-sm">Failed to save favorite</span>
              </>
            )}
          </div>
        )}

        {/* Quote Card */}
        <div
          className={`w-full rounded-lg md:rounded-xl p-6 sm:p-8 md:p-10 mb-8 shadow-lg md:shadow-xl ${
            isDarkMode
              ? "bg-gray-800 border border-gray-700"
              : "bg-white border border-gray-200"
          }`}
        >
          {isLoading.quote ? (
            <div className="py-8 md:py-10">
              <Loader size="large" text="Fetching new quote..." />
            </div>
          ) : (
            <div
              className={`transition-all duration-500 ${
                isAnimating ? "opacity-0" : "opacity-100"
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <div className="flex-1">
                  <p className="text-base sm:text-lg md:text-xl font-serif italic mb-4 leading-relaxed font-light">
                    "{currentQuote?.quote || "Loading..."}"
                  </p>
                  <p className="text-sm sm:text-base md:text-lg font-normal text-teal-500">
                    — {currentQuote?.author || "Unknown"}
                  </p>
                </div>
                <button
                  onClick={handleAddFavorite}
                  disabled={isLoading.favorite}
                  className={`shrink-0 transition-all duration-300 hover:scale-110 self-end sm:self-start ${
                    isLoading.favorite
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-400 hover:text-teal-500"
                  }`}
                  aria-label="Add to favorites"
                >
                  {isLoading.favorite ? (
                    <Loader size="default" />
                  ) : (
                    <HeartIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Next Quote Button */}
        <div className="flex justify-center sm:justify-end mb-12">
          <button
            onClick={handleNextQuote}
            disabled={isLoading.quote}
            className={`px-8 py-3 rounded-lg font-normal text-sm sm:text-base transition-all duration-300 hover:shadow-xl shadow-lg flex items-center justify-center gap-2 w-full sm:w-auto ${
              isDarkMode
                ? "bg-teal-500 hover:bg-teal-600 disabled:bg-gray-700 disabled:text-gray-500"
                : "bg-teal-500 hover:bg-teal-600 disabled:bg-gray-300 disabled:text-gray-500"
            } text-white disabled:cursor-not-allowed`}
          >
            {isLoading.quote ? (
              <>
                <LoaderIcon className="w-4 h-4" />
                <span>Loading...</span>
              </>
            ) : (
              <>
                <SparklesIcon className="w-4 h-4" />
                <span>Next Quote</span>
              </>
            )}
          </button>
        </div>

        {/* Favorites Section */}
        <div
          className={`w-full rounded-lg md:rounded-xl p-6 sm:p-8 md:p-10 shadow-lg md:shadow-xl ${
            isDarkMode
              ? "bg-gray-800 border border-gray-700"
              : "bg-white border border-gray-200"
          }`}
        >
          <h2 className="text-xl sm:text-2xl font-normal mb-6 flex items-center gap-2 flex-wrap">
            <StarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-teal-500" />
            <span className={isDarkMode ? "text-white" : "text-gray-900"}>
              Favorite Quotes
            </span>
            <span
              className={`text-sm sm:text-base font-light ${
                isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              ({favorites?.length || 0})
            </span>
          </h2>

          {favorites?.length > 0 ? (
            <div className="space-y-6">
              {favorites.map((fav) => (
                <div
                  key={fav?.id}
                  className={`p-5 md:p-6 rounded-lg transition-all duration-200 border-l-4 border-teal-400 shadow-md ${
                    isDarkMode
                      ? "bg-gray-700/50 hover:bg-gray-700/70"
                      : "bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                    <div className="flex-1">
                      <p className="font-serif italic mb-2 font-light text-sm sm:text-base">
                        "{fav?.quote || ""}"
                      </p>
                      <p className="font-normal text-xs sm:text-sm text-teal-500">
                        — {fav?.author || "Unknown"}
                      </p>
                      <p
                        className={`text-xs mt-1 font-light ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        Added:{" "}
                        {fav?.addedAt
                          ? new Date(fav.addedAt).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                    <button
                      onClick={() => removeFavorite(fav?.id)}
                      className={`shrink-0 transition-colors hover:scale-110 self-end sm:self-start mt-2 sm:mt-0 ${
                        isDarkMode
                          ? "text-gray-400 hover:text-red-400"
                          : "text-gray-400 hover:text-red-500"
                      }`}
                      aria-label="Remove favorite"
                    >
                      <TrashIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              className={`text-center py-8 ${
                isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              <HeartIcon className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p className="text-base font-light">No favorites yet</p>
              <p className="text-xs mt-1 font-light">
                Click the heart icon to save quotes you love
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

