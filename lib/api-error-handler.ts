/**
 * API Error Handlers
 * 
 * Centralized error handling utilities for API routes.
 */

import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

/**
 * Handles Prisma errors and returns appropriate NextResponse
 * @param error - The error to handle
 * @param context - Optional context message
 * @returns NextResponse with error message and status code
 */
export function handlePrismaError(error: unknown, context = '操作失败'): NextResponse {
  console.error(`${context}:`, error);

  // Handle Prisma "Record not found" error
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
    return NextResponse.json(
      { error: '资源不存在' },
      { status: 404 }
    );
  }

  // Handle other Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return NextResponse.json(
      { error: `数据库错误: ${error.code}` },
      { status: 500 }
    );
  }

  // Handle general errors
  if (error instanceof Error) {
    return NextResponse.json(
      { error: error.message || context },
      { status: 500 }
    );
  }

  // Fallback for unknown errors
  return NextResponse.json(
    { error: context },
    { status: 500 }
  );
}

/**
 * Creates a success response with data
 * @param data - The data to return
 * @param status - HTTP status code (default: 200)
 * @returns NextResponse with data
 */
export function createSuccessResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

/**
 * Creates an error response
 * @param message - Error message
 * @param status - HTTP status code (default: 400)
 * @returns NextResponse with error message
 */
export function createErrorResponse(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, { status });
}
