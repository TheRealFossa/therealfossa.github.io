async function handler({ user_book_id }) {
  if (!user_book_id) {
    return { error: "User book ID is required" };
  }

  try {
    const existingBook =
      await sql`SELECT id FROM user_books WHERE id = ${user_book_id}`;

    if (existingBook.length === 0) {
      return { error: "Book not found in your library" };
    }

    await sql`DELETE FROM user_books WHERE id = ${user_book_id}`;

    return {
      success: true,
      message: "Book removed from your library successfully",
    };
  } catch (error) {
    return { error: "Failed to remove book from library" };
  }
}
export async function POST(request) {
  return handler(await request.json());
}