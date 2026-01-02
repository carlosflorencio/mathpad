import { describe, it, expect } from "vitest"
import Big from "big.js"
import { CountAggregate } from "./count"

describe("CountAggregate", () => {
  const count = new CountAggregate()

  it("should count values", () => {
    const values = [new Big("10"), new Big("20"), new Big("30")]
    expect(count.execute(values).toString()).toBe("3")
  })

  it("should count single value", () => {
    const values = [new Big("42")]
    expect(count.execute(values).toString()).toBe("1")
  })

  it("should count many values", () => {
    const values = Array(100).fill(new Big("1"))
    expect(count.execute(values).toString()).toBe("100")
  })

  it("should validate empty array", () => {
    const error = count.validate?.([])
    expect(error).toBe("No numbers to count")
  })

  it("should validate non-empty array", () => {
    const error = count.validate?.([new Big("1")])
    expect(error).toBeNull()
  })
})
