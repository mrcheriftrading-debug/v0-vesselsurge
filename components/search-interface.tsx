"use client";
import { useState } from "react";
import { Search, Globe, ExternalLink, Loader2, Ship } from "lucide-react";

export default function SearchInterface() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, maxResults: 8 }),
      });
      const data = await res.json();
      if (data.success) {
        setResults(data.results);
      } else {
        setError("Search failed. Please try again.");
      }
    } catch (err) {
      setError("Connection error. Please check your internet.");
      console.error("[v0] Search failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 py-12">
      <div className="max-w-4xl mx-auto px-4 space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Ship className="h-6 w-6 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">Maritime Intelligence Search</h1>
          </div>
          <p className="text-lg text-muted-foreground">Search real-time maritime news, vessel tracking, and shipping market updates</p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="relative group">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search vessels, ports, shipping news, market updates..."
            className="w-full pl-12 pr-14 py-4 bg-card border border-border rounded-2xl shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-foreground"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <button 
            type="submit"
            disabled={loading}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all font-medium"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
          </button>
        </form>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm">
            {error}
          </div>
        )}

        {/* Results */}
        <div className="space-y-4">
          {loading ? (
            // Skeleton Loader
            [1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-muted/30 animate-pulse rounded-xl border border-border" />
            ))
          ) : results.length > 0 ? (
            <>
              <p className="text-sm text-muted-foreground font-medium">
                Found {results.length} results for "{query}"
              </p>
              {results.map((result, idx) => (
                <a
                  key={idx}
                  href={result.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-5 bg-card border border-border rounded-xl hover:border-primary/50 hover:shadow-lg transition-all"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Globe size={14} className="text-muted-foreground" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{result.source}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2 leading-snug flex items-center gap-2 group">
                    {result.title}
                    <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                  </h3>
                  <p className="text-muted-foreground text-sm line-clamp-2">{result.snippet}</p>
                  {result.date && (
                    <p className="text-xs text-muted-foreground mt-2">{new Date(result.date).toLocaleDateString()}</p>
                  )}
                </a>
              ))}
            </>
          ) : query && !loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No results found for "{query}". Try a different search term.</p>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Enter a search query to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
