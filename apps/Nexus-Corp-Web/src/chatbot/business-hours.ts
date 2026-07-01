const ECUADOR_TIME_ZONE = "America/Guayaquil"
const OPEN_MINUTE = 9 * 60
const CLOSE_MINUTE = 18 * 60

interface EcuadorDateParts {
  weekday: string
  hour: number
  minute: number
}

const getEcuadorDateParts = (date: Date): EcuadorDateParts => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: ECUADOR_TIME_ZONE,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date)

  const valueByType = new Map(parts.map((part) => [part.type, part.value]))

  return {
    weekday: valueByType.get("weekday") ?? "",
    hour: Number(valueByType.get("hour") ?? "0"),
    minute: Number(valueByType.get("minute") ?? "0"),
  }
}

export const isBusinessOpen = (date = new Date()) => {
  const { weekday, hour, minute } = getEcuadorDateParts(date)

  if (weekday === "Sat" || weekday === "Sun") {
    return false
  }

  const minuteOfDay = hour * 60 + minute
  return minuteOfDay >= OPEN_MINUTE && minuteOfDay < CLOSE_MINUTE
}

export const getBusinessHoursLabel = () => "lunes a viernes, de 09h00 a 18h00"
