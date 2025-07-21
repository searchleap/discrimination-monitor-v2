// Note: This will work once Prisma is configured with a database
// For now, we'll create a mock implementation
// import { PrismaClient } from '@prisma/client'

// Mock PrismaClient for development without database
class MockPrismaClient {
  $connect() {
    return Promise.resolve()
  }
  $disconnect() {
    return Promise.resolve()
  }
  $queryRaw(query: any) {
    return Promise.resolve([{ result: 1 }])
  }
  $transaction(fn: any) {
    return fn(this)
  }
}

type PrismaClient = MockPrismaClient

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

export const db = globalThis.prisma || new MockPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = db
}

// Database utility functions
export async function connectDB() {
  try {
    await db.$connect()
    // eslint-disable-next-line no-console
    console.log('Database connected successfully')
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Database connection error:', error)
    throw error
  }
}

export async function disconnectDB() {
  try {
    await db.$disconnect()
    // eslint-disable-next-line no-console
    console.log('Database disconnected')
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Database disconnection error:', error)
  }
}

export async function testConnection() {
  try {
    await db.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Database connection test failed:', error)
    return false
  }
}

// Health check function
export async function getDatabaseHealth() {
  try {
    const start = Date.now()
    await db.$queryRaw`SELECT 1`
    const responseTime = Date.now() - start
    
    return {
      status: 'healthy',
      responseTime,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }
  }
}

// Transaction helper
export async function executeTransaction<T>(
  fn: (tx: PrismaClient) => Promise<T>
): Promise<T> {
  return await db.$transaction(fn)
}

// Common query helpers
export async function findManyWithPagination(
  model: any,
  options: {
    where?: any
    orderBy?: any
    page: number
    limit: number
  }
) {
  const { where, orderBy, page, limit } = options
  const skip = (page - 1) * limit
  
  const [data, total] = await Promise.all([
    model.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        feed: true
      }
    }),
    model.count({ where })
  ])
  
  return {
    data,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      hasNext: page < Math.ceil(total / limit),
      hasPrevious: page > 1
    }
  }
}

export default db