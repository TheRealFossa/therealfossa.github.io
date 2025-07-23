async function handler() {
  try {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const [
      totalBooks,
      averageRatings,
      booksThisYear,
      booksThisMonth,
      topAuthors,
      ratingDistribution,
      monthlyStats,
      recentBooks,
    ] = await sql.transaction([
      sql`SELECT COUNT(*) as total FROM user_books`,

      sql`
        SELECT 
          ROUND(AVG(overall_rating), 2) as avg_overall,
          ROUND(AVG(writing_rating), 2) as avg_writing,
          ROUND(AVG(story_rating), 2) as avg_story
        FROM user_books 
        WHERE overall_rating IS NOT NULL
      `,

      sql`
        SELECT COUNT(*) as total 
        FROM user_books 
        WHERE EXTRACT(YEAR FROM read_date) = ${currentYear}
      `,

      sql`
        SELECT COUNT(*) as total 
        FROM user_books 
        WHERE EXTRACT(YEAR FROM read_date) = ${currentYear} 
        AND EXTRACT(MONTH FROM read_date) = ${currentMonth}
      `,

      sql`
        SELECT b.author, COUNT(*) as book_count
        FROM user_books ub
        JOIN books b ON ub.book_id = b.id
        GROUP BY b.author
        ORDER BY book_count DESC
        LIMIT 5
      `,

      sql`
        SELECT overall_rating, COUNT(*) as count
        FROM user_books
        WHERE overall_rating IS NOT NULL
        GROUP BY overall_rating
        ORDER BY overall_rating
      `,

      sql`
        SELECT 
          EXTRACT(YEAR FROM read_date) as year,
          EXTRACT(MONTH FROM read_date) as month,
          COUNT(*) as book_count
        FROM user_books
        WHERE read_date >= CURRENT_DATE - INTERVAL '12 months'
        GROUP BY EXTRACT(YEAR FROM read_date), EXTRACT(MONTH FROM read_date)
        ORDER BY year DESC, month DESC
      `,

      sql`
        SELECT b.title, b.author, ub.overall_rating, ub.read_date
        FROM user_books ub
        JOIN books b ON ub.book_id = b.id
        ORDER BY ub.read_date DESC
        LIMIT 5
      `,
    ]);

    // Get total pages from books table (which gets data from Google Books)
    const totalPagesResult = await sql`
      SELECT SUM(b.pages) as total_pages
      FROM user_books ub
      JOIN books b ON ub.book_id = b.id
      WHERE b.pages IS NOT NULL
    `;

    return {
      summary: {
        total_books: parseInt(totalBooks[0].total),
        books_this_year: parseInt(booksThisYear[0].total),
        books_this_month: parseInt(booksThisMonth[0].total),
        total_pages: parseInt(totalPagesResult[0].total_pages) || 0,
      },
      ratings: {
        average_overall: parseFloat(averageRatings[0].avg_overall) || 0,
        average_writing: parseFloat(averageRatings[0].avg_writing) || 0,
        average_story: parseFloat(averageRatings[0].avg_story) || 0,
        distribution: ratingDistribution.map((row) => ({
          rating: row.overall_rating,
          count: parseInt(row.count),
        })),
      },
      top_authors: topAuthors.map((row) => ({
        author: row.author,
        book_count: parseInt(row.book_count),
      })),
      monthly_reading: monthlyStats.map((row) => ({
        year: parseInt(row.year),
        month: parseInt(row.month),
        book_count: parseInt(row.book_count),
      })),
      recent_books: recentBooks.map((row) => ({
        title: row.title,
        author: row.author,
        rating: row.overall_rating,
        read_date: row.read_date,
      })),
    };
  } catch (error) {
    return { error: "Failed to fetch reading statistics" };
  }
}
export async function POST(request) {
  return handler(await request.json());
}