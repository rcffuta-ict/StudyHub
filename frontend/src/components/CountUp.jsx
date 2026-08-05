import { useEffect, useState } from 'react'

/**
 * Animates a number from 0 up to `value` once `start` becomes true.
 * `suffix` lets you keep trailing characters like "+" or "/7" that
 * shouldn't be part of the numeric count.
 */
const CountUp = ({ value, suffix = '', duration = 1400, start }) => {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!start) return

    let startTime = null
    let frameId

    const step = (timestamp) => {
      if (startTime === null) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      // ease-out cubic for a natural deceleration
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(eased * value))
      if (progress < 1) {
        frameId = requestAnimationFrame(step)
      }
    }

    frameId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frameId)
  }, [start, value, duration])

  return (
    <span>
      {display.toLocaleString()}
      {suffix}
    </span>
  )
}

export default CountUp