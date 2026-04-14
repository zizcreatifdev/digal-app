import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function useCountdown() {
  const [targetDate, setTargetDate] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isLaunched, setIsLaunched] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLaunchDate() {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "launch_date")
        .single();

      if (data?.value) {
        setTargetDate(new Date(data.value));
      }
      setLoading(false);
    }
    fetchLaunchDate();
  }, []);

  useEffect(() => {
    if (!targetDate) return;

    const tick = () => {
      const now = new Date().getTime();
      const diff = targetDate.getTime() - now;

      if (diff <= 0) {
        setIsLaunched(true);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return { timeLeft, isLaunched, loading };
}
