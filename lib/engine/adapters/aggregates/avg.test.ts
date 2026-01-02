import { describe, it, expect } from "vitest"
import Big from "big.js"
import { AvgAggregate } from "./avg"

describe("AvgAggregate", () => {
  const avg = new AvgAggregate()

  it("should calculate average", () => {
    const values = [new Big("10"), new Big("20"), new Big("30")]
    expect(avg.execute(values).toString()).toBe("20")
  })

  it("should handle decimals", () => {
    const values = [new Big("1"), new Big("2"), new Big("3")]
    const result = avg.execute(values)
    expect(result.toString()).toBe("2")
  })

  it("should handle single value", () => {
    const values = [new Big("42")]
    expect(avg.execute(values).toString()).toBe("42")
  })

  it("should validate empty array", () => {
    const error = avg.validate?.([])
    expect(error).toBe("No numbers to avg")
  })

  it("should validate non-empty array", () => {
    const error = avg.validate?.([new Big("1")])
    expect(error).toBeNull()
  })
})
