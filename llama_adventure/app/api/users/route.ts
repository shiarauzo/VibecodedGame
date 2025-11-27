import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, userSessions } from '@/db/schema';
import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';

export async function PATCH(request: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL is not set');
      return NextResponse.json(
        { 
          error: 'Database not configured',
          message: 'DATABASE_URL environment variable is not set.'
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { userId, name } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'name must be a non-empty string' },
        { status: 400 }
      );
    }

    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    try {
      await db
        .update(users)
        .set({ name: name.trim(), lastSeenAt: new Date() })
        .where(eq(users.id, userId));

      return NextResponse.json({
        id: userId,
        name: name.trim(),
      });
    } catch (error: any) {
      // If name column doesn't exist, return error with migration instructions
      if (error?.code === '42703' || error?.message?.includes('column "name"')) {
        return NextResponse.json(
          { 
            error: 'Name column not found. Please run migration: ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT;',
            needsMigration: true
          },
          { status: 500 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('Error in PATCH /api/users:', error);
    
    let errorMessage = 'Internal server error';
    let errorDetails: any = undefined;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = {
        name: error.name,
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      };
    } else if (typeof error === 'object' && error !== null) {
      errorMessage = String(error);
      errorDetails = error;
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: errorDetails,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL is not set');
      return NextResponse.json(
        { 
          error: 'Database not configured',
          message: 'DATABASE_URL environment variable is not set. Please add it to your .env.local file and restart the server.'
        },
        { status: 500 }
      );
    }

    // Test database connection
    try {
      await db.select().from(users).limit(1);
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return NextResponse.json(
        {
          error: 'Database connection failed',
          message: dbError instanceof Error ? dbError.message : 'Unable to connect to database',
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { fingerprintHash, avatarId } = body;

    if (!fingerprintHash) {
      return NextResponse.json(
        { error: 'fingerprintHash is required' },
        { status: 400 }
      );
    }

    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.fingerprintHash, fingerprintHash))
      .limit(1);

    if (existingUser.length > 0) {
      const user = existingUser[0];
      await db
        .update(users)
        .set({ lastSeenAt: new Date() })
        .where(eq(users.id, user.id));

      await db.insert(userSessions).values({
        id: nanoid(),
        userId: user.id,
        deviceInfo: {
          userAgent: request.headers.get('user-agent'),
          timestamp: new Date().toISOString(),
        },
      });

      return NextResponse.json({
        id: user.id,
        avatarId: user.avatarId,
      });
    }

    const newUserId = nanoid();
    const finalAvatarId = avatarId || Math.floor(Math.random() * 8) + 1;

    await db.insert(users).values({
      id: newUserId,
      fingerprintHash,
      avatarId: finalAvatarId,
      createdAt: new Date(),
      lastSeenAt: new Date(),
    });

    await db.insert(userSessions).values({
      id: nanoid(),
      userId: newUserId,
      deviceInfo: {
        userAgent: request.headers.get('user-agent'),
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      id: newUserId,
      avatarId: finalAvatarId,
    });
  } catch (error) {
    console.error('Error in POST /api/users:', error);
    
    let errorMessage = 'Internal server error';
    let errorDetails: any = undefined;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = {
        name: error.name,
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      };
    } else if (typeof error === 'object' && error !== null) {
      errorMessage = String(error);
      errorDetails = error;
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: errorDetails,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
