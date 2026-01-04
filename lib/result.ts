/**
 * Result type for functional error handling without throwing exceptions.
 * Inspired by Rust's Result<T, E> pattern.
 *
 * @example
 * function divide(a: number, b: number): Result<number, string> {
 *   if (b === 0) {
 *     return { ok: false, error: "Division by zero" }
 *   }
 *   return { ok: true, value: a / b }
 * }
 *
 * const result = divide(10, 2)
 * if (result.ok) {
 *   console.log(result.value) // 5
 * } else {
 *   console.error(result.error)
 * }
 */
export type Result<T, E = string> = { ok: true; value: T } | { ok: false; error: E }
