import getRelativeTime from "@/helpers/getRelativeTime";
import { useEffect, useState } from "react";

export default function RelativeTime({ time }: { time: number }) {
  const [timeString, setTimeString] = useState(getRelativeTime(time).result);

  useEffect(() => {
    const { result, updateIn } = getRelativeTime(time);
    const update = () => setTimeString(result);
    const interval = setInterval(update, updateIn);
    return () => clearInterval(interval);
  }, [time]);

  return timeString;
}
