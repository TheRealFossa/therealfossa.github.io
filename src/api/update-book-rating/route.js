async function handler({
  user_book_id,
  action,
  overall_rating,
  writing_rating,
  story_rating,
  notes,
  read_date,
}) {
  if (!user_book_id) {
    return { error: "User book ID is required" };
  }

  if (!action || !["update", "delete"].includes(action)) {
    return { error: "Action must be 'update' or 'delete'" };
  }

  try {
    const existingBook =
      await sql`SELECT id FROM user_books WHERE id = ${user_book_id}`;
    if (existingBook.length === 0) {
      return { error: "Book not found in your library" };
    }

    if (action === "delete") {
      await sql`DELETE FROM user_books WHERE id = ${user_book_id}`;
      return {
        success: true,
        message: "Book removed from your library successfully",
      };
    }

    if (overall_rating && (overall_rating < 1 || overall_rating > 5)) {
      return { error: "Overall rating must be between 1 and 5" };
    }

    if (writing_rating && (writing_rating < 1 || writing_rating > 5)) {
      return { error: "Writing rating must be between 1 and 5" };
    }

    if (story_rating && (story_rating < 1 || story_rating > 5)) {
      return { error: "Story rating must be between 1 and 5" };
    }

    let setClauses = [];
    let values = [];
    let paramCount = 0;

    if (overall_rating !== undefined) {
      setClauses.push(`overall_rating = $${++paramCount}`);
      values.push(overall_rating);
    }

    if (writing_rating !== undefined) {
      setClauses.push(`writing_rating = $${++paramCount}`);
      values.push(writing_rating);
    }

    if (story_rating !== undefined) {
      setClauses.push(`story_rating = $${++paramCount}`);
      values.push(story_rating);
    }

    if (notes !== undefined) {
      setClauses.push(`notes = $${++paramCount}`);
      values.push(notes);
    }

    if (read_date !== undefined) {
      setClauses.push(`read_date = $${++paramCount}`);
      values.push(read_date);
    }

    if (setClauses.length === 0) {
      return { error: "No fields to update" };
    }

    setClauses.push(`updated_at = $${++paramCount}`);
    values.push(new Date());

    const query = `
      UPDATE user_books 
      SET ${setClauses.join(", ")}
      WHERE id = $${++paramCount}
      RETURNING id
    `;
    values.push(user_book_id);

    const result = await sql(query, values);

    return {
      success: true,
      user_book_id: result[0].id,
      message: "Book updated successfully",
    };
  } catch (error) {
    return { error: "Failed to update or delete book" };
  }
}
export async function POST(request) {
  return handler(await request.json());
}