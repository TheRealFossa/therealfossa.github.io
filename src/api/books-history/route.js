async function handler() {
  try {
    const booksHistory = await sql`
      SELECT 
        b.id,
        b.title,
        b.author,
        b.isbn,
        b.cover_url,
        b.publication_date,
        b.pages,
        b.description,
        ub.overall_rating,
        ub.writing_rating,
        ub.story_rating,
        ub.read_date,
        ub.notes,
        ub.created_at
      FROM user_books ub
      JOIN books b ON ub.book_id = b.id
      ORDER BY ub.read_date DESC
    `;

    return {
      books: booksHistory,
      total: booksHistory.length,
    };
  } catch (error) {
    return { error: "Failed to fetch reading history" };
  }
}
export async function POST(request) {
  return handler(await request.json());
}