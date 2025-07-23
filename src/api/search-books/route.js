async function handler({ query }) {
  if (!query || typeof query !== "string" || query.trim().length === 0) {
    return { error: "Search query is required" };
  }

  try {
    const searchQuery = encodeURIComponent(query.trim());
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${searchQuery}&maxResults=20`
    );

    if (!response.ok) {
      return { error: "Failed to search books" };
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      return { books: [] };
    }

    const books = data.items.map((item) => {
      const volumeInfo = item.volumeInfo || {};
      const imageLinks = volumeInfo.imageLinks || {};
      const industryIdentifiers = volumeInfo.industryIdentifiers || [];

      const isbn13 = industryIdentifiers.find(
        (id) => id.type === "ISBN_13"
      )?.identifier;
      const isbn10 = industryIdentifiers.find(
        (id) => id.type === "ISBN_10"
      )?.identifier;
      const isbn = isbn13 || isbn10;

      return {
        title: volumeInfo.title || "Unknown Title",
        author: volumeInfo.authors
          ? volumeInfo.authors.join(", ")
          : "Unknown Author",
        isbn: isbn || null,
        cover_url: imageLinks.thumbnail || imageLinks.smallThumbnail || null,
        description: volumeInfo.description || null,
        publication_date: volumeInfo.publishedDate || null,
        pages: volumeInfo.pageCount || null,
        google_books_id: item.id || null,
      };
    });

    return { books };
  } catch (error) {
    return { error: "Search failed" };
  }
}
export async function POST(request) {
  return handler(await request.json());
}