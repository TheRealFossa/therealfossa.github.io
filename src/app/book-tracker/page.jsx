"use client";
import React from "react";

function MainComponent() {
  const [activeTab, setActiveTab] = React.useState("search");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState([]);
  const [searchLoading, setSearchLoading] = React.useState(false);
  const [booksHistory, setBooksHistory] = React.useState([]);
  const [historyLoading, setHistoryLoading] = React.useState(false);
  const [selectedBook, setSelectedBook] = React.useState(null);
  const [showRatingModal, setShowRatingModal] = React.useState(false);
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [editingBook, setEditingBook] = React.useState(null);
  const [showBookDetailModal, setShowBookDetailModal] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [statistics, setStatistics] = React.useState(null);
  const [statsLoading, setStatsLoading] = React.useState(false);
  const [deletingBook, setDeletingBook] = React.useState(false);
  const [updatingBook, setUpdatingBook] = React.useState(false);

  // Rating form state
  const [overallRating, setOverallRating] = React.useState(5);
  const [writingRating, setWritingRating] = React.useState(null);
  const [storyRating, setStoryRating] = React.useState(null);
  const [readDate, setReadDate] = React.useState(
    new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = React.useState("");
  const [addingBook, setAddingBook] = React.useState(false);

  // Search books with debouncing for live search
  const searchBooks = React.useCallback(
    async (query) => {
      const searchTerm = query || searchQuery;
      if (!searchTerm.trim()) {
        setSearchResults([]);
        return;
      }

      setSearchLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/search-books", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: searchTerm }),
        });

        if (!response.ok) {
          throw new Error(
            `When fetching /api/search-books, the response was [${response.status}] ${response.statusText}`
          );
        }

        const data = await response.json();
        if (data.error) {
          setError(data.error);
          setSearchResults([]);
        } else {
          setSearchResults(data.books || []);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to search books");
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    },
    [searchQuery]
  );

  // Debounced search effect for live search
  React.useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      searchBooks(searchQuery);
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchBooks]);

  // Load books history
  const loadBooksHistory = React.useCallback(async () => {
    setHistoryLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/books-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Failed to load books history");
      }

      const data = await response.json();
      if (data.error) {
        setError(data.error);
      } else {
        setBooksHistory(data.books || []);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load books history");
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  // Load statistics
  const loadStatistics = React.useCallback(async () => {
    setStatsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/reading-stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Failed to load statistics");
      }

      const data = await response.json();
      if (data.error) {
        setError(data.error);
      } else {
        setStatistics(data);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load statistics");
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Add book to library
  const addBookToLibrary = React.useCallback(async () => {
    if (!selectedBook) return;

    setAddingBook(true);
    setError(null);

    try {
      const response = await fetch("/api/add-book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: selectedBook.title,
          author: selectedBook.author,
          isbn: selectedBook.isbn,
          cover_url: selectedBook.cover_url,
          publication_date: selectedBook.publication_date,
          pages: selectedBook.pages,
          description: selectedBook.description,
          overall_rating: overallRating,
          writing_rating: writingRating,
          story_rating: storyRating,
          read_date: readDate,
          notes: notes,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add book");
      }

      const data = await response.json();
      if (data.error) {
        setError(data.error);
      } else {
        setShowRatingModal(false);
        setSelectedBook(null);
        setOverallRating(5);
        setWritingRating(null);
        setStoryRating(null);
        setNotes("");
        if (activeTab === "history") {
          loadBooksHistory();
        }
      }
    } catch (err) {
      console.error(err);
      setError("Failed to add book");
    } finally {
      setAddingBook(false);
    }
  }, [
    selectedBook,
    overallRating,
    writingRating,
    storyRating,
    readDate,
    notes,
    activeTab,
    loadBooksHistory,
  ]);

  // Open edit modal
  const openEditModal = React.useCallback((book) => {
    setEditingBook(book);
    setOverallRating(book.overall_rating || 5);
    setWritingRating(book.writing_rating || null);
    setStoryRating(book.story_rating || null);
    setReadDate(
      book.read_date
        ? book.read_date.split("T")[0]
        : new Date().toISOString().split("T")[0]
    );
    setNotes(book.notes || "");
    setShowEditModal(true);
  }, []);

  // Update book
  const updateBook = React.useCallback(async () => {
    if (!editingBook) return;

    setUpdatingBook(true);
    setError(null);

    try {
      const response = await fetch("/api/update-rating", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_book_id: editingBook.id,
          action: "update",
          overall_rating: overallRating,
          writing_rating: writingRating,
          story_rating: storyRating,
          read_date: readDate,
          notes: notes,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update book");
      }

      const data = await response.json();
      if (data.error) {
        setError(data.error);
      } else {
        setShowEditModal(false);
        setEditingBook(null);
        setOverallRating(5);
        setWritingRating(null);
        setStoryRating(null);
        setNotes("");
        loadBooksHistory();
      }
    } catch (err) {
      console.error(err);
      setError("Failed to update book");
    } finally {
      setUpdatingBook(false);
    }
  }, [
    editingBook,
    overallRating,
    writingRating,
    storyRating,
    readDate,
    notes,
    loadBooksHistory,
  ]);

  // Delete book from library
  const deleteBookFromLibrary = React.useCallback(
    async (userBookId) => {
      if (
        !confirm(
          "Sei sicuro di voler eliminare questo libro dalla tua libreria?"
        )
      ) {
        return;
      }

      setDeletingBook(true);
      setError(null);

      try {
        const response = await fetch("/api/update-rating", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_book_id: userBookId,
            action: "delete",
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to delete book");
        }

        const data = await response.json();
        if (data.error) {
          setError(data.error);
        } else {
          loadBooksHistory();
        }
      } catch (err) {
        console.error(err);
        setError("Failed to delete book");
      } finally {
        setDeletingBook(false);
      }
    },
    [loadBooksHistory]
  );

  // Load data when tab changes
  React.useEffect(() => {
    if (activeTab === "history") {
      loadBooksHistory();
    } else if (activeTab === "statistics") {
      loadStatistics();
    }
  }, [activeTab, loadBooksHistory, loadStatistics]);

  // Colorful star rating component
  const StarRating = ({ rating, onRatingChange, label, readonly = false }) => (
    <div className="flex flex-col space-y-2">
      <label className="text-sm font-medium text-gray-900">{label}</label>
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => !readonly && onRatingChange && onRatingChange(star)}
            disabled={readonly}
            className={`text-2xl transition-colors ${
              readonly ? "cursor-default" : "hover:scale-110"
            } ${
              star <= (rating || 0)
                ? star === 1
                  ? "text-red-500"
                  : star === 2
                  ? "text-orange-500"
                  : star === 3
                  ? "text-yellow-500"
                  : star === 4
                  ? "text-lime-500"
                  : "text-green-500"
                : "text-gray-300"
            }`}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );

  // Format date to Month Year
  const formatMonthYear = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("it-IT", {
      year: "numeric",
      month: "long",
    });
  };

  // Get month name
  const getMonthName = (monthNumber) => {
    const months = [
      "Gennaio",
      "Febbraio",
      "Marzo",
      "Aprile",
      "Maggio",
      "Giugno",
      "Luglio",
      "Agosto",
      "Settembre",
      "Ottobre",
      "Novembre",
      "Dicembre",
    ];
    return months[monthNumber - 1];
  };

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-black">I Miei Libri</h1>
          <p className="text-gray-600 mt-2">
            Tieni traccia dei tuoi libri letti
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab("search")}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === "search"
                  ? "border-black text-black"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Cerca Libri
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === "history"
                  ? "border-black text-black"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Cronologia Letture
            </button>
            <button
              onClick={() => setActiveTab("statistics")}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === "statistics"
                  ? "border-black text-black"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Statistiche
            </button>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {activeTab === "search" && (
          <div className="space-y-6">
            {/* Search form */}
            <div className="flex space-x-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && searchBooks()}
                placeholder="Cerca per titolo, autore o ISBN..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              />
              <button
                onClick={searchBooks}
                disabled={searchLoading || !searchQuery.trim()}
                className="px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {searchLoading ? "Cercando..." : "Cerca"}
              </button>
            </div>

            {/* Search results */}
            {searchResults.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {searchResults.map((book, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex space-x-4">
                      {book.cover_url && (
                        <img
                          src={book.cover_url}
                          alt={book.title}
                          className="w-16 h-24 object-cover rounded"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm line-clamp-2">
                          {book.title}
                        </h3>
                        <p className="text-gray-600 text-sm mt-1">
                          {book.author}
                        </p>
                        {book.publication_date && (
                          <p className="text-gray-500 text-xs mt-1">
                            {book.publication_date}
                          </p>
                        )}
                        <button
                          onClick={() => {
                            setSelectedBook(book);
                            setShowRatingModal(true);
                          }}
                          className="mt-2 px-3 py-1 bg-black text-white text-xs rounded hover:bg-gray-800"
                        >
                          Aggiungi alla Libreria
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "history" && (
          <div className="space-y-6">
            {historyLoading ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Caricamento cronologia...</p>
              </div>
            ) : booksHistory.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">
                  Nessun libro letto ancora. Inizia cercando e aggiungendo
                  libri!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">
                  Libri Letti ({booksHistory.length})
                </h2>
                <div className="space-y-4">
                  {booksHistory.map((book) => (
                    <div
                      key={book.id}
                      className="border border-gray-200 rounded-lg p-6"
                    >
                      <div className="flex space-x-6">
                        {book.cover_url && (
                          <img
                            src={book.cover_url}
                            alt={book.title}
                            className="w-32 h-48 object-cover rounded flex-shrink-0"
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-lg">
                                {book.title}
                              </h3>
                              <p className="text-gray-600 mt-1">
                                {book.author}
                              </p>
                              <p className="text-sm text-gray-500 mt-1">
                                Letto: {formatMonthYear(book.read_date)}
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => openEditModal(book)}
                                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                              >
                                Modifica
                              </button>
                              <button
                                onClick={() => deleteBookFromLibrary(book.id)}
                                disabled={deletingBook}
                                className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
                              >
                                Elimina
                              </button>
                            </div>
                          </div>

                          {/* Ratings */}
                          <div className="mt-4 space-y-2">
                            <div className="flex items-center space-x-4">
                              <span className="text-sm font-medium">
                                Valutazione Generale:
                              </span>
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <span
                                    key={star}
                                    className={`text-lg ${
                                      star <= book.overall_rating
                                        ? star === 1
                                          ? "text-red-500"
                                          : star === 2
                                          ? "text-orange-500"
                                          : star === 3
                                          ? "text-yellow-500"
                                          : star === 4
                                          ? "text-lime-500"
                                          : "text-green-500"
                                        : "text-gray-300"
                                    }`}
                                  >
                                    ★
                                  </span>
                                ))}
                              </div>
                            </div>

                            {book.writing_rating && (
                              <div className="flex items-center space-x-4">
                                <span className="text-sm font-medium">
                                  Scrittura:
                                </span>
                                <div className="flex">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <span
                                      key={star}
                                      className={`text-lg ${
                                        star <= book.writing_rating
                                          ? star === 1
                                            ? "text-red-500"
                                            : star === 2
                                            ? "text-orange-500"
                                            : star === 3
                                            ? "text-yellow-500"
                                            : star === 4
                                            ? "text-lime-500"
                                            : "text-green-500"
                                          : "text-gray-300"
                                      }`}
                                    >
                                      ★
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {book.story_rating && (
                              <div className="flex items-center space-x-4">
                                <span className="text-sm font-medium">
                                  Storia:
                                </span>
                                <div className="flex">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <span
                                      key={star}
                                      className={`text-lg ${
                                        star <= book.story_rating
                                          ? star === 1
                                            ? "text-red-500"
                                            : star === 2
                                            ? "text-orange-500"
                                            : star === 3
                                            ? "text-yellow-500"
                                            : star === 4
                                            ? "text-lime-500"
                                            : "text-green-500"
                                          : "text-gray-300"
                                      }`}
                                    >
                                      ★
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {book.notes && (
                            <div className="mt-4">
                              <p className="text-sm font-medium">Note:</p>
                              <p className="text-sm text-gray-700 mt-1">
                                {book.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "statistics" && (
          <div className="space-y-8">
            {statsLoading ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Caricamento statistiche...</p>
              </div>
            ) : !statistics ? (
              <div className="text-center py-8">
                <p className="text-gray-600">
                  Nessuna statistica disponibile. Aggiungi alcuni libri per
                  vedere le statistiche!
                </p>
              </div>
            ) : (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-black">
                      {statistics.summary.total_books}
                    </div>
                    <div className="text-sm text-gray-600">Libri Letti</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-black">
                      {statistics.summary.books_this_year}
                    </div>
                    <div className="text-sm text-gray-600">Quest'Anno</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-black">
                      {statistics.summary.books_this_month}
                    </div>
                    <div className="text-sm text-gray-600">Questo Mese</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-black">
                      {statistics.summary.total_pages || 0}
                    </div>
                    <div className="text-sm text-gray-600">Pagine Lette</div>
                  </div>
                </div>

                {/* Average Ratings */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">
                    Valutazioni Medie
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Generale:</span>
                      <div className="flex items-center space-x-2">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              className={`text-lg ${
                                star <=
                                Math.round(statistics.ratings.average_overall)
                                  ? star === 1
                                    ? "text-red-500"
                                    : star === 2
                                    ? "text-orange-500"
                                    : star === 3
                                    ? "text-yellow-500"
                                    : star === 4
                                    ? "text-lime-500"
                                    : "text-green-500"
                                  : "text-gray-300"
                              }`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        <span className="text-sm text-gray-600">
                          ({statistics.ratings.average_overall})
                        </span>
                      </div>
                    </div>
                    {statistics.ratings.average_writing > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Scrittura:</span>
                        <div className="flex items-center space-x-2">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span
                                key={star}
                                className={`text-lg ${
                                  star <=
                                  Math.round(statistics.ratings.average_writing)
                                    ? star === 1
                                      ? "text-red-500"
                                      : star === 2
                                      ? "text-orange-500"
                                      : star === 3
                                      ? "text-yellow-500"
                                      : star === 4
                                      ? "text-lime-500"
                                      : "text-green-500"
                                    : "text-gray-300"
                                }`}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                          <span className="text-sm text-gray-600">
                            ({statistics.ratings.average_writing})
                          </span>
                        </div>
                      </div>
                    )}
                    {statistics.ratings.average_story > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Storia:</span>
                        <div className="flex items-center space-x-2">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span
                                key={star}
                                className={`text-lg ${
                                  star <=
                                  Math.round(statistics.ratings.average_story)
                                    ? star === 1
                                      ? "text-red-500"
                                      : star === 2
                                      ? "text-orange-500"
                                      : star === 3
                                      ? "text-yellow-500"
                                      : star === 4
                                      ? "text-lime-500"
                                      : "text-green-500"
                                    : "text-gray-300"
                                }`}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                          <span className="text-sm text-gray-600">
                            ({statistics.ratings.average_story})
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Top Authors */}
                {statistics.top_authors.length > 0 && (
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">
                      Autori Preferiti
                    </h3>
                    <div className="space-y-2">
                      {statistics.top_authors.map((author, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center"
                        >
                          <span className="text-sm font-medium">
                            {author.author}
                          </span>
                          <span className="text-sm text-gray-600">
                            {author.book_count} libri
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Monthly Reading */}
                {statistics.monthly_reading.length > 0 && (
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">
                      Letture per Mese
                    </h3>
                    <div className="space-y-2">
                      {statistics.monthly_reading.map((month, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center"
                        >
                          <span className="text-sm font-medium">
                            {getMonthName(month.month)} {month.year}
                          </span>
                          <span className="text-sm text-gray-600">
                            {month.book_count} libri
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rating Distribution */}
                {statistics.ratings.distribution.length > 0 && (
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">
                      Distribuzione Valutazioni
                    </h3>
                    <div className="space-y-2">
                      {statistics.ratings.distribution.map((rating) => (
                        <div
                          key={rating.rating}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">
                              {rating.rating}
                            </span>
                            <span
                              className={`text-lg ${
                                rating.rating === 1
                                  ? "text-red-500"
                                  : rating.rating === 2
                                  ? "text-orange-500"
                                  : rating.rating === 3
                                  ? "text-yellow-500"
                                  : rating.rating === 4
                                  ? "text-lime-500"
                                  : "text-green-500"
                              }`}
                            >
                              ★
                            </span>
                          </div>
                          <span className="text-sm text-gray-600">
                            {rating.count} libri
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Rating Modal */}
      {showRatingModal && selectedBook && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold">
                  Aggiungi alla Libreria
                </h2>
                <button
                  onClick={() => setShowRatingModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">{selectedBook.title}</h3>
                  <p className="text-gray-600 text-sm">{selectedBook.author}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Data di Lettura
                  </label>
                  <input
                    type="month"
                    value={readDate.substring(0, 7)}
                    onChange={(e) => setReadDate(e.target.value + "-01")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>

                <StarRating
                  rating={overallRating}
                  onRatingChange={setOverallRating}
                  label="Valutazione Generale *"
                />

                <StarRating
                  rating={writingRating}
                  onRatingChange={setWritingRating}
                  label="Scrittura (opzionale)"
                />

                <StarRating
                  rating={storyRating}
                  onRatingChange={setStoryRating}
                  label="Storia (opzionale)"
                />

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Note (opzionale)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="Aggiungi le tue note sul libro..."
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setShowRatingModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Annulla
                  </button>
                  <button
                    onClick={addBookToLibrary}
                    disabled={addingBook}
                    className="flex-1 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 disabled:bg-gray-400"
                  >
                    {addingBook ? "Aggiungendo..." : "Aggiungi"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingBook && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold">Modifica Libro</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">{editingBook.title}</h3>
                  <p className="text-gray-600 text-sm">{editingBook.author}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Data di Lettura
                  </label>
                  <input
                    type="month"
                    value={readDate.substring(0, 7)}
                    onChange={(e) => setReadDate(e.target.value + "-01")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>

                <StarRating
                  rating={overallRating}
                  onRatingChange={setOverallRating}
                  label="Valutazione Generale *"
                />

                <StarRating
                  rating={writingRating}
                  onRatingChange={setWritingRating}
                  label="Scrittura (opzionale)"
                />

                <StarRating
                  rating={storyRating}
                  onRatingChange={setStoryRating}
                  label="Storia (opzionale)"
                />

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Note (opzionale)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="Aggiungi le tue note sul libro..."
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Annulla
                  </button>
                  <button
                    onClick={updateBook}
                    disabled={updatingBook}
                    className="flex-1 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 disabled:bg-gray-400"
                  >
                    {updatingBook ? "Aggiornando..." : "Aggiorna"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Book Detail Modal */}
      {showBookDetailModal && selectedBook && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold">Dettagli Libro</h2>
                <button
                  onClick={() => setShowBookDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Book Cover and Basic Info */}
                <div className="flex space-x-4">
                  {selectedBook.cover_url && (
                    <img
                      src={selectedBook.cover_url}
                      alt={selectedBook.title}
                      className="w-24 h-36 object-cover rounded flex-shrink-0"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">
                      {selectedBook.title}
                    </h3>
                    <p className="text-gray-600 mt-1">{selectedBook.author}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Letto: {formatMonthYear(selectedBook.read_date)}
                    </p>
                  </div>
                </div>

                {/* Book Details */}
                <div className="space-y-3">
                  {selectedBook.publication_date && (
                    <div>
                      <span className="text-sm font-medium text-gray-900">
                        Data di Pubblicazione:
                      </span>
                      <p className="text-sm text-gray-700 mt-1">
                        {selectedBook.publication_date}
                      </p>
                    </div>
                  )}

                  {selectedBook.pages && (
                    <div>
                      <span className="text-sm font-medium text-gray-900">
                        Pagine:
                      </span>
                      <p className="text-sm text-gray-700 mt-1">
                        {selectedBook.pages}
                      </p>
                    </div>
                  )}

                  {selectedBook.isbn && (
                    <div>
                      <span className="text-sm font-medium text-gray-900">
                        ISBN:
                      </span>
                      <p className="text-sm text-gray-700 mt-1">
                        {selectedBook.isbn}
                      </p>
                    </div>
                  )}

                  {selectedBook.description && (
                    <div>
                      <span className="text-sm font-medium text-gray-900">
                        Descrizione:
                      </span>
                      <p className="text-sm text-gray-700 mt-1 leading-relaxed">
                        {selectedBook.description}
                      </p>
                    </div>
                  )}
                </div>

                {/* Ratings */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">
                    Le Tue Valutazioni
                  </h4>

                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium">Generale:</span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`text-lg ${
                            star <= selectedBook.overall_rating
                              ? star === 1
                                ? "text-red-500"
                                : star === 2
                                ? "text-orange-500"
                                : star === 3
                                ? "text-yellow-500"
                                : star === 4
                                ? "text-lime-500"
                                : "text-green-500"
                              : "text-gray-300"
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>

                  {selectedBook.writing_rating && (
                    <div className="flex items-center space-x-4">
                      <span className="text-sm font-medium">Scrittura:</span>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={`text-lg ${
                              star <= selectedBook.writing_rating
                                ? star === 1
                                  ? "text-red-500"
                                  : star === 2
                                  ? "text-orange-500"
                                  : star === 3
                                  ? "text-yellow-500"
                                  : star === 4
                                  ? "text-lime-500"
                                  : "text-green-500"
                                : "text-gray-300"
                            }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedBook.story_rating && (
                    <div className="flex items-center space-x-4">
                      <span className="text-sm font-medium">Storia:</span>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={`text-lg ${
                              star <= selectedBook.story_rating
                                ? star === 1
                                  ? "text-red-500"
                                  : star === 2
                                  ? "text-orange-500"
                                  : star === 3
                                  ? "text-yellow-500"
                                  : star === 4
                                  ? "text-lime-500"
                                  : "text-green-500"
                                : "text-gray-300"
                            }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Notes */}
                {selectedBook.notes && (
                  <div>
                    <span className="text-sm font-medium text-gray-900">
                      Le Tue Note:
                    </span>
                    <p className="text-sm text-gray-700 mt-1 leading-relaxed bg-gray-50 p-3 rounded-md">
                      {selectedBook.notes}
                    </p>
                  </div>
                )}

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setShowBookDetailModal(false)}
                    className="flex-1 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
                  >
                    Chiudi
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MainComponent;