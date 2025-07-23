async function handler({
  title,
  author,
  isbn,
  cover_url,
  amazon_id,
  publication_date,
  pages,
  description,
  overall_rating,
  writing_rating,
  story_rating,
  read_date,
  notes,
}) {
  if (!title || !author) {
    return { error: "Title and author are required" };
  }

  if (!overall_rating || overall_rating < 1 || overall_rating > 5) {
    return { error: "Overall rating is required and must be between 1 and 5" };
  }

  if (!read_date) {
    return { error: "Read date is required" };
  }

  try {
    let bookId;

    if (isbn) {
      const existingBook = await sql`SELECT id FROM books WHERE isbn = ${isbn}`;
      if (existingBook.length > 0) {
        bookId = existingBook[0].id;
      }
    }

    if (!bookId) {
      const existingBook =
        await sql`SELECT id FROM books WHERE title = ${title} AND author = ${author}`;
      if (existingBook.length > 0) {
        bookId = existingBook[0].id;
      }
    }

    if (!bookId) {
      const newBook = await sql`
        INSERT INTO books (title, author, isbn, cover_url, amazon_id, publication_date, pages, description)
        VALUES (${title}, ${author}, ${isbn || null}, ${cover_url || null}, ${
        amazon_id || null
      }, ${publication_date || null}, ${pages || null}, ${description || null})
        RETURNING id
      `;
      bookId = newBook[0].id;
    }

    const userBook = await sql`
      INSERT INTO user_books (book_id, overall_rating, writing_rating, story_rating, read_date, notes)
      VALUES (${bookId}, ${overall_rating}, ${writing_rating || null}, ${
      story_rating || null
    }, ${read_date}, ${notes || null})
      RETURNING id
    `;

    return {
      success: true,
      book_id: bookId,
      user_book_id: userBook[0].id,
      message: "Book added to your library successfully",
    };
  } catch (error) {
    return { error: "Failed to add book to library" };
  }
}
export async function POST(request) {
  return handler(await request.json());
}