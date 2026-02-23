import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SystemSettings {
  customerSource: string;
  sheetId: string;
  sheetApiKey: string;
  sheetRange: string;
}

const SystemSettingsContext = createContext<SystemSettings | null>(null);

export const useSystemSettings = () => {
  const context = useContext(SystemSettingsContext);
  if (!context) {
    throw new Error("useSystemSettings must be used inside SystemSettingsProvider");
  }
  return context;
};

export const SystemSettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [settings, setSettings] = useState<SystemSettings>({
    customerSource: "null",
    sheetId: "",
    sheetApiKey: "",
    sheetRange: "",
  });

  useEffect(() => {
    const load = async () => {
      const appEnv = import.meta.env.VITE_APP_ENV || "production";
      const { data, error } = await supabase
        .from("system_settings")
        .select("customer_source, sheet_id, sheet_apikey, sheet_range")
        .eq("environment", appEnv)
        .limit(1);

      if (error) {
        console.error("Failed to load system settings:", error);
        return;
      }

      if (data && data.length > 0) {
        setSettings({
          customerSource: data[0].customer_source,
          sheetId: data[0].sheet_id,
          sheetApiKey: data[0].sheet_apikey,
          sheetRange: data[0].sheet_range,
        });
      }
    };

    load();
  }, []);

  return (
    <SystemSettingsContext.Provider value={settings}>
      {children}
    </SystemSettingsContext.Provider>
  );
};
