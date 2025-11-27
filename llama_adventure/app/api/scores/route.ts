import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { scores, users } from '@/db/schema';
import { nanoid } from 'nanoid';
import { eq, desc, asc } from 'drizzle-orm';
import { calculatePoints, isValidLevel } from '@/lib/score';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, levelName, completionTime, won } = body;

    if (!userId || !levelName || completionTime === undefined) {
      return NextResponse.json(
        { error: 'userId, levelName, and completionTime are required' },
        { status: 400 }
      );
    }

    if (!isValidLevel(levelName)) {
      return NextResponse.json(
        { error: 'Invalid level name' },
        { status: 400 }
      );
    }

    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (user.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate points: 0 for game over, normal calculation for wins
    const points = won !== false ? calculatePoints(completionTime, levelName) : 0;
    const scoreId = nanoid();

    await db.insert(scores).values({
      id: scoreId,
      userId,
      levelName,
      completionTime,
      points,
      createdAt: new Date(),
    });

    return NextResponse.json({
      id: scoreId,
      userId,
      levelName,
      completionTime,
      points,
      won: won !== false,
    });
  } catch (error) {
    console.error('Error in POST /api/scores:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const levelName = searchParams.get('level');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Query leaderboard
    let query = db
      .select({
        id: scores.id,
        userId: scores.userId,
        levelName: scores.levelName,
        completionTime: scores.completionTime,
        points: scores.points,
        createdAt: scores.createdAt,
        avatarId: users.avatarId,
        userName: users.name,
      })
      .from(scores)
      .innerJoin(users, eq(scores.userId, users.id));

    if (levelName && isValidLevel(levelName)) {
      query = query.where(eq(scores.levelName, levelName)) as typeof query;
    }

    const results = await query
      .orderBy(desc(scores.points), asc(scores.completionTime))
      .limit(limit)
      .offset(offset);

    const leaderboard = results.map((row, index) => ({
      rank: offset + index + 1,
      ...row,
      userName: row.userName || null,
    }));

    return NextResponse.json({
      leaderboard,
      limit,
      offset,
      hasMore: results.length === limit,
    });
  } catch (error) {
    console.error('Error in GET /api/scores:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
